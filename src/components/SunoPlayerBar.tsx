import React, { useState } from 'react';
import { GeneratedSong } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Download,
  Disc3,
  Music2,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { downloadMidiFile } from '../utils/midiEngine';

interface SunoPlayerBarProps {
  currentSong: GeneratedSong | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  onOpenLyrics: () => void;
  onOpenInspect: () => void;
}

export const SunoPlayerBar: React.FC<SunoPlayerBarProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTime,
  totalDuration,
  onSeek,
  onOpenLyrics,
  onOpenInspect,
}) => {
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  if (!currentSong) return null;

  const duration = Math.max(1, totalDuration || currentSong.duration);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-4 py-3 sm:px-6 shadow-2xl">
      {/* Interactive Progress Bar across the very top of player */}
      <div
        onClick={handleSeek}
        className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 cursor-pointer group"
      >
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 relative transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Song Metadata & Album Art */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentSong.coverGradient} flex items-center justify-center shrink-0 shadow-md`}
          >
            <Music2 className="w-5 h-5 text-white/90" />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{currentSong.title}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrev}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4 fill-slate-400" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-slate-950" />
              ) : (
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-slate-400" />
            </button>
          </div>

          {/* Time indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
            <span>·</span>
            <span>{currentSong.tempo} BPM</span>
            <span>·</span>
            <span>{currentSong.keySignature}</span>
          </div>
        </div>

        {/* Right: Quick Tools, Lyrics & Export */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Lyrics Button */}
          <button
            onClick={onOpenLyrics}
            className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="View Song Lyrics"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Lyrics</span>
          </button>

          {/* MIDI & WAV Download buttons */}
          <button
            onClick={() => downloadMidiFile(currentSong.notes, currentSong.tempo, `${currentSong.title}.mid`)}
            className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-900 rounded-lg transition-colors"
            title="Download MIDI (.mid)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => audioSynth.downloadWavFile(currentSong.notes, currentSong.instrument, `${currentSong.title}.wav`)}
            className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-slate-900 rounded-lg transition-colors"
            title="Download Audio WAV (.wav)"
          >
            <Disc3 className="w-4 h-4" />
          </button>

          {/* Deep Learning Inspector button */}
          <button
            onClick={onOpenInspect}
            className="p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-900 rounded-lg transition-colors"
            title="Open Deep Learning & Piano Roll Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
