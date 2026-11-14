import React, { useEffect } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';

interface LockedTabBannerProps {
  message: string;
  progressText?: string;
  currentCount?: number;
  totalRequired?: number;
  onClose: () => void;
}

export const LockedTabBanner: React.FC<LockedTabBannerProps> = ({
  message,
  progressText,
  currentCount = 0,
  totalRequired = 22,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const percentage = Math.min(100, Math.round((currentCount / totalRequired) * 100));

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md animate-bounce-short">
      <div className="bg-slate-900/95 text-white p-4 rounded-2xl border-2 border-amber-400 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 relative">
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <span>Feature Locked</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
              {message}
            </p>
          </div>
        </div>

        {totalRequired > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-amber-200">
              <span>{progressText || 'Progression Progress'}</span>
              <span>
                {currentCount} / {totalRequired} ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
