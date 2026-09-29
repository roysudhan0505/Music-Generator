import { MidiDatasetItem, MidiNote } from '../types/music';
import { midiPitchToName } from '../utils/midiEngine';

// Helper to generate note sequences from structured pitch/duration arrays
function makeNotes(
  seq: { p: number | number[]; d: number; v?: number }[],
  tempo: number,
  startOffset: number = 0
): MidiNote[] {
  const secondsPerBeat = 60 / tempo;
  let currentBeat = startOffset;
  const notes: MidiNote[] = [];
  let idCounter = 0;

  for (const item of seq) {
    const pitches = Array.isArray(item.p) ? item.p : [item.p];
    const durationSec = item.d * secondsPerBeat;
    const startSec = currentBeat * secondsPerBeat;

    for (const pitch of pitches) {
      if (pitch > 0) {
        notes.push({
          id: `note_${idCounter++}`,
          pitch,
          pitchName: midiPitchToName(pitch),
          startTime: Number(startSec.toFixed(3)),
          duration: Number((durationSec * 0.95).toFixed(3)), // slight articulation gap
          velocity: item.v || 84,
          channel: 0,
        });
      }
    }
    currentBeat += item.d;
  }
  return notes;
}

// 1. J.S. Bach - Invention No. 1 in C Major (BWV 772)
const bachInventionData = [
  // Motif 1: C4 D4 E4 F4, D4 E4 C4 G4, C5 B4 A4 G4 F4 E4 D4 G4
  { p: 0, d: 0.5 }, // rest
  { p: 60, d: 0.5, v: 88 }, // C4
  { p: 62, d: 0.5, v: 90 }, // D4
  { p: 64, d: 0.5, v: 92 }, // E4
  { p: 65, d: 0.5, v: 85 }, // F4
  { p: 62, d: 0.5, v: 86 }, // D4
  { p: 64, d: 0.5, v: 88 }, // E4
  { p: 60, d: 0.5, v: 84 }, // C4
  { p: 67, d: 1.0, v: 94 }, // G4
  { p: 72, d: 0.5, v: 92 }, // C5
  { p: 71, d: 0.5, v: 86 }, // B4
  { p: 69, d: 0.5, v: 84 }, // A4
  { p: 67, d: 0.5, v: 88 }, // G4
  { p: 65, d: 0.5, v: 85 }, // F4
  { p: 64, d: 0.5, v: 86 }, // E4
  { p: 62, d: 0.5, v: 82 }, // D4
  { p: 67, d: 0.5, v: 90 }, // G4
  // Measure 2: G4 A4 B4 C5, A4 B4 G4 D5
  { p: 67, d: 0.5, v: 88 }, // G4
  { p: 69, d: 0.5, v: 90 }, // A4
  { p: 71, d: 0.5, v: 92 }, // B4
  { p: 72, d: 0.5, v: 95 }, // C5
  { p: 69, d: 0.5, v: 86 }, // A4
  { p: 71, d: 0.5, v: 88 }, // B4
  { p: 67, d: 0.5, v: 85 }, // G4
  { p: 74, d: 1.0, v: 96 }, // D5
  { p: 72, d: 0.5, v: 90 }, // C5
  { p: 71, d: 0.5, v: 88 }, // B4
  { p: 69, d: 0.5, v: 84 }, // A4
  { p: 67, d: 0.5, v: 86 }, // G4
  { p: 65, d: 0.5, v: 82 }, // F4
  { p: 64, d: 0.5, v: 80 }, // E4
  { p: 62, d: 0.5, v: 84 }, // D4
  { p: 60, d: 1.0, v: 90 }, // C4
];

