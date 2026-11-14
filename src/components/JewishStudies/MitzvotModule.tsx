import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MITZVOT_DATA } from '../../data/jewishStudiesData';
import { MitzvahItem } from '../../types';
import { soundManager } from '../../utils/audio';
import { stripNiqqud } from '../../utils/hebrew';

export const MitzvotModule: React.FC = () => {
  const [selectedMitzvah, setSelectedMitzvah] = useState<MitzvahItem>(MITZVOT_DATA[0]);

  const handleSpeakTitle = (mitzvah: MitzvahItem) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(mitzvah.titleHe, 0.85, 1.0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">

      {/* Grid Mitzvot Selector - style-matched with Holidays, no scrolling, no Hebrew */}
      <div
        dir="ltr"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 px-1 w-full"
      >
        {MITZVOT_DATA.map((mitzvah) => {
          const isActive = selectedMitzvah.id === mitzvah.id;
          return (
            <button
              key={mitzvah.id}
              type="button"
              onClick={() => {
                setSelectedMitzvah(mitzvah);
                soundManager.playPop();
                handleSpeakTitle(mitzvah);
              }}
              className={`p-2.5 rounded-2xl border-2 flex items-center transition-all cursor-pointer active:scale-95 text-left w-full ${
                isActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5 w-full overflow-hidden">
                <span className="text-xl shrink-0 leading-none">{mitzvah.emoji}</span>
                <span className="text-xs sm:text-sm font-bold tracking-tight truncate flex-1 text-left select-none">
                  {mitzvah.titleEn.split(' (')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Mitzvah Showcase Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-amber-300/80 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-4xl flex items-center justify-center shadow-xs border-2 border-white">
              {selectedMitzvah.emoji}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {selectedMitzvah.titleEn}
              </h3>
              <div
                className="text-lg font-bold text-amber-800 font-hebrew"
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {stripNiqqud(selectedMitzvah.titleHe)} ({selectedMitzvah.transliteration})
              </div>
            </div>
          </div>
        </div>

        {/* Explanation & Ways to Practice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs space-y-2">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              💡 What Does It Mean?
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {selectedMitzvah.kidExplanation}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🤝 How You Can Practice:
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 font-medium">
              {selectedMitzvah.howToPractice.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
