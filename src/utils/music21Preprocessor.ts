import { MidiNote, PreprocessedData, PreprocessedToken } from '../types/music';

/**
 * Emulates the Python music21 preprocessing pipeline used in AI research:
 * - Parses note events & simultaneous notes into polyphonic chord tokens ('C4.E4.G4') or note tokens ('C4')
 * - Quantizes durations and captures rests
 * - Builds integer vocabulary mapping (note_to_int, int_to_note)
 * - Generates sliding window input/target sequences for LSTM/RNN training
 * - Computes token distribution frequencies and Markovian transition matrix
 */
export function preprocessMidiWithMusic21(
  notes: MidiNote[],
  sequenceLength: number = 16,
  quantizeGrid: number = 0.25 // 16th note grid
): PreprocessedData {
  if (!notes || notes.length === 0) {
    return {
      tokens: [],
      tokenStrings: [],
      vocabulary: [],
      noteToInt: {},
      intToNote: {},
      inputSequences: [],
      targetTokens: [],
      sequenceLength,
      frequencies: [],
      transitionMatrix: [],
      rawNotesCount: 0,
      uniqueTokenCount: 0,
    };
  }

  // 1. Sort notes chronologically
  const sortedNotes = [...notes].sort((a, b) => {
    if (Math.abs(a.startTime - b.startTime) < 0.05) {
      return a.pitch - b.pitch;
    }
    return a.startTime - b.startTime;
  });

  // 2. Group notes occurring at almost the same time (< 0.05s) into Chords
  const timeBuckets: { time: number; notes: MidiNote[] }[] = [];
  for (const n of sortedNotes) {
    const lastBucket = timeBuckets[timeBuckets.length - 1];
    if (lastBucket && Math.abs(lastBucket.time - n.startTime) < 0.05) {
      lastBucket.notes.push(n);
    } else {
      timeBuckets.push({ time: n.startTime, notes: [n] });
    }
  }

  // 3. Convert time buckets into music21-style tokens
  const tokens: PreprocessedToken[] = [];
  let prevEndTime = 0;

  for (let i = 0; i < timeBuckets.length; i++) {
    const bucket = timeBuckets[i];

    // Check for rest between previous end and current start
    const restDuration = bucket.time - prevEndTime;
    if (restDuration > 0.35) {
      const quantizedRest = Math.max(0.25, Math.round(restDuration / quantizeGrid) * quantizeGrid);
      tokens.push({
        id: `token_rest_${tokens.length}`,
        token: `rest_${quantizedRest.toFixed(2)}`,
        type: 'rest',
        pitches: [0],
        duration: quantizedRest,
        offset: prevEndTime,
      });
    }

    // Determine if chord or single note
    const uniquePitches = Array.from(new Set(bucket.notes.map((n) => n.pitch))).sort((a, b) => a - b);
    const avgDuration = bucket.notes.reduce((sum, n) => sum + n.duration, 0) / bucket.notes.length;
    const quantizedDuration = Math.max(0.25, Math.round(avgDuration / quantizeGrid) * quantizeGrid);

    if (uniquePitches.length > 1) {
      // Polyphonic Chord token like "C4.E4.G4"
      const chordNames = uniquePitches.map((p) => {
        const found = bucket.notes.find((n) => n.pitch === p);
        return found ? found.pitchName : `P${p}`;
      });
      const tokenStr = chordNames.join('.');
      tokens.push({
        id: `token_${tokens.length}`,
        token: tokenStr,
        type: 'chord',
        pitches: uniquePitches,
        duration: quantizedDuration,
        offset: bucket.time,
      });
    } else {
      // Single Note token like "C4"
      const noteName = bucket.notes[0].pitchName;
      tokens.push({
        id: `token_${tokens.length}`,
        token: noteName,
        type: 'note',
        pitches: uniquePitches,
        duration: quantizedDuration,
        offset: bucket.time,
      });
    }

    prevEndTime = bucket.time + avgDuration;
  }

  const tokenStrings = tokens.map((t) => t.token);

  // 4. Build Vocabulary
  const uniqueVocab = Array.from(new Set(tokenStrings)).sort();
  const noteToInt: Record<string, number> = {};
  const intToNote: Record<number, string> = {};

  uniqueVocab.forEach((token, index) => {
    noteToInt[token] = index;
    intToNote[index] = token;
  });

  // 5. Build Sliding Window Sequences for LSTM (X -> y)
  const inputSequences: number[][] = [];
  const targetTokens: number[] = [];

  const actualSeqLen = Math.min(sequenceLength, Math.max(2, Math.floor(tokenStrings.length / 2)));

  for (let i = 0; i < tokenStrings.length - actualSeqLen; i++) {
    const seqIn = tokenStrings.slice(i, i + actualSeqLen).map((tok) => noteToInt[tok]);
    const target = noteToInt[tokenStrings[i + actualSeqLen]];
    inputSequences.push(seqIn);
    targetTokens.push(target);
  }

  // 6. Token Frequencies
  const freqMap: Record<string, number> = {};
  for (const tok of tokenStrings) {
    freqMap[tok] = (freqMap[tok] || 0) + 1;
  }
  const frequencies = Object.entries(freqMap)
    .map(([token, count]) => ({
      token,
      count,
      percentage: Number(((count / tokenStrings.length) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  // 7. Transition Matrix (Markovian probabilities between tokens)
  const transCount: Record<string, Record<string, number>> = {};
  for (let i = 0; i < tokenStrings.length - 1; i++) {
    const from = tokenStrings[i];
    const to = tokenStrings[i + 1];
    if (!transCount[from]) transCount[from] = {};
    transCount[from][to] = (transCount[from][to] || 0) + 1;
  }

  const transitionMatrix: { from: string; to: string; probability: number }[] = [];
  for (const [from, dests] of Object.entries(transCount)) {
    const totalFrom = Object.values(dests).reduce((a, b) => a + b, 0);
    for (const [to, count] of Object.entries(dests)) {
      transitionMatrix.push({
        from,
        to,
        probability: Number((count / totalFrom).toFixed(3)),
      });
    }
  }

  return {
    tokens,
    tokenStrings,
    vocabulary: uniqueVocab,
    noteToInt,
    intToNote,
    inputSequences,
    targetTokens,
    sequenceLength: actualSeqLen,
    frequencies,
    transitionMatrix,
    rawNotesCount: notes.length,
    uniqueTokenCount: uniqueVocab.length,
  };
}

/**
 * Generates ready-to-run Python code using music21 and PyTorch/TensorFlow
 */
export function generatePythonMusic21Script(datasetTitle: string, seqLen: number, hiddenUnits: number): string {
  return `"""
Harmoniq AI - Music Generation with music21 & Deep Learning
Dataset: ${datasetTitle}
Architecture: LSTM Recurrent Neural Network
"""

import glob
import pickle
import numpy as np
from music21 import converter, instrument, note, chord, midi
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# ==========================================
# STEP 1: PREPROCESS MIDI WITH MUSIC21
# ==========================================
def extract_notes_from_midi(midi_folder="data/midi/"):
    notes = []
    print("Collecting and parsing MIDI files with music21...")
    
    for file in glob.glob(f"{midi_folder}/*.mid"):
        midi_obj = converter.parse(file)
        notes_to_parse = None
        
        try: # File has instrument parts
            parts = instrument.partitionByInstrument(midi_obj)
            notes_to_parse = parts.parts[0].recurse()
        except: # File has flat notes
            notes_to_parse = midi_obj.flat.notes
            
        for element in notes_to_parse:
            if isinstance(element, note.Note):
                notes.append(str(element.pitch))
            elif isinstance(element, chord.Chord):
                # Join chord normal order pitches with '.' e.g. "C4.E4.G4"
                notes.append('.'.join(str(n) for n in element.normalOrder))
            elif isinstance(element, note.Rest):
                notes.append(f"rest_{element.duration.quarterLength}")
                
    print(f"Extracted {len(notes)} total musical tokens.")
    return notes

# ==========================================
# STEP 2: BUILD VOCABULARY & SLIDING WINDOWS
# ==========================================
def prepare_sequences(notes, sequence_length=${seqLen}):
    # Get all unique pitch names sorted
    pitchnames = sorted(set(item for item in notes))
    n_vocab = len(pitchnames)
    
    note_to_int = {note: number for number, note in enumerate(pitchnames)}
    int_to_note = {number: note for number, note in enumerate(pitchnames)}
    
    network_input = []
    network_output = []
    
    for i in range(len(notes) - sequence_length):
        sequence_in = notes[i:i + sequence_length]
        sequence_out = notes[i + sequence_length]
        network_input.append([note_to_int[char] for char in sequence_in])
        network_output.append(note_to_int[sequence_out])
        
    n_patterns = len(network_input)
    print(f"Generated {n_patterns} sliding window sequences. Vocabulary size: {n_vocab}")
    return np.array(network_input), np.array(network_output), n_vocab, note_to_int, int_to_note

# ==========================================
# STEP 3: DEEP LEARNING LSTM ARCHITECTURE
# ==========================================
class MusicLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim=64, hidden_dim=${hiddenUnits}, num_layers=2, dropout=0.3):
        super(MusicLSTM, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim, vocab_size)
        
    def forward(self, x, hidden=None):
        embeds = self.embedding(x)
        out, hidden = self.lstm(embeds, hidden)
        # Take the output of the last time step
        out = self.dropout(out[:, -1, :])
        logits = self.fc(out)
        return logits, hidden

# ==========================================
# STEP 4: GENERATION WITH TEMPERATURE SAMPLING
# ==========================================
def sample_with_temperature(logits, temperature=0.8):
    probs = np.exp(logits / temperature)
    probs = probs / np.sum(probs)
    return np.random.choice(len(probs), p=probs)

def generate_music_sequence(model, seed_sequence, int_to_note, generate_length=64, temperature=0.8):
    model.eval()
    pattern = list(seed_sequence)
    prediction_output = []
    
    with torch.no_grad():
        for _ in range(generate_length):
            inp = torch.tensor([pattern], dtype=torch.long)
            logits, _ = model(inp)
            logits = logits[0].cpu().numpy()
            
            predicted_idx = sample_with_temperature(logits, temperature)
            result = int_to_note[predicted_idx]
            prediction_output.append(result)
            
            pattern.append(predicted_idx)
            pattern = pattern[1:]
            
    return prediction_output

# ==========================================
# STEP 5: CONVERT BACK TO MIDI & SAVE AUDIO
# ==========================================
def create_midi_from_prediction(prediction_output, output_filename="generated_output.mid"):
    offset = 0
    output_notes = []
    
    for pattern in prediction_output:
        if pattern.startswith("rest"):
            # Rest token
            parts = pattern.split("_")
            dur = float(parts[1]) if len(parts) > 1 else 0.5
            new_rest = note.Rest()
            new_rest.quarterLength = dur
            new_rest.offset = offset
            output_notes.append(new_rest)
            offset += dur
        elif ('.' in pattern) or pattern.isdigit():
            # Chord token
            notes_in_chord = pattern.split('.')
            chord_notes = []
            for current_note in notes_in_chord:
                new_note = note.Note(int(current_note) if current_note.isdigit() else current_note)
                new_note.storedInstrument = instrument.Piano()
                chord_notes.append(new_note)
            new_chord = chord.Chord(chord_notes)
            new_chord.offset = offset
            output_notes.append(new_chord)
            offset += 0.5
        else:
            # Single Note token
            new_note = note.Note(pattern)
            new_note.offset = offset
            new_note.storedInstrument = instrument.Piano()
            output_notes.append(new_note)
            offset += 0.5
            
    midi_stream = midi.translate.streamToMidiFile(output_notes)
    midi_stream.open(output_filename, 'wb')
    midi_stream.write()
    midi_stream.close()
    print(f"Generated MIDI successfully saved to {output_filename}")

if __name__ == "__main__":
    print("Harmoniq AI Pipeline Initialized. Ready for training.")
`;
}
