// app.js
const API_URL = CONFIG.API_URL;

let originalFileName = "";
let pollingStartTime = null;
let timerInterval = null;

function updateProgress(status) {
    const progressBarFilled = document.getElementById('progressBarFilled');
    const progressText = document.getElementById('progressText');
    const spinner = document.getElementById('spinner');
    const timer = document.getElementById('timer');

    switch (status) {
        case 'UPLOADING':
            progressBarFilled.style.width = '20%';
            progressText.textContent = 'Uploading file...';
            spinner.style.display = 'inline-block';
            timer.style.display = 'none';
            startTimer();
            break;
        case 'PROCESSING':
            progressBarFilled.style.width = '60%';
            progressText.textContent = 'Translation in progress...';
            spinner.style.display = 'inline-block';
            timer.style.display = 'block';
            break;
        case 'COMPLETED':
            progressBarFilled.style.width = '100%';
            progressText.textContent = 'Translation completed!';
            spinner.style.display = 'none';
            stopTimer();
            break;
        case 'FAILED':
            progressBarFilled.style.width = '0%';
            progressText.textContent = 'Translation failed.';
            spinner.style.display = 'none';
            stopTimer();
            break;
        default:
            progressBarFilled.style.width = '0%';
            progressText.textContent = '';
            spinner.style.display = 'none';
            stopTimer();
    }
}

function startTimer() {
    pollingStartTime = Date.now();
    const timerElement = document.getElementById('timer');
    stopTimer(); // Clear any previous timer

    timerInterval = setInterval(() => {
        const elapsedMs = Date.now() - pollingStartTime;
        const seconds = Math.floor(elapsedMs / 1000);
        timerElement.textContent = `Elapsed time: ${seconds} seconds`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const timerElement = document.getElementById('timer');
    timerElement.textContent = '';
}

function createDownloadLinkFromText(text, originalFileName, toLang) {
    const downloadLink = document.getElementById('downloadLink');

    const blob = new Blob([text], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);

    //const filename = originalFileName.replace('.pdf', '.txt');
    // Add suffix before extension
    const baseName = originalFileName.replace(/\.pdf$/i, '');
    const filename = `${baseName}_${toLang}.txt`;

    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.textContent = `Download ${filename}`;
    downloadLink.style.display = 'inline-block';
}

function startPolling(currentRequestId, toLang) {
    const statusUrl = `${API_URL}/status?request_id=${currentRequestId}`;
    console.log('Polling started for request ID:', statusUrl);

    updateProgress('PROCESSING');

    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(statusUrl);
            if (!response.ok) throw new Error('Status check failed');

            const status = await response.json();
            updateProgress(status.status);

            if (status.status === 'COMPLETED' && status.translated_text) {
                clearInterval(pollInterval);
                createDownloadLinkFromText(status.translated_text, originalFileName, toLang);
            } else if (status.status === 'FAILED') {
                clearInterval(pollInterval);
                alert('Translation failed. Please try again.');
                updateProgress('FAILED');
            }
        } catch (error) {
            console.error('Polling error:', error);
            updateProgress('PROCESSING');
        }
    }, CONFIG.POLL_INTERVAL_MS);
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
        // After: const fileInput = document.getElementById('pdfFile');
    const fromLang = document.getElementById('fromLang').value;
    const toLang = document.getElementById('toLang').value;

    if (fromLang === toLang) {
        alert('Please select different languages for "Translate From" and "Translate To".');
        return;
    }
    
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a PDF file first!');
        return;
    }

    if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        return;
    }

    originalFileName = file.name;

    try {
        updateProgress('UPLOADING');
        console.log(fromLang, toLang);
        //const response = await fetch(`${API_URL}/generate-url`);
        const response = await fetch(`${API_URL}/generate-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fromLang,
                toLang
            })
        });

        if (!response.ok) throw new Error('Failed to get upload URL');

        const responseBody = await response.json();
        console.log('RESPONSE BODY:', responseBody);
        let parsedBody;
        if (typeof responseBody.body === 'string') 
        {
            parsedBody = JSON.parse(responseBody.body);
        } 
        else 
        {
            parsedBody = responseBody.body;
        }
        console.log('PARSED BODY:', parsedBody);
        const { url, request_id } = parsedBody;

        await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        updateProgress('PROCESSING');
        startPolling(request_id, toLang);
        console.log('File uploaded successfully:', request_id);
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Error: ' + error.message);
        updateProgress('FAILED');
    }
}
