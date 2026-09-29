import React from 'react';
import {
  Compass,
  PlusCircle,
  Library,
  Sliders,
  Cpu,
  Music,
  Code2,
  Sparkles,
  Search,
} from 'lucide-react';

export type MainNavSection = 'explore' | 'create' | 'library' | 'pipeline';

interface SunoSidebarProps {
  currentSection: MainNavSection;
  onSelectSection: (section: MainNavSection) => void;
  onOpenPythonModal: () => void;
  savedSongsCount: number;
}

export const SunoSidebar: React.FC<SunoSidebarProps> = ({
  currentSection,
  onSelectSection,
  onOpenPythonModal,
  savedSongsCount,
}) => {
  const navItems: { id: MainNavSection; label: string; icon: any; count?: number }[] = [
    { id: 'explore', label: 'Explore & Feed', icon: Compass },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'library', label: 'My Library', icon: Library, count: savedSongsCount },
    { id: 'pipeline', label: 'Neural Lab (music21)', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 hidden md:flex h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Create Button Top Hero */}
      <div className="p-4">
        <button
          onClick={() => onSelectSection('create')}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4 fill-slate-950" />
          <span>Create Song</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Lab Card */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Under the Hood</span>
            <span className="text-[10px] font-mono text-emerald-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Standard MIDI data, music21 tokenization, LSTM recurrence, and Web Audio synthesis.
          </p>
          <button
            onClick={onOpenPythonModal}
            className="w-full py-1.5 px-2.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Script</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
