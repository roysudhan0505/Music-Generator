import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal } from 'lucide-react';
import { generatePythonMusic21Script } from '../utils/music21Preprocessor';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetTitle: string;
  sequenceLength: number;
  hiddenUnits: number;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  datasetTitle,
  sequenceLength,
  hiddenUnits,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = generatePythonMusic21Script(datasetTitle, sequenceLength, hiddenUnits);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'train_music_lstm.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-semibold text-white">
                Python <code className="text-sky-300 font-mono text-xs">music21</code> & PyTorch Deep Learning Script
              </h3>
              <p className="text-xs text-slate-400">
                Executable script implementing the full end-to-end pipeline for training on local GPUs or Google Colab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto selection:bg-sky-900 selection:text-white">
            <code>{scriptCode}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Prerequisites: <code className="text-sky-300">pip install music21 torch numpy</code></span>
          <span>Configured for: {datasetTitle} · Window: {sequenceLength}</span>
        </div>
      </div>
    </div>
  );
};
