import React, { useRef, useEffect, useState } from 'react';
import { TrainingMetric, ModelHyperparameters, MidiNote, PreprocessedData } from '../types/music';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, ChevronRight, Volume2, Sparkles } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface TrainerConsoleProps {
  hyperparams: ModelHyperparameters;
  preprocessedData: PreprocessedData;
  metricsHistory: TrainingMetric[];
  currentEpoch: number;
  isTraining: boolean;
  onStartTraining: () => void;
  onPauseTraining: () => void;
  onResetTraining: () => void;
  onFastForwardWeights: () => void;
  onProceedToGeneration: () => void;
  checkpointNotes?: MidiNote[];
}

export const TrainerConsole: React.FC<TrainerConsoleProps> = ({
  hyperparams,
  preprocessedData,
  metricsHistory,
  currentEpoch,
  isTraining,
  onStartTraining,
  onPauseTraining,
  onResetTraining,
  onFastForwardWeights,
  onProceedToGeneration,
  checkpointNotes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlayingCheckpoint, setIsPlayingCheckpoint] = useState(false);

  // Latest metrics
  const latestMetric = metricsHistory[metricsHistory.length - 1] || {
    epoch: 0,
    batch: 0,
    loss: 3.42,
    perplexity: 30.5,
    accuracy: 14.2,
  };

  // Render loss curve chart on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels (Loss 0.0 - 4.0)
      const lossVal = (4.0 - (4.0 / 4) * i).toFixed(1);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(lossVal, padding.left - 8, y + 3);
    }

    // X-axis label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Epoch 1 - ${Math.max(hyperparams.epochs, currentEpoch)}`, padding.left + chartW / 2, height - 8);

    if (metricsHistory.length < 2) {
      ctx.fillStyle = '#475569';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click "Start Training" to begin optimization loop', width / 2, height / 2);
      return;
    }

    // Draw Loss Path
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8'; // Sky blue loss line
    ctx.lineWidth = 2.5;

    metricsHistory.forEach((m, idx) => {
      const x = padding.left + (idx / (metricsHistory.length - 1)) * chartW;
      const normalizedLoss = Math.max(0, Math.min(4.0, m.loss));
      const y = padding.top + (1 - normalizedLoss / 4.0) * chartH;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area fill below loss line
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Accuracy Path (Green dotted)
    ctx.beginPath();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    metricsHistory.forEach((m, idx) => {
      const x = padding.left + (idx / (metricsHistory.length - 1)) * chartW;
      const normalizedAcc = Math.max(0, Math.min(100, m.accuracy)) / 100;
      const y = padding.top + (1 - normalizedAcc) * chartH;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }, [metricsHistory, currentEpoch, hyperparams.epochs]);

  const handleAuditionCheckpoint = () => {
    if (!checkpointNotes || checkpointNotes.length === 0) return;

    if (isPlayingCheckpoint) {
      audioSynth.stop();
      setIsPlayingCheckpoint(false);
    } else {
      setIsPlayingCheckpoint(true);
      audioSynth.playSequence(
        checkpointNotes,
        'grand_piano',
        undefined,
        () => setIsPlayingCheckpoint(false)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">4. Train Model on Note Dataset</h2>
          <p className="text-sm text-slate-400 mt-1">
            Execute in-browser backpropagation through time (BPTT) with Adam optimization and real-time loss tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onFastForwardWeights}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
            title="Fast-forward weights to pre-converged state for instant testing"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Converged Checkpoint</span>
          </button>

          <button
            onClick={onProceedToGeneration}
            className="px-4 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span>Open Generation Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Epoch Progress</span>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {currentEpoch} <span className="text-xs text-slate-500 font-normal">/ {hyperparams.epochs}</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
            <div
              className="bg-sky-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentEpoch / hyperparams.epochs) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Cross-Entropy Loss</span>
          <div className="text-xl font-bold font-mono tabular-nums text-sky-400">
            {latestMetric.loss.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{'−Σ yᵢ · log(pᵢ)'}</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Model Perplexity</span>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-400">
            {latestMetric.perplexity.toFixed(1)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Uncertainty branching factor</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Top-1 Accuracy</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {latestMetric.accuracy.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Correct next-note prediction</span>
        </div>
      </div>

      {/* Main Training Console: Canvas Chart + Controls */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isTraining ? (
              <button
                onClick={onPauseTraining}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pause Training</span>
              </button>
            ) : (
              <button
                onClick={onStartTraining}
                className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-sky-950/50"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{currentEpoch === 0 ? 'Start Training' : 'Resume Training'}</span>
              </button>
            )}

            <button
              onClick={onResetTraining}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Audition Checkpoint button */}
          {checkpointNotes && checkpointNotes.length > 0 && (
            <button
              onClick={handleAuditionCheckpoint}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-2"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isPlayingCheckpoint ? 'Stop Checkpoint Audio' : `Audition Epoch ${currentEpoch} Checkpoint`}</span>
            </button>
          )}
        </div>

        {/* Real-time Loss Chart */}
        <div className="rounded-lg overflow-hidden border border-slate-800">
          <canvas
            ref={canvasRef}
            width={900}
            height={260}
            className="w-full h-auto block"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-sky-400 inline-block"></span>
              <span>Training Loss ($-\log P$)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-emerald-400 border-t border-dashed border-emerald-400 inline-block"></span>
              <span>Next-Token Accuracy (%)</span>
            </span>
          </div>

          <span>Batch Size: {hyperparams.batchSize} · LR: {hyperparams.learningRate}</span>
        </div>
      </div>
    </div>
  );
};