// 2. F. Chopin - Prelude in E Minor, Op. 28 No. 4
const chopinPreludeData = [
  // Melodic sigh: B4 -> C5 -> B4 -> Bb4 -> A4 -> G#4 -> A4 with rich harmony
  { p: [52, 59, 64, 71], d: 1.0, v: 75 }, // Em triad + B4
  { p: [52, 59, 63, 71], d: 1.0, v: 70 },
  { p: [52, 58, 62, 72], d: 1.0, v: 80 }, // C5
  { p: [52, 58, 62, 71], d: 1.0, v: 75 }, // B4
  { p: [51, 57, 61, 71], d: 1.0, v: 74 },
  { p: [50, 56, 60, 70], d: 1.0, v: 76 }, // Bb4
  { p: [49, 55, 59, 69], d: 1.0, v: 72 }, // A4
  { p: [48, 54, 58, 69], d: 1.0, v: 70 },
  { p: [47, 53, 57, 68], d: 1.0, v: 75 }, // G#4
  { p: [48, 54, 58, 69], d: 1.0, v: 78 }, // A4
  { p: [47, 53, 59, 71], d: 1.0, v: 72 }, // B4
  { p: [45, 52, 57, 69], d: 2.0, v: 85 }, // Am cadence
  { p: [47, 51, 56, 66], d: 1.5, v: 82 }, // B7
  { p: [40, 52, 59, 64], d: 2.5, v: 70 }, // Em resolution
];

// 3. W.A. Mozart - Sonata Facile in C Major (K. 545)
const mozartSonataData = [
  // Allegro theme: C5 (half), E5-G5 (quarters), B4 (half), C5-D5-C5
  { p: [48, 55, 60, 72], d: 2.0, v: 95 }, // Alberti bass + C5
  { p: 76, d: 1.0, v: 90 }, // E5
  { p: 79, d: 1.0, v: 92 }, // G5
  { p: 71, d: 1.5, v: 85 }, // B4
  { p: 72, d: 0.25, v: 80 }, // C5
  { p: 74, d: 0.25, v: 82 }, // D5
  { p: 72, d: 2.0, v: 90 }, // C5
  // Scales running
  { p: 60, d: 0.5, v: 84 },
  { p: 62, d: 0.5, v: 84 },
  { p: 64, d: 0.5, v: 86 },
  { p: 65, d: 0.5, v: 86 },
  { p: 67, d: 0.5, v: 88 },
  { p: 69, d: 0.5, v: 88 },
  { p: 71, d: 0.5, v: 90 },
  { p: 72, d: 1.0, v: 94 },
  { p: 74, d: 0.5, v: 88 },
  { p: 72, d: 0.5, v: 86 },
  { p: 71, d: 0.5, v: 84 },
  { p: 69, d: 0.5, v: 82 },
  { p: 67, d: 1.0, v: 86 },
  { p: 65, d: 0.5, v: 82 },
  { p: 64, d: 0.5, v: 80 },
  { p: 62, d: 0.5, v: 82 },
  { p: 60, d: 1.5, v: 90 },
];

// 4. L.v. Beethoven - Für Elise (Bagatelle in A Minor, WoO 59)
const beethovenEliseData = [
  // E5 D#5 E5 D#5 E5 B4 D5 C5 A4
  { p: 76, d: 0.5, v: 85 }, // E5
  { p: 75, d: 0.5, v: 84 }, // D#5
  { p: 76, d: 0.5, v: 86 }, // E5
  { p: 75, d: 0.5, v: 84 }, // D#5
  { p: 76, d: 0.5, v: 86 }, // E5
  { p: 71, d: 0.5, v: 80 }, // B4
  { p: 74, d: 0.5, v: 82 }, // D5
  { p: 72, d: 0.5, v: 85 }, // C5
  { p: 69, d: 1.5, v: 90 }, // A4
  // Bass arpeggio C4 E4 A4
  { p: 48, d: 0.5, v: 75 }, // C3
  { p: 55, d: 0.5, v: 75 }, // G3
  { p: 60, d: 0.5, v: 78 }, // C4
  { p: 64, d: 0.5, v: 80 }, // E4
  { p: 69, d: 0.5, v: 82 }, // A4
  { p: 71, d: 1.5, v: 88 }, // B4
  // E3 G#3 E4 G#4 B4 C5
  { p: 40, d: 0.5, v: 72 }, // E2
  { p: 52, d: 0.5, v: 74 }, // E3
  { p: 56, d: 0.5, v: 76 }, // G#3
  { p: 64, d: 0.5, v: 78 }, // E4
  { p: 72, d: 0.5, v: 82 }, // C5
  { p: 76, d: 0.5, v: 85 }, // E5
  { p: 75, d: 0.5, v: 84 }, // D#5
  { p: 76, d: 0.5, v: 86 }, // E5
  { p: 69, d: 2.0, v: 90 }, // A4
];

