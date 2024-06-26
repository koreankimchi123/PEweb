const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
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

async function main() {
    await setupCamera();
    video.play();

    const net = await loadPosenet();

    async function poseDetectionFrame() {
        const pose = await detectPose(net);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        drawKeypoints(pose.keypoints, 0.5, ctx);

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}

main();
