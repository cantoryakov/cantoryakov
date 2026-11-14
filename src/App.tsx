/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Curriculum, DownloadsTab, GameMode, JewishStudiesMode, LetterData, UserProgress } from './types';
import { ALEFBET_LETTERS, ALL_LETTERS } from './data/alefbet';
import { getAllDictionaryWords } from './data/dictionary';
import { Navbar } from './components/Navbar';
import { LetterExplorer } from './components/LetterExplorer';
import { TracingCanvas } from './components/TracingCanvas';
import { ColoringBook } from './components/ColoringBook';
import { MatchGame, MatchSubMode } from './components/MatchGame';
import { BalloonPopper, PopperTheme } from './components/BalloonPopper';
import { CatchGame } from './components/CatchGame';
import { SentenceBuilder } from './components/SentenceBuilder';
import { HolidaysModule } from './components/JewishStudies/HolidaysModule';
import { TorahModule } from './components/JewishStudies/TorahModule';
import { HeroesModule } from './components/JewishStudies/HeroesModule';
import { BlessingsModule } from './components/JewishStudies/BlessingsModule';
import { MitzvotModule } from './components/JewishStudies/MitzvotModule';
import { IsraelModule } from './components/JewishStudies/IsraelModule';
import { DownloadsSection } from './components/DownloadsSection';
import { YouTubeModal } from './components/YouTubeModal';
import { CatchStarterModal } from './components/CatchStarterModal';
import { RetroIntro } from './components/RetroIntro';
import { DevModeModal } from './components/DevModeModal';
import { LockedTabBanner } from './components/LockedTabBanner';
import { BuildLockModal } from './components/BuildLockModal';
import { soundManager } from './utils/audio';
import { setChiptuneMuted, stopAllAudio } from './utils/chiptuneAudio';
import { preloadAllAppImages } from './utils/imagePreloader';

import { parseCurrentRoute, buildUrlForState, pushRouteUrl, getLetterByIdOrSlug } from './utils/router';
import { CATCH_HEROES, CATCH_VILLAINS, CATCH_HOLIDAYS, CATCH_KOSHER_FOODS } from './data/catchHeroes';

const STORAGE_KEY = 'cantor_yakov_alefbet_progress_v2';
const DRILL_LETTERS_STORAGE_KEY = 'cantor_yakov_alefbet_drill_letters';
const CATCH_INTRO_SEEN_KEY = 'cantor_yakov_alefbet_intro_seen_v1';

// Helper to pick two distinct random starter letters for Catch mode
const getRandomStarterLetterIds = (): string[] => {
  const shuffled = [...ALEFBET_LETTERS].sort(() => 0.5 - Math.random());
  return [shuffled[0].id, shuffled[1].id];
};

