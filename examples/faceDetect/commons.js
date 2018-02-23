const {
    cv,
    grabFrames,
    drawBlueRect
} = require('../utils');
const loadFacenet = require('../dnn/loadFacenet');
const {extractResults} = require('../dnn/ssdUtils');
const WebSocket = require('ws');
const WEBSOCKETPORT = 8083;
const wss = new WebSocket.Server({port: WEBSOCKETPORT});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        ws.send(`Received message from client: ${message}`);
    });

});

exports.runVideoFaceDetection = (src, detectFaces) => grabFrames(src, 1, (frame) => {
    console.time('detection time');
    const frameResized = frame.resize(720, 1280);

    // detect faces
    const faceRects = detectFaces(frameResized);
    if (faceRects.length) {
        const facesAsString = JSON.stringify({faces: faceRects});
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(facesAsString);
            }
        });

        // draw detection
        faceRects.forEach(faceRect => drawBlueRect(frameResized, faceRect));
    }

    cv.imshow('face detection', frameResized);
    console.timeEnd('detection time');
});

function classifyImg(net, img) {
    // facenet model works with 300 x 300 images
    const imgResized = img.resizeToMax(300);

    // network accepts blobs as input
    const inputBlob = cv.blobFromImage(imgResized);
    net.setInput(inputBlob);

    // forward pass input through entire network, will return
    // classification result as 1x1xNxM Mat
    let outputBlob = net.forward();
    // extract NxM Mat
    outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);

    return extractResults(outputBlob, img);
}

exports.makeRunDetectFacenetSSD = function () {
    const net = loadFacenet();
    return function (img, minConfidence) {
        const predictions = classifyImg(net, img);

        predictions
            .filter(res => res.confidence > minConfidence)
            .forEach(p => drawBlueRect(img, p.rect));

        return img;
    }
}
