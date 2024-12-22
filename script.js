const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

// MediaPipe Pose setup
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,  // Complexity level, higher values result in better accuracy but slower performance
  smoothLandmarks: true, // Enable smooth landmark tracking
  enableSegmentation: false, // Disable segmentation for better performance
  minDetectionConfidence: 0.6, // Minimum confidence threshold for detecting the pose
  minTrackingConfidence: 0.5   // Minimum confidence threshold for tracking landmarks
});

pose.onResults(onResults);

// WebAssembly backend setup for TensorFlow.js
// document.getElementById('startButton').addEventListener('click', () => {
// });
tf.setBackend('webgl').then(() => {
  console.log("WebGL 백엔드로 전환되었습니다.");
  main();  // 백엔드 설정 후 메인 실행 시작
});



// Calculate bounding box from pose landmarks
function getBoundingBox(landmarks) {
  const xValues = landmarks.map(landmark => landmark.x);
  const yValues = landmarks.map(landmark => landmark.y);

  return {
    minX: Math.min(...xValues),
    minY: Math.min(...yValues),
    maxX: Math.max(...xValues),
    maxY: Math.max(...yValues)
  };
}

// Draw bounding box on the canvas
function drawBoundingBox(ctx, boundingBox) {
  ctx.beginPath();
  ctx.rect(
    boundingBox.minX * canvasElement.width,  // Scale to canvas width
    boundingBox.minY * canvasElement.height, // Scale to canvas height
    (boundingBox.maxX - boundingBox.minX) * canvasElement.width,  // Box width
    (boundingBox.maxY - boundingBox.minY) * canvasElement.height  // Box height
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';
  ctx.stroke();
}

// // Adjust the coordinates based on the device orientation !! 수정 필요
// function adjustForOrientation(landmark) {
//   const orientation = window.orientation; // Device orientation (0, 90, 180, 270)
//   let { x, y } = landmark;

//   // Swap x and y if the device is rotated by 90 or -90 degrees
//   if (orientation === 90 || orientation === -90) {
//     [x, y] = [y, x];
//   }
//   return { x, y };
// }

// Function to process results from pose detection
function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.poseLandmarks) {
    const boundingBox = getBoundingBox(results.poseLandmarks);
    drawBoundingBox(canvasCtx, boundingBox); // Draw bounding box

    // Draw pose landmarks and connections
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'white', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: 'aqua', lineWidth: 2 });
  }
}

// Setup webcam and stream video to the element
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        resolve(videoElement);
      };
    });
  } catch (error) {
    alert("카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.");
    console.error("카메라 접근 오류:", error);
  }
}


// Main function to initialize camera and pose detection
async function main() {
  await setupCamera();
  videoElement.play();

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });  // Send video frame for pose detection
    },
    width: 540,
    height: 480
  });
  camera.start();
}

// Start the main process
main();