// 5. Autumn Leaves - Jazz Standard Progression (G Minor / Bb Major)
const autumnLeavesJazzData = [
  // C minor 7 (ii) -> F7 (V) -> Bbmaj7 (I) -> Ebmaj7 (IV)
  // Melody: C4 D4 Eb4 Bb4, Bb4 A4 G4 F#4 G4
  { p: [48, 55, 60, 63, 67], d: 1.5, v: 85 }, // Cm7 chord
  { p: 60, d: 0.5, v: 88 }, // C4
  { p: 62, d: 0.5, v: 90 }, // D4
  { p: 63, d: 0.5, v: 92 }, // Eb4
  { p: 70, d: 1.5, v: 96 }, // Bb4
  { p: [41, 53, 57, 63, 65], d: 1.5, v: 88 }, // F7 chord
  { p: 68, d: 0.5, v: 86 }, // Ab4
  { p: 67, d: 0.5, v: 84 }, // G4
  { p: 65, d: 0.5, v: 86 }, // F4
  { p: 68, d: 1.5, v: 90 }, // Ab4
  { p: [46, 53, 58, 62, 65], d: 1.5, v: 85 }, // Bbmaj7 chord
  { p: 67, d: 0.5, v: 86 }, // G4
  { p: 65, d: 0.5, v: 84 }, // F4
  { p: 63, d: 0.5, v: 86 }, // Eb4
  { p: 67, d: 2.0, v: 92 }, // G4
  { p: [43, 51, 55, 62, 63], d: 2.0, v: 82 }, // Ebmaj7
  { p: 65, d: 0.5, v: 84 }, // F4
  { p: 63, d: 0.5, v: 82 }, // Eb4
  { p: 62, d: 0.5, v: 86 }, // D4
  { p: 58, d: 2.0, v: 90 }, // Bb3
];

// 6. C Jam Blues - Duke Ellington Swing Riff
const cJamBluesData = [
  // Two-note swing motif: G4 C5, G4 C5 with walking bass C3-E3-G3-A3
  { p: [36, 67], d: 0.5, v: 88 }, // C2 bass + G4
  { p: 72, d: 1.0, v: 96 }, // C5
  { p: 40, d: 0.5, v: 75 }, // E2
  { p: 67, d: 0.5, v: 85 }, // G4
  { p: [43, 72], d: 1.0, v: 94 }, // G2 + C5
  { p: 45, d: 0.5, v: 76 }, // A2
  // Measure 2
  { p: [36, 67], d: 0.5, v: 86 },
  { p: 72, d: 1.0, v: 95 },
  { p: 40, d: 0.5, v: 78 },
  { p: 67, d: 0.5, v: 84 },
  { p: [43, 72], d: 1.0, v: 92 },
  { p: 45, d: 0.5, v: 80 },
  // F7 subdominant
  { p: [41, 68], d: 0.5, v: 90 }, // F2 + Ab4
  { p: 72, d: 1.0, v: 98 }, // C5
  { p: 45, d: 0.5, v: 80 },
  { p: 68, d: 0.5, v: 88 },
  { p: [48, 72], d: 1.0, v: 95 },
  { p: 50, d: 0.5, v: 82 },
  // Turnaround G7 -> C
  { p: [43, 67], d: 0.5, v: 88 },
  { p: 71, d: 0.5, v: 92 },
  { p: 74, d: 0.5, v: 94 },
  { p: 71, d: 0.5, v: 88 },
  { p: [36, 60, 64, 67, 72], d: 2.0, v: 100 }, // C6/9 chord hit
];

