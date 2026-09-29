import React from 'react';
import { ModelHyperparameters, ModelType } from '../types/music';
import { Cpu, Network, GitFork, Sliders, ChevronRight, Activity } from 'lucide-react';

interface ArchitectureViewProps {
  hyperparams: ModelHyperparameters;
  vocabSize: number;
  onUpdateHyperparams: (params: Partial<ModelHyperparameters>) => void;
  onProceedToTraining: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  hyperparams,
  vocabSize,
  onUpdateHyperparams,
  onProceedToTraining,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">3. Build Deep Learning Model Architecture</h2>
          <p className="text-sm text-slate-400 mt-1">
            Design recurrent neural networks (LSTM / Bi-LSTM) or adversarial generative networks (GANs) to capture temporal musical grammar.
          </p>
        </div>

        <button
          onClick={onProceedToTraining}
          className="px-4 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>Proceed to Training</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Model Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'lstm',
            name: 'Standard LSTM Network',
            desc: 'Unidirectional Long Short-Term Memory cell with forget, input, and output gates for causal autoregressive melody generation.',
            icon: Cpu,
          },
          {
            id: 'bilstm',
            name: 'Bi-Directional LSTM',
            desc: 'Dual forward and backward recurrent units capturing both preceding and succeeding musical context for richer voice-leading.',
            icon: Network,
          },
          {
            id: 'gan',
            name: 'Music GAN (Generative Adversarial)',
            desc: 'Minimax game between a Generator network producing candidate note tokens and a Discriminator evaluating melodic coherence.',
            icon: GitFork,
          },
        ].map((item) => {
          const isSelected = hyperparams.architecture === item.id;
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onUpdateHyperparams({ architecture: item.id as ModelType })}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900/90 border-sky-500/70 shadow-lg shadow-sky-950/40'
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.name}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Computation Graph & Gate Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Diagram */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Computation Graph Visualization</h3>
            <span className="text-xs text-slate-400 font-mono">
              Vocab: {vocabSize} · Hidden: {hyperparams.hiddenUnits}
            </span>
          </div>

          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800/80 space-y-4 font-mono text-xs">
            {/* Input Layer */}
            <div className="p-3 rounded border border-sky-900/40 bg-sky-950/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sky-300 block">Input Tensor ($X$)</span>
                <span className="text-[11px] text-slate-400">Sequence of {hyperparams.sequenceLength} token indices</span>
              </div>
              <span className="text-sky-400 font-mono">[{hyperparams.batchSize}, {hyperparams.sequenceLength}]</span>
            </div>

            {/* Recurrent Cell Layer */}
            <div className="p-3 rounded border border-indigo-900/40 bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-indigo-300 block">
                    {hyperparams.architecture === 'gan' ? 'Generator Latent Recurrent Layer' : `Recurrent LSTM Layer (Units: ${hyperparams.hiddenUnits})`}
                  </span>
                  <span className="text-[11px] text-slate-400">Forget Gate $f_t$, Input Gate $i_t$, Cell Memory $C_t$, Output Gate $o_t$</span>
                </div>
                <span className="text-indigo-400 font-mono">[{hyperparams.batchSize}, {hyperparams.hiddenUnits}]</span>
              </div>

              {/* Mathematical Gate Equations */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/30 text-[11px] text-indigo-200">
                <div className="bg-indigo-950/60 p-1.5 rounded">
                  <span className="text-slate-400">Forget:</span> {'f_t = σ(W_f · x_t + U_f · h_{t-1} + b_f)'}
                </div>
                <div className="bg-indigo-950/60 p-1.5 rounded">
                  <span className="text-slate-400">Input:</span> {'i_t = σ(W_i · x_t + U_i · h_{t-1} + b_i)'}
                </div>
                <div className="bg-indigo-950/60 p-1.5 rounded">
                  <span className="text-slate-400">Cell:</span> {'C_t = f_t ⊙ C_{t-1} + i_t ⊙ C̃_t'}
                </div>
                <div className="bg-indigo-950/60 p-1.5 rounded">
                  <span className="text-slate-400">Output:</span> {'h_t = o_t ⊙ tanh(C_t)'}
                </div>
              </div>
            </div>

            {/* Dropout Regularization */}
            <div className="p-2.5 rounded border border-amber-900/30 bg-amber-950/10 flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-300 block">Dropout Regularization</span>
                <span className="text-[11px] text-slate-400">Zeroes random activations during forward pass to prevent overfitting</span>
              </div>
              <span className="text-amber-400 font-mono">p = {hyperparams.dropout}</span>
            </div>

            {/* Dense Linear Softmax Output */}
            <div className="p-3 rounded border border-emerald-900/40 bg-emerald-950/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-300 block">Dense Linear + Softmax Layer</span>
                <span className="text-[11px] text-slate-400">Probability distribution over {vocabSize} vocabulary note classes</span>
              </div>
              <span className="text-emerald-400 font-mono">[{hyperparams.batchSize}, {vocabSize}]</span>
            </div>
          </div>
        </div>

        {/* Hyperparameters Config Panel */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Hyperparameter Tuning</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Hidden Units */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>LSTM Hidden Dimensions ($H$)</span>
                <span className="font-mono text-sky-400 font-semibold">{hyperparams.hiddenUnits} units</span>
              </div>
              <input
                type="range"
                min="32"
                max="256"
                step="32"
                value={hyperparams.hiddenUnits}
                onChange={(e) => onUpdateHyperparams({ hiddenUnits: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500"
              />
              <span className="text-[11px] text-slate-500">Higher values allow capturing more intricate musical phrasing</span>
            </div>

            {/* Dropout Rate */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Dropout Rate ($p$)</span>
                <span className="font-mono text-sky-400 font-semibold">{hyperparams.dropout}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={hyperparams.dropout}
                onChange={(e) => onUpdateHyperparams({ dropout: parseFloat(e.target.value) })}
                className="w-full accent-sky-500"
              />
              <span className="text-[11px] text-slate-500">Prevents the model from merely memorizing the training dataset</span>
            </div>

            {/* Learning Rate */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Learning Rate ($\alpha$)</span>
                <span className="font-mono text-sky-400 font-semibold">{hyperparams.learningRate}</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.02"
                step="0.001"
                value={hyperparams.learningRate}
                onChange={(e) => onUpdateHyperparams({ learningRate: parseFloat(e.target.value) })}
                className="w-full accent-sky-500"
              />
              <span className="text-[11px] text-slate-500">Adam optimizer step size</span>
            </div>

            {/* Batch Size */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Batch Size ($B$)</span>
                <span className="font-mono text-sky-400 font-semibold">{hyperparams.batchSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[16, 32, 64].map((b) => (
                  <button
                    key={b}
                    onClick={() => onUpdateHyperparams({ batchSize: b })}
                    className={`py-1.5 rounded border text-xs font-mono font-medium transition-colors ${
                      hyperparams.batchSize === b
                        ? 'bg-slate-800 text-sky-400 border-sky-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Epochs */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Training Epochs</span>
                <span className="font-mono text-sky-400 font-semibold">{hyperparams.epochs}</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={hyperparams.epochs}
                onChange={(e) => onUpdateHyperparams({ epochs: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
