import { MidiNote } from '../types/music';

export type InstrumentType = 'grand_piano' | 'rhodes' | 'strings' | 'marimba' | 'synth_8bit';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isPlaying: boolean = false;
  private activeTimeouts: number[] = [];
  private playbackStartTime: number = 0;
  private totalDuration: number = 0;
  private progressInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      // Reverb simulation
      this.reverbNode = this.ctx.createConvolver();
      this.createImpulseResponse(1.8, 2.2);

      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate synthetic impulse response for spatial room reverb
  private createImpulseResponse(duration: number, decay: number) {
    if (!this.ctx || !this.reverbNode) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
    }
    this.reverbNode.buffer = impulse;
  }

  // Synthesize single note based on instrument timbre
  private triggerNote(
    pitch: number,
    startTime: number,
    duration: number,
    velocity: number = 85,
    instrument: InstrumentType = 'grand_piano',
    context: BaseAudioContext = this.ctx!
  ) {
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    const velFactor = (velocity / 127) * 0.8;

    const gainNode = context.createGain();
    gainNode.connect(context.destination);

    if (instrument === 'grand_piano') {
      // Harmonic piano structure: Fundamental + 2nd + 3rd harmonics + hammer transient
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const osc3 = context.createOscillator();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(freq * 3, startTime);

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(8000, freq * 4), startTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), startTime + duration);

      // ADSR Envelope
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(velFactor * 0.6, startTime + 0.015); // Fast attack
      gainNode.gain.exponentialRampToValueAtTime(velFactor * 0.35, startTime + 0.15); // Decay
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.1); // Release

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gainNode);

      osc1.start(startTime);
      osc2.start(startTime);
      osc3.start(startTime);

      osc1.stop(startTime + duration + 0.2);
      osc2.stop(startTime + duration + 0.2);
      osc3.stop(startTime + duration + 0.2);
    } else if (instrument === 'rhodes') {
      // Vintage Rhodes: Warm sine with bell overtone and gentle vibrato
      const osc = context.createOscillator();
      const bellOsc = context.createOscillator();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(freq * 3.98, startTime); // Slightly detuned 4th harmonic

      const bellGain = context.createGain();
      bellGain.gain.setValueAtTime(velFactor * 0.3, startTime);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3); // Bell ping fades quickly

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(velFactor * 0.5, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(velFactor * 0.25, startTime + duration * 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.3);

      osc.connect(gainNode);
      bellOsc.connect(bellGain);
      bellGain.connect(gainNode);

      osc.start(startTime);
      bellOsc.start(startTime);
      osc.stop(startTime + duration + 0.35);
      bellOsc.stop(startTime + 0.35);
    } else if (instrument === 'strings') {
      // Lush Ensemble Strings: Detuned sawtooth with slow orchestral attack
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc1.detune.setValueAtTime(-7, startTime);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(7, startTime);

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, startTime);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(velFactor * 0.45, startTime + 0.18); // Soft bow attack
      gainNode.gain.setValueAtTime(velFactor * 0.45, startTime + duration * 0.8);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.4); // Smooth sustain release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.45);
      osc2.stop(startTime + duration + 0.45);
    } else if (instrument === 'marimba') {
      // Woody / Metallic transient chime
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(velFactor * 0.8, startTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(duration, 0.45));

      osc.connect(gainNode);
      osc.start(startTime);
      osc.stop(startTime + Math.min(duration, 0.45) + 0.05);
    } else {
      // 8-Bit Chiptune Pulse
      const osc = context.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(velFactor * 0.35, startTime);
      gainNode.gain.setValueAtTime(velFactor * 0.35, startTime + duration * 0.85);
      gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    }
  }

  // Play a single note preview on user click
  public previewNote(pitch: number, instrument: InstrumentType = 'grand_piano') {
    this.initContext();
    if (!this.ctx) return;
    this.triggerNote(pitch, this.ctx.currentTime, 0.6, 90, instrument);
  }

  // Play full note sequence with real-time playhead progress
  public playSequence(
    notes: MidiNote[],
    instrument: InstrumentType = 'grand_piano',
    onProgress?: (currentSec: number, totalSec: number) => void,
    onEnded?: () => void
  ) {
    this.stop();
    if (!notes || notes.length === 0) return;

    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    const now = this.ctx.currentTime + 0.05;
    this.playbackStartTime = now;

    // Calculate total duration
    this.totalDuration = notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);

    for (const note of notes) {
      const noteStart = now + note.startTime;
      this.triggerNote(note.pitch, noteStart, note.duration, note.velocity, instrument);
    }

    // Playhead ticker
    this.progressInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      const elapsed = this.ctx.currentTime - this.playbackStartTime;
      if (onProgress) {
        onProgress(Math.min(elapsed, this.totalDuration), this.totalDuration);
      }
      if (elapsed >= this.totalDuration + 0.3) {
        this.stop();
        if (onEnded) onEnded();
      }
    }, 30);
  }

  public stop() {
    this.isPlaying = false;
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeTimeouts = [];

    if (this.ctx && this.ctx.state !== 'closed') {
      // Clean suspend and resume to kill active oscillators
      this.ctx.close().then(() => {
        this.ctx = null;
      });
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Export Note Sequence as a lossless 16-bit 44.1kHz Stereo WAV Audio file
   */
  public async exportWavAudioBlob(
    notes: MidiNote[],
    instrument: InstrumentType = 'grand_piano'
  ): Promise<Blob> {
    const totalDuration = Math.max(1.0, notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0) + 1.0);
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

    for (const note of notes) {
      this.triggerNote(note.pitch, note.startTime, note.duration, note.velocity, instrument, offlineCtx);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  // Convert AudioBuffer to standard canonical RIFF WAV format
  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    function writeString(offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitDepth, true); // BitsPerSample

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels & write 16-bit PCM samples
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = Math.max(-1, Math.min(1, channels[ch][i]));
        // Convert to 16-bit signed int
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // Trigger download of WAV file directly in browser
  public async downloadWavFile(notes: MidiNote[], instrument: InstrumentType = 'grand_piano', filename = 'generated_music.wav') {
    const blob = await this.exportWavAudioBlob(notes, instrument);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const audioSynth = new AudioSynthesizer();
