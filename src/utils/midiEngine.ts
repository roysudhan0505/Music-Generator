import { MidiNote, MidiTrack, MidiDatasetItem } from '../types/music';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiPitchToName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const note = NOTE_NAMES[pitch % 12];
  return `${note}${octave}`;
}

export function nameToMidiPitch(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 60; // fallback C4
  const note = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const index = NOTE_NAMES.indexOf(note);
  if (index === -1) return 60;
  return (octave + 1) * 12 + index;
}

// Variable Length Quantity (VLQ) writer for MIDI
function writeVarLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

// Convert 32-bit int to 4 bytes big-endian
function int32ToBytes(val: number): number[] {
  return [(val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff];
}

// Convert 16-bit int to 2 bytes big-endian
function int16ToBytes(val: number): number[] {
  return [(val >> 8) & 0xff, val & 0xff];
}

interface MidiInternalEvent {
  tick: number;
  type: 'noteOn' | 'noteOff' | 'tempo';
  channel: number;
  pitch: number;
  velocity: number;
  tempoUs?: number;
}

/**
 * Creates standard binary MIDI Format 0 file from note sequence
 */
export function createMidiBytes(notes: MidiNote[], tempoBpm: number = 120, trackTitle: string = 'Harmoniq AI Generated'): Uint8Array {
  const PPQ = 480; // Pulses (ticks) per quarter note
  const secondsPerQuarter = 60 / tempoBpm;
  const ticksPerSecond = PPQ / secondsPerQuarter;

  const events: MidiInternalEvent[] = [];

  for (const n of notes) {
    const onTick = Math.max(0, Math.round(n.startTime * ticksPerSecond));
    const offTick = Math.max(onTick + 1, Math.round((n.startTime + n.duration) * ticksPerSecond));

    events.push({
      tick: onTick,
      type: 'noteOn',
      channel: n.channel || 0,
      pitch: Math.min(127, Math.max(0, Math.round(n.pitch))),
      velocity: Math.min(127, Math.max(1, Math.round(n.velocity || 85))),
    });

    events.push({
      tick: offTick,
      type: 'noteOff',
      channel: n.channel || 0,
      pitch: Math.min(127, Math.max(0, Math.round(n.pitch))),
      velocity: 0,
    });
  }

  // Sort events by tick (NoteOff before NoteOn if identical tick)
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'noteOff' && b.type === 'noteOn') return -1;
    if (a.type === 'noteOn' && b.type === 'noteOff') return 1;
    return 0;
  });

  const trackBytes: number[] = [];

  // Track Name Meta Event
  const titleBytes = Array.from(new TextEncoder().encode(trackTitle));
  trackBytes.push(0x00, 0xff, 0x03, ...writeVarLength(titleBytes.length), ...titleBytes);

  // Set Tempo Meta Event (microseconds per quarter note)
  const usPerQuarter = Math.round(60000000 / tempoBpm);
  trackBytes.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (usPerQuarter >> 16) & 0xff,
    (usPerQuarter >> 8) & 0xff,
    usPerQuarter & 0xff
  );

  let currentTick = 0;

  for (const ev of events) {
    const delta = Math.max(0, ev.tick - currentTick);
    currentTick = ev.tick;

    trackBytes.push(...writeVarLength(delta));

    if (ev.type === 'noteOn') {
      trackBytes.push(0x90 | (ev.channel & 0x0f), ev.pitch, ev.velocity);
    } else {
      trackBytes.push(0x80 | (ev.channel & 0x0f), ev.pitch, 0x00);
    }
  }

  // End of Track Meta Event: delta 0, FF 2F 00
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Build Full File
  // MThd header: 'MThd' (4 bytes), length 6 (4 bytes), format 0 (2 bytes), tracks 1 (2 bytes), division PPQ (2 bytes)
  const headerBytes: number[] = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // format 0 (single track)
    0x00, 0x01,             // 1 track
    ...int16ToBytes(PPQ),
  ];

  // MTrk header: 'MTrk' (4 bytes), length (4 bytes)
  const trackHeader: number[] = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    ...int32ToBytes(trackBytes.length),
  ];

  const fullBytes = new Uint8Array([...headerBytes, ...trackHeader, ...trackBytes]);
  return fullBytes;
}

/**
 * Downloads a generated or processed note sequence as a real .mid file
 */
