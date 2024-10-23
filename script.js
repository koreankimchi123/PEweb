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
tf.setBackend('wasm').then(() => {
  console.log("Switched to WebAssembly backend.");
  main();  // Start the main execution after backend is set
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
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640,
      height: 480
    }
  });
  videoElement.srcObject = stream;

  return new Promise((resolve) => {
    videoElement.onloadedmetadata = () => {
      resolve(videoElement);
    };
  });
}

// Main function to initialize camera and pose detection
async function main() {
  await setupCamera();
  videoElement.play();

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });  // Send video frame for pose detection
    },
    width: 640,
    height: 480
  });
  camera.start();
}

// Start the main process
main();
