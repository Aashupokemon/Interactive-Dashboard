import React from 'react';
import { Upload } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onOpenImport,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 bg-white">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('dashboard');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
      >
        OmniViz
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'dashboard' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Visualizer
        </button>
        <button
          onClick={() => onNavigate('grid')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'grid' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Data Records
        </button>
        <button
          onClick={() => onNavigate('columns')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'columns' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Attribute Schema
        </button>
        <button
          onClick={() => onNavigate('datasets')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'datasets' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Sample Datasets
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenImport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          Load Data
        </button>
      </div>
    </header>
  );
};
