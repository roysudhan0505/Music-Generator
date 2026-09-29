import React, { useRef, useEffect, useState } from 'react';
import { MidiNote } from '../types/music';
import { midiPitchToName } from '../utils/midiEngine';
import { audioSynth, InstrumentType } from '../utils/audioSynth';

interface PianoRollProps {
  notes: MidiNote[];
  currentTime?: number;
  totalDuration?: number;
  isPlaying?: boolean;
  instrument?: InstrumentType;
  height?: number;
  onSeek?: (time: number) => void;
}

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  currentTime = 0,
  totalDuration = 10,
  isPlaying = false,
  instrument = 'grand_piano',
  height = 280,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNote, setHoveredNote] = useState<MidiNote | null>(null);

  // Compute pitch bounds
  const minPitch = notes.length > 0 ? Math.max(24, Math.min(...notes.map((n) => n.pitch)) - 2) : 48;
  const maxPitch = notes.length > 0 ? Math.min(108, Math.max(...notes.map((n) => n.pitch)) + 3) : 84;
  const pitchRange = Math.max(12, maxPitch - minPitch + 1);

  const duration = Math.max(1, totalDuration, notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const keyWidth = 44;
    const rollWidth = width - keyWidth;
    const rowHeight = height / pitchRange;

    // Clear
    ctx.fillStyle = '#0b0f19'; // deep slate canvas
    ctx.fillRect(0, 0, width, height);

    // Draw background pitch rows
    for (let i = 0; i < pitchRange; i++) {
      const pitch = maxPitch - i;
      const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);
      const isC = pitch % 12 === 0;
      const y = i * rowHeight;

      ctx.fillStyle = isBlack ? '#0f172a' : '#131d31';
      ctx.fillRect(keyWidth, y, rollWidth, rowHeight);

      // Horizontal grid line
      ctx.strokeStyle = isC ? '#334155' : '#1e293b';
      ctx.lineWidth = isC ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(keyWidth, y + rowHeight);
      ctx.lineTo(width, y + rowHeight);
      ctx.stroke();

      // Left Piano Key
      ctx.fillStyle = isBlack ? '#1e293b' : '#f8fafc';
      ctx.fillRect(0, y + 0.5, keyWidth - 2, rowHeight - 1);

      if (isC || rowHeight > 16) {
        ctx.fillStyle = isBlack ? '#94a3b8' : '#475569';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(midiPitchToName(pitch), keyWidth - 6, y + rowHeight * 0.75);
      }
    }

    // Draw vertical beat grid lines
    const secondsPerBeat = 0.5; // default 120bpm quarter note
    const totalBeats = Math.ceil(duration / secondsPerBeat);
    for (let b = 0; b <= totalBeats; b++) {
      const beatTime = b * secondsPerBeat;
      const x = keyWidth + (beatTime / duration) * rollWidth;
      const isBar = b % 4 === 0;

      ctx.strokeStyle = isBar ? '#334155' : '#1e293b';
      ctx.lineWidth = isBar ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw notes
    for (const note of notes) {
      const x = keyWidth + (note.startTime / duration) * rollWidth;
      const w = Math.max(4, (note.duration / duration) * rollWidth);
      const rowIdx = maxPitch - note.pitch;
      const y = rowIdx * rowHeight + 1.5;
      const h = Math.max(3, rowHeight - 3);

      const isCurrent = isPlaying && currentTime >= note.startTime && currentTime <= (note.startTime + note.duration);

      // Note body
      if (isCurrent) {
        ctx.fillStyle = '#38bdf8'; // Sky blue active
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
        // Pitch-based gradient
        const hue = 180 + ((note.pitch % 12) / 12) * 120; // Teal to Purple range
        ctx.fillStyle = `hsl(${hue}, 75%, 55%)`;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 2);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = isCurrent ? '#ffffff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Note label if wide enough
      if (w > 26 && rowHeight > 12) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(note.pitchName, x + 3, y + h * 0.75);
      }
    }
    ctx.shadowBlur = 0;

    // Draw playhead scrubber
    if (duration > 0) {
      const playheadX = keyWidth + (Math.min(currentTime, duration) / duration) * rollWidth;
      ctx.strokeStyle = '#ef4444'; // Red playhead
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Scrubber head
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [notes, currentTime, totalDuration, isPlaying, minPitch, maxPitch, pitchRange, duration, height]);

  // Handle clicking on piano keys to audition notes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const keyWidth = 44;

    if (x <= keyWidth) {
      // Clicked on piano keyboard
      const rowHeight = height / pitchRange;
      const rowIdx = Math.floor(y / rowHeight);
      const pitch = maxPitch - rowIdx;
      audioSynth.previewNote(pitch, instrument);
    } else if (onSeek) {
      // Clicked on timeline to seek
      const rollWidth = canvas.width - keyWidth;
      const clickedTime = ((x - keyWidth) / rollWidth) * duration;
      onSeek(Math.max(0, Math.min(duration, clickedTime)));
    }
  };

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={height}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-pointer block"
        />
        <div className="absolute top-2 right-3 text-xs text-slate-400 font-mono pointer-events-none flex items-center gap-3">
          <span>{notes.length} notes</span>
          <span>·</span>
          <span>{duration.toFixed(1)}s</span>
          <span>·</span>
          <span>Range: {midiPitchToName(minPitch)} - {midiPitchToName(maxPitch)}</span>
        </div>
      </div>
    </div>
  );
};
