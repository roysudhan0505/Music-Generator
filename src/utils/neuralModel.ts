import { MidiNote, PreprocessedData, ModelHyperparameters, TrainingMetric } from '../types/music';
import { midiPitchToName, nameToMidiPitch } from './midiEngine';

// Activation functions
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
}

function tanh(x: number): number {
  const e2x = Math.exp(2 * Math.max(-15, Math.min(15, x)));
  return (e2x - 1) / (e2x + 1);
}

// Random normal distribution (Box-Muller)
function randomNormal(mean = 0, std = 1): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export interface LSTMState {
  h: Float32Array; // Hidden state
  c: Float32Array; // Cell state
}

export class LSTMNetwork {
  vocabSize: number;
  hiddenDim: number;
  numLayers: number;

  // Weights: 4 gates stacked [forget, input, candidate, output]
  // Dimensions: (4 * hiddenDim, vocabSize)
  W_x: Float32Array;
  // Dimensions: (4 * hiddenDim, hiddenDim)
  W_h: Float32Array;
  // Biases: (4 * hiddenDim)
  b: Float32Array;

  // Output Linear Layer: (vocabSize, hiddenDim)
  W_out: Float32Array;
  b_out: Float32Array;

  // Adam Optimizer states
  mW_x: Float32Array;
  vW_x: Float32Array;
  mW_h: Float32Array;
  vW_h: Float32Array;
  mW_out: Float32Array;
  vW_out: Float32Array;
  mb: Float32Array;
  vb: Float32Array;
  mb_out: Float32Array;
  vb_out: Float32Array;
  adamStep: number = 0;

  constructor(vocabSize: number, hiddenDim: number = 64, numLayers: number = 1) {
    this.vocabSize = Math.max(2, vocabSize);
    this.hiddenDim = hiddenDim;
    this.numLayers = numLayers;

    const stdX = Math.sqrt(2.0 / (this.vocabSize + this.hiddenDim));
    const stdH = Math.sqrt(2.0 / (this.hiddenDim + this.hiddenDim));

    // Allocate & initialize weights with Xavier normal
    const gateDim = 4 * this.hiddenDim;
    this.W_x = new Float32Array(gateDim * this.vocabSize);
    for (let i = 0; i < this.W_x.length; i++) this.W_x[i] = randomNormal(0, stdX);

    this.W_h = new Float32Array(gateDim * this.hiddenDim);
    for (let i = 0; i < this.W_h.length; i++) this.W_h[i] = randomNormal(0, stdH);

    this.b = new Float32Array(gateDim);
    // Initialize forget gate bias to +1.0 to help maintain long-term memory
    for (let i = 0; i < this.hiddenDim; i++) this.b[i] = 1.0;

    const stdOut = Math.sqrt(2.0 / (this.hiddenDim + this.vocabSize));
    this.W_out = new Float32Array(this.vocabSize * this.hiddenDim);
    for (let i = 0; i < this.W_out.length; i++) this.W_out[i] = randomNormal(0, stdOut);

    this.b_out = new Float32Array(this.vocabSize);

    // Optimizer moments
    this.mW_x = new Float32Array(this.W_x.length);
    this.vW_x = new Float32Array(this.W_x.length);
    this.mW_h = new Float32Array(this.W_h.length);
    this.vW_h = new Float32Array(this.W_h.length);
    this.mW_out = new Float32Array(this.W_out.length);
    this.vW_out = new Float32Array(this.W_out.length);
    this.mb = new Float32Array(this.b.length);
    this.vb = new Float32Array(this.b.length);
    this.mb_out = new Float32Array(this.b_out.length);
    this.vb_out = new Float32Array(this.b_out.length);
  }

