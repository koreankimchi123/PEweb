const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

// PoseNet에서 제공하는 연결 정보
const adjacentKeyPoints = posenet.getAdjacentKeyPoints;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadPosenet() {
    const net = await posenet.load();
    return net;
}

async function detectPose(net) {
    const pose = await net.estimateSinglePose(video, {
        flipHorizontal: false,
    });
    return pose;
}

function drawKeypoints(keypoints, minConfidence, ctx) {
    keypoints.forEach(point => {
        if (point.score > minConfidence) {
            const { y, x } = point.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'aqua';
            ctx.fill();
        }
    });
}

function drawSkeleton(keypoints, minConfidence, ctx) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        const startPoint = keypoints[0].position;
        const endPoint = keypoints[1].position;

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.stroke();
    });
}

async function main() {
    await setupCamera();
    video.play();

    const net = await loadPosenet();

    async function poseDetectionFrame() {
        const pose = await detectPose(net);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        drawKeypoints(pose.keypoints, 0.5, ctx);
        drawSkeleton(pose.keypoints, 0.5, ctx);

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}

main();
