import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Conv1D, GlobalMaxPooling1D, Dense
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Build CNN Model
def create_emotion_model(vocab_size, embedding_dim, max_length):
    model = Sequential([
        Embedding(input_dim=vocab_size, output_dim=embedding_dim, input_length=max_length),
        Conv1D(128, 5, activation='relu'),
        GlobalMaxPooling1D(),
        Dense(128, activation='relu'),
        Dense(4, activation='softmax')  # Assuming four emotions: happy, sad, angry, neutral
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Example use
vocab_size = 10000  # Adjust according to your vocabulary
embedding_dim = 50
max_length = 100
emotion_model = create_emotion_model(vocab_size, embedding_dim, max_length)
