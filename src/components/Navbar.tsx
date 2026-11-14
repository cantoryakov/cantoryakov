import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Curriculum, GameMode, JewishStudiesMode, LetterData } from '../types';
import { AlefBallIcon } from './AlefBallIcon';
import { TorahIcon } from './TorahIcon';
import { soundManager } from '../utils/audio';
import { ALL_LETTERS, ALEFBET_LETTERS } from '../data/alefbet';
import { CATCH_HEROES, CATCH_VILLAINS, CATCH_HOLIDAYS, CATCH_KOSHER_FOODS } from '../data/catchHeroes';

const TOTAL_ENTITIES_COUNT =
  ALL_LETTERS.length + CATCH_HEROES.length + CATCH_VILLAINS.length + CATCH_HOLIDAYS.length + CATCH_KOSHER_FOODS.length;

interface NavbarProps {
  activeCurriculum: Curriculum;
  onSelectCurriculum: (curriculum: Curriculum) => void;
  currentHebrewMode: GameMode;
  onSelectHebrewMode: (mode: GameMode) => void;
  currentJewishMode: JewishStudiesMode;
  onSelectJewishMode: (mode: JewishStudiesMode) => void;
  currentLetter?: LetterData;
  totalCaught: number;
  onOpenCatch: () => void;
  exploredCount?: number;
  exploreDenominator?: number;
  tracedCount?: number;
  coloredCount?: number;
  matchScore?: number;
  popScore?: number;
  sentenceCount?: number;
  devModeEnabled?: boolean;
  hasUnlockedFullCurriculum?: boolean;
  exploredLetters?: string[];
  tracedLetters?: string[];
  coloredLetters?: string[];
  onLockedTabClick?: (modeId: string, message: string, current: number, total: number) => void;
  onBuildLockedTabClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isUnlocked?: boolean;
  isBuildLock?: boolean;
  lockMsg?: string;
  currentVal?: number;
  totalReq?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCurriculum,
  onSelectCurriculum,
  currentHebrewMode,
  onSelectHebrewMode,
  currentJewishMode,
  onSelectJewishMode,
  currentLetter,
  totalCaught,
  onOpenCatch,
  exploredCount,
  exploreDenominator,
  tracedCount,
  coloredCount,
  matchScore,
  popScore,
  sentenceCount,
  devModeEnabled = false,
  hasUnlockedFullCurriculum = false,
  exploredLetters = [],
  tracedLetters = [],
  coloredLetters = [],
  onLockedTabClick,
  onBuildLockedTabClick,
}) => {
  const coreLettersExplored = ALEFBET_LETTERS.filter((l) => exploredLetters.includes(l.id)).length;
  const coreLettersTraced = ALEFBET_LETTERS.filter((l) => tracedLetters.includes(l.id)).length;
  const coreLettersColored = ALEFBET_LETTERS.filter((l) => coloredLetters.includes(l.id)).length;

  const currentMatchScore = matchScore || 0;
  const currentPopScore = popScore || 0;

  const isTraceUnlocked = devModeEnabled || hasUnlockedFullCurriculum;
  const isColorUnlocked = devModeEnabled || hasUnlockedFullCurriculum;
  const isMatchUnlocked = devModeEnabled || hasUnlockedFullCurriculum;
  const isPopUnlocked = devModeEnabled || hasUnlockedFullCurriculum;

  const isBuildUnlocked =
    devModeEnabled ||
    (hasUnlockedFullCurriculum &&
      coreLettersTraced >= 22 &&
      coreLettersColored >= 22 &&
      currentMatchScore >= 10 &&
      currentPopScore >= 10);

  const hebrewNavItems: NavItem[] = [
    {
      id: 'explorer',
      label: 'Explore',
      icon: '📖',
      isUnlocked: true,
      lockMsg: '',
      currentVal: 0,
      totalReq: 22,
    },
    {
      id: 'tracing',
      label: 'Trace',
      icon: '✏️',
      isUnlocked: isTraceUnlocked,
      lockMsg: 'Explore all 22 letters to unlock Trace, Color, Match, and Pop!',
      currentVal: coreLettersExplored,
      totalReq: 22,
    },
    {
      id: 'coloring',
      label: 'Color',
      icon: '🎨',
      isUnlocked: isColorUnlocked,
      lockMsg: 'Explore all 22 letters to unlock Trace, Color, Match, and Pop!',
      currentVal: coreLettersExplored,
      totalReq: 22,
    },
    {
      id: 'balloons',
      label: 'Pop',
      icon: '🎈',
      isUnlocked: isPopUnlocked,
      lockMsg: 'Explore all 22 letters to unlock Trace, Color, Match, and Pop!',
      currentVal: coreLettersExplored,
      totalReq: 22,
    },
    {
      id: 'match',
      label: 'Match',
      icon: '🧩',
      isUnlocked: isMatchUnlocked,
      lockMsg: 'Explore all 22 letters to unlock Trace, Color, Match, and Pop!',
      currentVal: coreLettersExplored,
      totalReq: 22,
    },
    {
      id: 'build',
      label: 'Build',
      icon: '🧱',
      isUnlocked: isBuildUnlocked,
      isBuildLock: true,
      lockMsg: 'Complete all 5 Capstone Achievements to unlock Build!',
      currentVal: 0,
      totalReq: 5,
    },
  ];

  const jewishNavItems: NavItem[] = [
    { id: 'holidays', label: 'Calendar', icon: '📅', isUnlocked: true },
    { id: 'torah', label: 'Tanach', icon: <TorahIcon className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-xs" />, isUnlocked: true },
    { id: 'heroes', label: 'People', icon: '👥', isUnlocked: true },
    { id: 'blessings', label: 'Prayers', icon: '💬', isUnlocked: true },
    { id: 'mitzvot', label: 'Mitzvot', icon: '✡️', isUnlocked: true },
    { id: 'israel', label: 'Israel', icon: '🇮🇱', isUnlocked: true },
  ];

  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cantor_yakov_navbar_collapsed') === 'true';
    }
    return false;
  });

  const toggleNavCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cantor_yakov_navbar_collapsed', String(next));
      }
      return next;
    });
    soundManager.playPop();
  };

  const isCatchMode = activeCurriculum === 'hebrew' && currentHebrewMode === 'catch';
  const isDownloadsMode = activeCurriculum === 'downloads';
  const isHebrewSelected = activeCurriculum === 'hebrew' && !isCatchMode;
  const isJewishSelected = activeCurriculum === 'jewish_studies';

  const currentNavItems = activeCurriculum === 'hebrew' ? hebrewNavItems : jewishNavItems;
  const currentActiveId = activeCurriculum === 'hebrew' ? currentHebrewMode : currentJewishMode;

  return (
    <>
      {/* Top Header: Brand Title, Curriculum Switcher, Star Counter */}
      <header
        className={`relative z-20 border-b shadow-xs transition-colors duration-300 ${
          isCatchMode
            ? 'bg-[#082e1c]/95 border-emerald-800/90 text-emerald-100 backdrop-blur-md'
            : isDownloadsMode
            ? 'bg-white border-stone-200'
            : isHebrewSelected
            ? 'bg-white border-amber-200/80'
            : 'bg-sky-100/85 border-sky-300/80'
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* App Title wordmark / CATCH AND TRAIN logo with badges */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                soundManager.speakHebrew("ברוכים הבאים לכיתה של החזן יעקב!");
                onSelectCurriculum('hebrew');
                if (currentHebrewMode === 'catch') {
                  onSelectHebrewMode('explorer');
                }
              }}
              className="text-left font-black transition-colors tracking-tight cursor-pointer flex items-center gap-2 shrink-0"
            >
              {isCatchMode ? (
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src="/catch-and-train-logo.webp"
                    alt="CATCH AND TRAIN Logo"
                    className="h-8 sm:h-10 w-auto object-contain shrink-0"
                  />
                  {devModeEnabled && (
                    <span className="px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold tracking-wider uppercase rounded-md shadow-2xs bg-amber-500 text-white select-none inline-block align-middle not-italic shrink-0">
                      🔧 DEV
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col justify-center shrink-0">
                  <span
                    className={`text-xs sm:text-base font-black leading-tight bg-clip-text text-transparent transition-all duration-300 bg-gradient-to-r from-amber-600 to-amber-700`}
                  >
                    Cantor Yakov’s
                  </span>
                  <span
                    className={`text-xs sm:text-base font-black leading-tight bg-clip-text text-transparent transition-all duration-300 flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700`}
                  >
                    Classroom
                    {devModeEnabled && (
                      <span className="px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold tracking-wider uppercase rounded-md shadow-2xs bg-amber-500 text-white select-none inline-block align-middle not-italic">
                        🔧 DEV
                      </span>
                    )}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Curriculum Switcher Segmented Toggle */}
          <div
            className={`relative p-1 rounded-2xl border grid grid-cols-2 gap-1 w-52 sm:w-64 shadow-2xs transition-colors duration-300 ${
              isCatchMode
                ? 'bg-[#051c11]/80 border-emerald-700/80'
                : isDownloadsMode
                ? 'bg-stone-100 border-stone-200'
                : isHebrewSelected
                ? 'bg-amber-100/80 border-amber-200'
                : 'bg-sky-200/70 border-sky-300'
            }`}
          >
            {/* Sliding Active Pill - Hidden in Catch mode and Downloads mode */}
            {!isCatchMode && !isDownloadsMode && (
              <div
                className={`absolute top-1 bottom-1 curriculum-pill-transition rounded-xl shadow-sm z-0 ${
                  isHebrewSelected
                    ? 'left-1 w-[calc(50%-4px)] bg-amber-500'
                    : 'left-[calc(50%+2px)] w-[calc(50%-4px)] bg-sky-600'
                }`}
              />
            )}

            <button
              type="button"
              onClick={() => {
                soundManager.speakEnglish('Hebrew');
                onSelectCurriculum('hebrew');
                if (currentHebrewMode === 'catch') {
                  onSelectHebrewMode('explorer');
                }
              }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-colors duration-300 cursor-pointer flex items-center justify-center gap-1.5 relative z-10 select-none ${
                isCatchMode
                  ? 'text-emerald-200 hover:text-white font-bold'
                  : isDownloadsMode
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 font-bold'
                  : isHebrewSelected
                  ? 'text-white'
                  : 'text-amber-950/80 hover:text-amber-950 font-bold'
              }`}
            >
              <span className="transition-transform duration-200 hover:scale-110">📖</span>
              <span>Hebrew</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.speakEnglish('Jewish Studies');
                onSelectCurriculum('jewish_studies');
              }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-colors duration-300 cursor-pointer flex items-center justify-center gap-1.5 relative z-10 select-none ${
                isCatchMode
                  ? 'text-emerald-300/70 hover:text-emerald-100 font-bold'
                  : isDownloadsMode
                  ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 font-bold'
                  : isJewishSelected
                  ? 'text-white'
                  : 'text-amber-950/80 hover:text-amber-950 font-bold'
              }`}
            >
              <span className="transition-transform duration-200 hover:scale-110">✡️</span>
              <span>Jewish Studies</span>
            </button>
          </div>

          {/* Alef-Ball CATCH Link Button in Top Bar */}
          <button
            type="button"
            onClick={() => {
              if (isCatchMode) {
                soundManager.playPop();
                window.dispatchEvent(new CustomEvent('alefbet_catch_tab_clicked'));
              } else {
                onOpenCatch();
              }
            }}
            title="Open Alef-Bet CATCH AND TRAIN & Alef-Dex"
            aria-label="Open CATCH AND TRAIN Game and Alef-Dex"
            className={`relative group flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-2xl active:scale-95 transition-all cursor-pointer select-none shrink-0 ${
              isCatchMode
                ? 'bg-emerald-800/90 ring-2 ring-emerald-400 shadow-md'
                : 'hover:bg-amber-100/60'
            }`}
          >
            <div className="relative animate-bounce-wiggle">
              <AlefBallIcon className="w-8 h-8 sm:w-9 sm:h-9 filter drop-shadow-md transition-transform group-hover:scale-110" />
            </div>
            <div
              style={{ fontWeight: 400 }}
              className={`text-[10px] sm:text-[11px] font-normal tracking-tight px-1.5 py-0.2 rounded-full shadow-2xs leading-none -mt-1 z-10 whitespace-nowrap ${
                isCatchMode
                  ? 'text-white bg-emerald-600 border border-emerald-400'
                  : 'text-amber-950 bg-amber-200/90 border border-amber-300/90'
              }`}
            >
              {totalCaught} / {TOTAL_ENTITIES_COUNT}
            </div>
          </button>
        </div>
      </header>

      {/* Dynamic Navigation Menu: Fixed at bottom - Hidden in Catch Mode & Downloads Mode */}
      {!isCatchMode && !isDownloadsMode && (
        <nav
          className={`fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg px-2 sm:px-4 py-1.5 sm:py-2 transition-transform duration-300 ease-in-out ${
            isNavCollapsed ? 'translate-y-full' : 'translate-y-0'
          } ${
            isHebrewSelected
              ? 'bg-white border-amber-200'
              : 'bg-sky-100 border-sky-300'
          }`}
          style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label="App Navigation"
        >
          {/* Collapse/Expand Toggle Arrow Tab Button */}
          <button
            type="button"
            onClick={toggleNavCollapse}
            aria-label={isNavCollapsed ? 'Expand navigation bar' : 'Collapse navigation bar'}
            title={isNavCollapsed ? 'Expand Navigation Bar' : 'Collapse Navigation Bar'}
            className={`absolute right-2 sm:right-4 -top-7 sm:-top-8 h-7 sm:h-8 px-3.5 sm:px-4 rounded-t-xl border-t border-x flex items-center justify-center gap-1 cursor-pointer select-none shadow-md transition-all active:scale-95 z-50 ${
              isHebrewSelected
                ? 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                : 'bg-sky-100 border-sky-300 text-sky-950 hover:bg-sky-200'
            }`}
          >
            {isNavCollapsed ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-amber-700 animate-bounce" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            )}
          </button>
          <div
            key={activeCurriculum}
            className={`max-w-lg sm:max-w-2xl mx-auto flex items-center justify-around gap-0.5 sm:gap-2 ${
              isHebrewSelected ? 'animate-slide-from-left' : 'animate-slide-from-right'
            }`}
          >
            {currentNavItems.map((item) => {
              const isActive = currentActiveId === item.id;
              const isLocked = activeCurriculum === 'hebrew' && item.isUnlocked === false;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (activeCurriculum === 'hebrew') {
                      if (isLocked) {
                        if (item.isBuildLock && onBuildLockedTabClick) {
                          onBuildLockedTabClick();
                          return;
                        }
                        if (onLockedTabClick) {
                          onLockedTabClick(item.id, item.lockMsg || '', item.currentVal || 0, item.totalReq || 22);
                        }
                        return;
                      }
                      if (item.id === 'catch') {
                        window.dispatchEvent(new CustomEvent('alefbet_catch_tab_clicked'));
                      } else if (item.id === 'build') {
                        soundManager.speakEnglish('Build');
                      } else if (item.id === 'tracing') {
                        soundManager.speakTraceLetterPrompt(currentLetter?.letter || 'א');
                      } else if (item.id === 'coloring') {
                        soundManager.speakColorLetterPrompt(currentLetter?.letter || 'א');
                      }
                      onSelectHebrewMode(item.id as GameMode);
                    } else {
                      if (item.id === 'torah') {
                        soundManager.speakHebrew("תַּנָךְ");
                      } else if (item.id === 'mitzvot') {
                        soundManager.speakHebrew("מִצְווֹת");
                      } else {
                        soundManager.speakEnglish(item.label);
                      }
                      onSelectJewishMode(item.id as JewishStudiesMode);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 sm:px-3 rounded-2xl transition-all cursor-pointer relative min-h-[50px] sm:min-h-[54px] active:scale-95 ${
                    isLocked
                      ? 'opacity-80 bg-slate-100/60 text-slate-400 font-semibold hover:bg-slate-200/60'
                      : isActive
                      ? isHebrewSelected
                        ? 'text-amber-800 font-bold'
                        : 'text-sky-950 font-bold'
                      : isHebrewSelected
                      ? 'text-slate-500 font-semibold hover:text-slate-800 hover:bg-amber-50/50'
                      : 'text-sky-900/70 font-semibold hover:text-sky-950 hover:bg-sky-200/50'
                  }`}
                >
                  {isActive && !isLocked && (
                    <div
                      className={`absolute inset-0 rounded-2xl -z-10 shadow-2xs border animate-pop-burst ${
                        isHebrewSelected
                          ? 'bg-amber-100/90 border-amber-300/80'
                          : 'bg-sky-200/90 border-sky-300/90'
                      }`}
                    />
                  )}
                  <span className="text-xl sm:text-2xl leading-none mb-0.5 flex items-center justify-center min-h-[26px] relative">
                    {item.icon}
                    {isLocked && (
                      <span className="absolute -top-1 -right-2 text-[10px] sm:text-xs bg-slate-800 text-amber-300 px-1 py-0.2 rounded-full shadow-xs border border-amber-400/60 leading-none">
                        🔒
                      </span>
                    )}
                  </span>
                  <span className="text-xs sm:text-sm tracking-tight font-bold">{item.label}</span>
                  {activeCurriculum === 'hebrew' && (
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none mt-0.5 shadow-2xs whitespace-nowrap ${
                      isLocked
                        ? 'text-slate-600 bg-slate-200/90 border border-slate-300'
                        : 'text-amber-800 bg-amber-100/90 border border-amber-300/60'
                    }`}>
                      {isLocked ? (
                        '🔒 Locked'
                      ) : (
                        <>
                          {item.id === 'explorer' && `${exploredCount ?? 0} / ${exploreDenominator ?? 145}`}
                          {item.id === 'tracing' && `${tracedCount ?? 0} / 27`}
                          {item.id === 'coloring' && `${coloredCount ?? 0} / 27`}
                          {item.id === 'balloons' && `${popScore ?? 0} pts`}
                          {item.id === 'match' && `${matchScore ?? 0} pts`}
                          {item.id === 'build' && `${sentenceCount ?? 0}`}
                        </>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
