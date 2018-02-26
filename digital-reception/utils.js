const path = require('path');

const cv = require('../');

exports.cv = cv;

let lastExecutionTime = 0;

const dataPath = path.resolve(__dirname, '../data');
exports.dataPath = dataPath;
exports.getDataFilePath = fileName => path.resolve(dataPath, fileName);

/*
* @param delay  : specifies how long the image is displayed (image stays until next image displayed)
*/
exports.grabFrames = (videoFile, delay, onFrame, MINFACEDETECTEXECUTIONTIME) => {
    const cap = new cv.VideoCapture(videoFile);
    // run detection as fast as possible (high CPU utilization!)
    if (!MINFACEDETECTEXECUTIONTIME) {
        let done = false;
        const intvl = setInterval(() => {
            let frame = cap.read();
            // loop back to start on end of stream reached
            if (frame.empty) {
                cap.reset();
                frame = cap.read();
            }
            onFrame(frame);

            const key = cv.waitKey(delay);
            done = key !== -1 && key !== 255;
            if (done) {
                clearInterval(intvl);
                console.log('Key pressed, exiting.');
            }
        }, 0);
    } else {
        _readAndDetect(cap, delay, onFrame, MINFACEDETECTEXECUTIONTIME);
    }
};


function _readAndDetect(cap, delay, onFrame, MINFACEDETECTEXECUTIONTIME) {
    const timeLeft = MINFACEDETECTEXECUTIONTIME - lastExecutionTime;
    const detectionDelay = timeLeft > 0 ? timeLeft : 0;
    console.log('detection delay', detectionDelay);
    setTimeout(() => {
        let done = false;
        let frame = cap.read();
        // loop back to start on end of stream reached
        if (frame.empty) {
            cap.reset();
            frame = cap.read();
        }

        const startTime = new Date();
        onFrame(frame);
        const endTime = new Date();
        lastExecutionTime = endTime - startTime;
        console.log('last execution time was', lastExecutionTime);

        const key = cv.waitKey(delay);
        done = key !== -1 && key !== 255;
        if (done) {
            console.log('Key pressed, exiting.');
            process.exit();

        }
        _readAndDetect(cap, delay, onFrame, MINFACEDETECTEXECUTIONTIME);
    }, detectionDelay);
}

exports.drawRectAroundBlobs = (binaryImg, dstImg, minPxSize, fixedRectWidth) => {
    const {
        centroids,
        stats
    } = binaryImg.connectedComponentsWithStats();

    // pretend label 0 is background
    for (let label = 1; label < centroids.rows; label += 1) {
        const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
        const [x2, y2] = [
            x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
            y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
        ];
        const size = stats.at(label, cv.CC_STAT_AREA);
        const blue = new cv.Vec(255, 0, 0);
        if (minPxSize < size) {
            dstImg.drawRectangle(
                new cv.Point(x1, y1),
                new cv.Point(x2, y2),
                {color: blue, thickness: 2}
            );
        }
    }
};

const drawRect = (image, rect, color, opts = {thickness: 2}) =>
    image.drawRectangle(
        rect,
        color,
        opts.thickness,
        cv.LINE_8
    );

exports.drawRect = drawRect;
exports.drawBlueRect = (image, rect, opts = {thickness: 2}) =>
    drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
exports.drawGreenRect = (image, rect, opts = {thickness: 2}) =>
    drawRect(image, rect, new cv.Vec(0, 255, 0), opts);
exports.drawRedRect = (image, rect, opts = {thickness: 2}) =>
    drawRect(image, rect, new cv.Vec(0, 0, 255), opts);
