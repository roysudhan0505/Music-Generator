import React, { useState } from 'react';
import { Sparkles, Wand2, Music, Mic, MicOff, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { InstrumentType } from '../utils/audioSynth';

interface SunoCreatePanelProps {
  onGenerateSong: (params: {
    prompt: string;
    styleInput?: string;
    title?: string;
    customLyrics?: string;
    instrumental: boolean;
    instrument: InstrumentType;
    temperature: number;
    genre: string;
  }) => Promise<void>;
  isGenerating: boolean;
}

export const SunoCreatePanel: React.FC<SunoCreatePanelProps> = ({
  onGenerateSong,
  isGenerating,
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [lyrics, setLyrics] = useState<string>('');
  const [styleInput, setStyleInput] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [instrumental, setInstrumental] = useState<boolean>(false);
  const [instrument, setInstrument] = useState<InstrumentType>('rhodes');
  const [temperature, setTemperature] = useState<number>(0.8);
  const [selectedGenre, setSelectedGenre] = useState<string>('pop');

  const inspirationPills = [
    { label: 'Lo-Fi Chill Beats', prompt: 'Chill lo-fi study beat with warm electric piano and rainy atmosphere', style: 'lo-fi, cozy, neo-soul' },
    { label: '80s Synthwave', prompt: 'Fast-paced nostalgic 80s synthwave anthem with punchy basslines and neon leads', style: 'synthwave, retropop, 80s' },
    { label: 'Smoky Jazz Club', prompt: 'Sophisticated midnight jazz with swinging walking bass and bebop piano solo', style: 'jazz, bebop, acoustic' },
    { label: 'Cinematic Strings', prompt: 'Epic emotional film soundtrack with soaring cello and sweeping orchestra', style: 'orchestral, cinematic, strings' },
    { label: 'Acoustic Indie Pop', prompt: 'Uplifting indie pop song about summer road trips and chasing golden sunsets', style: 'indie pop, bright, melodic' },
    { label: '8-Bit Arcade Boss', prompt: 'High-energy 8-bit chiptune dungeon battle theme with fast counterpoint', style: 'chiptune, 8-bit, fast' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !lyrics.trim() && !styleInput.trim()) return;

    onGenerateSong({
      prompt: prompt.trim() || 'Melodic music creation',
      styleInput: styleInput.trim(),
      title: title.trim(),
      customLyrics: lyrics.trim(),
      instrumental,
      instrument,
      temperature,
      genre: selectedGenre,
    });
  };

  const handleApplyInspiration = (item: typeof inspirationPills[0]) => {
    setPrompt(item.prompt);
    setStyleInput(item.style);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Switcher: Simple vs Custom (like Suno) */}
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Create Music</h2>
            <p className="text-xs text-slate-400">Describe what you want to hear or write custom lyrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Instrumental Toggle */}
          <button
            type="button"
            onClick={() => setInstrumental(!instrumental)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              instrumental
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {instrumental ? <MicOff className="w-3.5 h-3.5 text-sky-400" /> : <Mic className="w-3.5 h-3.5" />}
            <span>Instrumental</span>
          </button>

          {/* Simple vs Custom Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                !isCustomMode ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isCustomMode ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isCustomMode ? (
          /* ================= SIMPLE MODE (One prompt box like Suno) ================= */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Song Description
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A melancholic piano ballad about leaving hometown under autumn leaves, cinematic strings, soft female vocal harmonies..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 block">Try an inspiring style:</span>
              <div className="flex flex-wrap gap-1.5">
                {inspirationPills.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyInspiration(item)}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-sky-300 hover:border-slate-700 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= CUSTOM MODE (Lyrics, Style, Title) ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lyrics Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Lyrics
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLyrics(`[Verse 1]\nNeon signs flicker in the wet street\nFollowing the rhythm of a steady beat\n\n[Chorus]\nFly with me across the night sky\nNever stop to ask the reason why`);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    Fill sample lyrics
                  </button>
                </div>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={instrumental}
                  placeholder={instrumental ? "Instrumental track selected (no vocals)" : "[Verse 1]\nWrite your verses...\n\n[Chorus]\nAdd your memorable chorus..."}
                  rows={6}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none transition-colors resize-none font-mono ${
                    instrumental ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Style & Title */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Style of Music
                  </label>
                  <input
                    type="text"
                    value={styleInput}
                    onChange={(e) => setStyleInput(e.target.value)}
                    placeholder="e.g. upbeat disco funk, slap bass, vintage brass"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Echoes in Tokyo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Instrument Timbre */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Primary Audio Timbre
                  </label>
                  <select
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="rhodes">Vintage Electric Piano (Rhodes)</option>
                    <option value="grand_piano">Concert Grand Piano</option>
                    <option value="strings">Lush Orchestral Strings</option>
                    <option value="marimba">Vibraphone & Marimba</option>
                    <option value="synth_8bit">Chiptune Retro Synth</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Harmoniq AI Engine Ready</span>
            <span aria-hidden="true">·</span>
            <span>Free Unlimited Generations</span>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950'
            }`}
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Song...' : 'Create Song'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
