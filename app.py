from flask import Flask, request, jsonify
from tortoise.models.emotion_model import emotion_model, max_length  # Import the model
import pyttsx3
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)


# Load the pre-trained model
emotion_model.load_weights('weights.h5')  # Use pre-trained weights

# TTS engine setup
engine = pyttsx3.init()

# Process text input and emotion detection
@app.route('/process_text', methods=['POST'])
def process_text():
    data = request.json
    text = data['text']
    tokenized = pad_sequences(tokenizer.texts_to_sequences([text]), maxlen=max_length)
    
    # Predict emotion
    emotion = np.argmax(emotion_model.predict(tokenized), axis=-1)
    emotion_mapping = {0: 'happy', 1: 'sad', 2: 'angry', 3: 'neutral'}
    detected_emotion = emotion_mapping[emotion[0]]

    # Adjust prosody based on detected emotion
    if detected_emotion == 'happy':
        engine.setProperty('rate', 180)
    elif detected_emotion == 'sad':
        engine.setProperty('rate', 120)
    elif detected_emotion == 'angry':
        engine.setProperty('rate', 200)
    else:
        engine.setProperty('rate', 150)

    # Synthesize speech
    engine.say(text)
    engine.runAndWait()

    return jsonify({"emotion": detected_emotion, "text": text})

if __name__ == "__main__":
    app.run(debug=True)
