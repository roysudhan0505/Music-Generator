import React, { useState } from 'react';
import { Upload, Play, Square, FileMusic, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { MidiDatasetItem } from '../types/music';
import { parseMidiBytes } from '../utils/midiEngine';
import { audioSynth } from '../utils/audioSynth';
import { PianoRoll } from './PianoRoll';

interface DataCollectorProps {
  datasets: MidiDatasetItem[];
  selectedDataset: MidiDatasetItem;
  onSelectDataset: (item: MidiDatasetItem) => void;
  onDatasetImported: (item: MidiDatasetItem) => void;
  onProceedToPreprocessing: () => void;
}

export const DataCollector: React.FC<DataCollectorProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onDatasetImported,
  onProceedToPreprocessing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredDatasets = activeGenreFilter === 'all'
    ? datasets
    : datasets.filter((d) => d.genre === activeGenreFilter);

  const handlePlayPreview = () => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
      setPlayheadTime(0);
    } else {
      setIsPlaying(true);
      audioSynth.playSequence(
        selectedDataset.notes,
        'grand_piano',
        (curr) => setPlayheadTime(curr),
        () => {
          setIsPlaying(false);
          setPlayheadTime(0);
        }
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const uint8 = new Uint8Array(buffer);
        const parsed = parseMidiBytes(uint8, file.name);
        onDatasetImported(parsed);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse MIDI file. Make sure it is standard MIDI format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">1. Collect MIDI Music Data</h2>
          <p className="text-sm text-slate-400 mt-1">
            Select authentic multi-track MIDI recordings across classical, jazz, ambient, or upload custom .mid files.
          </p>
        </div>

        {/* Interactive Genre Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start md:self-auto">
          {['all', 'classical', 'jazz', 'ambient', 'chiptune'].map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenreFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                activeGenreFilter === g
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredDatasets.map((ds) => {
          const isSelected = selectedDataset.id === ds.id;
          return (
            <div
              key={ds.id}
              onClick={() => {
                if (isPlaying) {
                  audioSynth.stop();
                  setIsPlaying(false);
                  setPlayheadTime(0);
                }
                onSelectDataset(ds);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900/90 border-sky-500/60 shadow-lg shadow-sky-950/40'
                  : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white truncate">{ds.title}</h3>
                  <p className="text-xs text-slate-400">{ds.composer}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Clean metadata without pill badges */}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span className="capitalize text-slate-400">{ds.genre}</span>
                <span>·</span>
                <span>{ds.tempo} BPM</span>
                <span>·</span>
                <span>{ds.notes.length} notes</span>
              </div>
            </div>
          );
        })}

        {/* Upload Custom MIDI Card */}
        <label className="p-4 rounded-lg border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/20 hover:bg-slate-900/40 cursor-pointer transition-all flex flex-col items-center justify-center text-center group">
          <input
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors mb-2" />
          <span className="text-xs font-medium text-slate-300 group-hover:text-white">Upload Custom MIDI</span>
          <span className="text-[11px] text-slate-500 mt-1">.mid or .midi files</span>
        </label>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300">
          {uploadError}
        </div>
      )}

      {/* Selected Dataset Detail & Live Piano Roll Preview */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileMusic className="w-4 h-4 text-sky-400" />
              <h3 className="text-base font-semibold text-white">{selectedDataset.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{selectedDataset.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPreview}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Stop Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Play Preview</span>
                </>
              )}
            </button>

            <button
              onClick={onProceedToPreprocessing}
              className="px-4 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>Preprocess Dataset</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tabular Numerals & Metadata summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Key Signature</span>
            <span className="font-mono text-slate-200">{selectedDataset.keySignature}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Time Signature</span>
            <span className="font-mono text-slate-200">{selectedDataset.timeSignature[0]}/{selectedDataset.timeSignature[1]}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Notes</span>
            <span className="font-mono tabular-nums text-slate-200">{selectedDataset.notes.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Tempo</span>
            <span className="font-mono tabular-nums text-slate-200">{selectedDataset.tempo} BPM</span>
          </div>
        </div>

        {/* Piano Roll Canvas of Raw Training Data */}
        <div className="pt-2">
          <PianoRoll
            notes={selectedDataset.notes}
            currentTime={playheadTime}
            isPlaying={isPlaying}
            height={220}
            onSeek={(t) => setPlayheadTime(t)}
          />
        </div>
      </div>
    </div>
  );
};
