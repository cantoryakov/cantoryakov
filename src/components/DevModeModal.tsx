import React, { useState } from 'react';
import { Wrench, CheckCircle2, X } from 'lucide-react';

interface DevModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  devModeEnabled: boolean;
  onToggleDevMode: (enabled: boolean) => void;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({
  isOpen,
  onClose,
  devModeEnabled,
  onToggleDevMode,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === 'gcea') {
      onToggleDevMode(true);
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleDisable = () => {
    onToggleDevMode(false);
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border-2 border-amber-300 shadow-2xl relative text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
          <Wrench className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800">Developer Mode</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {devModeEnabled
              ? 'Dev Mode is currently ACTIVE. All progression locks are bypassed.'
              : 'Enter developer password to unlock all tabs and features.'}
          </p>
        </div>

        {devModeEnabled ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All tabs & modules are unlocked</span>
            </div>
            <button
              onClick={handleDisable}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
            >
              Disable Dev Mode
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-center font-mono text-base tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-bold animate-shake">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
              >
                Unlock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
