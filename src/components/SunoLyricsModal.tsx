import React from 'react';
import { GeneratedSong } from '../types/music';
import { X, Music, Disc3, Download, Sparkles, Copy, Check } from 'lucide-react';
import { downloadMidiFile } from '../utils/midiEngine';
import { audioSynth } from '../utils/audioSynth';

interface SunoLyricsModalProps {
  song: GeneratedSong | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SunoLyricsModal: React.FC<SunoLyricsModalProps> = ({
  song,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !song) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${song.title} - ${song.artist}\n\n${song.lyrics || 'Instrumental Track'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center shrink-0 shadow-md`}>
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{song.title}</h3>
              <p className="text-xs text-slate-400">{song.artist} · {song.genre} · {song.tempo} BPM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Song Style Tags */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Style Prompt:</span>
            <span>"{song.prompt}"</span>
          </div>

          {/* Formatted Lyrics */}
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
            {song.lyrics || (
              <span className="text-slate-500 italic">This is an instrumental composition without vocal lyrics.</span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Model: {song.model}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadMidiFile(song.notes, song.tempo, `${song.title}.mid`)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MIDI</span>
            </button>
            <button
              onClick={() => audioSynth.downloadWavFile(song.notes, song.instrument, `${song.title}.wav`)}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>Download WAV Audio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