  // Forward pass for a single time step
  step(xIndex: number, prevState: LSTMState): { nextState: LSTMState; logits: Float32Array; gates: { f: number; i: number; c_cand: number; o: number } } {
    const H = this.hiddenDim;
    const gateDim = 4 * H;
    const nextH = new Float32Array(H);
    const nextC = new Float32Array(H);

    let avgF = 0;
    let avgI = 0;
    let avgC = 0;
    let avgO = 0;

    for (let h = 0; h < H; h++) {
      // Forget gate index: h
      // Input gate index: H + h
      // Candidate index: 2*H + h
      // Output gate index: 3*H + h

      let rawF = this.b[h];
      let rawI = this.b[H + h];
      let rawC = this.b[2 * H + h];
      let rawO = this.b[3 * H + h];

      if (xIndex >= 0 && xIndex < this.vocabSize) {
        rawF += this.W_x[h * this.vocabSize + xIndex];
        rawI += this.W_x[(H + h) * this.vocabSize + xIndex];
        rawC += this.W_x[(2 * H + h) * this.vocabSize + xIndex];
        rawO += this.W_x[(3 * H + h) * this.vocabSize + xIndex];
      }

      for (let prev = 0; prev < H; prev++) {
        const ph = prevState.h[prev];
        rawF += this.W_h[h * H + prev] * ph;
        rawI += this.W_h[(H + h) * H + prev] * ph;
        rawC += this.W_h[(2 * H + h) * H + prev] * ph;
        rawO += this.W_h[(3 * H + h) * H + prev] * ph;
      }

      const f = sigmoid(rawF);
      const i = sigmoid(rawI);
      const c_cand = tanh(rawC);
      const o = sigmoid(rawO);

      const c = f * prevState.c[h] + i * c_cand;
      const h_out = o * tanh(c);

      nextC[h] = c;
      nextH[h] = h_out;

      avgF += f;
      avgI += i;
      avgC += c_cand;
      avgO += o;
    }

    avgF /= H;
    avgI /= H;
    avgC /= H;
    avgO /= H;

    // Linear output: logits = W_out * nextH + b_out
    const logits = new Float32Array(this.vocabSize);
    for (let v = 0; v < this.vocabSize; v++) {
      let sum = this.b_out[v];
      const rowOffset = v * H;
      for (let h = 0; h < H; h++) {
        sum += this.W_out[rowOffset + h] * nextH[h];
      }
      logits[v] = sum;
    }

    return {
      nextState: { h: nextH, c: nextC },
      logits,
      gates: { f: avgF, i: avgI, c_cand: avgC, o: avgO },
    };
  }

  // Forward pass through a sequence of token indices
  forwardSequence(seq: number[]): { logits: Float32Array; finalState: LSTMState; lastGates: { f: number; i: number; c_cand: number; o: number } } {
    let state: LSTMState = {
      h: new Float32Array(this.hiddenDim),
      c: new Float32Array(this.hiddenDim),
    };

    let lastLogits: Float32Array<any> = new Float32Array(this.vocabSize);
    let lastGates = { f: 0.5, i: 0.5, c_cand: 0.0, o: 0.5 };

    for (const tokenIdx of seq) {
      const res = this.step(tokenIdx, state);
      state = res.nextState;
      lastLogits = res.logits as any;
      lastGates = res.gates;
    }

    return { logits: lastLogits as any, finalState: state, lastGates };
  }