// 7. Midnight Rain - Lo-Fi & Ambient Progression
const lofiMidnightData = [
  // Dmaj9 -> C#m7 -> Bm9 -> Amaj7
  { p: [50, 57, 61, 64, 69], d: 2.0, v: 70 }, // Dmaj9
  { p: 73, d: 0.5, v: 72 }, // C#5
  { p: 69, d: 0.5, v: 68 }, // A4
  { p: 64, d: 1.0, v: 65 }, // E4
  { p: [49, 56, 60, 64, 68], d: 2.0, v: 68 }, // C#m7
  { p: 71, d: 0.5, v: 70 }, // B4
  { p: 68, d: 0.5, v: 66 }, // G#4
  { p: 64, d: 1.0, v: 62 }, // E4
  { p: [47, 54, 57, 61, 66], d: 2.0, v: 68 }, // Bm9
  { p: 69, d: 0.5, v: 68 }, // A4
  { p: 66, d: 0.5, v: 64 }, // F#4
  { p: 61, d: 1.0, v: 60 }, // C#4
  { p: [45, 52, 56, 61, 64], d: 3.0, v: 72 }, // Amaj7
  { p: 73, d: 1.0, v: 65 }, // C#5
];

// 8. Crystal Caverns - 8-Bit Chiptune RPG Theme
const chiptuneCavernsData = [
  // Fast arpeggiated melodic lead in D minor
  { p: 62, d: 0.25, v: 90 }, // D4
  { p: 65, d: 0.25, v: 92 }, // F4
  { p: 69, d: 0.25, v: 95 }, // A4
  { p: 74, d: 0.25, v: 98 }, // D5
  { p: 72, d: 0.25, v: 92 }, // C5
  { p: 69, d: 0.25, v: 88 }, // A4
  { p: 65, d: 0.25, v: 86 }, // F4
  { p: 62, d: 0.25, v: 84 }, // D4
  // Bb major arpeggio
  { p: 58, d: 0.25, v: 90 }, // Bb3
  { p: 62, d: 0.25, v: 92 }, // D4
  { p: 65, d: 0.25, v: 95 }, // F4
  { p: 70, d: 0.25, v: 98 }, // Bb4
  { p: 69, d: 0.25, v: 90 }, // A4
  { p: 65, d: 0.25, v: 88 }, // F4
  { p: 62, d: 0.25, v: 85 }, // D4
  { p: 58, d: 0.25, v: 82 }, // Bb3
  // C major to A minor cadence
  { p: 60, d: 0.25, v: 90 },
  { p: 64, d: 0.25, v: 92 },
  { p: 67, d: 0.25, v: 95 },
  { p: 72, d: 0.25, v: 98 },
  { p: 57, d: 0.5, v: 95 },
  { p: 60, d: 0.5, v: 92 },
  { p: 64, d: 0.5, v: 90 },
  { p: 69, d: 1.0, v: 100 },
];

