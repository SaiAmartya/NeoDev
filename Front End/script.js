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
]

// Select necessary DOM elements
const controls = document.querySelector('.controls');
const cameraOptions = document.querySelector('.video-options>select');
const video = document.querySelector('video'); // Use the existing video element from HTML
const canvas = document.createElement('canvas'); // Create canvas element dynamically
const screenshotImage = document.createElement('img'); // Create img element for the screenshot
document.body.appendChild(screenshotImage); // Append the image to the body
const buttons = [...controls.querySelectorAll('button')];
let streamStarted = false;

// Destructure the buttons for easy access
const [play, capture] = buttons;

// Constraints for the video stream
const constraints = {
    video: {
        width: {
            min: 1280,
            ideal: 1920,
            max: 2560,
        },
        height: {
            min: 720,
            ideal: 1080,
            max: 1440
        },
    }
};

// Function to get available camera selection
const getCameraSelection = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const options = videoDevices.map(videoDevice => {
        return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
    });
    cameraOptions.innerHTML = options.join('');
};

// Play button click handler
play.onclick = async () => {
    if (streamStarted) {
        video.play(); // Play the video if already started
        play.classList.add('d-none'); // Hide the play button
        capture.classList.remove('d-none'); // Show the capture button
        return;
    }
    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
        const updatedConstraints = {
            ...constraints,
            deviceId: {
                exact: cameraOptions.value // Use the selected camera
            }
        };
        await startStream(updatedConstraints); // Start the video stream
    }
};

// Handle camera selection change
cameraOptions.onchange = () => {
    const updatedConstraints = {
        ...constraints,
        deviceId: {
            exact: cameraOptions.value // Update constraints with selected camera
        }
    };
    startStream(updatedConstraints); // Restart the stream with the new camera
};

// Start video stream
const startStream = async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
};

// Handle the video stream
const handleStream = (stream) => {
    video.srcObject = stream; // Set the video source to the stream
    video.play(); // Play the video
    play.classList.add('d-none'); // Hide the play button
    capture.classList.remove('d-none'); // Show the capture button
    streamStarted = true; // Update stream status
};

// Function to send the captured image to the API as a Base64 string
const sendImageToApi = async (base64Image) => {
    try {
        const response = await fetch('https://36kskdzg-5000.use.devtunnels.ms/barcode/', { // Replace with your API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set content type to JSON
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ image: base64Image }), // Send the Base64 image as JSON
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); // Parse the JSON response
        console.log('Success: ', data);
        
        // Call function to display results
        displayResults(data);
        
    } catch (error) {
        console.error('Error sending image to API:', error);
    }
};


const displayResults = (data) => {
    if (data === null) {
        console.log("Product not found in the database.")
        return;
    }
    const barcodeElement = document.getElementById('barcode');
    const nutrientsElement = document.getElementById('nutrients');
    const healthinessScoreElement = document.getElementById('healthinessScore');

    const nutritionData = data[0]; // Nutritional data object
    const healthinessScore = data[1]; // Healthiness score

    // Clear previous results
    barcodeElement.textContent = '';
    nutrientsElement.innerHTML = ''; // Clear previous nutrients
    healthinessScoreElement.textContent = ''; // Clear previous score

    // Set nutrients
    nutrients_to_include.forEach((nutrient) => {
        if (Object.prototype.hasOwnProperty.call(nutritionData, nutrient)) {
            const value = nutritionData[nutrient];

            if (nutrient.includes('_computed') || value === 0) return;
            if (nutrient.endsWith('_unit')) return;

            const unitKey = `${nutrient}_unit`;
            const unit = nutritionData[unitKey] ? ` ${nutritionData[unitKey]}` : '';

            const listItem = document.createElement('li');
            listItem.textContent = `${nutrient.replace(/_/g, ' ')}: ${value}${unit}`;
            nutrientsElement.appendChild(listItem);
        }
    })

    // Set healthiness score with a message
    healthinessScoreElement.textContent = `Healthiness Score: ${healthinessScore}/100`;
};
// Function to capture an image
const captureImage = () => {
    const videoWidth = video.videoWidth; // Get the video width
    const videoHeight = video.videoHeight; // Get the video height

    canvas.width = videoWidth; // Set canvas width to match video width
    canvas.height = videoHeight; // Set canvas height to match video height
    const context = canvas.getContext('2d');

    context.drawImage(video, 0, 0, videoWidth, videoHeight); // Draw the current frame on the canvas
    let capturedImageData = canvas.toDataURL('image/png'); // Convert the canvas to a Base64 data URL
    capturedImageData = capturedImageData.slice(capturedImageData); // If needed, slice to get the base64 string

    screenshotImage.src = capturedImageData; // Set the image source to the captured data
    screenshotImage.classList.remove('d-none'); // Show the screenshot image

    // Send the Base64 image to the API
    sendImageToApi(capturedImageData);
};

// Add event listeners for the buttons
capture.onclick = captureImage; // Capture button functionality

// Initialize camera selection on page load
getCameraSelection();
