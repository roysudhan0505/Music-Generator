export interface MidiNote {
  id: string;
  pitch: number; // 0 - 127
  pitchName: string; // e.g. "C4", "G#5"
  startTime: number; // in seconds or quarter-note beats
  duration: number; // in seconds or beats
  velocity: number; // 0 - 127
  trackIndex?: number;
  channel?: number;
}

export interface MidiTrack {
  id: string;
  name: string;
  instrument?: string;
  channel: number;
  notes: MidiNote[];
  totalDuration: number;
}

export interface MidiDatasetItem {
  id: string;
  title: string;
  composer: string;
  genre: 'classical' | 'jazz' | 'ambient' | 'chiptune';
  tempo: number;
  timeSignature: [number, number];
  tracks: MidiTrack[];
  notes: MidiNote[];
  description: string;
  keySignature: string;
  rawMidiBytes?: Uint8Array;
}

export interface PreprocessedToken {
  id: string;
  token: string; // "C4", "C4.E4.G4", "rest_0.5"
  type: 'note' | 'chord' | 'rest';
  pitches: number[];
  duration: number;
  offset: number;
}

export interface PreprocessedData {
  tokens: PreprocessedToken[];
  tokenStrings: string[];
  vocabulary: string[];
  noteToInt: Record<string, number>;
  intToNote: Record<number, string>;
  inputSequences: number[][]; // X (indices)
  targetTokens: number[]; // y (indices)
  sequenceLength: number;
  frequencies: { token: string; count: number; percentage: number }[];
  transitionMatrix: { from: string; to: string; probability: number }[];
  rawNotesCount: number;
  uniqueTokenCount: number;
}

export type ModelType = 'lstm' | 'bilstm' | 'gan';

export interface ModelHyperparameters {
  architecture: ModelType;
  sequenceLength: number;
  hiddenUnits: number;
  layers: number;
  dropout: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
  latentDim: number; // For GAN
}

export interface TrainingMetric {
  epoch: number;
  batch: number;
  loss: number;
  perplexity: number;
  accuracy: number;
  timestamp: number;
}

export interface GenerationSettings {
  temperature: number; // 0.2 - 2.0
  length: number; // 16 - 128 notes
  tempo: number; // 60 - 220 BPM
  instrument: 'grand_piano' | 'rhodes' | 'strings' | 'marimba' | 'synth_8bit';
  seedType: 'dataset' | 'motif' | 'random' | 'ai';
  seedNotes?: string[];
  reverbAmount: number; // 0 - 1
  swingFactor: number; // 0 - 0.5
}

export interface AIAnalysisResult {
  detectedKey: string;
  harmonicProgression: string;
  melodicContour: string;
  tonalCoherence: string;
  aestheticStyle: string;
  theoryCritique: string;
  recommendation: string;
}

export interface GeneratedSong {
  id: string;
  title: string;
  artist: string;
  styleTags: string[];
  genre: 'classical' | 'jazz' | 'ambient' | 'chiptune' | 'pop' | 'electronic';
  prompt: string;
  lyrics?: string;
  hasVocals: boolean;
  tempo: number;
  duration: number;
  notes: MidiNote[];
  waveform: number[];
  createdAt: number;
  likes: number;
  plays: number;
  coverGradient: string;
  coverImage?: string;
  instrument: 'grand_piano' | 'rhodes' | 'strings' | 'marimba' | 'synth_8bit';
  keySignature: string;
  model: 'Harmoniq v3.5 (LSTM)' | 'Harmoniq v4-Chopin' | 'Harmoniq-GAN Polyphonic';
}
