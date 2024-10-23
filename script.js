const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1, 
  smoothLandmarks: true,
  enableSegmentation: false, 
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.5
});

pose.onResults(onResults);

// WebAssembly 백엔드 설정
tf.setBackend('wasm').then(() => {
    console.log("WebAssembly 백엔드로 전환되었습니다.");
    main();  // WebAssembly 설정 후 main 실행
});


function getBoundingBox(landmarks) {
    const xValues = landmarks.map(landmark => landmark.x);
    const yValues = landmarks.map(landmark => landmark.y);
  
    const minX = Math.min(...xValues);
    const minY = Math.min(...yValues);
    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);
  
    return { minX, minY, maxX, maxY };
  }
  
  function drawBoundingBox(ctx, boundingBox) {
    ctx.beginPath();
    ctx.rect(
      boundingBox.minX * canvasElement.width,  // X 좌표는 전체 캔버스 크기에 맞춰서 계산
      boundingBox.minY * canvasElement.height, // Y 좌표도 동일
      (boundingBox.maxX - boundingBox.minX) * canvasElement.width, // 경계 상자의 너비
      (boundingBox.maxY - boundingBox.minY) * canvasElement.height // 경계 상자의 높이
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'red';
    ctx.stroke();
  }  

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
    });
    videoElement.srcObject = stream;

    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve(videoElement);
        };
    });
}

function onResults(results) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
    if (results.poseLandmarks) {
      results.poseLandmarks.forEach((landmark) => {
        console.log(`X: ${landmark.x}, Y: ${landmark.y}, Z: ${landmark.z}`);
      });
    // Bounding Box 계산
    const boundingBox = getBoundingBox(results.poseLandmarks);

    // Bounding Box 그리기
    drawBoundingBox(canvasCtx, boundingBox);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: 'white', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks, {color: 'aqua', lineWidth: 2});
    }
  }
  

async function main() {
    await setupCamera();
    videoElement.play();

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({image: videoElement});
      },
      width: 640,
      height: 480
    });
    camera.start();
}

main();
