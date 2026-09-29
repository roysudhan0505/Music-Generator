import React from 'react';
import { GeneratedSong } from '../types/music';
import { Play, Pause, Heart, Share2, Download, Music2, Disc3, Mic, Sparkles } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { downloadMidiFile } from '../utils/midiEngine';

interface SunoSongCardProps {
  song: GeneratedSong;
  isPlaying: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
  onLikeToggle?: () => void;
  isLiked?: boolean;
}

export const SunoSongCard: React.FC<SunoSongCardProps> = ({
  song,
  isPlaying,
  isCurrent,
  onSelect,
  onTogglePlay,
  onLikeToggle,
  isLiked = false,
}) => {
  const handleExportMidi = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadMidiFile(song.notes, song.tempo, `${song.title.toLowerCase().replace(/\s+/g, '_')}.mid`);
  };

  const handleExportWav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await audioSynth.downloadWavFile(song.notes, song.instrument, `${song.title.toLowerCase().replace(/\s+/g, '_')}.wav`);
    } catch (err) {
      console.error('WAV export error:', err);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all ${
        isCurrent
          ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/40'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Album Artwork with Play Button Overlay */}
        <div
          className={`relative w-18 h-18 rounded-lg bg-gradient-to-br ${song.coverGradient} flex items-center justify-center shrink-0 shadow-md overflow-hidden group/art`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-lg ${
              isCurrent && isPlaying
                ? 'bg-sky-400 text-slate-950 scale-100 opacity-100'
                : 'bg-black/60 text-white backdrop-blur-xs group-hover/art:scale-105 group-hover/art:opacity-100 sm:opacity-85'
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Sound wave badge when playing */}
          {isCurrent && isPlaying && (
            <div className="absolute bottom-1 right-1 flex items-end gap-0.5 px-1 py-0.5 bg-black/60 rounded">
              <span className="w-0.5 h-2 bg-sky-400 animate-pulse" />
              <span className="w-0.5 h-3 bg-sky-400 animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-sky-400 animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                {song.title}
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                {song.artist}
              </p>
            </div>

            {/* Like count */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onLikeToggle) onLikeToggle();
              }}
              className={`flex items-center gap-1 text-xs shrink-0 transition-colors ${
                isLiked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
              <span className="font-mono tabular-nums text-[11px]">{song.likes + (isLiked ? 1 : 0)}</span>
            </button>
          </div>

          {/* Style Tags (clean text, no pills) */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            {song.styleTags.slice(0, 3).map((tag, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-600">·</span>}
                <span className="capitalize">{tag}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Waveform Micro-Preview */}
          <div className="mt-2.5 flex items-end gap-0.5 h-4 w-full">
            {song.waveform.map((bar, idx) => {
              const active = isCurrent && isPlaying;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all ${
                    active ? 'bg-sky-400/80' : 'bg-slate-700/60 group-hover:bg-slate-600/70'
                  }`}
                  style={{ height: `${Math.max(15, bar)}%` }}
                />
              );
            })}
          </div>

          {/* Bottom info row: duration, tempo, exports */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span>{Math.floor(song.duration / 60)}:{(Math.floor(song.duration % 60)).toString().padStart(2, '0')}</span>
              <span>·</span>
              <span>{song.tempo} BPM</span>
              <span>·</span>
              <span>{song.hasVocals ? 'Vocals' : 'Instrumental'}</span>
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleExportMidi}
                title="Export standard MIDI file (.mid)"
                className="p-1 hover:text-sky-300 text-slate-400 transition-colors"
              >
                <Music2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleExportWav}
                title="Export lossless WAV audio (.wav)"
                className="p-1 hover:text-emerald-300 text-slate-400 transition-colors"
              >
                <Disc3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
