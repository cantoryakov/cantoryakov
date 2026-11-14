import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { LetterData } from '../types';
import { SOFIT_LETTERS } from '../data/alefbet';

interface LetterDrillSelectorProps {
  letters: LetterData[];
  selectedLetterIds: Set<string>;
  onToggleLetter: (letterId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export const LetterDrillSelector: React.FC<LetterDrillSelectorProps> = ({
  letters,
  selectedLetterIds,
  onToggleLetter,
  onSelectAll,
  onSelectNone,
}) => {
  const baseLetters = letters.slice(0, 22);

  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-xs space-y-2 sm:space-y-2.5">
      {/* Header with status count and Select All / Select None action buttons */}
      <div className="h-8 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-xs sm:text-sm leading-none">Drill Letters:</span>
          <span className="font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {selectedLetterIds.size} active
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelectAll}
            className="h-7 flex items-center gap-1 px-2.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={onSelectNone}
            className="h-7 flex items-center gap-1 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
          >
            <Square className="w-3.5 h-3.5 text-slate-500" />
            <span>Select None</span>
          </button>
        </div>
      </div>

      {/* 2x11 RTL Hebrew Letter Grid */}
      <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
        {baseLetters.map((letter) => {
          const isSelected = selectedLetterIds.has(letter.id);
          return (
            <button
              key={letter.id}
              type="button"
              onClick={() => onToggleLetter(letter.id)}
              className={`aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center cursor-pointer select-none ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                  : 'bg-slate-100/90 text-slate-400 hover:bg-amber-100 hover:text-slate-600 border border-slate-200 opacity-60'
              }`}
              style={{ fontFamily: "'Akoderf', sans-serif" }}
            >
              {letter.letter}
            </button>
          );
        })}
      </div>

      {/* Five Separate Sofit Letter Icons: ך ם ן ף ץ */}
      <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto pt-2 border-t border-amber-100 mt-2">
        {SOFIT_LETTERS.map((sofitLetter, idx) => {
          const isSelected = selectedLetterIds.has(sofitLetter.id);
          return (
            <button
              key={sofitLetter.id}
              type="button"
              onClick={() => onToggleLetter(sofitLetter.id)}
              className={`aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center cursor-pointer select-none border shadow-2xs ${
                idx === 0 ? 'col-start-4' : ''
              } ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 scale-105'
                  : 'bg-slate-100/90 text-slate-400 hover:bg-amber-100 hover:text-slate-600 border border-slate-200 opacity-60'
              }`}
              style={{ fontFamily: "'Akoderf', sans-serif" }}
            >
              {sofitLetter.letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};
