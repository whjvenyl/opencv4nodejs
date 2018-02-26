const {
    cv
} = require('../utils');

const {runVideoFaceDetection} = require('./commons');

const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

const webcamPort = 0;
const MINSIZE = 40;

function detectFaces(img) {
    // restrict minSize and scaleFactor for faster processing
    const options = {
        minSize: new cv.Size(MINSIZE, MINSIZE),
        scaleFactor: 1.2,
        minNeighbors: 10
    };
    return classifier.detectMultiScaleGpu(img.bgrToGray(), options);
}

runVideoFaceDetection(webcamPort, detectFaces);
