import React, { useState } from 'react';
import { Volume2, Star, CheckCircle2, Heart } from 'lucide-react';
import { BLESSINGS_DATA } from '../../data/jewishStudiesData';
import { BlessingItem } from '../../types';
import { soundManager } from '../../utils/audio';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { stripNiqqud } from '../../utils/hebrew';

export const BlessingsModule: React.FC = () => {
  const [selectedBlessing, setSelectedBlessing] = useState<BlessingItem>(BLESSINGS_DATA[0]);
  const [practicedSet, setPracticedSet] = useState<Set<string>>(new Set());
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);

  const handleSpeakLine = (lineHe: string, idx: number) => {
    soundManager.unlockAudio();
    setActiveLineIdx(idx);
    soundManager.speakHebrew(lineHe, 0.85, 1.0, () => {
      setActiveLineIdx(null);
    });
  };

  const handleSpeakFullBlessing = () => {
    soundManager.unlockAudio();
    const fullText = selectedBlessing.lines.map((l) => l.he).join(' ');
    soundManager.speakHebrew(fullText, 0.85, 1.0);
  };

  const handlePracticeBlessing = () => {
    soundManager.unlockAudio();
    soundManager.playSparkle();
    if (!practicedSet.has(selectedBlessing.id)) {
      setPracticedSet((prev) => new Set([...prev, selectedBlessing.id]));
      fireCelebrationConfetti(0.5, 0.4);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">

      {/* Grid Blessing Selector - style-matched with Holidays, no scrolling, no Hebrew */}
      <div
        dir="ltr"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 px-1 w-full"
      >
        {BLESSINGS_DATA.map((blessing) => {
          const isActive = selectedBlessing.id === blessing.id;
          return (
            <button
              key={blessing.id}
              type="button"
              onClick={() => {
                setSelectedBlessing(blessing);
                setActiveLineIdx(null);
                soundManager.playPop();
              }}
              className={`p-2.5 rounded-2xl border-2 flex items-center transition-all cursor-pointer active:scale-95 text-left w-full ${
                isActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5 w-full overflow-hidden">
                <span className="text-xl shrink-0 leading-none">{blessing.emoji}</span>
                <span className="text-xs sm:text-sm font-bold tracking-tight truncate flex-1 text-left select-none">
                  {blessing.titleEn.split(' (')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Blessing Player View */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-amber-300/80 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-4xl flex items-center justify-center shadow-xs border-2 border-white">
              {selectedBlessing.emoji}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {selectedBlessing.titleEn}
              </h3>
              <div
                className="text-lg font-bold text-amber-800 font-hebrew"
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {stripNiqqud(selectedBlessing.titleHe)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeakFullBlessing}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Full Blessing</span>
            </button>

            <button
              type="button"
              onClick={handlePracticeBlessing}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                practicedSet.has(selectedBlessing.id)
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {practicedSet.has(selectedBlessing.id) ? 'I Said It! 🙏' : 'I Said This Blessing! 🙏'}
              </span>
            </button>
          </div>
        </div>

        {/* When to say callout */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center gap-2">
          <span className="text-base">🕒</span>
          <div>
            <span className="font-bold text-amber-900">When To Say: </span>
            <span>{selectedBlessing.whenToSay}</span>
          </div>
        </div>

        {/* Line-by-Line Interactive Text Cards */}
        <div className="space-y-3 pt-1">
          {selectedBlessing.lines.map((line, idx) => (
            <div
              key={idx}
              onClick={() => handleSpeakLine(line.he, idx)}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-2xs hover:scale-101 flex flex-col items-center justify-center text-center space-y-1.5 ${
                activeLineIdx === idx
                  ? 'bg-amber-400 border-amber-600 ring-4 ring-amber-200 shadow-md'
                  : 'bg-amber-50/50 hover:bg-amber-100/80 border-amber-200'
              }`}
            >
              <div
                className="text-2xl sm:text-3xl font-bold text-slate-900 font-hebrew tracking-wide"
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {stripNiqqud(line.he)}
              </div>

              <div className="text-xs sm:text-sm font-bold text-amber-900">
                {line.transliteration}
              </div>

              <div className="text-xs font-bold text-slate-600 italic">
                "{line.en}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
