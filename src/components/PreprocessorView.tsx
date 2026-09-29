import React, { useState } from 'react';
import { PreprocessedData, MidiDatasetItem } from '../types/music';
import { Layers, ArrowRight, BookOpen, Binary, RefreshCw, ChevronRight } from 'lucide-react';

interface PreprocessorViewProps {
  selectedDataset: MidiDatasetItem;
  preprocessedData: PreprocessedData;
  sequenceLength: number;
  onUpdateSequenceLength: (len: number) => void;
  onProceedToArchitecture: () => void;
  onOpenPythonScript: () => void;
}

export const PreprocessorView: React.FC<PreprocessorViewProps> = ({
  selectedDataset,
  preprocessedData,
  sequenceLength,
  onUpdateSequenceLength,
  onProceedToArchitecture,
  onOpenPythonScript,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'vocab' | 'sliding_window' | 'transitions'>('tokens');
  const [slidingWindowIndex, setSlidingWindowIndex] = useState(0);

  const {
    tokens,
    tokenStrings,
    vocabulary,
    noteToInt,
    inputSequences,
    targetTokens,
    frequencies,
    transitionMatrix,
  } = preprocessedData;

  const currentWindowInput = inputSequences[slidingWindowIndex] || [];
  const currentWindowTarget = targetTokens[slidingWindowIndex] !== undefined ? targetTokens[slidingWindowIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">2. Preprocess into Note Sequences (music21)</h2>
          <p className="text-sm text-slate-400 mt-1">
            Transform polyphonic MIDI events into quantized note/chord tokens, build vocabulary encodings, and structure sliding windows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPythonScript}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>music21 Python Code</span>
          </button>

          <button
            onClick={onProceedToArchitecture}
            className="px-4 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span>Configure Architecture</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preprocessing Pipeline Parameters */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Sliding Window Length ($N$)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="4"
              max="32"
              step="2"
              value={sequenceLength}
              onChange={(e) => onUpdateSequenceLength(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500"
            />
            <span className="font-mono tabular-nums text-xs text-sky-400 w-8 text-right font-semibold">
              {sequenceLength}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Context notes fed to the LSTM</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-300 block mb-1.5">Quantization Grid</span>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-200">
            16th Note (0.25 beats)
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Rhythmic resolution</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-300 block mb-1.5">Vocabulary Size ($V$)</span>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono tabular-nums text-sky-400 font-semibold">
            {vocabulary.length} Unique Tokens
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Distinct pitch classes & chords</span>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-300 block mb-1.5">Training Pairs ($X \to y$)</span>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono tabular-nums text-emerald-400 font-semibold">
            {inputSequences.length} Pairs
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Supervised training samples</span>
        </div>
      </div>

      {/* Tabs for Preprocessed Data Inspection */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start w-fit">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'tokens' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Token Stream ({tokenStrings.length})
          </button>
          <button
            onClick={() => setActiveTab('sliding_window')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'sliding_window' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sliding Window Explorer ({inputSequences.length})
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'vocab' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vocabulary Distribution ({vocabulary.length})
          </button>
          <button
            onClick={() => setActiveTab('transitions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'transitions' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Markov Transition Matrix
          </button>
        </div>

        {/* Tab 1: Token Stream */}
        {activeTab === 'tokens' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Chronological Token Sequence</span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedDataset.notes.length} raw notes parsed into {tokenStrings.length} tokens
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-3 bg-slate-950 rounded-md border border-slate-800/80 font-mono text-xs">
              {tokens.map((t, idx) => {
                const isChord = t.type === 'chord';
                const isRest = t.type === 'rest';

                let colorClasses = 'text-sky-300 border-sky-900/40 bg-sky-950/20';
                if (isChord) colorClasses = 'text-amber-300 border-amber-900/40 bg-amber-950/20 font-semibold';
                if (isRest) colorClasses = 'text-slate-500 border-slate-800 bg-slate-900/40';

                return (
                  <span
                    key={t.id || idx}
                    className={`px-2 py-0.5 rounded border text-[11px] ${colorClasses}`}
                    title={`Index ${idx} · Duration: ${t.duration} beats · Offset: ${t.offset.toFixed(2)}s`}
                  >
                    {t.token}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-950 border border-sky-800 inline-block"></span>
                <span>Single Notes</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-950 border border-amber-800 inline-block"></span>
                <span>Polyphonic Chords</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700 inline-block"></span>
                <span>Rests</span>
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Sliding Window Explorer */}
        {activeTab === 'sliding_window' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">Supervised Training Pair Inspection</span>
                <span className="text-xs text-slate-400">
                  Slide through sequences to observe the exact input vector $X$ and target label $y$
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, inputSequences.length - 1)}
                  value={slidingWindowIndex}
                  onChange={(e) => setSlidingWindowIndex(parseInt(e.target.value, 10))}
                  className="w-48 accent-sky-500"
                />
                <span className="text-xs font-mono text-slate-300 tabular-nums">
                  Sample {slidingWindowIndex + 1} / {inputSequences.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
              {/* Input Window X */}
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Input Sequence $X_t$ (Length: {currentWindowInput.length})</span>
                  <span className="text-[11px] font-mono text-slate-500">Network Input</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/60 rounded border border-slate-800 font-mono text-xs">
                  {currentWindowInput.map((intVal, idx) => {
                    const tokenStr = preprocessedData.intToNote[intVal];
                    return (
                      <span key={idx} className="px-2 py-1 rounded bg-slate-800 text-sky-300 border border-slate-700 text-[11px]">
                        {tokenStr}
                        <span className="text-[9px] text-slate-500 ml-1">({intVal})</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-600">
                <ArrowRight className="w-5 h-5 text-sky-400" />
              </div>

              {/* Target token y */}
              <div className="md:col-span-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-400">Target $y_t$</span>
                  <span className="text-[11px] font-mono text-slate-500">Next Step</span>
                </div>
                <div className="p-2 bg-emerald-950/20 rounded border border-emerald-800/40 font-mono text-xs text-center">
                  {currentWindowTarget !== null ? (
                    <div>
                      <span className="text-sm font-bold text-emerald-300 block">
                        {preprocessedData.intToNote[currentWindowTarget]}
                      </span>
                      <span className="text-[10px] text-emerald-500">Class Index: {currentWindowTarget}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Vocabulary Distribution */}
        {activeTab === 'vocab' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Unique Token Vocabulary & Frequency</span>
              <span className="text-xs text-slate-400 font-mono">
                {frequencies.length} unique classes for Softmax layer
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Integer ID</th>
                    <th className="py-2.5 px-4 font-medium">Token Symbol</th>
                    <th className="py-2.5 px-4 font-medium text-right">Occurrence Count</th>
                    <th className="py-2.5 px-4 font-medium text-right">Distribution %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {frequencies.map((f, i) => {
                    const id = noteToInt[f.token];
                    return (
                      <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-4 tabular-nums text-slate-400">{id}</td>
                        <td className="py-2 px-4 text-white font-medium">{f.token}</td>
                        <td className="py-2 px-4 text-right tabular-nums text-slate-300">{f.count}</td>
                        <td className="py-2 px-4 text-right tabular-nums text-sky-400">{f.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Markov Transition Matrix */}
        {activeTab === 'transitions' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">First-Order Note Transition Probabilities</span>
              <span className="text-xs text-slate-400 font-mono">
                $P(note_{'{t+1}'} \mid note_t)$ learned from {selectedDataset.title}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {transitionMatrix.slice(0, 30).map((t, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-300 font-medium">{t.from}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-300 font-medium">{t.to}</span>
                  </div>
                  <span className="text-xs tabular-nums font-semibold text-slate-400">
                    {(t.probability * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
