// Global variables
let selectedFile = null;
let resultImageUrl = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const processingSection = document.getElementById('processingSection');
const resultSection = document.getElementById('resultSection');
const resultImg = document.getElementById('resultImg');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const processBtn = document.getElementById('processBtn');

// API Configuration
const API_CONFIG = {
    url: 'https://undress-strip-person.p.rapidapi.com/UndressImage',
    headers: {
        'x-rapidapi-key': 'e1e729d35dmsha15cb19a43cd588p1c655ajsnefacbd8b9c23',
        'x-rapidapi-host': 'undress-strip-person.p.rapidapi.com'
    }
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => imageInput.click());
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB.');
        return;
    }
    
    selectedFile = file;
    displayImagePreview(file);
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
        hideAllSections();
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedFile = null;
    imageInput.value = '';
    uploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
    hideAllSections();
}

function hideAllSections() {
    processingSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

async function processImage() {
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }
    
    // Show processing state
    hideAllSections();
    processingSection.style.display = 'block';
    processBtn.disabled = true;
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // Make API request
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Handle the API response
        if (result.success || result.image_url || result.result_url) {
            // Assuming the API returns an image URL or base64 data
            const imageUrl = result.image_url || result.result_url || result.output || result.data;
            
            if (imageUrl) {
                displayResult(imageUrl);
            } else {
                throw new Error('No processed image received from API');
            }
        } else {
            throw new Error(result.message || 'Processing failed');
        }
        
    } catch (error) {
        console.error('Processing error:', error);
        showError(`Processing failed: ${error.message}`);
    } finally {
        processBtn.disabled = false;
        processingSection.style.display = 'none';
    }
}

function displayResult(imageUrl) {
    resultImageUrl = imageUrl;
    resultImg.src = imageUrl;
    resultSection.style.display = 'block';
}

function downloadResult() {
    if (!resultImageUrl) {
        showError('No result image to download.');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = resultImageUrl;
    link.download = `processed_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetTool() {
    clearImage();
    hideAllSections();
    resultImageUrl = null;
}

function showError(message) {
    errorMessage.textContent = message;
    hideAllSections();
    errorSection.style.display = 'block';
}

// Utility function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Handle API response based on different possible formats
function handleApiResponse(response) {
    // This function can be extended based on the actual API response format
    if (response.image_url) {
        return response.image_url;
    } else if (response.result_url) {
        return response.result_url;
    } else if (response.data && response.data.startsWith('data:image')) {
        return response.data;
    } else if (response.output) {
        return response.output;
    } else {
        throw new Error('Unexpected API response format');
    }
}

