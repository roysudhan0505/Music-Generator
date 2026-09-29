import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CURATED_DATASETS } from './data/midiLibrary';
import { INITIAL_FEATURED_SONGS } from './data/featuredSongs';
import {
  MidiDatasetItem,
  ModelHyperparameters,
  TrainingMetric,
  GenerationSettings,
  MidiNote,
  GeneratedSong,
} from './types/music';
import { preprocessMidiWithMusic21 } from './utils/music21Preprocessor';
import { LSTMNetwork, sampleWithTemperature, tokensToMidiNotes } from './utils/neuralModel';
import { audioSynth, InstrumentType } from './utils/audioSynth';
import { downloadMidiFile } from './utils/midiEngine';
import { midiPitchToName } from './utils/midiEngine';

import { SunoNavbar } from './components/SunoNavbar';
import { SunoSidebar, MainNavSection } from './components/SunoSidebar';
import { SunoCreatePanel } from './components/SunoCreatePanel';
import { SunoSongCard } from './components/SunoSongCard';
import { SunoPlayerBar } from './components/SunoPlayerBar';
import { SunoLyricsModal } from './components/SunoLyricsModal';
import { SunoInspectModal } from './components/SunoInspectModal';
import { PythonCodeModal } from './components/PythonCodeModal';

// Existing Deep Learning Lab Views
import { DataCollector } from './components/DataCollector';
import { PreprocessorView } from './components/PreprocessorView';
import { ArchitectureView } from './components/ArchitectureView';
import { TrainerConsole } from './components/TrainerConsole';
import { GenerationStudio } from './components/GenerationStudio';

import {
  TrendingUp,
  Sparkles,
  Compass,
  Play,
  Heart,
  Sliders,
  Flame,
  Radio,
  PlusCircle,
  FileMusic,
} from 'lucide-react';