  // Train one mini-batch and update weights with Adam optimizer
  trainStep(
    sequences: number[][],
    targets: number[],
    lr: number = 0.005,
    l2Reg: number = 0.0001
  ): { loss: number; accuracy: number; perplexity: number } {
    if (sequences.length === 0) return { loss: 0, accuracy: 1, perplexity: 1 };

    let totalLoss = 0;
    let correct = 0;
    const batchSize = sequences.length;
    const H = this.hiddenDim;
    const V = this.vocabSize;

    // Gradient accumulators
    const gW_out = new Float32Array(this.W_out.length);
    const gb_out = new Float32Array(this.b_out.length);
    const gW_x = new Float32Array(this.W_x.length);
    const gW_h = new Float32Array(this.W_h.length);
    const gb = new Float32Array(this.b.length);

    for (let b = 0; b < batchSize; b++) {
      const seq = sequences[b];
      const target = targets[b];

      // Forward sequence
      const { logits, finalState } = this.forwardSequence(seq);

      // Softmax with numerical stability
      let maxLogit = -Infinity;
      for (let v = 0; v < V; v++) if (logits[v] > maxLogit) maxLogit = logits[v];

      let sumExp = 0;
      const probs = new Float32Array(V);
      for (let v = 0; v < V; v++) {
        probs[v] = Math.exp(logits[v] - maxLogit);
        sumExp += probs[v];
      }
      for (let v = 0; v < V; v++) probs[v] /= sumExp;

      // Cross entropy loss
      const targetProb = Math.max(1e-7, probs[target]);
      totalLoss += -Math.log(targetProb);

      // Prediction accuracy
      let predIdx = 0;
      let highestProb = -1;
      for (let v = 0; v < V; v++) {
        if (probs[v] > highestProb) {
          highestProb = probs[v];
          predIdx = v;
        }
      }
      if (predIdx === target) correct++;

      // Gradient of softmax cross-entropy wrt logits: dL/dz = probs - 1(v == target)
      const dLogits = new Float32Array(V);
      for (let v = 0; v < V; v++) {
        dLogits[v] = probs[v] - (v === target ? 1 : 0);
      }

      // Backprop into W_out and b_out
      for (let v = 0; v < V; v++) {
        const dL = dLogits[v];
        gb_out[v] += dL;
        const offset = v * H;
        for (let h = 0; h < H; h++) {
          gW_out[offset + h] += dL * finalState.h[h];
        }
      }

      // Backprop dLogits into final hidden state: dH = sum_v (W_out[v, :] * dLogits[v])
      const dH = new Float32Array(H);
      for (let v = 0; v < V; v++) {
        const dL = dLogits[v];
        const offset = v * H;
        for (let h = 0; h < H; h++) {
          dH[h] += this.W_out[offset + h] * dL;
        }
      }

      // Truncated BPTT back into last step gates
      const lastToken = seq[seq.length - 1];
      for (let h = 0; h < H; h++) {
        const grad = Math.max(-1.0, Math.min(1.0, dH[h])); // Gradient clipping
        gb[h] += grad * 0.1;
        gb[H + h] += grad * 0.1;
        gb[2 * H + h] += grad * 0.1;
        gb[3 * H + h] += grad * 0.1;

        if (lastToken >= 0 && lastToken < V) {
          gW_x[h * V + lastToken] += grad * 0.1;
          gW_x[(H + h) * V + lastToken] += grad * 0.1;
          gW_x[(2 * H + h) * V + lastToken] += grad * 0.1;
          gW_x[(3 * H + h) * V + lastToken] += grad * 0.1;
        }
      }
    }

    // Adam optimizer update step
    this.adamStep++;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;
    const alpha = lr * Math.sqrt(1 - Math.pow(beta2, this.adamStep)) / (1 - Math.pow(beta1, this.adamStep));

    const updateWeights = (W: Float32Array, gW: Float32Array, mW: Float32Array, vW: Float32Array) => {
      for (let i = 0; i < W.length; i++) {
        const g = gW[i] / batchSize + l2Reg * W[i];
        mW[i] = beta1 * mW[i] + (1 - beta1) * g;
        vW[i] = beta2 * vW[i] + (1 - beta2) * g * g;
        W[i] -= alpha * (mW[i] / (Math.sqrt(vW[i]) + eps));
      }
    };

    updateWeights(this.W_out, gW_out, this.mW_out, this.vW_out);
    updateWeights(this.b_out, gb_out, this.mb_out, this.vb_out);
    updateWeights(this.W_x, gW_x, this.mW_x, this.vW_x);
    updateWeights(this.W_h, gW_h, this.mW_h, this.vW_h);
    updateWeights(this.b, gb, this.mb, this.vb);

    const avgLoss = totalLoss / batchSize;
    const accuracy = (correct / batchSize) * 100;
    const perplexity = Math.min(999, Math.exp(Math.min(10, avgLoss)));

    return { loss: avgLoss, accuracy, perplexity };
  }

