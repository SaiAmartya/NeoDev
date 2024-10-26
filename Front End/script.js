// Replace feather icons
feather.replace();

const nutrients_to_include = [
    'calcium',
    'carbohydrates',
    'cholesterol',
    'fat',
    'fiber',
    'iron',
    'proteins',
    'salt',
    'saturated-fat',
    'sugars',
    'trans-fat',
];

// Select necessary DOM elements
const controls = document.querySelector('.controls');
const cameraOptions = document.querySelector('.video-options>select');
const video = document.querySelector('video');
const canvas = document.createElement('canvas');
const screenshotImage = document.createElement('img');
document.body.appendChild(screenshotImage);
const buttons = [...controls.querySelectorAll('button')];
const barcodeElement = document.getElementById('barcode');
const nutrientsElement = document.getElementById('nutrients');
const healthinessScoreElement = document.getElementById('healthinessScore');
const progressBarFill = document.querySelector('.progress-fill');
const [play, capture] = buttons;
let streamStarted = false;

// Constraints for the video stream
const constraints = {
    video: {
        width: { min: 1280, ideal: 1920, max: 2560 },
        height: { min: 720, ideal: 1080, max: 1440 },
    }
};

// Initialize camera selection on page load
getCameraSelection();

// Function to get available camera selection
const getCameraSelection = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const options = videoDevices.map(videoDevice => 
        `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`
    );
    cameraOptions.innerHTML = options.join('');
};

// Play button click handler
play.onclick = async () => {
    if (streamStarted) {
        video.play();
        play.classList.add('d-none');
        capture.classList.remove('d-none');
        return;
    }
    if (navigator.mediaDevices.getUserMedia) {
        const updatedConstraints = { ...constraints, deviceId: { exact: cameraOptions.value } };
        await startStream(updatedConstraints);
    }
};

// Handle camera selection change
cameraOptions.onchange = () => {
    const updatedConstraints = { ...constraints, deviceId: { exact: cameraOptions.value } };
    startStream(updatedConstraints);
};

// Start video stream
const startStream = async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
};

// Handle the video stream
const handleStream = (stream) => {
    video.srcObject = stream;
    video.play();
    play.classList.add('d-none');
    capture.classList.remove('d-none');
    streamStarted = true;
};

// Function to capture an image
const captureImage = () => {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    let capturedImageData = canvas.toDataURL('image/png');
    screenshotImage.src = capturedImageData;
    screenshotImage.classList.remove('d-none');

    startLoading(); // Start the loading animation
    sendImageToApi(capturedImageData);
};

// Send the captured image to the API
const sendImageToApi = async (base64Image) => {
    try {
        const response = await fetch('https://36kskdzg-5000.use.devtunnels.ms/barcode/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        displayResults(data); // Display results when the response is successful
    } catch (error) {
        console.error('Error sending image to API:', error);
        alert('Failed to get nutrients data.');
    } finally {
        stopLoading(); // Stop the loading animation
    }
};

// Display the results from the API
const displayResults = (data) => {
    if (!data) {
        console.log("Product not found in the database.");
        return;
    }

    const nutritionData = data[0];
    const healthinessScore = data[1];

    barcodeElement.textContent = '';
    nutrientsElement.innerHTML = '';
    healthinessScoreElement.textContent = '';

    nutrients_to_include.forEach((nutrient) => {
        if (nutritionData[nutrient]) {
            const unit = nutritionData[`${nutrient}_unit`] || '';
            const listItem = document.createElement('li');
            listItem.textContent = `${nutrient.replace(/_/g, ' ')}: ${nutritionData[nutrient]} ${unit}`;
            nutrientsElement.appendChild(listItem);
        }
    });

    healthinessScoreElement.textContent = `Healthiness Score: ${healthinessScore}/100`;
};

// Start the loading animation
const startLoading = () => {
    progressBarFill.style.width = '0%';

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBarFill.style.width = `${progress}%`;

        if (progress >= 100) clearInterval(interval);
    }, 500);
};

// Stop the loading animation
const stopLoading = () => {
    progressBarFill.style.width = '100%';
};

// Add event listeners for the buttons
capture.onclick = captureImage;