export const CURATED_DATASETS: MidiDatasetItem[] = [
  {
    id: 'bach_invention_1',
    title: 'Invention No. 1 in C Major (BWV 772)',
    composer: 'Johann Sebastian Bach',
    genre: 'classical',
    tempo: 108,
    timeSignature: [4, 4],
    keySignature: 'C Major',
    description: 'Masterclass in polyphonic imitation and contrapuntal voice leading with scalar motifs.',
    notes: makeNotes(bachInventionData, 108),
    tracks: [
      {
        id: 'bach_trk_1',
        name: 'Right Hand Melody',
        channel: 0,
        notes: makeNotes(bachInventionData, 108),
        totalDuration: 18.5,
      },
    ],
  },
  {
    id: 'chopin_prelude_em',
    title: 'Prelude in E Minor, Op. 28 No. 4',
    composer: 'Frédéric Chopin',
    genre: 'classical',
    tempo: 68,
    timeSignature: [4, 4],
    keySignature: 'E Minor',
    description: 'Haunting chromatic descending harmonies with subtle expressive phrasing and dynamic tension.',
    notes: makeNotes(chopinPreludeData, 68),
    tracks: [
      {
        id: 'chopin_trk_1',
        name: 'Piano Solo',
        channel: 0,
        notes: makeNotes(chopinPreludeData, 68),
        totalDuration: 18.0,
      },
    ],
  },
  {
    id: 'mozart_sonata_facile',
    title: 'Sonata Facile in C Major (K. 545)',
    composer: 'Wolfgang Amadeus Mozart',
    genre: 'classical',
    tempo: 126,
    timeSignature: [4, 4],
    keySignature: 'C Major',
    description: 'Iconic classical sonata form featuring clean Alberti bass arpeggios and clear diatonic resolution.',
    notes: makeNotes(mozartSonataData, 126),
    tracks: [
      {
        id: 'mozart_trk_1',
        name: 'Piano Forte',
        channel: 0,
        notes: makeNotes(mozartSonataData, 126),
        totalDuration: 16.0,
      },
    ],
  },
  {
    id: 'beethoven_fur_elise',
    title: 'Für Elise (Bagatelle in A Minor)',
    composer: 'Ludwig van Beethoven',
    genre: 'classical',
    tempo: 132,
    timeSignature: [3, 8],
    keySignature: 'A Minor',
    description: 'Celebrated romantic bagatelle with famous semitone neighbor oscillation and sweeping arpeggiated runs.',
    notes: makeNotes(beethovenEliseData, 132),
    tracks: [
      {
        id: 'beethoven_trk_1',
        name: 'Klavier',
        channel: 0,
        notes: makeNotes(beethovenEliseData, 132),
        totalDuration: 17.5,
      },
    ],
  },
  {
    id: 'autumn_leaves_jazz',
    title: 'Autumn Leaves (ii-V-I Progression)',
    composer: 'Joseph Kosma / Jazz Standard',
    genre: 'jazz',
    tempo: 116,
    timeSignature: [4, 4],
    keySignature: 'G Minor / Bb Major',
    description: 'Essential jazz repertoire piece exploring cyclic circle-of-fifths secondary dominant resolutions.',
    notes: makeNotes(autumnLeavesJazzData, 116),
    tracks: [
      {
        id: 'jazz_trk_1',
        name: 'Jazz Ensemble',
        channel: 0,
        notes: makeNotes(autumnLeavesJazzData, 116),
        totalDuration: 19.0,
      },
    ],
  },
  {
    id: 'c_jam_blues',
    title: 'C Jam Blues (Duke Ellington)',
    composer: 'Duke Ellington',
    genre: 'jazz',
    tempo: 140,
    timeSignature: [4, 4],
    keySignature: 'C Blues',
    description: 'Iconic 12-bar blues riff based on repeated two-note syncopation and classic swing basslines.',
    notes: makeNotes(cJamBluesData, 140),
    tracks: [
      {
        id: 'blues_trk_1',
        name: 'Swing Big Band',
        channel: 0,
        notes: makeNotes(cJamBluesData, 140),
        totalDuration: 15.0,
      },
    ],
  },
  {
    id: 'midnight_rain_lofi',
    title: 'Midnight Rain (Neo-Soul Lo-Fi)',
    composer: 'Harmoniq Audio Lab',
    genre: 'ambient',
    tempo: 80,
    timeSignature: [4, 4],
    keySignature: 'D Major',
    description: 'Lush extended 9th and 7th chords with warm vinyl warmth, spacious rests, and laid-back feel.',
    notes: makeNotes(lofiMidnightData, 80),
    tracks: [
      {
        id: 'ambient_trk_1',
        name: 'Electric Piano',
        channel: 0,
        notes: makeNotes(lofiMidnightData, 80),
        totalDuration: 18.0,
      },
    ],
  },
  {
    id: 'crystal_caverns_8bit',
    title: 'Crystal Caverns (8-Bit RPG Theme)',
    composer: 'Retro Soundworks',
    genre: 'chiptune',
    tempo: 150,
    timeSignature: [4, 4],
    keySignature: 'D Minor',
    description: 'High-speed arpeggios, square-wave counterpoint, and driving bass characteristic of classic arcade OSTs.',
    notes: makeNotes(chiptuneCavernsData, 150),
    tracks: [
      {
        id: 'chiptune_trk_1',
        name: 'Pulse Channel',
        channel: 0,
        notes: makeNotes(chiptuneCavernsData, 150),
        totalDuration: 12.0,
      },
    ],
  },
];
