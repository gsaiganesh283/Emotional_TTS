document.addEventListener('DOMContentLoaded', () => {
    const voiceSelect = document.getElementById('voice-select');
    const textInput = document.getElementById('text-input');
    const convertButton = document.querySelector('button');

    // Populate voice options
    function populateVoiceOptions() {
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';

        voices.forEach(voice => {
            if (voice.name && voice.lang) {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = voice.name;
                voiceSelect.appendChild(option);
            }
        });

        // Retrieve and set default voice from local storage
        const savedVoiceName = localStorage.getItem('selectedVoice');
        if (savedVoiceName) {
            const defaultVoice = voices.find(voice => voice.name === savedVoiceName);
            if (defaultVoice) {
                voiceSelect.value = savedVoiceName;
            }
        }
    }

    // Save selected voice to local storage
    function saveSelectedVoice() {
        const selectedVoiceName = voiceSelect.value;
        localStorage.setItem('selectedVoice', selectedVoiceName);
    }

    // Event listener for voice selection change
    voiceSelect.addEventListener('change', saveSelectedVoice);

    // Event listener for Enter key press
    textInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission behavior
            convertTextToSpeech(); // Call the function to convert text to speech
        }
    });

    // Populate voices when they are loaded
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
    } else {
        populateVoiceOptions();
    }

    // Convert text to speech
    window.convertTextToSpeech = function() {
        const text = textInput.value;
        const selectedVoice = voiceSelect.value;

        // Basic validation
        if (!text.trim()) {
            alert("Please enter some text.");
            return;
        }

        // Using the Web Speech API
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Set options
        const voices = speechSynthesis.getVoices();
        const selectedVoiceObj = voices.find(voice => voice.name === selectedVoice);

        if (selectedVoiceObj) {
            utterance.voice = selectedVoiceObj;
        }

        utterance.lang = 'te-IN'; // Telugu (India)
        utterance.pitch = 1; // Pitch (0 to 2)
        utterance.rate = 1; // Speed (0.1 to 10)

        // Speak the text
        speechSynthesis.speak(utterance);
    };
});
