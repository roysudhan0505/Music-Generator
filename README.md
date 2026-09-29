# 🎵 Music Generation with AI

An AI-powered music generation project that uses **Deep Learning** to learn patterns from existing MIDI music and generate new musical compositions.

The project processes MIDI files into note sequences, trains a recurrent neural network such as **LSTM**, and generates new music based on the learned musical patterns. The generated sequences are then converted back into MIDI files that can be played or further converted into audio.

---

## 📌 Project Overview

Music contains complex patterns involving notes, timing, rhythm, chords, and melodies. This project explores how Artificial Intelligence can learn these patterns from existing musical compositions and create new music.

### Workflow

```text
MIDI Music Dataset
        ↓
Data Collection
        ↓
MIDI Preprocessing
        ↓
Note Sequence Extraction
        ↓
Training Dataset Creation
        ↓
LSTM / RNN Model
        ↓
Model Training
        ↓
Music Sequence Generation
        ↓
MIDI File Creation
        ↓
🎵 Generated Music
```

---

## 🎯 Objectives

* Collect MIDI music datasets.
* Extract musical notes and sequences from MIDI files.
* Preprocess the data for deep learning.
* Train an RNN/LSTM-based music generation model.
* Learn musical patterns such as melody and rhythm.
* Generate new and original musical sequences.
* Convert generated sequences into MIDI files.
* Play or save the generated compositions.

---

## 🛠️ Technologies Used

* **Python**
* **TensorFlow / Keras**
* **Music21**
* **NumPy**
* **Pandas**
* **Matplotlib**
* **MIDI**
* **Jupyter Notebook / VS Code**

---

## 📂 Project Structure

```text
Music-Generation-with-AI/
│
├── dataset/
│   └── midi/
│       ├── song1.mid
│       ├── song2.mid
│       └── ...
│
├── data/
│   ├── notes.pkl
│   └── sequences.pkl
│
├── models/
│   └── music_generation_model.h5
│
├── output/
│   ├── generated_music.mid
│   └── generated_music.wav
│
├── notebooks/
│   └── music_generation.ipynb
│
├── src/
│   ├── preprocess.py
│   ├── train.py
│   ├── generate.py
│   └── midi_converter.py
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## 📥 1. Dataset Collection

The model requires a collection of MIDI files for training.

The dataset can contain different genres such as:

* Classical
* Jazz
* Piano
* Folk
* Instrumental
* Pop

Place the MIDI files inside:

```text
dataset/midi/
```

Example:

```text
dataset/midi/
├── classical_01.mid
├── classical_02.mid
├── piano_01.mid
└── piano_02.mid
```

---

## 🎼 2. MIDI Preprocessing

The MIDI files are processed using the **Music21** library.

The preprocessing stage extracts musical information such as:

* Notes
* Chords
* Pitch
* Duration
* Musical sequences

Example:

```python
from music21 import converter, instrument, note, chord

midi = converter.parse("dataset/midi/song.mid")

notes = []

for element in midi.flatten().notes:
    if isinstance(element, note.Note):
        notes.append(str(element.pitch))

    elif isinstance(element, chord.Chord):
        notes.append('.'.join(str(n) for n in element.normalOrder))

print(notes[:20])
```

The extracted notes are converted into numerical representations that can be understood by the neural network.

---

## 🧠 3. Creating Training Sequences

The extracted notes are converted into sequences.

For example:

```text
C4 → D4 → E4 → G4 → A4
```

The model can learn:

```text
Input:
C4 D4 E4 G4

Output:
A4
```

A sliding-window approach can be used to create multiple training examples.

---

## 🤖 4. Deep Learning Model

An **LSTM (Long Short-Term Memory)** network is used because music is sequential data and the model needs to learn relationships between previous and upcoming notes.

Example architecture:

```text
Input Layer
     ↓
LSTM Layer
     ↓
Dropout
     ↓
LSTM Layer
     ↓
Dropout
     ↓
Dense Layer
     ↓
Softmax Output
```

Example implementation:

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dropout, Dense

model = Sequential()

model.add(
    LSTM(
        256,
        input_shape=(sequence_length, 1),
        return_sequences=True
    )
)

model.add(Dropout(0.3))

model.add(
    LSTM(256)
)

model.add(Dropout(0.3))

model.add(
    Dense(number_of_notes, activation="softmax")
)

model.compile(
    loss="categorical_crossentropy",
    optimizer="adam"
)

model.summary()
```

---

