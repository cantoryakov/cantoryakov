import React from 'react';
import { Lock, CheckCircle2, XCircle, Sparkles, X, ChevronRight } from 'lucide-react';

interface BuildLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  coreLettersExplored: number;
  coreLettersTraced: number;
  coreLettersColored: number;
  matchScore: number;
  popScore: number;
  hasUnlockedFullCurriculum?: boolean;
}

export const BuildLockModal: React.FC<BuildLockModalProps> = ({
  isOpen,
  onClose,
  coreLettersExplored,
  coreLettersTraced,
  coreLettersColored,
  matchScore,
  popScore,
  hasUnlockedFullCurriculum = false,
}) => {
  if (!isOpen) return null;

  const reqs = [
    {
      id: 'explore',
      label: 'Explore 22 core letters',
      current: Math.min(22, hasUnlockedFullCurriculum ? 22 : coreLettersExplored),
      target: 22,
      unit: '',
      isMet: hasUnlockedFullCurriculum || coreLettersExplored >= 22,
      icon: '📖',
    },
    {
      id: 'trace',
      label: 'Trace 22 core letters',
      current: Math.min(22, coreLettersTraced),
      target: 22,
      unit: '',
      isMet: coreLettersTraced >= 22,
      icon: '✏️',
    },
    {
      id: 'color',
      label: 'Color 22 core letters',
      current: Math.min(22, coreLettersColored),
      target: 22,
      unit: '',
      isMet: coreLettersColored >= 22,
      icon: '🎨',
    },
    {
      id: 'match',
      label: 'Match score: at least 10 pts',
      current: Math.min(10, matchScore),
      target: 10,
      unit: 'pts',
      isMet: matchScore >= 10,
      icon: '🧩',
    },
    {
      id: 'pop',
      label: 'Pop score: at least 10 pts',
      current: Math.min(10, popScore),
      target: 10,
      unit: 'pts',
      isMet: popScore >= 10,
      icon: '🎈',
    },
  ];

  const metCount = reqs.filter((r) => r.isMet).length;
  const overallPercentage = Math.round((metCount / 5) * 100);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border-2 border-amber-300 shadow-2xl relative text-left space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🧱
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
              <span>Sentence Builder Locked</span>
              <Lock className="w-4 h-4 text-amber-600" />
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Complete all 5 Capstone Achievements to unlock Build!
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Capstone Progression</span>
            </span>
            <span>{metCount} / 5 Unlocked ({overallPercentage}%)</span>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-2.5 p-0.5 overflow-hidden border border-amber-300/80">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2 pt-1">
          {reqs.map((req) => {
            return (
              <div
                key={req.id}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  req.isMet
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50/90 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 text-base">
                    {req.isMet ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                    <span>{req.icon}</span>
                    <span>{req.label}</span>
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      req.isMet
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-slate-200/80 border-slate-300 text-slate-600'
                    }`}
                  >
                    {req.current} / {req.target} {req.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1"
          >
            <span>Keep Learning & Exploring!</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