export default function App() {
  const initialRoute = parseCurrentRoute();

  const [activeCurriculum, setActiveCurriculum] = useState<Curriculum>(initialRoute.curriculum);
  const [currentHebrewMode, setCurrentHebrewMode] = useState<GameMode>(initialRoute.hebrewMode || 'explorer');
  const [currentJewishMode, setCurrentJewishMode] = useState<JewishStudiesMode>(initialRoute.jewishMode || 'holidays');
  const [activeDownloadsTab, setActiveDownloadsTab] = useState<DownloadsTab>(initialRoute.downloadsTab || 'welcome');
  const [currentLetter, setCurrentLetter] = useState<LetterData>(() => {
    if (initialRoute.letterId) {
      const found = getLetterByIdOrSlug(initialRoute.letterId);
      if (found) return found;
    }
    return ALEFBET_LETTERS[0];
  });
  const [activeParashaSlug, setActiveParashaSlug] = useState<string | undefined>(initialRoute.parashaSlug);
  const [activeHeroId, setActiveHeroId] = useState<string | undefined>(initialRoute.heroId);
  const [activeHolidayId, setActiveHolidayId] = useState<string | undefined>(initialRoute.holidayId);

  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isResetStarsModalOpen, setIsResetStarsModalOpen] = useState<boolean>(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('Njv3SsfLVEw');
  const [bgRipple, setBgRipple] = useState<{ active: boolean; type: Curriculum }>({ active: false, type: 'hebrew' });
  const [showRetroIntro, setShowRetroIntro] = useState<boolean>(false);
  const [introKey, setIntroKey] = useState<number>(0);

  const [devModeEnabled, setDevModeEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cantor_yakov_dev_mode') === 'true';
    }
    return false;
  });
  const [isDevModeModalOpen, setIsDevModeModalOpen] = useState<boolean>(false);
  const [isBuildLockModalOpen, setIsBuildLockModalOpen] = useState<boolean>(false);
  const [lockedBannerInfo, setLockedBannerInfo] = useState<{
    message: string;
    currentCount: number;
    totalRequired: number;
  } | null>(null);

  const handleToggleDevMode = (enabled: boolean) => {
    setDevModeEnabled(enabled);
    if (enabled) {
      setShowRetroIntro(false);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cantor_yakov_dev_mode', enabled ? 'true' : 'false');
    }
  };

  useEffect(() => {
    const handleDevModeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        handleToggleDevMode(customEvent.detail);
      }
    };
    window.addEventListener('alefbet_dev_mode_changed', handleDevModeEvent);
    return () => window.removeEventListener('alefbet_dev_mode_changed', handleDevModeEvent);
  }, []);

  
  const handleReplayIntro = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    soundManager.stopAllAudio();
    stopAllAudio();
    soundManager.setMuted(false);
    setChiptuneMuted(false);
    setIsMuted(false);
    setIntroKey((prev) => prev + 1);
    setShowRetroIntro(true);
  }, []);

  // Listen for custom event to replay retro intro
  useEffect(() => {
    const handleReplay = () => handleReplayIntro();
    window.addEventListener('alefbet_replay_intro', handleReplay);
    return () => window.removeEventListener('alefbet_replay_intro', handleReplay);
  }, [handleReplayIntro]);

  // Sync state to URL bar on navigation
  useEffect(() => {
    const targetUrl = buildUrlForState({
      curriculum: activeCurriculum,
      hebrewMode: currentHebrewMode,
      jewishMode: currentJewishMode,
      downloadsTab: activeDownloadsTab,
      letterId: currentLetter.id,
      parashaSlug: activeParashaSlug,
      heroId: activeHeroId,
      holidayId: activeHolidayId,
    });
    pushRouteUrl(targetUrl);
  }, [activeCurriculum, currentHebrewMode, currentJewishMode, activeDownloadsTab, currentLetter.id, activeParashaSlug, activeHeroId, activeHolidayId]);

  // Listen to browser Back/Forward or direct hash changes
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setActiveCurriculum(route.curriculum);
      if (route.hebrewMode) setCurrentHebrewMode(route.hebrewMode);
      if (route.jewishMode) setCurrentJewishMode(route.jewishMode);
      if (route.downloadsTab) {
        setActiveDownloadsTab(route.downloadsTab);
      } else if (route.curriculum === 'downloads') {
        setActiveDownloadsTab('welcome');
      }
      if (route.letterId) {
        const found = getLetterByIdOrSlug(route.letterId);
        if (found) setCurrentLetter(found);
      }
      if (route.parashaSlug) setActiveParashaSlug(route.parashaSlug);
      if (route.heroId) setActiveHeroId(route.heroId);
      if (route.holidayId) setActiveHolidayId(route.holidayId);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Listen for ESC to close and ENTER to confirm Reset Everything modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isResetStarsModalOpen) return;
      if (e.key === 'Escape') {
        setIsResetStarsModalOpen(false);
      } else if (e.key === 'Enter') {
        handleConfirmResetStars();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetStarsModalOpen]);

  const handleNavigateToParasha = (parashaSlug: string) => {
    setActiveCurriculum('jewish_studies');
    setCurrentJewishMode('torah');
    setActiveParashaSlug(parashaSlug);
    soundManager.playPop();
  };

  const handleNavigateToHero = (heroId: string) => {
    setActiveCurriculum('jewish_studies');
    setCurrentJewishMode('heroes');
    setActiveHeroId(heroId);
    soundManager.playPop();
  };

  // Trigger smooth background ripple on curriculum switch
  useEffect(() => {
    if (activeCurriculum === 'downloads') {
      setBgRipple((prev) => ({ ...prev, active: false }));
      return;
    }
    setBgRipple({ active: true, type: activeCurriculum });
    const timer = setTimeout(() => {
      setBgRipple((prev) => ({ ...prev, active: false }));
    }, 650);
    return () => clearTimeout(timer);
  }, [activeCurriculum]);

  // Shared letter drill selection across Match and Pop modes (defaults to 22 core letters on app launch)
  const [drillLetterIds, setDrillLetterIds] = useState<Set<string>>(() => {
    return new Set(ALEFBET_LETTERS.map((l) => l.id));
  });

  // Question modes for Match Game (defaults to 'audio_to_letter' when locked or initializing default settings for a new user/session)
  const [matchModes, setMatchModes] = useState<Set<MatchSubMode>>(
    () => new Set<MatchSubMode>(['audio_to_letter'])
  );

  // Game styles for Pop Game (always defaults to all 4 enabled on each session)
  const [popStyles, setPopStyles] = useState<Set<PopperTheme>>(
    () => new Set<PopperTheme>(['balloons', 'butterflies', 'cars', 'invasion'])
  );

  // Clean up legacy localStorage entries for transient game settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cantor_yakov_alefbet_match_modes');
      localStorage.removeItem('cantor_yakov_alefbet_pop_styles');
      localStorage.removeItem(DRILL_LETTERS_STORAGE_KEY);
    }
  }, []);

  // Sync drill letters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRILL_LETTERS_STORAGE_KEY, JSON.stringify(Array.from(drillLetterIds)));
    }
  }, [drillLetterIds]);

  const [isCatchStarterModalOpen, setIsCatchStarterModalOpen] = useState<boolean>(false);

  // Permanent milestone flag: once student completes all 22 base letters, curriculum stays unlocked forever
  const [hasUnlockedFullCurriculum, setHasUnlockedFullCurriculum] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('hasUnlockedFullCurriculum') === 'true') {
        return true;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.hasUnlockedFullCurriculum) return true;
          if (parsed.exploredLetters && parsed.exploredLetters.length >= 22) return true;
        } catch {}
      }
      const legacyExplored = localStorage.getItem('exploredLetters');
      if (legacyExplored) {
        try {
          const arr = JSON.parse(legacyExplored);
          const count = ALEFBET_LETTERS.filter((l) => arr.includes(l.id)).length;
          if (count >= 22) return true;
        } catch {}
      }
    }
    return false;
  });

  // User progress state with localStorage persistence
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed.caughtLetterIds) {
            parsed.caughtLetterIds = [];
          }
          if (!parsed.caughtHeroIds) {
            parsed.caughtHeroIds = [];
          }
          if (!parsed.caughtVillainIds) {
            parsed.caughtVillainIds = [];
          }
          if (!parsed.caughtHolidayIds) {
            parsed.caughtHolidayIds = [];
          }
          if (!parsed.caughtKosherFoodIds) {
            parsed.caughtKosherFoodIds = [];
          }
          if (!parsed.coloredLetters) {
            parsed.coloredLetters = [];
          }
          return {
            ...parsed,
            hasUnlockedFullCurriculum: parsed.hasUnlockedFullCurriculum || false,
            // Daily checkmarks strictly start empty on fresh session / refresh
            exploredLetters: [],
            exploredWords: [],
            exploredCategories: [],
          };
        } catch {
          // fallback
        }
      }
    }
    return {
      hasUnlockedFullCurriculum: false,
      exploredLetters: [],
      tracedLetters: [],
      coloredLetters: [],
      balloonsPopped: 0,
      popDollars: 0,
      userName: '',
      caughtLetterIds: [],
      caughtHeroIds: [],
      caughtVillainIds: [],
      caughtHolidayIds: [],
      caughtKosherFoodIds: [],
    };
  });

  const totalCaught = devModeEnabled
    ? (ALL_LETTERS.length + CATCH_HEROES.length + CATCH_VILLAINS.length + CATCH_HOLIDAYS.length + CATCH_KOSHER_FOODS.length)
    : ((progress.caughtLetterIds?.length || 0) +
       (progress.caughtHeroIds?.length || 0) +
       (progress.caughtVillainIds?.length || 0) +
       (progress.caughtHolidayIds?.length || 0) +
       (progress.caughtKosherFoodIds?.length || 0));

  const handleOpenCatch = () => {
    soundManager.playPop();
    const hasSeenIntro =
      devModeEnabled || (typeof window !== 'undefined' && localStorage.getItem(CATCH_INTRO_SEEN_KEY) === 'true');

    // Rule 1A: When Alefdex count is 0 OR intro not seen, play intro cutscene (unless Dev Mode is ON)
    if (!devModeEnabled && (totalCaught === 0 || !hasSeenIntro)) {
      handleReplayIntro();
      return;
    }

    if (activeCurriculum === 'hebrew' && currentHebrewMode === 'catch') {
      window.dispatchEvent(new CustomEvent('alefbet_catch_tab_clicked'));
      return;
    }
    setActiveCurriculum('hebrew');
    setCurrentHebrewMode('catch');
  };

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CATCH_INTRO_SEEN_KEY, 'true');
      localStorage.setItem('hasSeenIntro', 'true');
      localStorage.setItem('hasSeenCatchAndTrainIntro', 'true');
    }
    setShowRetroIntro(false);
    setActiveCurriculum('hebrew');
    setCurrentHebrewMode('catch');
    if (totalCaught === 0) {
      setIsCatchStarterModalOpen(true);
    }
  };

  const handleClaimCatchStarters = (starterIds: string[]) => {
    setProgress((prev) => ({
      ...prev,
      caughtLetterIds: starterIds,
    }));
    setActiveCurriculum('hebrew');
    setCurrentHebrewMode('catch');
  };

  const [traceResetCounter, setTraceResetCounter] = useState(0);

  const handleUnlockFullCurriculum = () => {
    setHasUnlockedFullCurriculum(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasUnlockedFullCurriculum', 'true');
    }
    setProgress((prev) => ({
      ...prev,
      hasUnlockedFullCurriculum: true,
    }));
  };

  // Sync progress to localStorage (excluding volatile daily EXPLORE checkmarks, preserving permanent milestone)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProgress = {
        ...progress,
        hasUnlockedFullCurriculum,
        exploredLetters: [],
        exploredWords: [],
        exploredCategories: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
      if (hasUnlockedFullCurriculum) {
        localStorage.setItem('hasUnlockedFullCurriculum', 'true');
      }
    }
  }, [progress, hasUnlockedFullCurriculum]);

  // Preload all app images (POP backgrounds, vocabulary icons, etc.) on home page open
  useEffect(() => {
    preloadAllAppImages();
  }, []);

  // Unlock Web Audio context on first mobile tap/click
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.unlockAudio();
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('touchend', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Global listener: hide cursor on tap or click, restore on actual mouse/trackpad movement
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      document.documentElement.classList.add('hide-cursor');
      document.body.classList.add('hide-cursor');
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Check if actual movement occurred (ignore zero-delta or synthetic jitter during click)
      if (lastX !== null && lastY !== null) {
        const deltaX = Math.abs(e.clientX - lastX);
        const deltaY = Math.abs(e.clientY - lastY);
        if (deltaX < 2 && deltaY < 2) {
          return;
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
      document.documentElement.classList.remove('hide-cursor');
      document.body.classList.remove('hide-cursor');
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('mousedown', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('mousedown', handlePointerDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.documentElement.classList.remove('hide-cursor');
      document.body.classList.remove('hide-cursor');
    };
  }, []);

  // Mark letter as explored (volatile for today's session)
  const handleLetterExplored = (letterId: string) => {
    setProgress((prev) => {
      if (prev.exploredLetters.includes(letterId)) return prev;
      const nextExplored = [...prev.exploredLetters, letterId];
      const coreCount = ALEFBET_LETTERS.filter((l) => nextExplored.includes(l.id)).length;
      if (coreCount >= 22 && !hasUnlockedFullCurriculum) {
        handleUnlockFullCurriculum();
      }
      return {
        ...prev,
        exploredLetters: nextExplored,
      };
    });
  };

  const handleWordExplored = (wordEn: string) => {
    setProgress((prev) => {
      const words = prev.exploredWords || [];
      if (words.includes(wordEn)) return prev;
      return {
        ...prev,
        exploredWords: [...words, wordEn],
      };
    });
  };

  const handleCategoryExplored = (catKey: string) => {
    setProgress((prev) => {
      const cats = prev.exploredCategories || [];
      if (cats.includes(catKey)) return prev;
      return {
        ...prev,
        exploredCategories: [...cats, catKey],
      };
    });
  };

  // Mark letter as traced
  const handleLetterTraced = (letterId: string) => {
    setProgress((prev) => {
      const already = prev.tracedLetters.includes(letterId);
      if (already) return prev;
      return {
        ...prev,
        tracedLetters: [...prev.tracedLetters, letterId],
      };
    });
  };

  // Mark letter as colored
  const handleLetterColored = (letterId: string) => {
    setProgress((prev) => {
      const colored = prev.coloredLetters || [];
      if (colored.includes(letterId)) return prev;
      return {
        ...prev,
        coloredLetters: [...colored, letterId],
      };
    });
  };

  // Mark letter as uncolored or cleared
  const handleLetterCleared = (letterId: string) => {
    setProgress((prev) => {
      const colored = prev.coloredLetters || [];
      if (!colored.includes(letterId)) return prev;
      return {
        ...prev,
        coloredLetters: colored.filter((id) => id !== letterId),
      };
    });
  };

  const handleUpdateMatchScore = (updater: number | ((prev: number) => number)) => {
    setProgress((prev) => {
      const current = prev.matchScore || 0;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, matchScore: next };
    });
  };

  const exploreDenominator = React.useMemo(() => {
    const dictWords = getAllDictionaryWords();
    const uniqueWordsCount = dictWords.length;
    const lettersCount = ALL_LETTERS.length; // 27
    const categoriesCount = 18; // 17 specific categories + 'all' = 18
    return uniqueWordsCount + lettersCount + categoriesCount;
  }, []);

  const exploredCount = 
    new Set(progress.exploredLetters || []).size +
    new Set(progress.exploredCategories || []).size +
    new Set(progress.exploredWords || []).size;
  const tracedCount = progress.tracedLetters?.length || 0;
  const coloredCount = progress.coloredLetters?.length || 0;
  const matchScore = progress.matchScore || 0;
  const popScore = progress.popScore || progress.balloonsPopped || progress.popDollars || 0;

  const coreLettersExplored = ALEFBET_LETTERS.filter((l) =>
    progress.exploredLetters?.includes(l.id)
  ).length;

  const isExploreUnlocked = devModeEnabled || hasUnlockedFullCurriculum;
  const displayedExploreCount = isExploreUnlocked ? exploredCount : coreLettersExplored;
  const displayedExploreDenominator = isExploreUnlocked ? exploreDenominator : 22;

  const coreLettersTraced = ALEFBET_LETTERS.filter((l) =>
    progress.tracedLetters?.includes(l.id)
  ).length;

  const coreLettersColored = ALEFBET_LETTERS.filter((l) =>
    progress.coloredLetters?.includes(l.id)
  ).length;

  const currentMatchScore = progress.matchScore || 0;
  const currentPopScore = progress.popScore || progress.balloonsPopped || progress.popDollars || 0;

  const checkModeUnlocked = (
    mode: GameMode
  ): { unlocked: boolean; message: string; current: number; total: number; isBuildLock?: boolean } => {
    if (devModeEnabled || mode === 'explorer' || mode === 'catch') {
      return { unlocked: true, message: '', current: 0, total: 22 };
    }
    if (mode === 'tracing' || mode === 'coloring' || mode === 'match' || mode === 'balloons') {
      const unlocked = devModeEnabled || hasUnlockedFullCurriculum;
      return {
        unlocked,
        message: 'Explore all 22 letters to unlock Trace, Color, Match, and Pop!',
        current: coreLettersExplored,
        total: 22,
      };
    }
    if (mode === 'build') {
      const unlocked =
        devModeEnabled ||
        (hasUnlockedFullCurriculum &&
          coreLettersTraced >= 22 &&
          coreLettersColored >= 22 &&
          currentMatchScore >= 10 &&
          currentPopScore >= 10);
      return {
        unlocked,
        message: 'Complete all 5 Capstone Achievements to unlock Build!',
        current: 0,
        total: 5,
        isBuildLock: true,
      };
    }
    return { unlocked: true, message: '', current: 0, total: 22 };
  };

  // Ensure active mode is unlocked on route or state changes
  useEffect(() => {
    if (activeCurriculum === 'hebrew' && !devModeEnabled) {
      const { unlocked } = checkModeUnlocked(currentHebrewMode);
      if (!unlocked) {
        setCurrentHebrewMode('explorer');
      }
    }
  }, [
    activeCurriculum,
    currentHebrewMode,
    devModeEnabled,
    hasUnlockedFullCurriculum,
    coreLettersTraced,
    coreLettersColored,
    currentMatchScore,
    currentPopScore,
  ]);

  const handleUpdateName = (name: string) => {
    setProgress((prev) => ({ ...prev, userName: name }));
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleGoToTracing = (letter: LetterData) => {
    const { unlocked, message, current, total } = checkModeUnlocked('tracing');
    if (!unlocked) {
      setLockedBannerInfo({
        message,
        currentCount: current,
        totalRequired: total,
      });
      return;
    }
    setCurrentLetter(letter);
    setActiveCurriculum('hebrew');
    setCurrentHebrewMode('tracing');
    soundManager.playPop();
    soundManager.speakTraceLetterPrompt(letter.letter);
  };

  const handleConfirmResetStars = () => {
    const wasInCatchMode = isCatchMode;

    // Forcefully disable Dev Mode on reset
    setDevModeEnabled(false);
    setHasUnlockedFullCurriculum(false);

    setProgress((prev) => {
      const resetProgress = {
        ...prev,
        hasUnlockedFullCurriculum: false,
        exploredLetters: [],
        exploredWords: [],
        exploredCategories: [],
        tracedLetters: [],
        coloredLetters: [],
        matchScore: 0,
        popScore: 0,
        balloonsPopped: 0,
        popDollars: 0,
        caughtLetterIds: [],
        caughtHeroIds: [],
        caughtVillainIds: [],
        caughtHolidayIds: [],
        caughtKosherFoodIds: [],
        savedSentences: [],
      };
      if (typeof window !== 'undefined') {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resetProgress));
        localStorage.setItem('hasUnlockedFullCurriculum', 'false');
        localStorage.removeItem('hasUnlockedFullCurriculum');
        localStorage.setItem('cantor_yakov_dev_mode', 'false');
        localStorage.removeItem('cantor_yakov_dev_mode');
        localStorage.removeItem('devModeEnabled');
        localStorage.removeItem('devMode');
        localStorage.removeItem(CATCH_INTRO_SEEN_KEY);
        localStorage.removeItem('hasSeenIntro');
        localStorage.removeItem('hasSeenCatchAndTrainIntro');
        window.dispatchEvent(new CustomEvent('alefbet_reset_everything'));
      }
      return resetProgress;
    });
    setTraceResetCounter((c) => c + 1);
    soundManager.playRecycleSweep();
    setIsResetStarsModalOpen(false);
    setIsCatchStarterModalOpen(false);

    if (currentHebrewMode !== 'explorer' && currentHebrewMode !== 'catch') {
      setCurrentHebrewMode('explorer');
    }

    // Cancel any ongoing voice narration or speech synthesis immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (wasInCatchMode) {
      // Replay intro cutscene when resetting from inside Catch & Train
      handleReplayIntro();
    } else {
      // Silently reset without playing intro when resetting from other screens
      setShowRetroIntro(false);
    }
  };

  const isCatchMode = activeCurriculum === 'hebrew' && currentHebrewMode === 'catch';
  const isDownloadsMode = activeCurriculum === 'downloads';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        isCatchMode
          ? 'bg-[#062417] text-emerald-100'
          : isDownloadsMode
          ? 'bg-white text-stone-900'
          : activeCurriculum === 'hebrew'
          ? 'bg-amber-50/40 text-slate-800'
          : 'bg-sky-50/40 text-slate-800'
      }`}
    >
      {/* Background Transition Ripple Wave Overlay */}
      {bgRipple.active && !isCatchMode && !isDownloadsMode && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-clip">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] rounded-full -translate-y-1/2 animate-bg-pulse-ripple ${
              bgRipple.type === 'hebrew'
                ? 'bg-gradient-to-b from-amber-400/20 via-amber-200/5 to-transparent'
                : 'bg-gradient-to-b from-sky-400/25 via-sky-200/5 to-transparent'
            }`}
          />
        </div>
      )}

      {/* Top Header & Dynamic Bottom Bar Navbar */}
      <Navbar
        activeCurriculum={activeCurriculum}
        onSelectCurriculum={(curriculum) => {
          setActiveCurriculum(curriculum);
          soundManager.playPop();
        }}
        currentHebrewMode={currentHebrewMode}
        onSelectHebrewMode={(mode) => {
          const { unlocked, message, current, total, isBuildLock } = checkModeUnlocked(mode);
          if (!unlocked) {
            if (isBuildLock) {
              setIsBuildLockModalOpen(true);
            } else {
              setLockedBannerInfo({
                message,
                currentCount: current,
                totalRequired: total,
              });
            }
            return;
          }
          setCurrentHebrewMode(mode);
          soundManager.playPop();
        }}
        currentJewishMode={currentJewishMode}
        onSelectJewishMode={(mode) => {
          setCurrentJewishMode(mode);
          soundManager.playPop();
        }}
        currentLetter={currentLetter}
        totalCaught={totalCaught}
        onOpenCatch={handleOpenCatch}
        exploredCount={displayedExploreCount}
        exploreDenominator={displayedExploreDenominator}
        tracedCount={tracedCount}
        coloredCount={coloredCount}
        matchScore={matchScore}
        popScore={popScore}
        sentenceCount={progress.savedSentences?.length || 0}
        devModeEnabled={devModeEnabled}
        hasUnlockedFullCurriculum={hasUnlockedFullCurriculum}
        exploredLetters={progress.exploredLetters}
        tracedLetters={progress.tracedLetters}
        coloredLetters={progress.coloredLetters}
        onBuildLockedTabClick={() => setIsBuildLockModalOpen(true)}
        onLockedTabClick={(_modeId, message, current, total) => {
          setLockedBannerInfo({
            message,
            currentCount: current,
            totalRequired: total,
          });
        }}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 py-4 sm:py-6 ${
          isCatchMode || isDownloadsMode ? 'pb-10 sm:pb-12' : 'pb-24 sm:pb-28'
        }`}
      >
        {/* ================= HEBREW CLASS CURRICULUM ================= */}
        <div className={activeCurriculum === 'hebrew' ? 'block animate-slide-from-left' : 'hidden'}>
          <div className={currentHebrewMode === 'explorer' ? 'block' : 'hidden'}>
            <LetterExplorer
              currentLetter={currentLetter}
              letters={ALEFBET_LETTERS}
              onSelectLetter={(letter) => setCurrentLetter(letter)}
              onGoToTracing={handleGoToTracing}
              onLetterExplored={handleLetterExplored}
              onWordExplored={handleWordExplored}
              onCategoryExplored={handleCategoryExplored}
              exploredLetters={progress.exploredLetters}
              exploredWords={progress.exploredWords}
              exploredCategories={progress.exploredCategories}
              devModeEnabled={devModeEnabled}
              hasUnlockedFullCurriculum={hasUnlockedFullCurriculum}
              onUnlockFullCurriculum={handleUnlockFullCurriculum}
              onOpenVideo={(videoId) => {
                setCurrentVideoId(videoId);
                setIsVideoOpen(true);
              }}
            />
          </div>

          {currentHebrewMode === 'tracing' && (
            <TracingCanvas
              key={`tracing-${traceResetCounter}-${currentLetter.id}`}
              currentLetter={currentLetter}
              letters={ALEFBET_LETTERS}
              onSelectLetter={(letter) => setCurrentLetter(letter)}
              onLetterTraced={handleLetterTraced}
              isAlreadyTraced={progress.tracedLetters.includes(currentLetter.id)}
              tracedLetters={progress.tracedLetters}
              devModeEnabled={devModeEnabled}
            />
          )}

          {currentHebrewMode === 'coloring' && (
            <ColoringBook
              key={`coloring-${traceResetCounter}-${currentLetter.id}`}
              currentLetter={currentLetter}
              letters={ALEFBET_LETTERS}
              onSelectLetter={(letter) => setCurrentLetter(letter)}
              devModeEnabled={devModeEnabled}
coloredLetters={devModeEnabled ? ALEFBET_LETTERS.map(l => l.id) : (progress.coloredLetters || [])}
onLetterColored={handleLetterColored}
onLetterCleared={handleLetterCleared}
            />
          )}

          {/* MATCH GAME: Kept mounted in DOM so score and game state are retained during mode switches */}
          <div className={currentHebrewMode === 'match' ? 'block' : 'hidden'}>
            <MatchGame
              letters={ALEFBET_LETTERS}
              selectedLetterIds={drillLetterIds}
              onUpdateSelectedLetterIds={setDrillLetterIds}
              selectedModes={matchModes}
              onUpdateSelectedModes={setMatchModes}
              matchScore={progress.matchScore || 0}
              onUpdateMatchScore={handleUpdateMatchScore}
              isActive={activeCurriculum === 'hebrew' && currentHebrewMode === 'match'}
              devModeEnabled={devModeEnabled}
            />
          </div>

          {currentHebrewMode === 'balloons' && (
            <BalloonPopper
              letters={ALL_LETTERS}
              score={progress.popDollars || 0}
              onUpdateScore={(updater) => {
                setProgress((prev) => {
                  const current = prev.popDollars || 0;
                  const next = typeof updater === 'function' ? updater(current) : updater;
                  const updated = { ...prev, popDollars: next };
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                  }
                  return updated;
                });
              }}
              selectedLetterIds={drillLetterIds}
              onUpdateSelectedLetterIds={setDrillLetterIds}
              selectedStyles={popStyles}
              onUpdateSelectedStyles={setPopStyles}
            />
          )}

          {/* CATCH RPG: Kept mounted in DOM so ongoing battles retain status during mode switches */}
          <div className={currentHebrewMode === 'catch' ? 'block' : 'hidden'}>
            <CatchGame
              key={`catch-${traceResetCounter}`}
              letters={ALEFBET_LETTERS}
              caughtLetterIds={devModeEnabled ? ALEFBET_LETTERS.map(l => l.id) : (progress.caughtLetterIds || [])}
              onUpdateCaughtLetters={(newIds) => {
                setProgress((prev) => ({
                  ...prev,
                  caughtLetterIds: newIds,
                }));
              }}
              caughtHeroIds={devModeEnabled ? CATCH_HEROES.map(h => h.id) : (progress.caughtHeroIds || [])}
              onUpdateCaughtHeroes={(newIds) => {
                setProgress((prev) => ({
                  ...prev,
                  caughtHeroIds: newIds,
                }));
              }}
              caughtVillainIds={devModeEnabled ? CATCH_VILLAINS.map(v => v.id) : (progress.caughtVillainIds || [])}
              onUpdateCaughtVillains={(newIds) => {
                setProgress((prev) => ({
                  ...prev,
                  caughtVillainIds: newIds,
                }));
              }}
              caughtHolidayIds={devModeEnabled ? CATCH_HOLIDAYS.map(h => h.id) : (progress.caughtHolidayIds || [])}
              onUpdateCaughtHolidays={(newIds) => {
                setProgress((prev) => ({
                  ...prev,
                  caughtHolidayIds: newIds,
                }));
              }}
              caughtKosherFoodIds={devModeEnabled ? CATCH_KOSHER_FOODS.map(f => f.id) : (progress.caughtKosherFoodIds || [])}
              onUpdateCaughtKosherFoods={(newIds) => {
                setProgress((prev) => ({
                  ...prev,
                  caughtKosherFoodIds: newIds,
                }));
              }}
              isActive={activeCurriculum === 'hebrew' && currentHebrewMode === 'catch'}
              onReplayIntro={handleReplayIntro}
              devModeEnabled={devModeEnabled}
              onToggleDevMode={handleToggleDevMode}
            />
          </div>

          {/* BUILD TAB: Kept mounted in DOM so sentence builder state is retained */}
          <div className={currentHebrewMode === 'build' ? 'block' : 'hidden'}>
            <SentenceBuilder
              savedSentences={progress.savedSentences || []}
              onUpdateSavedSentences={(newSentences) => {
                setProgress((prev) => ({
                  ...prev,
                  savedSentences: newSentences,
                }));
              }}
            />
          </div>
        </div>

        {/* ================= JEWISH STUDIES CURRICULUM ================= */}
        <div className={activeCurriculum === 'jewish_studies' ? 'block animate-slide-from-right' : 'hidden'}>
          {currentJewishMode === 'holidays' && (
            <HolidaysModule />
          )}

          {currentJewishMode === 'torah' && (
            <TorahModule
              activeParashaSlug={activeParashaSlug}
              onSelectParashaSlug={(slug) => setActiveParashaSlug(slug)}
              onNavigateToHero={handleNavigateToHero}
            />
          )}

          {currentJewishMode === 'heroes' && (
            <HeroesModule
              activeHeroId={activeHeroId}
              onSelectHeroId={(heroId) => setActiveHeroId(heroId)}
              onNavigateToParasha={handleNavigateToParasha}
            />
          )}

          {currentJewishMode === 'blessings' && (
            <BlessingsModule />
          )}

          {currentJewishMode === 'mitzvot' && (
            <MitzvotModule />
          )}

          {currentJewishMode === 'israel' && (
            <IsraelModule />
          )}
        </div>

        {/* ================= DOWNLOADS SECTION (ADULTS / RESOURCES) ================= */}
        {isDownloadsMode && (
          <div className="animate-curriculum-transition">
            <DownloadsSection
              activeTab={activeDownloadsTab}
              onSelectTab={setActiveDownloadsTab}
            />
          </div>
        )}
      </main>

      <YouTubeModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} videoId={currentVideoId} />


      {/* Clean, Quiet Footer */}
      <footer
        className={`mt-auto py-4 ${
          isCatchMode || isDownloadsMode
            ? 'mb-4 sm:mb-4'
            : 'mb-20 sm:mb-20'
        } border-t transition-colors duration-300 text-center text-xs ${
          isCatchMode
            ? 'border-emerald-800/80 bg-[#051c11]/85 text-emerald-300/80'
            : isDownloadsMode
            ? 'border-stone-200 bg-white text-stone-500'
            : activeCurriculum === 'hebrew'
            ? 'border-amber-200/60 bg-white/70 text-slate-500'
            : 'border-sky-200/60 bg-sky-50/70 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
          <div className="sm:text-left">
            <span className="font-bold">
              ©{' '}
              <a
                href="mailto:yakov.hadash@gmail.com"
                className={
                  isCatchMode
                    ? 'hover:text-emerald-200 transition-colors underline'
                    : 'hover:text-amber-700 transition-colors underline'
                }
              >
                Yakov Hadash
              </a>
            </span>
          </div>

          {!isDownloadsMode && (
            <>
              <div className="flex justify-center">
                <a
                  href="/downloads"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveCurriculum('downloads');
                    setActiveDownloadsTab('welcome');
                    soundManager.playPop();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 text-sm sm:text-base font-bold transition-colors cursor-pointer ${
                    isCatchMode
                      ? 'text-emerald-100 hover:text-white'
                      : 'text-slate-700 hover:text-amber-800'
                  }`}
                >
                  <img
                    src="/downloads.png"
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
                  />
                  <span>Downloads</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                <button
                  onClick={() => setIsResetStarsModalOpen(true)}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Everything</span>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setIsDevModeModalOpen(true)}
                  className={`flex items-center gap-1 font-bold transition-all cursor-pointer rounded-lg px-2 py-0.5 ${
                    devModeEnabled
                      ? 'text-amber-900 bg-amber-200/90 border border-amber-400/80 shadow-2xs hover:bg-amber-300'
                      : isCatchMode
                      ? 'text-emerald-300/80 hover:text-emerald-100 underline'
                      : 'text-slate-500 hover:text-slate-800 underline'
                  }`}
                >
                  <span>{devModeEnabled ? '🔧 Dev Mode (ON)' : 'Dev Mode'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </footer>

      {/* Reset Confirmation Modal Popup */}
      {isResetStarsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border-2 border-amber-200 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">
                Reset everything?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to reset all stars, tracing, and CATCH AND TRAIN progress?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsResetStarsModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                ref={(node) => node?.focus()}
                onClick={handleConfirmResetStars}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starter Onboarding Modal */}
      <CatchStarterModal
        isOpen={isCatchStarterModalOpen}
        onClose={() => setIsCatchStarterModalOpen(false)}
        onClaimStarters={handleClaimCatchStarters}
        letters={ALEFBET_LETTERS}
      />

      {/* Retro 8-bit Style Intro Cinematic Overlay */}
      {showRetroIntro && (
        <RetroIntro key={introKey} onComplete={handleIntroComplete} />
      )}

      {/* Dev Mode Password / Toggle Modal */}
      <DevModeModal
        isOpen={isDevModeModalOpen}
        onClose={() => setIsDevModeModalOpen(false)}
        devModeEnabled={devModeEnabled}
        onToggleDevMode={handleToggleDevMode}
      />

      {/* Build Capstone Lock Progress Modal */}
      <BuildLockModal
        isOpen={isBuildLockModalOpen}
        onClose={() => setIsBuildLockModalOpen(false)}
        coreLettersExplored={coreLettersExplored}
        coreLettersTraced={coreLettersTraced}
        coreLettersColored={coreLettersColored}
        matchScore={currentMatchScore}
        popScore={currentPopScore}
        hasUnlockedFullCurriculum={hasUnlockedFullCurriculum}
      />

      {/* Locked Tab Banner Overlay */}
      {lockedBannerInfo && (
        <LockedTabBanner
          message={lockedBannerInfo.message}
          currentCount={lockedBannerInfo.currentCount}
          totalRequired={lockedBannerInfo.totalRequired}
          onClose={() => setLockedBannerInfo(null)}
        />
      )}
    </div>
  );
}