export default function App() {
  // Navigation: Suno main sections
  const [currentSection, setCurrentSection] = useState<MainNavSection>('explore');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>('all');

  // Song catalogue
  const [songs, setSongs] = useState<GeneratedSong[]>(INITIAL_FEATURED_SONGS);
  const [currentSong, setCurrentSong] = useState<GeneratedSong | null>(INITIAL_FEATURED_SONGS[0]);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set(['suno_1']));

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(INITIAL_FEATURED_SONGS[0].duration);

  // Modals
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState<boolean>(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [isGeneratingSong, setIsGeneratingSong] = useState<boolean>(false);

  // Deep Learning Neural Engine states
  const [datasets, setDatasets] = useState<MidiDatasetItem[]>(CURATED_DATASETS);
  const [selectedDataset, setSelectedDataset] = useState<MidiDatasetItem>(CURATED_DATASETS[0]);
  const [sequenceLength, setSequenceLength] = useState<number>(16);

  const preprocessedData = useMemo(() => {
    return preprocessMidiWithMusic21(selectedDataset.notes, sequenceLength);
  }, [selectedDataset, sequenceLength]);

  const [hyperparams, setHyperparams] = useState<ModelHyperparameters>({
    architecture: 'lstm',
    sequenceLength: 16,
    hiddenUnits: 64,
    layers: 1,
    dropout: 0.2,
    learningRate: 0.005,
    batchSize: 16,
    epochs: 30,
    latentDim: 32,
  });

  const modelRef = useRef<LSTMNetwork | null>(null);

  useEffect(() => {
    if (preprocessedData.vocabulary.length > 0) {
      const net = new LSTMNetwork(preprocessedData.vocabulary.length, hyperparams.hiddenUnits, hyperparams.layers);
      net.seedFromTransitionMatrix(preprocessedData.transitionMatrix, preprocessedData.noteToInt);
      modelRef.current = net;
    }
  }, [preprocessedData.vocabulary.length, hyperparams.hiddenUnits, hyperparams.layers]);

  // Deep Learning Training state (inside Neural Lab)
  const [activeLabTab, setActiveLabTab] = useState<'dataset' | 'preprocess' | 'architecture' | 'training' | 'generation'>('dataset');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [metricsHistory, setMetricsHistory] = useState<TrainingMetric[]>([
    { epoch: 0, batch: 0, loss: 3.45, perplexity: 31.5, accuracy: 12.0, timestamp: Date.now() },
  ]);
  const [checkpointNotes, setCheckpointNotes] = useState<MidiNote[]>([]);

  // Generation settings for lab
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    temperature: 0.8,
    length: 48,
    tempo: selectedDataset.tempo || 120,
    instrument: 'grand_piano',
    seedType: 'motif',
    reverbAmount: 0.35,
    swingFactor: 0.1,
  });
  const [labGeneratedNotes, setLabGeneratedNotes] = useState<MidiNote[]>([]);

  // Toggle song like
  const handleToggleLike = (songId: string) => {
    setLikedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  // Playback control
  const handlePlaySong = (song: GeneratedSong) => {
    if (currentSong?.id === song.id && isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
    setTotalDuration(song.duration);

    audioSynth.playSequence(
      song.notes,
      song.instrument,
      (curr) => setCurrentTime(curr),
      () => {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    );
  };

  const handleTogglePlayCurrent = () => {
    if (!currentSong) return;
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioSynth.playSequence(
        currentSong.notes,
        currentSong.instrument,
        (curr) => setCurrentTime(curr),
        () => {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      );
    }
  };

  const handleNextSong = () => {
    if (!currentSong || songs.length === 0) return;
    const idx = songs.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (idx + 1) % songs.length;
    handlePlaySong(songs[nextIdx]);
  };

  const handlePrevSong = () => {
    if (!currentSong || songs.length === 0) return;
    const idx = songs.findIndex((s) => s.id === currentSong.id);
    const prevIdx = (idx - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIdx]);
  };

  // Suno One-Click Song Generation Action
  const handleGenerateSunoSong = async (params: {
    prompt: string;
    styleInput?: string;
    title?: string;
    customLyrics?: string;
    instrumental: boolean;
    instrument: InstrumentType;
    temperature: number;
    genre: string;
  }) => {
    setIsGeneratingSong(true);
    try {
      // 1. Call server to get lyrics, metadata, style tags, and key signature
      const res = await fetch('/api/music/create-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      const songData = data.song || {};

      // 2. Synthesize note sequence using our neural LSTM network primed with the generated motif
      let notes: MidiNote[] = [];
      const tempo = songData.tempo || 108;
      const secPerBeat = 60 / tempo;

      if (songData.motifNotes && songData.motifNotes.length > 0) {
        // Use motif from model
        let currentBeat = 0;
        notes = songData.motifNotes.map((n: any, idx: number) => {
          const start = currentBeat * secPerBeat;
          const dur = (n.duration || 0.5) * secPerBeat;
          currentBeat += n.duration || 0.5;
          return {
            id: `gen_n_${Date.now()}_${idx}`,
            pitch: n.midiPitch || 60,
            pitchName: n.pitchName || midiPitchToName(n.midiPitch || 60),
            startTime: Number(start.toFixed(3)),
            duration: Number((dur * 0.95).toFixed(3)),
            velocity: 84 + (idx % 4) * 3,
            channel: 0,
          };
        });

        // Extend using neural model for full 20+ second song experience
        if (modelRef.current && preprocessedData.vocabulary.length > 0) {
          const model = modelRef.current;
          const vocab = preprocessedData.vocabulary;
          const intToNote = preprocessedData.intToNote;
          const currentWindow = notes.slice(-16).map((n) => preprocessedData.noteToInt[n.pitchName] || 0);

          while (currentWindow.length < 16) {
            currentWindow.push(Math.floor(Math.random() * vocab.length));
          }

          const extendedTokens: string[] = [];
          for (let step = 0; step < 24; step++) {
            const { logits } = model.forwardSequence(currentWindow);
            const nextIdx = sampleWithTemperature(logits, params.temperature || 0.8);
            const token = intToNote[nextIdx] || 'C4';
            extendedTokens.push(token);
            currentWindow.push(nextIdx);
            currentWindow.shift();
          }

          const extraNotes = tokensToMidiNotes(extendedTokens, tempo, 0.5);
          const lastStartTime = notes.length > 0 ? notes[notes.length - 1].startTime + notes[notes.length - 1].duration : 0;
          extraNotes.forEach((en) => {
            en.startTime += lastStartTime;
            notes.push(en);
          });
        }
      } else {
        // Fallback sequence
        notes = tokensToMidiNotes(['C4', 'E4', 'G4', 'B4', 'C5', 'A4', 'F4', 'D4'], tempo, 0.5);
      }

      // Generate random color gradient for album art
      const gradients = [
        'from-fuchsia-600 via-rose-600 to-amber-700',
        'from-sky-500 via-indigo-600 to-purple-800',
        'from-emerald-500 via-teal-700 to-slate-900',
        'from-violet-600 via-purple-700 to-pink-600',
        'from-amber-500 via-orange-600 to-rose-700',
        'from-cyan-500 via-blue-600 to-indigo-900',
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      const songDuration = notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);

      // Random waveform bars
      const randomWaveform = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20);

      const newSong: GeneratedSong = {
        id: `song_${Date.now()}`,
        title: songData.title || params.title || 'Untitled Composition',
        artist: songData.artist || 'Harmoniq AI',
        styleTags: songData.styleTags || ['ambient', 'cinematic'],
        genre: (songData.genre as any) || 'pop',
        prompt: params.prompt,
        lyrics: songData.lyrics || params.customLyrics || '',
        hasVocals: !params.instrumental,
        tempo,
        duration: Math.max(10, songDuration),
        notes,
        waveform: randomWaveform,
        createdAt: Date.now(),
        likes: 1,
        plays: 1,
        coverGradient: randomGradient,
        instrument: params.instrument,
        keySignature: songData.keySignature || 'C Major',
        model: 'Harmoniq v3.5 (LSTM)',
      };

      setSongs((prev) => [newSong, ...prev]);
      setCurrentSong(newSong);
      handlePlaySong(newSong);

      // Switch to library or explore to see song immediately
      setCurrentSection('library');
    } catch (err) {
      console.error('Failed to create song:', err);
    } finally {
      setIsGeneratingSong(false);
    }
  };

  // Filter songs based on search and genre
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.styleTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.prompt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = activeGenreFilter === 'all' || s.genre === activeGenreFilter;
      return matchesSearch && matchesGenre;
    });
  }, [songs, searchQuery, activeGenreFilter]);

  const librarySongs = useMemo(() => {
    return songs.filter((s) => s.id.startsWith('song_') || likedSongIds.has(s.id));
  }, [songs, likedSongIds]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-900 selection:text-white antialiased pb-28">
      {/* Top Navbar */}
      <SunoNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        onOpenCreate={() => setCurrentSection('create')}
        onOpenPython={() => setIsPythonModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Suno Sidebar */}
        <SunoSidebar
          currentSection={currentSection}
          onSelectSection={setCurrentSection}
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
          savedSongsCount={librarySongs.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 space-y-8 min-w-0">
          {/* ================= SECTION 1: CREATE VIEW ================= */}
          {currentSection === 'create' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <SunoCreatePanel
                onGenerateSong={handleGenerateSunoSong}
                isGenerating={isGeneratingSong}
              />

              {/* Recent creations under create view */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Your Recent Generations</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{songs.length} total tracks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {songs.slice(0, 4).map((song) => (
                    <SunoSongCard
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onSelect={() => setCurrentSong(song)}
                      onTogglePlay={() => handlePlaySong(song)}
                      onLikeToggle={() => handleToggleLike(song.id)}
                      isLiked={likedSongIds.has(song.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: EXPLORE & FEED (SUNO DISCOVERY) ================= */}
          {currentSection === 'explore' && (
            <div className="space-y-8">
              {/* Hero Banner for Fast Creation */}
              <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-900 border border-sky-900/30">
                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="text-xs font-semibold text-sky-400 tracking-wider uppercase font-mono">
                    Suno-Style AI Music Generation
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Make any song you can imagine with AI.
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Type a prompt or lyrics. Harmoniq AI converts it to trained note sequences, synthesizes audio in your browser, and exports full MIDI & WAV files.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setCurrentSection('create')}
                      className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs shadow-lg shadow-sky-950/50 flex items-center gap-2 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Start Creating Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Genre Filter Tabs (clean unboxed tabs, no pills) */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {[
                    { id: 'all', label: 'Trending Feed' },
                    { id: 'electronic', label: 'Electronic & Synth' },
                    { id: 'ambient', label: 'Lo-Fi & Chill' },
                    { id: 'jazz', label: 'Jazz & Swing' },
                    { id: 'classical', label: 'Neoclassical' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveGenreFilter(g.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeGenreFilter === g.id
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  {filteredSongs.length} tracks
                </span>
              </div>

              {/* Song Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredSongs.map((song) => (
                  <SunoSongCard
                    key={song.id}
                    song={song}
                    isPlaying={isPlaying}
                    isCurrent={currentSong?.id === song.id}
                    onSelect={() => setCurrentSong(song)}
                    onTogglePlay={() => handlePlaySong(song)}
                    onLikeToggle={() => handleToggleLike(song.id)}
                    isLiked={likedSongIds.has(song.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================= SECTION 3: MY LIBRARY ================= */}
          {currentSection === 'library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">My Music Library</h2>
                  <p className="text-xs text-slate-400 mt-1">Your generated songs, liked tracks, and audio recordings</p>
                </div>
                <button
                  onClick={() => setCurrentSection('create')}
                  className="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New</span>
                </button>
              </div>

              {librarySongs.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-3">
                  <FileMusic className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">No songs generated yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click create to produce your first AI song from a prompt or lyrics.
                  </p>
                  <button
                    onClick={() => setCurrentSection('create')}
                    className="px-4 py-2 bg-sky-400 text-slate-950 font-bold text-xs rounded-lg inline-block"
                  >
                    Create a Song
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {librarySongs.map((song) => (
                    <SunoSongCard
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onSelect={() => setCurrentSong(song)}
                      onTogglePlay={() => handlePlaySong(song)}
                      onLikeToggle={() => handleToggleLike(song.id)}
                      isLiked={likedSongIds.has(song.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 4: NEURAL LAB (DEEP LEARNING / MUSIC21) ================= */}
          {currentSection === 'pipeline' && (
            <div className="space-y-6">
              {/* Lab subheader tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Neural Deep Learning Lab</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore the underlying data collection, music21 tokenization, LSTM tensor math, and model training.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  {[
                    { id: 'dataset', label: '1. MIDI Data' },
                    { id: 'preprocess', label: '2. music21' },
                    { id: 'architecture', label: '3. Architecture' },
                    { id: 'training', label: '4. Training' },
                    { id: 'generation', label: '5. Studio' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLabTab(tab.id as any)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        activeLabTab === tab.id ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lab tab views */}
              {activeLabTab === 'dataset' && (
                <DataCollector
                  datasets={datasets}
                  selectedDataset={selectedDataset}
                  onSelectDataset={(ds) => {
                    setSelectedDataset(ds);
                    setGenerationSettings((prev) => ({ ...prev, tempo: ds.tempo }));
                  }}
                  onDatasetImported={(ds) => {
                    setDatasets((prev) => [ds, ...prev]);
                    setSelectedDataset(ds);
                  }}
                  onProceedToPreprocessing={() => setActiveLabTab('preprocess')}
                />
              )}

              {activeLabTab === 'preprocess' && (
                <PreprocessorView
                  selectedDataset={selectedDataset}
                  preprocessedData={preprocessedData}
                  sequenceLength={sequenceLength}
                  onUpdateSequenceLength={(len) => {
                    setSequenceLength(len);
                    setHyperparams((prev) => ({ ...prev, sequenceLength: len }));
                  }}
                  onProceedToArchitecture={() => setActiveLabTab('architecture')}
                  onOpenPythonScript={() => setIsPythonModalOpen(true)}
                />
              )}

              {activeLabTab === 'architecture' && (
                <ArchitectureView
                  hyperparams={hyperparams}
                  vocabSize={preprocessedData.vocabulary.length}
                  onUpdateHyperparams={(params) => setHyperparams((prev) => ({ ...prev, ...params }))}
                  onProceedToTraining={() => setActiveLabTab('training')}
                />
              )}

              {activeLabTab === 'training' && (
                <TrainerConsole
                  hyperparams={hyperparams}
                  preprocessedData={preprocessedData}
                  metricsHistory={metricsHistory}
                  currentEpoch={currentEpoch}
                  isTraining={isTraining}
                  onStartTraining={() => setIsTraining(true)}
                  onPauseTraining={() => setIsTraining(false)}
                  onResetTraining={() => setCurrentEpoch(0)}
                  onFastForwardWeights={() => {
                    setCurrentEpoch(hyperparams.epochs);
                    setMetricsHistory((prev) => [
                      ...prev,
                      { epoch: hyperparams.epochs, batch: 1, loss: 0.95, perplexity: 2.5, accuracy: 86.0, timestamp: Date.now() },
                    ]);
                  }}
                  onProceedToGeneration={() => setActiveLabTab('generation')}
                  checkpointNotes={checkpointNotes}
                />
              )}

              {activeLabTab === 'generation' && (
                <GenerationStudio
                  generatedNotes={currentSong?.notes || []}
                  preprocessedData={preprocessedData}
                  settings={generationSettings}
                  onUpdateSettings={(newSettings) => setGenerationSettings((prev) => ({ ...prev, ...newSettings }))}
                  onGenerate={() => {}}
                  isGenerating={false}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Suno Bottom Persistent Player Bar */}
      <SunoPlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlayCurrent}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        currentTime={currentTime}
        totalDuration={totalDuration}
        onSeek={(seekTime) => {
          if (!currentSong) return;
          audioSynth.stop();
          const remainingNotes = currentSong.notes.map((n) => ({
            ...n,
            startTime: Math.max(0, n.startTime - seekTime),
          })).filter((n) => n.startTime >= 0);

          setCurrentTime(seekTime);
          setIsPlaying(true);
          audioSynth.playSequence(
            remainingNotes,
            currentSong.instrument,
            (curr) => setCurrentTime(seekTime + curr),
            () => {
              setIsPlaying(false);
              setCurrentTime(0);
            }
          );
        }}
        onOpenLyrics={() => setIsLyricsModalOpen(true)}
        onOpenInspect={() => setIsInspectModalOpen(true)}
      />

      {/* Lyrics Modal */}
      <SunoLyricsModal
        song={currentSong}
        isOpen={isLyricsModalOpen}
        onClose={() => setIsLyricsModalOpen(false)}
      />

      {/* Inspect Modal */}
      <SunoInspectModal
        song={currentSong}
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        preprocessedData={preprocessedData}
        hyperparams={hyperparams}
        onUpdateHyperparams={(p) => setHyperparams((prev) => ({ ...prev, ...p }))}
        onOpenPythonScript={() => setIsPythonModalOpen(true)}
      />

      {/* Python Code Export Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        datasetTitle={selectedDataset.title}
        sequenceLength={sequenceLength}
        hiddenUnits={hyperparams.hiddenUnits}
      />
    </div>
  );
}
