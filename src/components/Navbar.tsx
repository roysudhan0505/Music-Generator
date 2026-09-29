import React from 'react';
import { Download, Music, Code2 } from 'lucide-react';

export type ActiveTab = 'dataset' | 'preprocess' | 'architecture' | 'training' | 'generation';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExportMidi: () => void;
  onExportWav: () => void;
  onOpenPythonCode: () => void;
  hasGeneratedNotes: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onExportMidi,
  onExportWav,
  onOpenPythonCode,
  hasGeneratedNotes,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dataset', label: '1. MIDI Datasets' },
    { id: 'preprocess', label: '2. Preprocessing' },
    { id: 'architecture', label: '3. Model Architecture' },
    { id: 'training', label: '4. Model Training' },
    { id: 'generation', label: '5. Generation Studio' },
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Music className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Harmoniq AI
        </span>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPythonCode}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="View and export Python music21 & PyTorch training code"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Python Script</span>
        </button>

        <button
          onClick={onExportMidi}
          disabled={!hasGeneratedNotes}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            hasGeneratedNotes
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Export current generated music sequence as standard MIDI file (.mid)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MIDI</span>
        </button>
      </div>
    </header>
  );
};
