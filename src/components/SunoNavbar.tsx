import React from 'react';
import { Music, Search, SlidersHorizontal, Sparkles, Code2, Plus } from 'lucide-react';
import { MainNavSection } from './SunoSidebar';

interface SunoNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentSection: MainNavSection;
  onSelectSection: (s: MainNavSection) => void;
  onOpenCreate: () => void;
  onOpenPython: () => void;
}

export const SunoNavbar: React.FC<SunoNavbarProps> = ({
  searchQuery,
  onSearchChange,
  currentSection,
  onSelectSection,
  onOpenCreate,
  onOpenPython,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Brand logo & name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md">
          <Music className="w-4 h-4 fill-slate-950" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            Harmoniq
          </span>
          <span className="text-xs font-mono text-sky-400 font-semibold hidden sm:inline">
            v3.5
          </span>
        </div>
      </div>

      {/* Global Search bar like Suno */}
      <div className="flex-1 max-w-md mx-2 md:mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search songs, styles, genres, moods..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="flex md:hidden items-center gap-1">
        <button
          onClick={() => onSelectSection('explore')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md ${currentSection === 'explore' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
        >
          Explore
        </button>
        <button
          onClick={() => onSelectSection('create')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md ${currentSection === 'create' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'}`}
        >
          Create
        </button>
      </div>

      {/* Right actions */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenPython}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          title="Python music21 & PyTorch script"
        >
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Python Code</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="px-3.5 py-1.5 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Create</span>
        </button>
      </div>
    </header>
  );
};