export function downloadMidiFile(notes: MidiNote[], tempoBpm: number = 120, filename: string = 'generated_music.mid') {
  const bytes = createMidiBytes(notes, tempoBpm, filename.replace(/\.[^/.]+$/, ''));
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Binary MIDI Parser to parse uploaded or raw MIDI files
 */
export function parseMidiBytes(data: Uint8Array, filename: string = 'Uploaded MIDI'): MidiDatasetItem {
  let offset = 0;

  function readString(len: number): string {
    let str = '';
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(data[offset++]);
    }
    return str;
  }

  function readUint32(): number {
    const val = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    offset += 4;
    return val >>> 0;
  }

  function readUint16(): number {
    const val = (data[offset] << 8) | data[offset + 1];
    offset += 2;
    return val;
  }

  function readVarLen(): number {
    let val = 0;
    while (offset < data.length) {
      const b = data[offset++];
      val = (val << 7) | (b & 0x7f);
      if (!(b & 0x80)) break;
    }
    return val;
  }

  // Verify MThd
  const headerId = readString(4);
  if (headerId !== 'MThd') {
    throw new Error('Not a valid Standard MIDI File (missing MThd header)');
  }

  const headerLen = readUint32();
  const format = readUint16();
  const numTracks = readUint16();
  const division = readUint16();
  const ppq = (division & 0x8000) ? 480 : division;

  // Skip any extra header bytes if headerLen > 6
  if (headerLen > 6) {
    offset += (headerLen - 6);
  }

  let tempoBpm = 120;
  const allNotes: MidiNote[] = [];
  const tracks: MidiTrack[] = [];

  for (let t = 0; t < numTracks && offset < data.length; t++) {
    const trackId = readString(4);
    if (trackId !== 'MTrk') {
      break;
    }
    const trackLength = readUint32();
    const trackEnd = offset + trackLength;

    let currentTick = 0;
    let runningStatus = 0;
    const activeNotes = new Map<number, { pitch: number; startTick: number; velocity: number }>();
    const trackNotes: MidiNote[] = [];
    let trackName = `Track ${t + 1}`;

    while (offset < trackEnd && offset < data.length) {
      const delta = readVarLen();
      currentTick += delta;

      let status = data[offset];
      if (status >= 0x80) {
        offset++;
        runningStatus = status;
      } else {
        status = runningStatus;
      }

      const messageType = status & 0xf0;
      const channel = status & 0x0f;

      if (status === 0xff) {
        // Meta Event
        const metaType = data[offset++];
        const metaLength = readVarLen();
        if (metaType === 0x51 && metaLength === 3) {
          // Tempo
          const usPerQuarter = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
          tempoBpm = Math.round(60000000 / usPerQuarter);
        } else if (metaType === 0x03) {
          // Track Name
          let name = '';
          for (let k = 0; k < metaLength; k++) {
            name += String.fromCharCode(data[offset + k]);
          }
          if (name.trim()) trackName = name.trim();
        }
        offset += metaLength;
      } else if (status === 0xf0 || status === 0xf7) {
        // Sysex Event
        const sysexLength = readVarLen();
        offset += sysexLength;
      } else if (messageType === 0x90) {
        // Note On
        const pitch = data[offset++];
        const velocity = data[offset++];
        const noteKey = (channel << 8) | pitch;

        if (velocity > 0) {
          // End previous if overlapping
          if (activeNotes.has(noteKey)) {
            const prev = activeNotes.get(noteKey)!;
            const startSec = (prev.startTick / ppq) * (60 / tempoBpm);
            const durSec = Math.max(0.1, ((currentTick - prev.startTick) / ppq) * (60 / tempoBpm));
            const n: MidiNote = {
              id: `trk_${t}_${prev.pitch}_${prev.startTick}`,
              pitch: prev.pitch,
              pitchName: midiPitchToName(prev.pitch),
              startTime: startSec,
              duration: durSec,
              velocity: prev.velocity,
              trackIndex: t,
              channel,
            };
            trackNotes.push(n);
            allNotes.push(n);
          }
          activeNotes.set(noteKey, { pitch, startTick: currentTick, velocity });
        } else {
          // Note On with velocity 0 is Note Off
          if (activeNotes.has(noteKey)) {
            const prev = activeNotes.get(noteKey)!;
            const startSec = (prev.startTick / ppq) * (60 / tempoBpm);
            const durSec = Math.max(0.1, ((currentTick - prev.startTick) / ppq) * (60 / tempoBpm));
            const n: MidiNote = {
              id: `trk_${t}_${prev.pitch}_${prev.startTick}`,
              pitch: prev.pitch,
              pitchName: midiPitchToName(prev.pitch),
              startTime: startSec,
              duration: durSec,
              velocity: prev.velocity,
              trackIndex: t,
              channel,
            };
            trackNotes.push(n);
            allNotes.push(n);
            activeNotes.delete(noteKey);
          }
        }
      } else if (messageType === 0x80) {
        // Note Off
        const pitch = data[offset++];
        offset++; // velocity byte
        const noteKey = (channel << 8) | pitch;
        if (activeNotes.has(noteKey)) {
          const prev = activeNotes.get(noteKey)!;
          const startSec = (prev.startTick / ppq) * (60 / tempoBpm);
          const durSec = Math.max(0.1, ((currentTick - prev.startTick) / ppq) * (60 / tempoBpm));
          const n: MidiNote = {
            id: `trk_${t}_${prev.pitch}_${prev.startTick}`,
            pitch: prev.pitch,
            pitchName: midiPitchToName(prev.pitch),
            startTime: startSec,
            duration: durSec,
            velocity: prev.velocity,
            trackIndex: t,
            channel,
          };
          trackNotes.push(n);
          allNotes.push(n);
          activeNotes.delete(noteKey);
        }
      } else if (messageType === 0xa0 || messageType === 0xb0 || messageType === 0xe0) {
        // 2 data bytes
        offset += 2;
      } else if (messageType === 0xc0 || messageType === 0xd0) {
        // 1 data byte
        offset += 1;
      }
    }

    const totalDur = trackNotes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
    tracks.push({
      id: `track_${t}`,
      name: trackName,
      channel: t % 16,
      notes: trackNotes,
      totalDuration: totalDur,
    });
  }

  allNotes.sort((a, b) => a.startTime - b.startTime);

  return {
    id: `midi_${Date.now()}`,
    title: filename.replace(/\.[^/.]+$/, ''),
    composer: 'Imported Artist',
    genre: 'classical',
    tempo: tempoBpm || 120,
    timeSignature: [4, 4],
    tracks,
    notes: allNotes,
    description: `User-imported MIDI file with ${allNotes.length} notes across ${tracks.length} tracks.`,
    keySignature: 'Detected Chromatic',
    rawMidiBytes: data,
  };
}