## 🏋️ 5. Model Training

The processed music sequences are used to train the model.

Example:

```python
model.fit(
    X,
    y,
    epochs=50,
    batch_size=64
)
```

During training, the model learns patterns from the MIDI dataset.

The trained model can be saved as:

```text
models/music_generation_model.h5
```

---

## 🎹 6. Music Generation

After training, the model can generate new sequences.

A random sequence from the training data can be used as the starting point.

The model predicts the next note repeatedly:

```text
Seed Sequence
      ↓
Predict Next Note
      ↓
Add Predicted Note
      ↓
Predict Next Note
      ↓
Repeat
      ↓
Generated Music Sequence
```

The generated sequence does not simply copy one existing song; it is produced from patterns learned during training.

---

## 🎵 7. Convert Generated Notes to MIDI

The generated notes are converted back into a MIDI file using Music21.

Example:

```python
from music21 import stream, note

output = stream.Stream()

for pitch in generated_notes:
    output.append(note.Note(pitch))

output.write(
    "midi",
    fp="output/generated_music.mid"
)
```

The resulting file can be opened using a MIDI-compatible music player or digital audio workstation.

---

## 🔊 8. MIDI to Audio

MIDI files contain musical instructions rather than recorded audio.

To obtain an audio file such as WAV or MP3, a MIDI synthesizer can be used.

Example tools:

* FluidSynth
* MuseScore
* TiMidity++
* Other MIDI-compatible DAWs

Example output:

```text
output/
├── generated_music.mid
└── generated_music.wav
```

---

## 📊 Model Evaluation

The generated music can be evaluated using:

* Musical coherence
* Note diversity
* Sequence consistency
* Rhythm consistency
* Chord progression
* Repetition
* Human listening evaluation

Since music quality is partly subjective, evaluation can combine quantitative measurements with human feedback.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/Music-Generation-with-AI.git
```

### 2. Navigate to the project

```bash
cd Music-Generation-with-AI
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

### 4. Activate the environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 📦 Requirements

Example `requirements.txt`:

```text
tensorflow
music21
numpy
pandas
matplotlib
scikit-learn
```

---

## ▶️ How to Run

### Step 1 — Add MIDI files

Place your MIDI dataset inside:

```text
dataset/midi/
```

### Step 2 — Preprocess the dataset

```bash
python src/preprocess.py
```

### Step 3 — Train the model

```bash
python src/train.py
```

### Step 4 — Generate music

```bash
python src/generate.py
```

### Step 5 — Listen to the generated music

Open:

```text
output/generated_music.mid
```

with a MIDI player or music production software.

---

## ✨ Features

* 🎼 MIDI dataset processing
* 🧠 Deep learning-based music generation
* 🔄 LSTM sequence learning
* 🎹 Automatic note prediction
* 🎵 New MIDI composition generation
* 🔊 MIDI-to-audio conversion
* 📁 Automatic output file generation
* 🧩 Modular project structure

---

## 🚀 Future Improvements

* Implement Transformer-based music generation.
* Add GAN-based music generation.
* Support multiple musical instruments.
* Generate complete melodies with chords and rhythm.
* Add a web interface for music generation.
* Add genre selection.
* Add tempo and instrument controls.
* Generate longer musical compositions.
* Improve MIDI-to-audio conversion.
* Deploy the model as a web application or API.

---

## ⚠️ Limitations

* Generated music quality depends heavily on the training dataset.
* Small datasets may produce repetitive sequences.
* Training can require significant computational resources.
* MIDI generation does not automatically produce realistic audio.
* Musical quality cannot be completely measured using numerical metrics.

---

## 📜 License

This project is intended for educational and research purposes.

If external MIDI datasets are used, their respective licenses and attribution requirements should be followed.

---

## 👨‍💻 Author

**Roys Sudhan B.**

AI/ML Engineering Student
Bengaluru, Karnataka, India

### Interests

* Artificial Intelligence
* Machine Learning
* Generative AI
* Android Development
* Music & Creative Technology

---

## ⭐ Acknowledgements

* [Music21](https://web.mit.edu/music21/)
* TensorFlow / Keras
* Python
* Open-source MIDI datasets
* The open-source AI and music-generation community

---

## 🎶 Project Goal

> **Teach machines to understand musical patterns and use those patterns to create new music.**

🎵 **Input:** Existing MIDI compositions
🧠 **Process:** Deep Learning
🎹 **Output:** Newly generated MIDI music
