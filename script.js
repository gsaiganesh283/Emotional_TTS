document.addEventListener('DOMContentLoaded', () => {
    const voiceSelect = document.getElementById('voice-select');
    const textInput = document.getElementById('text-input');
    const sttText = document.getElementById('stt-text');
    const convertButton = document.querySelector('button[onclick="convertTextToSpeech()"]');
    const audioElement = document.getElementById('audio');
    const synth = window.speechSynthesis;
    let recognition;
    let stream;
    let audioContext;
    let analyser;
    let source;

    // Populate voice options
    function populateVoiceList() {
        const voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = index;
            voiceSelect.appendChild(option);
        });

        // Set default voice to "Telugu Shruti"
        const defaultVoiceIndex = voices.findIndex(voice => voice.name.includes('Microsoft Shruti'));
        if (defaultVoiceIndex !== -1) {
            voiceSelect.selectedIndex = defaultVoiceIndex;
        }
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // Convert text to speech
    async function convertTextToSpeech() {
        const text = textInput.value;
        const voiceIndex = voiceSelect.value;

        const response = await fetch('/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice_index: voiceIndex })
        });

        const data = await response.json();
        audioElement.src = data.audio_path;
        audioElement.play();
    }

    convertButton.addEventListener('click', convertTextToSpeech);

    // Convert speech to text
    async function convertSpeechToText() {
        const audioFile = document.getElementById('audio-file').files[0];
        if (!audioFile) {
            alert('Please select an audio file first.');
            return;
        }

        const formData = new FormData();
        formData.append('audio_file', audioFile);

        const response = await fetch('/stt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.text) {
            sttText.value = data.text; // Set the transcribed text into the new textarea
        } else {
            const sttResult = document.getElementById('stt-result');
            sttResult.textContent = `Error: ${data.error}`;
        }
    }

    document.querySelector('button[onclick="convertSpeechToText()"]').addEventListener('click', convertSpeechToText);

    // Convert uploaded audio to text
    async function convertUploadedAudioToText() {
        const audioFile = document.getElementById('audio-file').files[0];
        if (!audioFile) {
            alert('Please select an audio file first.');
            return;
        }

        const formData = new FormData();
        formData.append('audio_file', audioFile);

        const response = await fetch('/convert_audio', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.text) {
            document.getElementById('stt-text').value = data.text;
        } else {
            document.getElementById('stt-result').textContent = `Error: ${data.error}`;
        }
    }

    document.querySelector('button[onclick="convertSpeechToText()"]').addEventListener('click', convertUploadedAudioToText);

    // Record speech from microphone and visualize waveform
    async function startRecording() {
        const recordingResult = document.getElementById('recording-result');
        const waveformCanvas = document.getElementById('waveform');
        const canvasContext = waveformCanvas.getContext('2d');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            recordingResult.textContent = 'getUserMedia not supported on your browser!';
            return;
        }

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 2048;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function drawWaveform() {
            requestAnimationFrame(drawWaveform);

            analyser.getByteTimeDomainData(dataArray);

            canvasContext.fillStyle = 'rgb(18, 18, 18)';
            canvasContext.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = 'rgb(0, 123, 255)';

            canvasContext.beginPath();

            const sliceWidth = waveformCanvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * waveformCanvas.height / 2;

                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasContext.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
            canvasContext.stroke();
        }

        drawWaveform();

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            textInput.value = speechResult; // Set the transcribed text into the textarea
            recordingResult.textContent = `Recorded Text: ${speechResult}`;
        };

        recognition.onerror = (event) => {
            recordingResult.textContent = `Error occurred in recognition: ${event.error}`;
        };
    }

    async function stopRecording() {
        if (recognition) {
            recognition.stop();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
    }

    document.querySelector('button[onclick="startRecording()"]').addEventListener('click', startRecording);
    document.querySelector('button[onclick="stopRecording()"]').addEventListener('click', stopRecording);
});