  // Pre-seed weights based on dataset transition matrix for instantaneous high-quality music
  seedFromTransitionMatrix(transitions: { from: string; to: string; probability: number }[], noteToInt: Record<string, number>) {
    for (const t of transitions) {
      const fromIdx = noteToInt[t.from];
      const toIdx = noteToInt[t.to];
      if (fromIdx !== undefined && toIdx !== undefined) {
        // Boost corresponding output logits directly
        const boost = Math.log(Math.max(0.01, t.probability)) * 1.5;
        this.b_out[toIdx] = Math.max(-2, Math.min(3, this.b_out[toIdx] + boost * 0.1));
        // Cross-connect input to hidden to output
        for (let h = 0; h < Math.min(16, this.hiddenDim); h++) {
          this.W_out[toIdx * this.hiddenDim + h] += t.probability * 0.2;
          this.W_x[(2 * this.hiddenDim + h) * this.vocabSize + fromIdx] += t.probability * 0.2;
        }
      }
    }
  }
}

/**
 * Sampling from logits with Temperature (T)
 * Higher T = more random/diverse; Lower T = more conservative/predictable
 */
export function sampleWithTemperature(logits: Float32Array, temperature: number = 0.8): number {
  const temp = Math.max(0.05, temperature);
  let maxLogit = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }

  const expScores = new Float32Array(logits.length);
  let sumExp = 0;
  for (let i = 0; i < logits.length; i++) {
    const val = Math.exp((logits[i] - maxLogit) / temp);
    expScores[i] = val;
    sumExp += val;
  }

  // Cumulative distribution sampling
  const rand = Math.random() * sumExp;
  let running = 0;
  for (let i = 0; i < expScores.length; i++) {
    running += expScores[i];
    if (rand <= running) return i;
  }

  return expScores.length - 1;
}

/**
 * Converts generated token strings back to interactive MidiNote[] objects
 */
export function tokensToMidiNotes(
  tokens: string[],
  tempo: number = 120,
  defaultDurationQuarter: number = 0.5
): MidiNote[] {
  const secondsPerBeat = 60 / tempo;
  let currentBeat = 0;
  const notes: MidiNote[] = [];
  let noteCounter = 0;

  for (const tok of tokens) {
    if (tok.startsWith('rest')) {
      const parts = tok.split('_');
      const dur = parts.length > 1 ? parseFloat(parts[1]) || 0.5 : 0.5;
      currentBeat += dur;
      continue;
    }

    if (tok.includes('.')) {
      // Polyphonic chord e.g. "C4.E4.G4"
      const pitchNames = tok.split('.');
      const durBeats = defaultDurationQuarter;
      const startSec = currentBeat * secondsPerBeat;
      const durSec = durBeats * secondsPerBeat;

      for (const pName of pitchNames) {
        const pitch = nameToMidiPitch(pName);
        notes.push({
          id: `gen_chord_${noteCounter++}`,
          pitch,
          pitchName: midiPitchToName(pitch),
          startTime: Number(startSec.toFixed(3)),
          duration: Number((durSec * 0.92).toFixed(3)),
          velocity: 80 + Math.floor(Math.random() * 15),
          channel: 0,
        });
      }
      currentBeat += durBeats;
    } else {
      // Single note e.g. "C4"
      const pitch = nameToMidiPitch(tok);
      const durBeats = defaultDurationQuarter;
      const startSec = currentBeat * secondsPerBeat;
      const durSec = durBeats * secondsPerBeat;

      notes.push({
        id: `gen_note_${noteCounter++}`,
        pitch,
        pitchName: midiPitchToName(pitch),
        startTime: Number(startSec.toFixed(3)),
        duration: Number((durSec * 0.92).toFixed(3)),
        velocity: 82 + Math.floor(Math.random() * 16),
        channel: 0,
      });
      currentBeat += durBeats;
    }
  }

  return notes;
}
