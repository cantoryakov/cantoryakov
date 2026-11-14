import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, RefreshCw, Trophy, Shield, Volume2, Search, ArrowRight, CheckCircle2, Train } from 'lucide-react';
import { LetterData, WordExample } from '../types';
import { ALEFBET_LETTERS, SOFIT_LETTERS, ALL_LETTERS } from '../data/alefbet';
import { CATCH_HEROES, CATCH_VILLAINS, CATCH_HOLIDAYS, CATCH_KOSHER_FOODS, CatchHero, getMovesForCatchHero, getAllMovesForCatchHero } from '../data/catchHeroes';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { randomizeSkinTone, renderEmoji } from '../utils/emoji';
import { AlefBallIcon } from './AlefBallIcon';
import { BattlefieldTracer } from './BattlefieldTracer';
import { ISRAEL_RAILWAYS_STATIONS, TrainStation } from '../data/trainStations';
import { setChiptuneMuted } from '../utils/chiptuneAudio';

interface CatchGameProps {
  letters: LetterData[];
  caughtLetterIds: string[];
  onUpdateCaughtLetters: (newIds: string[]) => void;
  caughtHeroIds?: string[];
  onUpdateCaughtHeroes?: (newIds: string[]) => void;
  caughtVillainIds?: string[];
  onUpdateCaughtVillains?: (newIds: string[]) => void;
  caughtHolidayIds?: string[];
  onUpdateCaughtHolidays?: (newIds: string[]) => void;
  caughtKosherFoodIds?: string[];
  onUpdateCaughtKosherFoods?: (newIds: string[]) => void;
  isActive?: boolean;
  onReplayIntro?: () => void;
  devModeEnabled?: boolean;
  onToggleDevMode?: (enabled: boolean) => void;
}

export interface AttackMove {
  wordHe: string;
  spokenHe: string;
  wordEn: string;
  transliteration: string;
  emoji?: string;
  image?: string;
  power: number;
  isHeroMove?: boolean;
  spokenEn?: string;
}

type BattlePhase =
  | 'exploring'
  | 'encounter'
  | 'player_turn'
  | 'player_attacking'
  | 'wild_attacking'
  | 'throwing_ball'
  | 'wiggling'
  | 'caught'
  | 'wild_fainted'
  | 'player_fainted';

export const CATCH_BATTLE_STORAGE_KEY = 'cantor_yakov_catch_battle_session_v1';
export const CATCH_ENTITY_HP_STORAGE_KEY = 'cantor_yakov_catch_entity_hp_v2';
export const CATCH_INITIALIZED_STORAGE_KEY = 'cantor_yakov_catch_initialized_v1';
export const USER_PROGRESS_STORAGE_KEY = 'cantor_yakov_alefbet_progress_v3';

// Check if user has previously initialized/saved game state (e.g. via localStorage)
const hasUserSavedGameState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Explicit initialized marker from a previous session
    if (localStorage.getItem(CATCH_INITIALIZED_STORAGE_KEY) === 'true') {
      return true;
    }
    // 2. Saved battle session in localStorage
    if (localStorage.getItem(CATCH_BATTLE_STORAGE_KEY)) {
      return true;
    }
    // 3. Saved entity HP map
    const rawHp = localStorage.getItem(CATCH_ENTITY_HP_STORAGE_KEY);
    if (rawHp) {
      const parsed = JSON.parse(rawHp);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return true;
      }
    }
    // 4. Saved user progress with active gameplay history
    const rawProgress = localStorage.getItem(USER_PROGRESS_STORAGE_KEY);
    if (rawProgress) {
      const parsed = JSON.parse(rawProgress);
      if (
        (parsed.caughtLetterIds && parsed.caughtLetterIds.length > 0) ||
        (parsed.caughtHeroIds && parsed.caughtHeroIds.length > 0) ||
        (parsed.caughtVillainIds && parsed.caughtVillainIds.length > 0) ||
        (parsed.caughtHolidayIds && parsed.caughtHolidayIds.length > 0) ||
        (parsed.caughtKosherFoodIds && parsed.caughtKosherFoodIds.length > 0) ||
        (parsed.stars && parsed.stars > 0) ||
        (parsed.wordsLearned && parsed.wordsLearned > 0) ||
        (parsed.popScore && parsed.popScore > 0) ||
        (parsed.xp && parsed.xp > 0)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const getStationGradient = (station: TrainStation): string => {
  if (station.customBg) {
    return station.customBg;
  }
  if (station.id === 'lehavim-rahat') {
    return 'bg-blue-600';
  }
  if (station.id === 'ben-gurion-airport') {
    return 'bg-gradient-to-b from-sky-300 via-blue-100 to-indigo-100';
  }
  switch (station.region) {
    case 'jerusalem':
      return 'bg-gradient-to-b from-amber-200 via-stone-100 to-amber-100';
    case 'haifa_north':
      return 'bg-gradient-to-b from-cyan-200 via-teal-100 to-emerald-100';
    case 'south':
      return 'bg-gradient-to-b from-amber-200 via-orange-100 to-yellow-100';
    case 'sharon':
      return 'bg-gradient-to-b from-emerald-100 via-sky-100 to-teal-100';
    case 'tel_aviv':
    default:
      return 'bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100';
  }
};

const loadEntityHpMap = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CATCH_ENTITY_HP_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export interface StoredCatchBattle {
  wildLetterId: string;
  wildHp: number;
  maxWildHp: number;
  wildLevel: number;
  activeCompanionId: string;
  playerHp: number;
  maxPlayerHp: number;
  playerLevel: number;
  playerXp?: number;
  battleLog: string;
  battlePhase: BattlePhase;
  activeTab: 'battle' | 'alefdex';
}

const loadSavedBattle = (): Partial<StoredCatchBattle> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CATCH_BATTLE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};


// Helper to check if a letter is one of the final five sofit letters
const isSofitLetter = (letterObj?: LetterData | null) => {
  if (!letterObj) return false;
  return (
    letterObj.id?.startsWith('sofit_') ||
    letterObj.id?.includes('sofit') ||
    SOFIT_LETTERS.some((s) => s.id === letterObj.id || s.letter === letterObj.letter) ||
    ['ך', 'ם', 'ן', 'ף', 'ץ'].includes(letterObj.letter)
  );
};

export const CatchGame: React.FC<CatchGameProps> = ({
  letters,
  caughtLetterIds,
  onUpdateCaughtLetters,
  caughtHeroIds,
  onUpdateCaughtHeroes,
  caughtVillainIds,
  onUpdateCaughtVillains,
  caughtHolidayIds,
  onUpdateCaughtHolidays,
  caughtKosherFoodIds,
  onUpdateCaughtKosherFoods,
  isActive = true,
  onReplayIntro,
  devModeEnabled = false,
  onToggleDevMode,
}) => {
  const [isDevMode, setIsDevMode] = useState(devModeEnabled);

  useEffect(() => {
    setIsDevMode(devModeEnabled);
  }, [devModeEnabled]);

  const setDevMode = (enabled: boolean) => {
    setIsDevMode(enabled);
    if (onToggleDevMode) {
      onToggleDevMode(enabled);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cantor_yakov_dev_mode', enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('alefbet_dev_mode_changed', { detail: enabled }));
    }
  };

  const handleExitDevMode = () => {
    setDevMode(false);
    setIsDevArenaOpen(false);
    soundManager.playPop();
  };

  const [isDevArenaOpen, setIsDevArenaOpen] = useState(false);
  const [isDevPasswordModalOpen, setIsDevPasswordModalOpen] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState(false);

  // Ensure player has at least two random starter letters caught if none provided
  const safeCaughtIds = React.useMemo(() => {
    if (isDevMode) return ALL_LETTERS.map((l) => l.id);
    if (caughtLetterIds && caughtLetterIds.length >= 2) return caughtLetterIds;
    if (caughtLetterIds && caughtLetterIds.length === 1) {
      const remaining = letters.filter((l) => l.id !== caughtLetterIds[0]);
      const randSecond = remaining[Math.floor(Math.random() * remaining.length)]?.id || 'bet';
      return [caughtLetterIds[0], randSecond];
    }
    const shuffled = [...letters].sort(() => 0.5 - Math.random());
    return [shuffled[0]?.id || 'alef', shuffled[1]?.id || 'bet'];
  }, [caughtLetterIds, letters, isDevMode]);

  const safeCaughtHeroIds = React.useMemo(() => {
    if (isDevMode) return CATCH_HEROES.map((h) => h.id);
    if (caughtHeroIds && caughtHeroIds.length > 0) return caughtHeroIds;
    return [];
  }, [caughtHeroIds, isDevMode]);

  const safeCaughtVillainIds = React.useMemo(() => {
    if (isDevMode) return CATCH_VILLAINS.map((v) => v.id);
    if (caughtVillainIds && caughtVillainIds.length > 0) return caughtVillainIds;
    return [];
  }, [caughtVillainIds, isDevMode]);

  const safeCaughtHolidayIds = React.useMemo(() => {
    if (isDevMode) return CATCH_HOLIDAYS.map((h) => h.id);
    if (caughtHolidayIds && caughtHolidayIds.length > 0) return caughtHolidayIds;
    return [];
  }, [caughtHolidayIds, isDevMode]);

  const safeCaughtKosherFoodIds = React.useMemo(() => {
    if (isDevMode) return CATCH_KOSHER_FOODS.map((f) => f.id);
    if (caughtKosherFoodIds && caughtKosherFoodIds.length > 0) return caughtKosherFoodIds;
    return [];
  }, [caughtKosherFoodIds, isDevMode]);

  const caughtSet = new Set(safeCaughtIds);
  const caughtHeroSet = new Set(safeCaughtHeroIds);
  const caughtVillainSet = new Set(safeCaughtVillainIds);
  const caughtHolidaySet = new Set(safeCaughtHolidayIds);
  const caughtKosherFoodSet = new Set(safeCaughtKosherFoodIds);

  // Load any existing in-progress battle session from localStorage
  const savedBattle = React.useMemo(() => loadSavedBattle(), []);
  const announcedWildLetterRef = useRef<string | null>(null);

  const [currentStation, setCurrentStation] = useState<TrainStation>(() => {
    const benGurionStation =
      ISRAEL_RAILWAYS_STATIONS.find((s) => s.id === 'ben-gurion-airport') ||
      ISRAEL_RAILWAYS_STATIONS[0];
    const isReturningUser = hasUserSavedGameState();

    // 1. Fresh launch with no saved progress: start specifically at Ben Gurion Airport
    if (!isReturningUser) {
      return benGurionStation;
    }

    // 2. Subsequent launches: select a random station from available railway stations on app startup
    const randomStation =
      ISRAEL_RAILWAYS_STATIONS[Math.floor(Math.random() * ISRAEL_RAILWAYS_STATIONS.length)];
    return randomStation || benGurionStation;
  });
  const [isStationTransitioning, setIsStationTransitioning] = useState(false);

  // Dev Mode station selection list sorted alphabetically by English name
  const sortedDevStations = React.useMemo(() => {
    return [...ISRAEL_RAILWAYS_STATIONS].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, []);

  const pickRandomStation = () => {
    const st = ISRAEL_RAILWAYS_STATIONS[Math.floor(Math.random() * ISRAEL_RAILWAYS_STATIONS.length)];
    setCurrentStation(st);
    return st;
  };

  const handleTravelToStation = (station: TrainStation) => {
    if (!station || station.id === currentStation.id) return;
    setIsStationTransitioning(true);
    setCurrentStation(station);
    soundManager.unlockAudio();
    soundManager.playSparkle();

    const companionName = isHeroActive && activeHero ? activeHero.nameEn : playerLetter.letter;
    const isLetter = !!wildLetter;
    const isHoliday = !isLetter && wildHero?.alignment === 'holiday';
    const isKosherFood = !isLetter && wildHero?.alignment === 'kosher_food';
    const targetNameEn = wildLetter ? wildLetter.letter : wildHero ? wildHero.nameEn : '';
    const targetNameHe = wildLetter
      ? wildLetter.letter
      : wildHero
      ? (wildHero.ttsText || wildHero.speechText || wildHero.spokenHe || wildHero.nameHe || wildHero.hebrew || '')
      : '';

    const newLog = `⚡ Arrived at ${station.nameEn} Station!`;
    setBattleLog(newLog);

    if (isActive) {
      const type = isLetter ? 'letter' : isHoliday ? 'holiday' : isKosherFood ? 'kosher_food' : 'hero';
      soundManager.speakStationEncounterPrompt(
        station.ttsText || station.speechText || station.spokenHe || station.nameHe,
        station.nameEn,
        type,
        targetNameEn,
        targetNameHe,
        wildHero?.id === 'challah',
        isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn,
        isHeroActive && activeHero ? (activeHero.ttsText || activeHero.speechText || activeHero.spokenHe || activeHero.nameHe || activeHero.hebrew) : undefined,
        !isHeroActive ? playerLetter.letter : undefined,
        isLetter ? targetNameEn : undefined
      );
    }

    setTimeout(() => {
      setIsStationTransitioning(false);
    }, 600);
  };

  const [activeCompanionId, setActiveCompanionId] = useState<string>(() => {
    if (savedBattle?.activeCompanionId) {
      if (
        safeCaughtIds.includes(savedBattle.activeCompanionId) ||
        safeCaughtHeroIds.includes(savedBattle.activeCompanionId) ||
        safeCaughtVillainIds.includes(savedBattle.activeCompanionId) ||
        safeCaughtHolidayIds.includes(savedBattle.activeCompanionId) ||
        safeCaughtKosherFoodIds.includes(savedBattle.activeCompanionId) ||
        CATCH_KOSHER_FOODS.some((f) => f.id === savedBattle.activeCompanionId) ||
        CATCH_HOLIDAYS.some((h) => h.id === savedBattle.activeCompanionId) ||
        CATCH_HEROES.some((h) => h.id === savedBattle.activeCompanionId) ||
        CATCH_VILLAINS.some((v) => v.id === savedBattle.activeCompanionId) ||
        ALL_LETTERS.some((l) => l.id === savedBattle.activeCompanionId)
      ) {
        return savedBattle.activeCompanionId;
      }
    }
    return safeCaughtIds[Math.floor(Math.random() * safeCaughtIds.length)] || safeCaughtIds[0] || 'alef';
  });

  // State for persistent entity HP map across encounters
  const [entityHpMap, setEntityHpMap] = useState<Record<string, number>>(() => loadEntityHpMap());

  // Save entityHpMap to localStorage whenever it updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CATCH_ENTITY_HP_STORAGE_KEY, JSON.stringify(entityHpMap));
    } catch {}
  }, [entityHpMap]);

  // Hospital (בית חולים) state
  const [isInHospital, setIsInHospital] = useState(false);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [isHealingInProgress, setIsHealingInProgress] = useState(false);
  const [healingProgress, setHealingProgress] = useState(0);

  const allCaughtEntities = useMemo(() => {
    return Array.from(
      new Set([
        ...safeCaughtIds,
        ...safeCaughtHeroIds,
        ...safeCaughtVillainIds,
        ...safeCaughtHolidayIds,
        ...safeCaughtKosherFoodIds,
      ])
    );
  }, [
    safeCaughtIds,
    safeCaughtHeroIds,
    safeCaughtVillainIds,
    safeCaughtHolidayIds,
    safeCaughtKosherFoodIds,
  ]);

  // Filter out anyone who is already at 100% health:
  const damagedEntities = useMemo(() => {
    return allCaughtEntities.filter((id: string) => (entityHpMap[id] ?? 100) < 100);
  }, [allCaughtEntities, entityHpMap]);

  // Sync player HP when active companion changes
  useEffect(() => {
    const currentHp = entityHpMap[activeCompanionId] ?? 100;
    setPlayerHp(currentHp);
    if (currentHp <= 0) {
      setBattlePhase('player_fainted');
    }
  }, [activeCompanionId, entityHpMap]);

  const [wildHero, setWildHero] = useState<CatchHero | null>(null);

  const handleDevModeClick = () => {
    setDevPasswordInput('');
    setDevPasswordError(false);
    setIsDevPasswordModalOpen(true);
  };

  const handleVerifyDevPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (devPasswordInput.trim().toLowerCase() === 'gcea') {
      setDevMode(true);
      onUpdateCaughtLetters(ALL_LETTERS.map((l) => l.id));
      if (onUpdateCaughtHeroes) {
        onUpdateCaughtHeroes(CATCH_HEROES.map((h) => h.id));
      }
      if (onUpdateCaughtVillains) {
        onUpdateCaughtVillains(CATCH_VILLAINS.map((v) => v.id));
      }
      if (onUpdateCaughtHolidays) {
        onUpdateCaughtHolidays(CATCH_HOLIDAYS.map((h) => h.id));
      }
      if (onUpdateCaughtKosherFoods) {
        onUpdateCaughtKosherFoods(CATCH_KOSHER_FOODS.map((f) => f.id));
      }
      setIsDevPasswordModalOpen(false);
      setIsDevArenaOpen(true);
      soundManager.playFanfare();
    } else {
      setDevPasswordError(true);
      soundManager.playPop();
    }
  };

  const [wildLetter, setWildLetter] = useState<LetterData>(() => {
    if (savedBattle?.wildLetterId) {
      const found = ALL_LETTERS.find((l) => l.id === savedBattle.wildLetterId);
      if (found) return found;
    }
    const all22MainCaptured = letters.every((l) => caughtSet.has(l.id));
    const candidatePool = all22MainCaptured ? ALL_LETTERS : letters;
    const uncaught = candidatePool.filter((l) => !caughtSet.has(l.id));
    return uncaught.length > 0
      ? uncaught[Math.floor(Math.random() * uncaught.length)]
      : candidatePool[Math.floor(Math.random() * candidatePool.length)];
  });

  const [battlePhase, setBattlePhase] = useState<BattlePhase>(() => {
    if (savedBattle?.battlePhase === 'player_fainted' || savedBattle?.battlePhase === 'wild_fainted') {
      return savedBattle.battlePhase;
    }
    return 'player_turn';
  });

  const [playerHp, setPlayerHp] = useState<number>(() => {
    if (typeof savedBattle?.playerHp === 'number' && savedBattle.playerHp > 0) {
      return savedBattle.playerHp;
    }
    return 100;
  });
  const [maxPlayerHp] = useState<number>(() => {
    if (typeof savedBattle?.maxPlayerHp === 'number' && savedBattle.maxPlayerHp > 0) {
      return savedBattle.maxPlayerHp;
    }
    return 100;
  });

  const [wildHp, setWildHp] = useState<number>(() => {
    if (typeof savedBattle?.wildHp === 'number' && savedBattle.wildHp > 0) {
      return savedBattle.wildHp;
    }
    return 100;
  });
  const [maxWildHp] = useState<number>(() => {
    if (typeof savedBattle?.maxWildHp === 'number' && savedBattle.maxWildHp > 0) {
      return savedBattle.maxWildHp;
    }
    return 100;
  });

  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    if (typeof savedBattle?.playerLevel === 'number') {
      return savedBattle.playerLevel;
    }
    return 1;
  });
  const [playerXp, setPlayerXp] = useState<number>(() => {
    if (typeof savedBattle?.playerXp === 'number') {
      return savedBattle.playerXp;
    }
    return 0;
  });
  const [xpPopup, setXpPopup] = useState<{ amount: number } | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);

  const [wildLevel, setWildLevel] = useState<number>(() => {
    if (typeof savedBattle?.wildLevel === 'number') {
      return savedBattle.wildLevel;
    }
    return 1;
  });

  const gainXp = (amount: number) => {
    if (amount <= 0) return;
    setXpPopup({ amount });
    setTimeout(() => {
      setXpPopup(null);
    }, 1800);

    setPlayerXp((prevXp) => {
      let currentXp = prevXp + amount;
      let currentLevel = playerLevel;
      let needed = currentLevel * 50;
      let didLevelUp = false;

      while (currentXp >= needed) {
        currentXp -= needed;
        currentLevel += 1;
        needed = currentLevel * 50;
        didLevelUp = true;
      }

      if (didLevelUp) {
        setPlayerLevel(currentLevel);
        soundManager.playFanfare();
        fireCelebrationConfetti(0.5, 0.3);
        setLevelUpBanner(`LEVEL UP! Reached Lv.${currentLevel}! 🌟`);
        setTimeout(() => setLevelUpBanner(null), 4000);
        setBattleLog(`🌟 LEVEL UP! Your companion reached Lv.${currentLevel}! (+${amount} XP)`);
      }

      return currentXp;
    });
  };

  const [battleLog, setBattleLog] = useState<string>(() => {
    if (savedBattle?.battleLog && !savedBattle.battleLog.includes('A wild letter appeared') && !savedBattle.battleLog.includes('Station')) {
      return savedBattle.battleLog;
    }
    return `At ${currentStation.nameEn} Station: A wild ${wildLetter.letter} appeared!`;
  });

  // Keep companion valid if not in safeCaughtIds, safeCaughtHeroIds, safeCaughtVillainIds, safeCaughtHolidayIds, or safeCaughtKosherFoodIds
  useEffect(() => {
    if (isDevMode) return;
    const isLetterValid = safeCaughtIds.includes(activeCompanionId);
    const isHeroValid = safeCaughtHeroIds.includes(activeCompanionId);
    const isVillainValid = safeCaughtVillainIds.includes(activeCompanionId);
    const isHolidayValid = safeCaughtHolidayIds.includes(activeCompanionId);
    const isKosherFoodValid = safeCaughtKosherFoodIds.includes(activeCompanionId);
    if (!isLetterValid && !isHeroValid && !isVillainValid && !isHolidayValid && !isKosherFoodValid) {
      setActiveCompanionId(safeCaughtIds[0] || 'alef');
    }
  }, [safeCaughtIds, safeCaughtHeroIds, safeCaughtVillainIds, safeCaughtHolidayIds, safeCaughtKosherFoodIds, activeCompanionId, isDevMode]);

  // Mark game as initialized in localStorage so subsequent app startups rotate stations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CATCH_INITIALIZED_STORAGE_KEY, 'true');
      } catch {}
    }
  }, []);

  // Cancel active speech synthesis & voice narration helper
  const cancelAllVoiceNarration = React.useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    soundManager.stopAllAudio();
  }, []);

  // Listen for RESET EVERYTHING event
  useEffect(() => {
    const handleResetEverything = () => {
      cancelAllVoiceNarration();
      setIsDevMode(false);
      setIsDevArenaOpen(false);
      setIsDevPasswordModalOpen(false);
      setWildHero(null);
      setWildLetter(letters[0] || ALL_LETTERS[0]);
      setEntityHpMap({});
      setPlayerHp(100);
      setWildHp(100);
      setPlayerLevel(1);
      setPlayerXp(0);
      setBattlePhase('player_turn');
      setActiveCompanionId('alef');

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CATCH_INITIALIZED_STORAGE_KEY);
          localStorage.removeItem(CATCH_BATTLE_STORAGE_KEY);
          localStorage.removeItem(CATCH_ENTITY_HP_STORAGE_KEY);
        } catch {}
      }

      const bgStation = ISRAEL_RAILWAYS_STATIONS.find((s) => s.id === 'ben-gurion-airport');
      if (bgStation) {
        setCurrentStation(bgStation);
        setBattleLog(`At ${bgStation.nameEn} Station: A wild א appeared!`);
      }
    };
    window.addEventListener('alefbet_reset_everything', handleResetEverything);
    return () => window.removeEventListener('alefbet_reset_everything', handleResetEverything);
  }, [letters, cancelAllVoiceNarration]);

  // Listen for ESC to close Dev Password modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDevPasswordModalOpen) {
        setIsDevPasswordModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevPasswordModalOpen]);

  // Persist ongoing battle state whenever it updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateToSave: StoredCatchBattle = {
      wildLetterId: wildLetter.id,
      wildHp,
      maxWildHp,
      wildLevel,
      activeCompanionId,
      playerHp,
      maxPlayerHp,
      playerLevel,
      playerXp,
      battleLog,
      battlePhase: battlePhase === 'player_fainted' || battlePhase === 'wild_fainted' ? battlePhase : 'player_turn',
      activeTab: 'battle',
    };
    try {
      localStorage.setItem(CATCH_BATTLE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [
    wildLetter.id,
    wildHp,
    maxWildHp,
    wildLevel,
    activeCompanionId,
    playerHp,
    maxPlayerHp,
    playerLevel,
    playerXp,
    battleLog,
    battlePhase,
  ]);

  // Animation states
  const [flyingAttack, setFlyingAttack] = useState<{
    text: string;
    emoji?: string;
    image?: string;
    direction: 'to_wild' | 'to_player';
  } | null>(null);
  const [isWildShaking, setIsWildShaking] = useState(false);
  const [isPlayerShaking, setIsPlayerShaking] = useState(false);
  const [damagePopup, setDamagePopup] = useState<{
    amount: number;
    target: 'wild' | 'player';
    isMiss?: boolean;
    isCrit?: boolean;
  } | null>(null);
  const [ballWiggleCount, setBallWiggleCount] = useState<number>(0);
  const [isCompanionFadingOut, setIsCompanionFadingOut] = useState<boolean>(false);

  // Tracing challenge target letter after being caught in Alef-Ball
  const [tracingTargetLetter, setTracingTargetLetter] = useState<LetterData | null>(null);

  // Alef-Dex icon color pop animation trigger
  const [isAlefDexPopping, setIsAlefDexPopping] = useState<boolean>(false);
  const alefDexPopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const postCatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      cancelAllVoiceNarration();
      if (alefDexPopTimerRef.current) {
        clearTimeout(alefDexPopTimerRef.current);
      }
      if (postCatchTimerRef.current) {
        clearTimeout(postCatchTimerRef.current);
      }
    };
  }, [cancelAllVoiceNarration]);

  // Seed to randomize the 4 attack moves in Normal Mode per encounter
  const [movesRerollSeed, setMovesRerollSeed] = useState<number>(0);

  const ALL_COMPANIONS = React.useMemo(() => [...CATCH_HEROES, ...CATCH_VILLAINS, ...CATCH_HOLIDAYS, ...CATCH_KOSHER_FOODS], []);
  const activeHero = ALL_COMPANIONS.find((h) => h.id === activeCompanionId);
  const playerLetter = ALL_LETTERS.find((l) => l.id === activeCompanionId) || letters[0];
  const isHeroActive = Boolean(activeHero);

  // Derive the full library of attack moves for any given letter from its vocabulary in alefbet.ts
  const getAllMovesForLetter = (letter: LetterData): AttackMove[] => {
    const isHeroOrVillainWord = (w: WordExample) => {
      const category = (w.category || '').toLowerCase().trim();
      return (
        category === 'heroes_villains' ||
        category === 'heroes' ||
        category === 'villains' ||
        category === 'heroes & villains' ||
        category.includes('hero') ||
        category.includes('villain') ||
        w.alignment === 'hero' ||
        w.alignment === 'villain'
      );
    };

    // Exclude specific words as associated attack moves from their respective Hebrew letters:
    // - Remove "red" from letter א (Alef)
    // - Remove "in the/with" from letter ב (Bet)
    // - Remove "haggadah" from letter ה (Heh)
    // - Remove "and" and "pink" from letter ו (Vav)
    // - Remove "challah", "chanukkiah", "Haifa", and "brown" from letter ח (Chet)
    // - Remove "Israel", "Jerusalem", and "green" from letter י (Yod)
    // - Remove "orange" and "blue" from letter כ (Kaf)
    // - Remove "to / for" and "white" from letter ל (Lamed)
    // - Remove "purple" from letter ס (Samekh)
    // - Remove "yellow" from letter צ (Tsadi)
    // - Remove "shofar", "shabbat", and "black" from letter ש (Shin)
    // - Remove "Tel Aviv" from letter ת (Tav)
    const isExcludedAttackMove = (w: WordExample) => {
      if (w.excludeFromAttacks) return true;

      const normEn = (w.wordEn || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const normHe = (w.wordHe || '').trim();
      const letterId = (letter.id || '').toLowerCase();
      const letterChar = letter.letter;

      // Letter א (Alef): Remove "red" and "gray"
      if (letterId === 'alef' || letterChar === 'א') {
        if (
          normEn === 'red' ||
          normEn === 'gray' ||
          normEn === 'grey' ||
          normHe === 'אדום' ||
          normHe === 'אדומה' ||
          normHe === 'אפור' ||
          normHe === 'אפורה'
        ) {
          return true;
        }
      }

      // Letter ב (Bet): Remove "in the/with"
      if (letterId === 'bet' || letterChar === 'ב') {
        if (normEn.includes('in the') || normEn.includes('with') || normHe === 'ב') return true;
      }

      // Letter ה (Heh): Remove "haggadah"
      if (letterId === 'he' || letterId === 'heh' || letterChar === 'ה') {
        if (normEn === 'haggadah' || normHe === 'הגדה') return true;
      }

      // Letter ו (Vav): Remove "and" and "pink"
      if (letterId === 'vav' || letterChar === 'ו') {
        if (normEn === 'and' || normHe === 'ו' || normEn === 'pink' || normHe === 'ורוד' || normHe === 'ורודה') return true;
      }

      // Letter ח (Chet): Remove "challah", "chanukkiah", "Haifa", and "brown"
      if (letterId === 'chet' || letterChar === 'ח') {
        if (
          normEn === 'challah' ||
          normEn === 'chanukkiah' ||
          normEn === 'haifa' ||
          normHe === 'חלה' ||
          normHe === 'חנוכייה' ||
          normHe === 'חיפה' ||
          normEn === 'brown' ||
          normHe === 'חום' ||
          normHe === 'חומה'
        ) {
          return true;
        }
      }

      // Letter י (Yod): Remove "Israel", "Jerusalem", and "green"
      if (letterId === 'yod' || letterChar === 'י') {
        if (
          normEn === 'israel' ||
          normEn === 'jerusalem' ||
          normHe === 'ישראל' ||
          normHe === 'ירושלים' ||
          normEn === 'green' ||
          normHe === 'ירוק' ||
          normHe === 'ירוקה'
        ) {
          return true;
        }
      }

      // Letter כ (Kaf): Remove "orange" and "blue"
      if (letterId === 'kaf' || letterChar === 'כ') {
        if (
          normEn === 'orange' ||
          normEn === 'blue' ||
          normHe === 'כתום' ||
          normHe === 'כתומה' ||
          normHe === 'כחול' ||
          normHe === 'כחולה'
        ) {
          return true;
        }
      }

      // Letter ל (Lamed): Remove "to / for" and "white"
      if (letterId === 'lamed' || letterChar === 'ל') {
        if (
          normEn.includes('to / for') ||
          normEn === 'to/for' ||
          normEn === 'to' ||
          normEn === 'for' ||
          normHe === 'ל' ||
          normEn === 'white' ||
          normHe === 'לבן' ||
          normHe === 'לבנה'
        ) {
          return true;
        }
      }

      // Letter ס (Samekh): Remove "purple"
      if (letterId === 'samekh' || letterId === 'samech' || letterChar === 'ס') {
        if (normEn === 'purple' || normHe === 'סגול' || normHe === 'סגולה') return true;
      }

      // Letter צ (Tsadi): Remove "yellow"
      if (letterId === 'tsadi' || letterId === 'tzadi' || letterChar === 'צ') {
        if (normEn === 'yellow' || normHe === 'צהוב' || normHe === 'צהובה') return true;
      }

      // Letter ש (Shin): Remove "shofar", "shabbat", and "black"
      if (letterId === 'shin' || letterChar === 'ש') {
        if (
          normEn === 'shofar' ||
          normEn === 'shabbat' ||
          normHe === 'שופר' ||
          normHe === 'שבת' ||
          normEn === 'black' ||
          normHe === 'שחור' ||
          normHe === 'שחורה'
        ) {
          return true;
        }
      }

      // Letter ת (Tav): Remove "Tel Aviv"
      if (letterId === 'tav' || letterChar === 'ת') {
        if (
          normEn === 'tel aviv' ||
          normEn === 'tel-aviv' ||
          normHe === 'תל אביב'
        ) {
          return true;
        }
      }

      return false;
    };

    let allWords = [letter.primaryWord, ...(letter.secondaryWords || [])]
      .filter(Boolean)
      .filter((w) => !isHeroOrVillainWord(w) && !isExcludedAttackMove(w));

    // If it's a sofit letter, pool words from the existing ALEFBET_LETTERS dictionary that end in this sofit letter
    if (letter.id.startsWith('sofit_') || SOFIT_LETTERS.some((s) => s.letter === letter.letter)) {
      const dictWords: WordExample[] = [];
      ALEFBET_LETTERS.forEach((l) => {
        const words = [l.primaryWord, ...(l.secondaryWords || [])].filter(Boolean);
        words.forEach((w) => {
          if (w && w.wordHe && w.wordHe.endsWith(letter.letter) && !isHeroOrVillainWord(w) && !isExcludedAttackMove(w)) {
            if (!dictWords.some((existing) => existing.wordHe === w.wordHe)) {
              dictWords.push(w);
            }
          }
        });
      });
      if (dictWords.length > 0) {
        allWords = dictWords;
      }
    }

    return allWords.map((word, idx) => ({
      wordHe: word.wordHe,
      spokenHe: word.spokenHe || word.wordHe,
      wordEn: word.wordEn,
      transliteration: word.transliteration,
      emoji: word.emoji ? randomizeSkinTone(word.emoji) : undefined,
      image: word.image,
      power: 20 + (idx % 3) * 10 + ((idx * 7) % 5),
    }));
  };

  // Complete library of attack moves for current companion
  const fullAttackLibrary: AttackMove[] = React.useMemo(() => {
    if (isHeroActive && activeHero) {
      const heroMoves = getAllMovesForCatchHero(activeHero.id);
      return heroMoves.map((m) => ({
        wordHe: m.nameEn,
        spokenHe: m.spokenEn,
        wordEn: m.nameEn,
        transliteration: m.nameEn,
        emoji: m.emoji,
        image: m.image,
        power: m.power,
        isHeroMove: true,
        spokenEn: m.spokenEn,
      }));
    }
    return getAllMovesForLetter(playerLetter);
  }, [isHeroActive, activeHero, playerLetter]);

  // Attack Moves selection:
  // - In DEV MODE: show all of the attacks in the library for development purposes.
  // - In NORMAL MODE: show four attack moves randomly chosen from the library of attacks.
  const playerMoves: AttackMove[] = React.useMemo(() => {
    if (isDevMode) {
      return fullAttackLibrary;
    }

    if (fullAttackLibrary.length <= 4) {
      return fullAttackLibrary;
    }

    // Pick 4 random distinct attack moves using Fisher-Yates shuffle
    const shuffled = [...fullAttackLibrary];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }, [isDevMode, fullAttackLibrary, movesRerollSeed]);

  // Helper to restate the current battle state ("A wild מ appeared! Go א!" or "Moses appeared! Go א!")
  const restateBattle = React.useCallback((speakAudio = true) => {
    const companionName = isHeroActive && activeHero
      ? activeHero.nameEn
      : playerLetter.letter;

    let statementText = '';

    if (wildHero) {
      const isKosherFood = wildHero.alignment === 'kosher_food';
      const isHoliday = wildHero.alignment === 'holiday';
      statementText = `${isKosherFood ? 'A wild ' : ''}${wildHero.nameEn} appeared at ${currentStation.nameEn} Station! Go ${companionName}!`;
      if (speakAudio) {
        soundManager.unlockAudio();
        const type = isHoliday ? 'holiday' : isKosherFood ? 'kosher_food' : 'hero';
        const heroSpeech = wildHero.ttsText || wildHero.speechText || wildHero.spokenHe || wildHero.nameHe || wildHero.hebrew || '';
        const companionSpeech = isHeroActive && activeHero
          ? (activeHero.ttsText || activeHero.speechText || activeHero.spokenHe || activeHero.nameHe || activeHero.hebrew)
          : undefined;
        const stationSpeech = currentStation.ttsText || currentStation.speechText || currentStation.spokenHe || currentStation.nameHe;
        soundManager.speakStationEncounterPrompt(
          stationSpeech,
          currentStation.nameEn,
          type,
          wildHero.nameEn,
          heroSpeech,
          wildHero.id === 'challah',
          isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn,
          companionSpeech,
          !isHeroActive ? playerLetter.letter : undefined
        );
      }
    } else {
      statementText = `A wild ${wildLetter.letter} appeared at ${currentStation.nameEn} Station! Go ${companionName}!`;
      if (speakAudio) {
        soundManager.unlockAudio();
        const stationSpeech = currentStation.ttsText || currentStation.speechText || currentStation.spokenHe || currentStation.nameHe;
        soundManager.speakStationEncounterPrompt(
          stationSpeech,
          currentStation.nameEn,
          'letter',
          wildLetter.letter,
          wildLetter.letter,
          false,
          isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn,
          isHeroActive && activeHero ? activeHero.nameHe : undefined,
          !isHeroActive ? playerLetter.letter : undefined,
          wildLetter.letter
        );
      }
    }

    setBattleLog(statementText);
  }, [isHeroActive, activeHero, playerLetter, wildHero, wildLetter, currentStation]);

  // Restate battle whenever Catch tab becomes active or when CATCH nav button is clicked
  const prevIsActiveRef = useRef(false);
  useEffect(() => {
    if (isActive && !prevIsActiveRef.current) {
      restateBattle(true);
    } else if (!isActive && prevIsActiveRef.current) {
      // Navigating away from Catch tab: immediately cancel any active speech or voice clips
      cancelAllVoiceNarration();
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, restateBattle, cancelAllVoiceNarration]);

  useEffect(() => {
    const handleCatchTabClick = () => {
      restateBattle(true);
    };
    window.addEventListener('alefbet_catch_tab_clicked', handleCatchTabClick);
    return () => window.removeEventListener('alefbet_catch_tab_clicked', handleCatchTabClick);
  }, [restateBattle]);

  // Encounter a specific entity (hero, villain, holiday, food, or letter) from Dev Arena
  const startEncounterWithEntity = (target: CatchHero | LetterData) => {
    if (postCatchTimerRef.current) {
      clearTimeout(postCatchTimerRef.current);
      postCatchTimerRef.current = null;
    }
    soundManager.unlockAudio();
    soundManager.playSparkle();

    const st = pickRandomStation();
    const stationHe = st.ttsText || st.speechText || st.spokenHe || st.nameHe;
    const stationEn = st.nameEn;

    const isLetter = 'letter' in target;
    if (isLetter) {
      setWildHero(null);
      setWildLetter(target as LetterData);
      announcedWildLetterRef.current = (target as LetterData).id;
    } else {
      setWildHero(target as CatchHero);
      announcedWildLetterRef.current = (target as CatchHero).id;
    }

    setWildHp(100);
    const companionHp = entityHpMap[activeCompanionId] ?? 100;
    setPlayerHp(companionHp);
    if (companionHp <= 0) {
      setBattlePhase('player_fainted');
    } else {
      setBattlePhase('player_turn');
    }
    setWildLevel(Math.max(1, Math.min(25, playerLevel + Math.floor(Math.random() * 3))));

    const companionName = isHeroActive && activeHero ? activeHero.nameEn : playerLetter.letter;
    const isKosherFood = !isLetter && (target as CatchHero).alignment === 'kosher_food';
    const isHoliday = !isLetter && (target as CatchHero).alignment === 'holiday';
    const targetNameEn = isLetter ? (target as LetterData).letter : (target as CatchHero).nameEn;
    const targetHero = !isLetter ? (target as CatchHero) : null;
    const targetNameHe = isLetter
      ? (target as LetterData).letter
      : (targetHero?.ttsText || targetHero?.speechText || targetHero?.spokenHe || targetHero?.nameHe || targetHero?.hebrew || '');

    const statementText = `A wild ${targetNameEn} appeared! Go ${companionName}!`;
    setBattleLog(statementText);
    setIsDevArenaOpen(false);

    if (isActive) {
      soundManager.unlockAudio();
      const type = isLetter ? 'letter' : isHoliday ? 'holiday' : isKosherFood ? 'kosher_food' : 'hero';
      soundManager.speakStationEncounterPrompt(
        stationHe,
        stationEn,
        type,
        targetNameEn,
        targetNameHe,
        target.id === 'challah',
        isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn,
        isHeroActive && activeHero ? (activeHero.ttsText || activeHero.speechText || activeHero.spokenHe || activeHero.nameHe || activeHero.hebrew) : undefined,
        !isHeroActive ? playerLetter.letter : undefined,
        isLetter ? targetNameEn : undefined
      );
    }
  };

  // Helper to select a random player fighter from the unlocked roster / Alef-Dex data,
  // ensuring it does not pick the currently active character if more than 1 character exists.
  const getRandomPlayerFighter = (
    currentExcludeId?: string,
    customRoster?: string[]
  ): string => {
    const exclude = currentExcludeId || activeCompanionId;
    let pool: string[] = [];

    if (customRoster && customRoster.length > 0) {
      pool = Array.from(new Set(customRoster));
    } else if (isDevMode) {
      pool = Array.from(
        new Set([
          ...ALL_LETTERS.map((l) => l.id),
          ...CATCH_HEROES.map((h) => h.id),
          ...CATCH_VILLAINS.map((v) => v.id),
          ...CATCH_HOLIDAYS.map((h) => h.id),
          ...CATCH_KOSHER_FOODS.map((f) => f.id),
        ])
      );
    } else {
      pool = Array.from(
        new Set([
          ...safeCaughtIds,
          ...safeCaughtHeroIds,
          ...safeCaughtVillainIds,
          ...safeCaughtHolidayIds,
          ...safeCaughtKosherFoodIds,
        ])
      );
    }

    if (!pool || pool.length === 0) {
      pool = letters.map((l) => l.id);
    }
    if (pool.length === 0) {
      return 'alef';
    }

    // Prefer awake characters (HP > 0)
    const awakePool = pool.filter((id) => (entityHpMap[id] ?? 100) > 0);
    const candidatePool = awakePool.length > 0 ? awakePool : pool;

    // Do not pick the currently active character if more than 1 character exists
    if (candidatePool.length > 1) {
      const candidatesWithoutCurrent = candidatePool.filter((id) => id !== exclude);
      if (candidatesWithoutCurrent.length > 0) {
        return candidatesWithoutCurrent[Math.floor(Math.random() * candidatesWithoutCurrent.length)];
      }
    } else if (pool.length > 1) {
      const allWithoutCurrent = pool.filter((id) => id !== exclude);
      if (allWithoutCurrent.length > 0) {
        return allWithoutCurrent[Math.floor(Math.random() * allWithoutCurrent.length)];
      }
    }

    return candidatePool[0] || pool[0] || 'alef';
  };

  // Encounter a new wild letter, hero, villain, or holiday with station transition fade
  const startWildEncounter = (
    overrideCaughtIds?: string[],
    overrideCaughtHeroIds?: string[],
    overrideCaughtVillainIds?: string[],
    overrideCaughtHolidayIds?: string[],
    overrideCaughtKosherFoodIds?: string[]
  ) => {
    setIsStationTransitioning(true);

    setTimeout(() => {
      setMovesRerollSeed((prev) => prev + 1);
      if (postCatchTimerRef.current) {
        clearTimeout(postCatchTimerRef.current);
        postCatchTimerRef.current = null;
      }
      soundManager.unlockAudio();
      soundManager.playSparkle();

      setIsCompanionFadingOut(false);
      setIsPlayerShaking(false);
      setIsWildShaking(false);
      setDamagePopup(null);
      setFlyingAttack(null);

      // Build updated roster pool if overrides were provided (e.g. right after a capture)
      const currentRoster = Array.from(
        new Set([
          ...(overrideCaughtIds || safeCaughtIds),
          ...(overrideCaughtHeroIds || safeCaughtHeroIds),
          ...(overrideCaughtVillainIds || safeCaughtVillainIds),
          ...(overrideCaughtHolidayIds || safeCaughtHolidayIds),
          ...(overrideCaughtKosherFoodIds || safeCaughtKosherFoodIds),
        ])
      );

      // Randomly pick a new player fighter from the unlocked roster / Alef-Dex data
      const nextCompanionId = getRandomPlayerFighter(activeCompanionId, currentRoster);
      setActiveCompanionId(nextCompanionId);

      const nextHero = ALL_COMPANIONS.find((h) => h.id === nextCompanionId);
      const nextLetter = ALL_LETTERS.find((l) => l.id === nextCompanionId) || letters[0];
      const nextIsHero = Boolean(nextHero);

      // Preserve the player's existing HP value (from entityHpMap)
      const companionHp = entityHpMap[nextCompanionId] ?? 100;
      setPlayerHp(companionHp);
      if (companionHp <= 0) {
        setBattlePhase('player_fainted');
      } else {
        setBattlePhase('player_turn');
      }

      const companionDisplayName = nextIsHero && nextHero ? nextHero.nameEn : nextLetter.letter;
      const companionNameEn = nextIsHero && nextHero ? nextHero.nameEn : nextLetter.nameEn;
      const companionNameHe = nextIsHero && nextHero
        ? (nextHero.ttsText || nextHero.speechText || nextHero.spokenHe || nextHero.nameHe || nextHero.hebrew)
        : undefined;
      const companionLetterGlyph = !nextIsHero ? nextLetter.letter : undefined;

      const st = pickRandomStation();
      const stationHe = st.ttsText || st.speechText || st.spokenHe || st.nameHe;
      const stationEn = st.nameEn;

      const currentCaughtSet = new Set(overrideCaughtIds || safeCaughtIds);
      const currentCaughtHeroSet = new Set(overrideCaughtHeroIds || safeCaughtHeroIds);
      const currentCaughtVillainSet = new Set(overrideCaughtVillainIds || safeCaughtVillainIds);
      const currentCaughtHolidaySet = new Set(overrideCaughtHolidayIds || safeCaughtHolidayIds);
      const currentCaughtKosherFoodSet = new Set(overrideCaughtKosherFoodIds || safeCaughtKosherFoodIds);

      const uncaughtHeroes = CATCH_HEROES.filter((h) => !currentCaughtHeroSet.has(h.id));
      const uncaughtVillains = CATCH_VILLAINS.filter((v) => !currentCaughtVillainSet.has(v.id));
      const uncaughtHolidays = CATCH_HOLIDAYS.filter((h) => !currentCaughtHolidaySet.has(h.id));
      const uncaughtKosherFoods = CATCH_KOSHER_FOODS.filter((f) => !currentCaughtKosherFoodSet.has(f.id));
      const uncaughtCharacters = [...uncaughtHeroes, ...uncaughtVillains, ...uncaughtHolidays, ...uncaughtKosherFoods];

      // Equal probability between base letters and each uncaught hero/villain/holiday/food
      const numBaseLetters = letters.length > 0 ? letters.length : 22;
      const totalPool = numBaseLetters + uncaughtCharacters.length;
      const charProbability = uncaughtCharacters.length > 0 ? uncaughtCharacters.length / totalPool : 0;

      if (uncaughtCharacters.length > 0 && Math.random() < charProbability) {
        const chosenChar = uncaughtCharacters[Math.floor(Math.random() * uncaughtCharacters.length)];
        setWildHero(chosenChar);
        setWildHp(100);
        setWildLevel(Math.max(1, Math.min(25, playerLevel + Math.floor(Math.random() * 3))));
        announcedWildLetterRef.current = chosenChar.id;

        const isKosherFood = chosenChar.alignment === 'kosher_food';
        const isHoliday = chosenChar.alignment === 'holiday';
        const statementText = `${isKosherFood ? 'A wild ' : ''}${chosenChar.nameEn} appeared! Go ${companionDisplayName}!`;
        setBattleLog(statementText);

        if (isActive) {
          soundManager.unlockAudio();
          const type = isHoliday ? 'holiday' : isKosherFood ? 'kosher_food' : 'hero';
          const chosenSpeech = chosenChar.ttsText || chosenChar.speechText || chosenChar.spokenHe || chosenChar.nameHe || chosenChar.hebrew || '';
          soundManager.speakStationEncounterPrompt(
            stationHe,
            stationEn,
            type,
            chosenChar.nameEn,
            chosenSpeech,
            chosenChar.id === 'challah',
            companionNameEn,
            companionNameHe,
            companionLetterGlyph
          );
        }
        setIsStationTransitioning(false);
        return;
      }

      setWildHero(null);
      // Sofit letters (The Final Five) only appear as wild letters AFTER catching EVERYONE else!
      const all22MainCaptured = letters.every((l) => currentCaughtSet.has(l.id));
      const allCharactersCaptured = uncaughtCharacters.length === 0;
      const everyoneElseCaptured = all22MainCaptured && allCharactersCaptured;

      const candidatePool = everyoneElseCaptured ? ALL_LETTERS : letters;

      const uncaught = candidatePool.filter((l) => !currentCaughtSet.has(l.id));
      let nextWild: LetterData;
      if (uncaught.length > 0) {
        nextWild = uncaught[Math.floor(Math.random() * uncaught.length)];
      } else {
        const available = candidatePool.filter((l) => l.id !== wildLetter.id);
        nextWild = available[Math.floor(Math.random() * available.length)] || candidatePool[0];
      }

      setWildLetter(nextWild);
      setWildHp(100);
      setWildLevel(Math.max(1, Math.min(20, playerLevel + Math.floor(Math.random() * 3) - 1)));
      announcedWildLetterRef.current = nextWild.id;

      const statementText = `A wild ${nextWild.letter} appeared! Go ${companionDisplayName}!`;
      setBattleLog(statementText);

      if (isActive) {
        soundManager.unlockAudio();
        soundManager.speakStationEncounterPrompt(
          stationHe,
          stationEn,
          'letter',
          nextWild.letter,
          nextWild.letter,
          false,
          companionNameEn,
          companionNameHe,
          companionLetterGlyph,
          nextWild.letter
        );
      }
      setIsStationTransitioning(false);
    }, 500);
  };

  // Open בית חולים (Hospital). If currently in an active wild battle, forfeits the battle!
  // Fades out screen like station transition, then switches to Hospital right on the battle screen!
  const handleOpenClinic = () => {
    const isInActiveBattle =
      battlePhase === 'player_turn' ||
      battlePhase === 'player_attacking' ||
      battlePhase === 'wild_attacking' ||
      battlePhase === 'throwing_ball' ||
      battlePhase === 'wiggling';

    if (isInActiveBattle) {
      setBattleLog('Traveling to the בית חולים (Hospital)... The wild battle was forfeited.');
    } else {
      setBattleLog('Welcome to the בית חולים (Hospital)!');
    }

    setIsStationTransitioning(true);
    soundManager.unlockAudio();
    soundManager.playSparkle();

    setTimeout(() => {
      setIsInHospital(true);
      const allCaughtEntities = [
        ...safeCaughtIds,
        ...safeCaughtHeroIds,
        ...safeCaughtVillainIds,
        ...safeCaughtHolidayIds,
        ...safeCaughtKosherFoodIds,
      ];
      // Automatically filter out anyone who is already at 100% health:
      const damaged = allCaughtEntities.filter((id) => (entityHpMap[id] ?? 100) < 100);
      setSelectedClinicIds(damaged.slice(0, 5));
      setIsStationTransitioning(false);
      soundManager.speakEnglish("Welcome to the hospital! Select injured companions to heal.");
    }, 500);
  };

  // Exit בית חולים (Hospital) and return to train station battle
  const handleExitHospital = () => {
    setIsStationTransitioning(true);
    soundManager.playPop();
    setTimeout(() => {
      setIsInHospital(false);
      setSelectedClinicIds([]);
      startWildEncounter();
    }, 500);
  };

  // Start the screen-filling healing process in בית חולים
  const handleStartHealing = () => {
    if (selectedClinicIds.length === 0) return;

    soundManager.unlockAudio();
    soundManager.playSparkle();
    setIsHealingInProgress(true);
    setHealingProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setHealingProgress(current);

      if (current === 48) {
        soundManager.playHealingChime();
      }

      if (current >= 100) {
        clearInterval(interval);

        // Fully heal selected entities
        setEntityHpMap((prev) => {
          const next = { ...prev };
          selectedClinicIds.forEach((id) => {
            next[id] = 100;
          });
          return next;
        });

        // If current active companion was healed, restore active playerHp and turn
        if (selectedClinicIds.includes(activeCompanionId)) {
          setPlayerHp(100);
          if (battlePhase === 'player_fainted') {
            setBattlePhase('player_turn');
          }
        }

        soundManager.playFanfare();

        setTimeout(() => {
          setIsHealingInProgress(false);
          setSelectedClinicIds([]);
          setBattleLog('All selected companions have been fully healed at the בית חולים (Hospital)! 💚');
        }, 900);
      }
    }, 120);
  };

  // Player attacks wild letter with a word move
  const handlePlayerAttack = (move: AttackMove) => {
    if (battlePhase !== 'player_turn') return;

    if (playerHp <= 0) {
      setBattleLog(`${isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn} is fainted! Visit the בית חולים (Hospital) to heal! 🏥`);
      soundManager.playPop();
      return;
    }

    soundManager.unlockAudio();
    setBattlePhase('player_attacking');

    // RNG: 10% miss, 4% critical hit
    const isMiss = Math.random() < 0.10;
    const isCrit = !isMiss && Math.random() < 0.04;

    const attackerName = move.isHeroMove ? (activeHero ? activeHero.nameEn : 'Hero') : playerLetter.nameEn;

    if (isMiss) {
      setBattleLog(`${attackerName}'s move missed! 💨`);
    } else if (isCrit) {
      setBattleLog(`💥 CRITICAL HIT! 1.5x Damage! ${attackerName} used "${move.isHeroMove ? move.wordEn : move.wordHe}"!`);
    } else {
      if (move.isHeroMove) {
        setBattleLog(`${attackerName} used "${move.wordEn}"!`);
        soundManager.speakEnglish(move.spokenEn || move.wordEn);
      } else {
        setBattleLog(`${playerLetter.nameEn} threw "${move.wordHe}" (${move.wordEn})!`);
        soundManager.speakHebrew(move.spokenHe);
      }
    }

    setFlyingAttack({
      text: move.isHeroMove ? move.wordEn : move.wordHe,
      emoji: move.emoji,
      image: move.image,
      direction: 'to_wild',
    });

    setTimeout(() => {
      setFlyingAttack(null);

      if (isMiss) {
        soundManager.playGentleBoing();
        setDamagePopup({ amount: 0, target: 'wild', isMiss: true });
        setTimeout(() => {
          setDamagePopup(null);
          setTimeout(() => {
            handleWildCounterAttack();
          }, 600);
        }, 800);
        return;
      }

      setIsWildShaking(true);
      if (isCrit) {
        soundManager.playFanfare();
      } else {
        soundManager.playCoinClink();
      }

      const rawPower = move.power;
      const calcDamage = isCrit ? Math.floor(rawPower * 1.5) : rawPower;
      const damage = Math.min(wildHp, calcDamage);

      setDamagePopup({ amount: damage, target: 'wild', isCrit });
      setWildHp((prev) => Math.max(0, prev - damage));
      gainXp(isCrit ? 25 : 15);

      setTimeout(() => {
        setIsWildShaking(false);
        setDamagePopup(null);

        const newWildHp = wildHp - damage;
        if (newWildHp <= 0) {
          setBattlePhase('wild_fainted');
          const targetName = wildHero ? wildHero.nameEn : wildLetter.nameEn;
          setBattleLog(`${targetName} fainted! (+50 XP)`);
          gainXp(50);
          soundManager.speakEnglish(`${targetName} fainted`);
          soundManager.playGentleBoing();

          setTimeout(() => {
            startWildEncounter();
          }, 2200);
        } else {
          setTimeout(() => {
            handleWildCounterAttack();
          }, 800);
        }
      }, 600);
    }, 700);
  };

  // Wild letter or hero counter-attacks
  const handleWildCounterAttack = () => {
    setBattlePhase('wild_attacking');

    // RNG: 10% miss, 4% critical hit
    const isMiss = Math.random() < 0.10;
    const isCrit = !isMiss && Math.random() < 0.04;

    if (wildHero) {
      const heroMoves = getMovesForCatchHero(wildHero.id);
      const randMove = heroMoves[Math.floor(Math.random() * heroMoves.length)];

      if (isMiss) {
        setBattleLog(`${wildHero.nameEn}'s attack missed! 💨`);
      } else if (isCrit) {
        setBattleLog(`💥 CRITICAL HIT! ${wildHero.nameEn} dealt 1.5x damage with "${randMove.nameEn}"!`);
      } else {
        setBattleLog(`${wildHero.nameEn} countered with "${randMove.nameEn}"!`);
        soundManager.speakEnglish(randMove.spokenEn);
      }

      setFlyingAttack({
        text: randMove.nameEn,
        emoji: randMove.emoji,
        image: randMove.image,
        direction: 'to_player',
      });

      setTimeout(() => {
        setFlyingAttack(null);

        if (isMiss) {
          soundManager.playGentleBoing();
          setDamagePopup({ amount: 0, target: 'player', isMiss: true });
          setTimeout(() => {
            setDamagePopup(null);
            setBattlePhase('player_turn');
            setBattleLog(`Your turn! Choose an attack or throw an Alef-Ball!`);
          }, 800);
          return;
        }

        setIsPlayerShaking(true);
        if (isCrit) {
          soundManager.playFanfare();
        } else {
          soundManager.playGentleBoing();
        }

        const baseDmg = Math.floor(randMove.power * 0.75);
        const calcDmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;
        const damage = Math.min(playerHp, calcDmg);

        setDamagePopup({ amount: damage, target: 'player', isCrit });
        const newPlayerHp = Math.max(0, playerHp - damage);
        setPlayerHp(newPlayerHp);
        setEntityHpMap((prev) => ({ ...prev, [activeCompanionId]: newPlayerHp }));

        setTimeout(() => {
          setIsPlayerShaking(false);
          setDamagePopup(null);

          if (newPlayerHp <= 0) {
            setIsCompanionFadingOut(true);
            const companionName = isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn;

            const allOwnedCompanions = Array.from(
              new Set([
                ...safeCaughtIds,
                ...safeCaughtHeroIds,
                ...safeCaughtVillainIds,
                ...safeCaughtHolidayIds,
                ...safeCaughtKosherFoodIds,
              ])
            );
            const awakeCompanions = allOwnedCompanions.filter(
              (id) => id !== activeCompanionId && (entityHpMap[id] ?? 100) > 0
            );

            if (awakeCompanions.length > 0) {
              const nextId = awakeCompanions[Math.floor(Math.random() * awakeCompanions.length)];
              const nextLetter = ALL_LETTERS.find((l) => l.id === nextId);
              const nextHero = ALL_COMPANIONS.find((c) => c.id === nextId);
              const nextName = nextHero ? nextHero.nameEn : nextLetter ? nextLetter.nameEn : nextId;

              setBattleLog(`${companionName} fainted! 💫 ${nextName} stepped in to battle!`);
              soundManager.speakEnglish(`${companionName} fainted. ${nextName} stepped in!`);
              soundManager.playGentleBoing();

              setTimeout(() => {
                setActiveCompanionId(nextId);
                setPlayerHp(entityHpMap[nextId] ?? 100);
                setIsCompanionFadingOut(false);
                setBattlePhase('player_turn');
              }, 850);
            } else {
              setBattlePhase('player_fainted');
              setBattleLog(`${companionName} fainted! 💫 All companions are out of HP! Visit the בית חולים (Hospital) to heal! 🏥`);
              soundManager.speakEnglish(`${companionName} fainted. Visit the Hospital to heal.`);
              soundManager.playGentleBoing();
            }
          } else {
            setBattlePhase('player_turn');
            setBattleLog(`Your turn! Choose an attack or throw an Alef-Ball!`);
          }
        }, 600);
      }, 700);
      return;
    }

    const wildMoves = getAllMovesForLetter(wildLetter);
    const randMove = wildMoves[Math.floor(Math.random() * wildMoves.length)];

    if (isMiss) {
      setBattleLog(`Wild ${wildLetter.nameEn}'s attack missed! 💨`);
    } else if (isCrit) {
      setBattleLog(`💥 CRITICAL HIT! Wild ${wildLetter.nameEn} dealt 1.5x damage with "${randMove.wordHe}"!`);
    } else {
      setBattleLog(`Wild ${wildLetter.nameEn} countered with "${randMove.wordHe}"!`);
      soundManager.speakHebrew(randMove.spokenHe);
    }

    setFlyingAttack({
      text: randMove.wordHe,
      emoji: randMove.emoji,
      image: randMove.image,
      direction: 'to_player',
    });

    setTimeout(() => {
      setFlyingAttack(null);

      if (isMiss) {
        soundManager.playGentleBoing();
        setDamagePopup({ amount: 0, target: 'player', isMiss: true });
        setTimeout(() => {
          setDamagePopup(null);
          setBattlePhase('player_turn');
          setBattleLog(`Your turn! Choose an attack or throw an Alef-Ball!`);
        }, 800);
        return;
      }

      setIsPlayerShaking(true);
      if (isCrit) {
        soundManager.playFanfare();
      } else {
        soundManager.playGentleBoing();
      }

      const baseDmg = Math.floor(randMove.power * 0.75);
      const calcDmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;
      const damage = Math.min(playerHp, calcDmg);

      setDamagePopup({ amount: damage, target: 'player', isCrit });
      const newPlayerHp = Math.max(0, playerHp - damage);
      setPlayerHp(newPlayerHp);
      setEntityHpMap((prev) => ({ ...prev, [activeCompanionId]: newPlayerHp }));

      setTimeout(() => {
        setIsPlayerShaking(false);
        setDamagePopup(null);

          if (newPlayerHp <= 0) {
            setIsCompanionFadingOut(true);
            const companionName = isHeroActive && activeHero ? activeHero.nameEn : playerLetter.nameEn;

            const allOwnedCompanions = Array.from(
              new Set([
                ...safeCaughtIds,
                ...safeCaughtHeroIds,
                ...safeCaughtVillainIds,
                ...safeCaughtHolidayIds,
                ...safeCaughtKosherFoodIds,
              ])
            );
            const awakeCompanions = allOwnedCompanions.filter(
              (id) => id !== activeCompanionId && (entityHpMap[id] ?? 100) > 0
            );

            if (awakeCompanions.length > 0) {
              const nextId = awakeCompanions[Math.floor(Math.random() * awakeCompanions.length)];
              const nextLetter = ALL_LETTERS.find((l) => l.id === nextId);
              const nextHero = ALL_COMPANIONS.find((c) => c.id === nextId);
              const nextName = nextHero ? nextHero.nameEn : nextLetter ? nextLetter.nameEn : nextId;

              setBattleLog(`${companionName} fainted! 💫 ${nextName} stepped in to battle!`);
              soundManager.speakEnglish(`${companionName} fainted. ${nextName} stepped in!`);
              soundManager.playGentleBoing();

              setTimeout(() => {
                setActiveCompanionId(nextId);
                setPlayerHp(entityHpMap[nextId] ?? 100);
                setIsCompanionFadingOut(false);
                setBattlePhase('player_turn');
              }, 850);
            } else {
              setBattlePhase('player_fainted');
              setBattleLog(`${companionName} fainted! 💫 All companions are out of HP! Visit the בית חולים (Hospital) to heal! 🏥`);
              soundManager.speakEnglish(`${companionName} fainted. Visit the Hospital to heal.`);
              soundManager.playGentleBoing();
            }
          } else {
            setBattlePhase('player_turn');
            setBattleLog(`Your turn! Choose an attack or throw an Alef-Ball!`);
          }
      }, 600);
    }, 700);
  };

  // Throw Alef-Ball to catch the wild letter or hero
  const handleThrowAlefBall = () => {
    if (battlePhase !== 'player_turn') return;

    soundManager.unlockAudio();
    setBattlePhase('throwing_ball');
    const targetName = wildHero ? wildHero.nameEn : `wild ${wildLetter.nameEn}`;
    setBattleLog(`Threw the ball at ${targetName}!`);
    soundManager.playPop();

    setTimeout(() => {
      setBattlePhase('wiggling');
      setBallWiggleCount(1);
      soundManager.playNote(440, 0.15);

      setTimeout(() => {
        setBallWiggleCount(2);
        soundManager.playNote(523, 0.15);

        setTimeout(() => {
          setBallWiggleCount(3);
          soundManager.playNote(659, 0.15);

          const hpPercent = wildHp / maxWildHp;
          const catchRate = 0.45 + (1 - hpPercent) * 0.5;
          const isSuccessful = Math.random() < catchRate;

          setTimeout(() => {
            if (isSuccessful) {
              setBattlePhase('caught');
              if (wildHero) {
                const isVillain = wildHero.alignment === 'villain';
                const isHoliday = wildHero.alignment === 'holiday';
                const isKosherFood = wildHero.alignment === 'kosher_food';
                const labelType = isKosherFood ? 'Kosher Food' : isHoliday ? 'Holiday' : isVillain ? 'Villain' : 'Hero';
                setBattleLog(`✨ Gotcha! ${labelType} ${wildHero.nameEn} was added to your Alef-Dex! (+75 XP) ✨`);
                gainXp(75);
                soundManager.playFanfare();
                fireCelebrationConfetti(0.5, 0.4);

                let nextHolidays = safeCaughtHolidayIds;
                let nextVillains = safeCaughtVillainIds;
                let nextHeroes = safeCaughtHeroIds;
                let nextKosherFoods = safeCaughtKosherFoodIds;

                if (isKosherFood) {
                  nextKosherFoods = Array.from(new Set([...safeCaughtKosherFoodIds, wildHero.id]));
                  if (onUpdateCaughtKosherFoods) onUpdateCaughtKosherFoods(nextKosherFoods);
                } else if (isHoliday) {
                  nextHolidays = Array.from(new Set([...safeCaughtHolidayIds, wildHero.id]));
                  if (onUpdateCaughtHolidays) onUpdateCaughtHolidays(nextHolidays);
                } else if (isVillain) {
                  nextVillains = Array.from(new Set([...safeCaughtVillainIds, wildHero.id]));
                  if (onUpdateCaughtVillains) onUpdateCaughtVillains(nextVillains);
                } else {
                  nextHeroes = Array.from(new Set([...safeCaughtHeroIds, wildHero.id]));
                  if (onUpdateCaughtHeroes) onUpdateCaughtHeroes(nextHeroes);
                }

                // Wait for the full congratulations speech ("כל הכבוד! Caught [name]!") to complete
                // before introducing the next opponent.
                let hasTransitioned = false;
                const triggerNextEncounter = () => {
                  if (hasTransitioned) return;
                  hasTransitioned = true;
                  if (postCatchTimerRef.current) {
                    clearTimeout(postCatchTimerRef.current);
                    postCatchTimerRef.current = null;
                  }
                  startWildEncounter(safeCaughtIds, nextHeroes, nextVillains, nextHolidays, nextKosherFoods);
                };

                // Generous safety fallback timeout (10 seconds) in case TTS engine does not fire onend
                postCatchTimerRef.current = setTimeout(() => {
                  triggerNextEncounter();
                }, 10000);

                const caughtSpeech = wildHero.ttsText || wildHero.speechText || wildHero.spokenHe || wildHero.nameHe || wildHero.hebrew || wildHero.nameEn;
                soundManager.speakCaughtCharacterPrompt(wildHero.nameEn, caughtSpeech, () => {
                  // After congratulations speech finishes completely, allow a peaceful 1800ms celebration delay
                  if (postCatchTimerRef.current) {
                    clearTimeout(postCatchTimerRef.current);
                  }
                  postCatchTimerRef.current = setTimeout(() => {
                    triggerNextEncounter();
                  }, 1800);
                });
              } else {
                setBattleLog(`Trace the ${wildLetter.nameEn} (${wildLetter.letter}) to register it in your Alef-Dex! ✍️`);
                soundManager.playFanfare();
                fireCelebrationConfetti(0.5, 0.4);

                soundManager.speakTraceNeededPrompt(wildLetter.letter, () => {
                  setTracingTargetLetter(wildLetter);
                });
                setTimeout(() => {
                  setTracingTargetLetter((curr) => curr || wildLetter);
                }, 1600);
              }
            } else {
              setBattleLog(`Oh no! ${targetName} broke free!`);
              setTimeout(() => {
                handleWildCounterAttack();
              }, 800);
            }
          }, 600);
        }, 500);
      }, 500);
    }, 700);
  };

  // Called when child completes tracing the caught letter
  const handleTracingComplete = () => {
    if (!tracingTargetLetter) return;
    const caught = tracingTargetLetter;
    setTracingTargetLetter(null);

    const nextCaught = Array.from(new Set([...safeCaughtIds, caught.id]));
    onUpdateCaughtLetters(nextCaught);

    setBattleLog(`✨ Gotcha! ${caught.nameEn} (${caught.letter}) was sealed into your Alef-Dex! (+75 XP) ✨`);
    gainXp(75);

    setIsAlefDexPopping(true);
    soundManager.playFanfare();
    soundManager.playSparkle();
    fireCelebrationConfetti(0.6, 0.5);

    if (alefDexPopTimerRef.current) {
      clearTimeout(alefDexPopTimerRef.current);
    }
    alefDexPopTimerRef.current = setTimeout(() => {
      setIsAlefDexPopping(false);
    }, 4500);

    let hasTransitioned = false;
    const triggerNextEncounter = () => {
      if (hasTransitioned) return;
      hasTransitioned = true;
      if (postCatchTimerRef.current) {
        clearTimeout(postCatchTimerRef.current);
        postCatchTimerRef.current = null;
      }
      startWildEncounter(nextCaught, safeCaughtHeroIds, safeCaughtVillainIds, safeCaughtHolidayIds);
    };

    // Generous safety fallback timeout (10 seconds) in case TTS engine does not fire onend
    postCatchTimerRef.current = setTimeout(() => {
      triggerNextEncounter();
    }, 10000);

    soundManager.speakCaughtCharacterPrompt(caught.nameEn, caught.letter, () => {
      // After congratulations speech finishes completely, allow a peaceful 1800ms celebration delay
      if (postCatchTimerRef.current) {
        clearTimeout(postCatchTimerRef.current);
      }
      postCatchTimerRef.current = setTimeout(() => {
        triggerNextEncounter();
      }, 1800);
    });
  };

  const handleCancelTracing = () => {
    setTracingTargetLetter(null);
    setBattleLog(`Wild ${wildLetter.nameEn} was not registered yet. Ready for your turn!`);
    setBattlePhase('player_turn');
  };

  const renderAlefDex = () => (
    <div className="bg-emerald-100/95 p-3.5 sm:p-5 rounded-3xl border-2 border-emerald-300/90 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-emerald-200/90 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-950 text-sm sm:text-base flex items-center gap-1.5">
            <span>📖</span>
            <span>Alef-Dex</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-800 font-bold hidden md:inline">
            Tap a caught partner to make it active in battle!
          </span>
          <button
            type="button"
            onClick={isInHospital ? handleExitHospital : handleOpenClinic}
            className={`${
              isInHospital ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
            } text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer`}
            title={isInHospital ? 'Return to Train Station' : 'Visit בית חולים (Hospital)'}
            aria-label={isInHospital ? 'Return to Train Station' : 'Visit בית חולים (Hospital)'}
          >
            <span>{isInHospital ? '🚂' : '🏥'}</span>
            <span>{isInHospital ? 'Back to Train' : 'בית חולים'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: LETTERS (22 Main Letters) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-emerald-950 flex items-center gap-1.5 font-bold">📜 Letters</span>
          <span className="font-bold text-emerald-950 bg-emerald-200/90 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtIds.filter((id) => !id.startsWith('sofit_')).length} of {letters.length}
          </span>
        </div>

        <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
          {letters.map((letter, idx) => {
            const hp = (letter.id === activeCompanionId ? playerHp : entityHpMap[letter.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtSet.has(letter.id);
            const isActive = activeCompanionId === letter.id;
            const anims = ['alefdexWiggle', 'alefdexBounce', 'alefdexSquish'];
            const animName = anims[idx % 3];
            const delay = ((idx * 0.5) % 4).toFixed(1);
            const duration = (3.5 + (idx % 3) * 0.8).toFixed(1);

            return (
              <button
                key={letter.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(letter.id);
                    soundManager.speakGoCompanionPrompt(letter.letter, letter.nameEn);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'Locked'
                    : isFainted
                    ? `${letter.nameEn} (${letter.letter}) — Fainted 😵 (Visit בית חולים)`
                    : letter.nameEn
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-105 ring-2 ring-amber-300 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-amber-100 text-slate-800 hover:bg-amber-200 hover:text-slate-900 border border-amber-300/80 shadow-2xs cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                <span
                  className={`inline-block ${isCaught && isFainted ? 'opacity-30' : ''}`}
                  style={
                    isCaught && !isFainted
                      ? {
                          animationName: animName,
                          animationDuration: `${duration}s`,
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDelay: `${delay}s`,
                        }
                      : undefined
                  }
                >
                  {isCaught ? letter.letter : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: HEROES */}
      <div className="space-y-1.5 pt-2.5 border-t-2 border-emerald-200/90">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-purple-950 flex items-center gap-1.5 font-bold">⚔️ Heroes</span>
          <span className="font-bold text-purple-950 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtHeroIds.length} of {CATCH_HEROES.length}
          </span>
        </div>

        <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
          {CATCH_HEROES.map((hero) => {
            const hp = (hero.id === activeCompanionId ? playerHp : entityHpMap[hero.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtHeroSet.has(hero.id);
            const isActive = activeCompanionId === hero.id;

            return (
              <button
                key={hero.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(hero.id);
                    const heroSpeech = hero.ttsText || hero.speechText || hero.spokenHe || hero.nameHe || hero.hebrew;
                    soundManager.speakGoHeroPrompt(hero.nameEn, heroSpeech);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'Locked Hero'
                    : isFainted
                    ? `${hero.nameEn} (${hero.title}) — Fainted 😵 (Visit בית חולים)`
                    : `${hero.nameEn} (${hero.title})`
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative shadow-2xs ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300 scale-105 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 text-purple-950 cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
              >
                <span
                  className={
                    isCaught
                      ? `text-base sm:text-lg md:text-xl leading-none select-none ${isFainted ? 'opacity-30' : ''}`
                      : "font-bold"
                  }
                  style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
                >
                  {isCaught ? (
                    hero.image ? (
                      <img
                        src={hero.image}
                        alt={hero.nameEn}
                        className={`w-6 h-6 sm:w-7 sm:h-7 object-contain leading-none select-none ${isFainted ? 'opacity-30' : ''}`}
                      />
                    ) : (
                      hero.emoji
                    )
                  ) : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: VILLAINS */}
      <div className="space-y-1.5 pt-2.5 border-t-2 border-emerald-200/90">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-rose-950 flex items-center gap-1.5 font-bold">🦹 Villains</span>
          <span className="font-bold text-rose-950 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtVillainIds.length} of {CATCH_VILLAINS.length}
          </span>
        </div>

        <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
          {CATCH_VILLAINS.map((villain) => {
            const hp = (villain.id === activeCompanionId ? playerHp : entityHpMap[villain.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtVillainSet.has(villain.id);
            const isActive = activeCompanionId === villain.id;

            return (
              <button
                key={villain.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(villain.id);
                    const villainSpeech = villain.ttsText || villain.speechText || villain.spokenHe || villain.nameHe || villain.hebrew;
                    soundManager.speakGoHeroPrompt(villain.nameEn, villainSpeech);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'Locked Villain'
                    : isFainted
                    ? `${villain.nameEn} (${villain.title}) — Fainted 😵 (Visit בית חולים)`
                    : `${villain.nameEn} (${villain.title})`
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative shadow-2xs ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300 scale-105 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300 text-rose-950 cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
              >
                <span
                  className={
                    isCaught
                      ? `text-base sm:text-lg md:text-xl leading-none select-none ${isFainted ? 'opacity-30' : ''}`
                      : "font-bold"
                  }
                  style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
                >
                  {isCaught ? villain.emoji : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: HOLIDAYS */}
      <div className="space-y-1.5 pt-2.5 border-t-2 border-emerald-200/90">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-sky-950 flex items-center gap-1.5 font-bold">🎉 Holidays</span>
          <span className="font-bold text-sky-950 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtHolidayIds.length} of {CATCH_HOLIDAYS.length}
          </span>
        </div>

        <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
          {CATCH_HOLIDAYS.map((holiday) => {
            const hp = (holiday.id === activeCompanionId ? playerHp : entityHpMap[holiday.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtHolidaySet.has(holiday.id);
            const isActive = activeCompanionId === holiday.id;

            return (
              <button
                key={holiday.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(holiday.id);
                    const holidaySpeech = holiday.ttsText || holiday.speechText || holiday.spokenHe || holiday.nameHe || holiday.hebrew;
                    soundManager.speakGoHeroPrompt(holiday.nameEn, holidaySpeech);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'Locked Holiday'
                    : isFainted
                    ? `${holiday.nameEn} (${holiday.title}) — Fainted 😵 (Visit בית חולים)`
                    : `${holiday.nameEn} (${holiday.title})`
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative shadow-2xs ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300 scale-105 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 hover:border-sky-300 text-sky-950 cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
              >
                <span
                  className={
                    isCaught
                      ? `text-base sm:text-lg md:text-xl leading-none select-none ${isFainted ? 'opacity-30' : ''}`
                      : "font-bold"
                  }
                  style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
                >
                  {isCaught ? holiday.emoji : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: KOSHER FOOD */}
      <div className="space-y-1.5 pt-2.5 border-t-2 border-emerald-200/90">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-amber-950 flex items-center gap-1.5 font-bold">
            🥪 Kosher Food
          </span>
          <span className="font-bold text-amber-950 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtKosherFoodIds.length} of {CATCH_KOSHER_FOODS.length}
          </span>
        </div>

        <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
          {CATCH_KOSHER_FOODS.map((food) => {
            const hp = (food.id === activeCompanionId ? playerHp : entityHpMap[food.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtKosherFoodSet.has(food.id);
            const isActive = activeCompanionId === food.id;

            return (
              <button
                key={food.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(food.id);
                    const foodSpeech = food.ttsText || food.speechText || food.spokenHe || food.nameHe || food.hebrew;
                    soundManager.speakGoHeroPrompt(food.nameEn, foodSpeech);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'Locked Kosher Food'
                    : isFainted
                    ? `${food.nameEn} (${food.title}) — Fainted 😵 (Visit בית חולים)`
                    : `${food.nameEn} (${food.title})`
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative shadow-2xs ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300 scale-105 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-950 cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
              >
                <span
                  className={
                    isCaught
                      ? `text-base sm:text-lg md:text-xl leading-none select-none ${isFainted ? 'opacity-30' : ''}`
                      : "font-bold"
                  }
                  style={!isCaught ? { fontFamily: "'Akoderf', sans-serif" } : undefined}
                >
                  {isCaught ? (
                    food.image ? (
                      <img
                        src={food.image}
                        alt={food.nameEn}
                        className={`w-6 h-6 sm:w-7 sm:h-7 object-contain leading-none select-none ${isFainted ? 'opacity-30' : ''}`}
                      />
                    ) : (
                      food.emoji
                    )
                  ) : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: THE FINAL FIVE (SOFIT LETTERS) */}
      <div className="space-y-1.5 pt-2.5 border-t-2 border-emerald-300/90">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-0.5">
          <span className="text-slate-900 flex items-center gap-1.5 font-bold">
            👑 The Final Five
          </span>
          <span className="font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
            {safeCaughtIds.filter((id) => id.startsWith('sofit_')).length} of {SOFIT_LETTERS.length}
          </span>
        </div>

        <div dir="rtl" className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-sm sm:max-w-md mx-auto">
          {SOFIT_LETTERS.map((sofitLetter, idx) => {
            const hp = (sofitLetter.id === activeCompanionId ? playerHp : entityHpMap[sofitLetter.id]) ?? 100;
            const isFainted = hp <= 0;
            const isCaught = isDevMode || caughtSet.has(sofitLetter.id);
            const isActive = activeCompanionId === sofitLetter.id;
            const anims = ['alefdexBounce', 'alefdexSquish', 'alefdexWiggle'];
            const animName = anims[idx % 3];
            const delay = (((idx + 22) * 0.5) % 4).toFixed(1);
            const duration = (3.6 + (idx % 3) * 0.7).toFixed(1);

            return (
              <button
                key={sofitLetter.id}
                type="button"
                disabled={!isCaught || isFainted}
                onClick={() => {
                  if (isCaught && !isFainted) {
                    setActiveCompanionId(sofitLetter.id);
                    soundManager.speakGoCompanionPrompt(sofitLetter.letter, sofitLetter.nameEn);
                    soundManager.playPop();
                  }
                }}
                title={
                  !isCaught
                    ? 'The Final Five (Locked)'
                    : isFainted
                    ? `${sofitLetter.nameEn} (${sofitLetter.letter}) — Fainted 😵 (Visit בית חולים)`
                    : `${sofitLetter.nameEn} (${sofitLetter.letter})`
                }
                className={`aspect-square w-full rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all select-none relative shadow-2xs ${
                  isCaught && isFainted
                    ? 'bg-slate-200/90 text-slate-400 border-slate-300 opacity-60 grayscale cursor-not-allowed shadow-none'
                    : isActive
                    ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-xs ring-2 ring-amber-300 scale-105 cursor-pointer active:scale-95'
                    : isCaught
                    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-600 shadow-2xs cursor-pointer active:scale-95'
                    : 'bg-emerald-200/50 text-emerald-800/40 border border-emerald-300/60 opacity-50 cursor-not-allowed'
                }`}
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                <span
                  className={`inline-block ${isCaught && isFainted ? 'opacity-30' : ''}`}
                  style={
                    isCaught && !isFainted
                      ? {
                          animationName: animName,
                          animationDuration: `${duration}s`,
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDelay: `${delay}s`,
                        }
                      : undefined
                  }
                >
                  {isCaught ? sofitLetter.letter : '?'}
                </span>
                {isCaught && isFainted && (
                  <span
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[11px] sm:text-xs leading-none select-none z-10 drop-shadow-xs"
                    title="Fainted 😵"
                  >
                    😵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-5 select-none overflow-x-hidden">
      {/* Battle Arena & Controls Container */}
      <div className="space-y-3 w-full max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 w-full max-w-5xl mx-auto px-2">
          {/* 2D Battle Field Stage Container Wrapper (allows badge overflow on bottom border) */}
          <div className="relative w-full lg:flex-1 min-w-0">
            {/* 2D Battle Field Stage Inner Frame */}
            <div
              className="relative w-full h-[280px] sm:h-[310px] md:h-[340px] lg:h-[350px] rounded-3xl bg-slate-900 border-3 border-amber-300 shadow-inner overflow-hidden isolate flex flex-col justify-between p-2.5 sm:p-3.5"
              style={{
                backgroundImage: currentStation?.image ? `url(${currentStation.image})` : currentStation?.bgImage ? `url(${currentStation.bgImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Background: Hospital ward if isInHospital, otherwise station photo/gradient */}
              {isInHospital ? (
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-teal-950 via-slate-900 to-emerald-950 transition-opacity duration-700 ${
                    isStationTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(20,184,166,0.3),transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                </div>
              ) : currentStation?.image || currentStation?.bgImage ? (
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                    isStationTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{
                    backgroundImage: `url(${currentStation.image || currentStation.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Visual overlay for contrast and crisp letter/card readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/40 to-slate-900/50 backdrop-blur-[0.5px]" />
                </div>
              ) : (
                <div
                  className={`absolute inset-0 ${getStationGradient(currentStation)} transition-opacity duration-700 ${
                    isStationTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}

              {isInHospital ? (
                /* HOSPITAL RECOVERY WARD INSIDE BATTLE ARENA */
                <div
                  className={`relative z-10 w-full h-full flex flex-col justify-between pt-0.5 pb-3 sm:pb-4 transition-opacity duration-700 ${
                    isStationTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {/* Hospital Top Ward Status Bar */}
                  <div className="flex items-center justify-between w-full">
                    <div className="bg-emerald-950/85 border border-emerald-400/80 text-emerald-200 px-2.5 py-0.5 sm:py-1 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold shadow-md backdrop-blur-xs">
                      <span className="text-sm sm:text-base">🏥</span>
                      <span>בית חולים Recovery Ward</span>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-400/40">
                        {damagedEntities.length > 0 ? `${damagedEntities.length} Injured` : 'All Healthy 💚'}
                      </span>
                    </div>
                    <div className="bg-slate-800/85 border border-teal-400/60 text-teal-200 px-2 py-0.5 sm:py-1 rounded-2xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <span>🩺</span>
                      <span>Nurse Cantor Yakov</span>
                    </div>
                  </div>

                  {/* Hospital Center: Healing in progress OR hospital beds */}
                  {isHealingInProgress ? (
                    <div className="flex-1 flex flex-col items-center justify-center my-auto space-y-2 sm:space-y-3 animate-fade-in">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border-3 border-emerald-400 text-2xl sm:text-3xl animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                        💖
                      </div>
                      <div className="text-center space-y-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-emerald-300">
                          בית חולים — Healing in Progress
                        </h3>
                        <p className="text-[11px] sm:text-xs text-emerald-100/90 font-bold">
                          Restoring health and vitality to your companions...
                        </p>
                      </div>

                      {/* HEALING PODS */}
                      <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
                        {selectedClinicIds.map((id) => {
                          const letter = ALL_LETTERS.find((l) => l.id === id);
                          const hero = ALL_COMPANIONS.find((c) => c.id === id);
                          const name = hero ? hero.nameEn : letter?.nameEn || id;
                          const display = hero ? hero.emoji : letter?.letter || '?';

                          return (
                            <div
                              key={id}
                              className="w-12 h-14 sm:w-15 sm:h-18 rounded-2xl bg-emerald-900/80 border-2 border-emerald-400 flex flex-col items-center justify-center p-1 relative shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-bounce"
                              style={{ animationDuration: '1.5s' }}
                            >
                              <span className="text-lg sm:text-xl font-bold font-hebrew text-white">
                                {display}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-emerald-200 truncate max-w-full">
                                {name}
                              </span>
                              <div className="absolute -top-1.5 -right-1.5 text-[10px] animate-ping">
                                💖
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-emerald-300">
                          <span>Restoring HP</span>
                          <span>{healingProgress}%</span>
                        </div>
                        <div className="w-full h-3.5 sm:h-4 bg-slate-800 rounded-full p-0.5 border-2 border-emerald-400 overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-400 transition-all duration-150"
                            style={{ width: `${healingProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center my-auto py-1">
                      {damagedEntities.length === 0 ? (
                        <div className="bg-slate-900/85 border-2 border-emerald-400/80 rounded-3xl p-3 sm:p-5 text-center max-w-sm sm:max-w-md w-full shadow-xl backdrop-blur-xs space-y-2.5 animate-fade-in">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-2xl sm:text-3xl">
                            💚
                          </div>
                          <div className="space-y-0.5">
                            <h3 className="text-sm sm:text-base font-bold text-emerald-300">
                              All Companions at 100% Health!
                            </h3>
                            <p className="text-[11px] sm:text-xs text-slate-300 font-bold">
                              Everyone in your Alef-Dex is fully rested and ready to battle. No medical attention needed right now!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleExitHospital}
                            className="w-full py-2 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>🚂</span>
                            <span>Return to Train Battle</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full space-y-2 flex flex-col items-center justify-center">
                          <div className="text-center">
                            <p className="text-[11px] sm:text-xs font-bold text-emerald-200">
                              {selectedClinicIds.length === 0
                                ? 'Select injured companions on the right panel to place them into clinic pods.'
                                : `${selectedClinicIds.length} companion${selectedClinicIds.length > 1 ? 's' : ''} in clinic pods — ready for treatment:`}
                            </p>
                          </div>

                          {/* Clinic Pods for selected companions */}
                          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
                            {selectedClinicIds.length === 0 ? (
                              <div className="h-16 sm:h-20 w-full max-w-xs sm:max-w-sm rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-950/30 flex flex-col items-center justify-center text-teal-300/80 p-1.5 text-center">
                                <span className="text-xl mb-0.5">🩹</span>
                                <span className="text-[11px] font-bold">Treatment pods are empty</span>
                                <span className="text-[9px] text-teal-400/60 mt-0.5">Click injured companions on the right to heal them</span>
                              </div>
                            ) : (
                              selectedClinicIds.map((id) => {
                                const letter = ALL_LETTERS.find((l) => l.id === id);
                                const hero = ALL_COMPANIONS.find((c) => c.id === id);
                                const name = hero ? hero.nameEn : letter?.nameEn || id;
                                const display = hero ? hero.emoji : letter?.letter || '?';
                                const hp = entityHpMap[id] ?? 100;

                                return (
                                  <div
                                    key={id}
                                    className="w-16 sm:w-20 p-1 sm:p-1.5 rounded-2xl bg-slate-900/90 border-2 border-teal-400/80 shadow-lg flex flex-col items-center justify-between text-center relative group"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedClinicIds((prev) => prev.filter((i) => i !== id))}
                                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold flex items-center justify-center shadow-xs cursor-pointer"
                                      title="Remove from pod"
                                    >
                                      ✕
                                    </button>
                                    <span className="text-xl sm:text-2xl font-bold font-hebrew text-white">
                                      {display}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                                      {name}
                                    </span>
                                    <div className="w-full mt-0.5">
                                      <div className="flex justify-between text-[8px] font-bold text-slate-300">
                                        <span>HP</span>
                                        <span>{hp}/100</span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            hp > 50 ? 'bg-emerald-500' : hp > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${hp}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Start Healing button inside the battle field during Hospital visits */}
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
                            <button
                              type="button"
                              disabled={selectedClinicIds.length === 0 || isHealingInProgress}
                              onClick={handleStartHealing}
                              className={`px-4 py-1.5 sm:py-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 border-2 cursor-pointer ${
                                selectedClinicIds.length > 0
                                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105'
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <span className="text-sm sm:text-base">💚</span>
                              <span>
                                {selectedClinicIds.length === 0
                                  ? 'Start Healing (0)'
                                  : `Start Healing (${selectedClinicIds.length})`}
                              </span>
                            </button>

                            {selectedClinicIds.length < Math.min(5, damagedEntities.length) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClinicIds(damagedEntities.slice(0, 5));
                                  soundManager.playPop();
                                }}
                                className="px-2.5 py-1.5 sm:py-2 rounded-2xl bg-teal-900/85 hover:bg-teal-800 text-teal-200 hover:text-white font-bold text-[10px] sm:text-[11px] shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 border border-teal-500/50"
                                title="Select up to 5 injured companions"
                              >
                                <span>⚡</span>
                                <span>All ({Math.min(5, damagedEntities.length)})</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleExitHospital}
                              className="px-2.5 py-1.5 sm:py-2 rounded-2xl bg-slate-800/85 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] sm:text-[11px] shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 border border-slate-600/70"
                            >
                              <span>🚂</span>
                              <span>Back</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Wild Letter, Hero, or Holiday (Upper Area: Sprite & Wild HP Card Grouped Together) */}
                  <div
                    className={`flex items-center justify-end gap-2 sm:gap-3.5 w-full z-10 mr-0.5 sm:mr-1.5 transition-opacity duration-700 ${
                      isStationTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {/* Wild Enemy Status Card (Sits right next to opponent sprite) */}
                    <div
                      className={`bg-white text-slate-800 rounded-2xl p-1.5 sm:p-2 border-2 shadow-md w-38 sm:w-46 md:w-50 shrink-0 ${
                        wildHero
                          ? wildHero.alignment === 'holiday'
                            ? 'border-sky-400'
                            : wildHero.alignment === 'villain'
                            ? 'border-rose-400'
                            : wildHero.alignment === 'kosher_food'
                            ? 'border-amber-400'
                            : 'border-purple-400'
                          : 'border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm">
                        <span className="flex items-center gap-1 overflow-hidden min-w-0">
                          {wildHero ? (
                            <span
                              className={`${
                                wildHero.alignment === 'kosher_food'
                                  ? "text-amber-950 font-bold"
                                  : wildHero.alignment === 'villain'
                                  ? "text-rose-950 font-bold"
                                  : wildHero.alignment === 'holiday'
                                  ? "text-sky-950 font-bold"
                                  : "text-purple-950 font-bold"
                              } truncate`}
                            >
                              {wildHero.alignment === 'kosher_food' ? `Wild ${wildHero.nameEn}` : wildHero.nameEn}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-900 truncate">Wild</span>
                              <span
                                className={`font-hebrew font-bold text-base shrink-0 ${isSofitLetter(wildLetter) ? 'text-black' : 'text-amber-700'}`}
                                style={{ fontFamily: "'Akoderf', sans-serif" }}
                              >
                                {wildLetter.letter}
                              </span>
                            </span>
                          )}
                        </span>
                        <span
                          className={`${
                            wildHero
                              ? wildHero.alignment === 'holiday'
                                ? 'text-sky-700'
                                : wildHero.alignment === 'villain'
                                ? 'text-rose-700'
                                : wildHero.alignment === 'kosher_food'
                                ? 'text-amber-700'
                                : 'text-purple-700'
                              : 'text-emerald-700'
                          } font-bold text-xs shrink-0 ml-1`}
                        >
                          Lv.{wildLevel}
                        </span>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {/* HP Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                            <span
                              className={`${
                                wildHero
                                  ? wildHero.alignment === 'holiday'
                                    ? 'text-sky-700'
                                    : wildHero.alignment === 'villain'
                                    ? 'text-rose-700'
                                    : wildHero.alignment === 'kosher_food'
                                    ? 'text-amber-700'
                                    : 'text-purple-700'
                                  : 'text-emerald-700'
                              } font-bold`}
                            >
                              HP
                            </span>
                            <span className="tabular-nums font-bold">{wildHp}/{maxWildHp}</span>
                          </div>
                          <div className="w-full h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300 shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                wildHp > 50 ? 'bg-emerald-500' : wildHp > 20 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                              }`}
                              style={{ width: `${(wildHp / maxWildHp) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wild Enemy Sprite (Right next to Wild HP Card) */}
                    <div className={`flex flex-col items-center justify-center shrink-0 transition-all duration-700 ease-in-out ${
                      isStationTransitioning ? 'opacity-0' : (battlePhase === 'wild_fainted' ? 'opacity-0 scale-75 grayscale' : 'opacity-100 scale-100')
                    }`}>
                      {wildHero ? (
                        wildHero.image ? (
                          <img
                            src={wildHero.image}
                            alt={wildHero.nameEn}
                            className={`w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm transition-transform hover:scale-105 select-none ${
                              isWildShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                            }`}
                          />
                        ) : (
                          <span
                            className={`text-3xl sm:text-4xl drop-shadow-sm transition-transform hover:scale-105 select-none ${
                              isWildShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                            }`}
                          >
                            {wildHero.emoji}
                          </span>
                        )
                      ) : (
                        <span
                          className={`text-5xl sm:text-6xl font-bold font-hebrew ${
                            isSofitLetter(wildLetter)
                              ? 'text-black drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]'
                              : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]'
                          } transition-transform hover:scale-110 select-none ${
                            isWildShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                          }`}
                          style={{
                            color: isSofitLetter(wildLetter) ? '#000000' : (wildLetter.color || '#000000'),
                            fontFamily: "'Akoderf', sans-serif",
                          }}
                        >
                          {wildLetter.letter}
                        </span>
                      )}
                    </div>
                  </div>

                  <style>{`
                    @keyframes alefdexWiggle {
                      0%, 80%, 100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
                      85% { transform: translateY(0) translateX(-2px) rotate(-5deg) scale(1.05); }
                      90% { transform: translateY(0) translateX(2px) rotate(5deg) scale(1.05); }
                      95% { transform: translateY(0) translateX(-1px) rotate(-2deg) scale(1.02); }
                    }

                    @keyframes alefdexBounce {
                      0%, 75%, 100% { transform: translateY(0) scale(1); }
                      80% { transform: translateY(0) scaleY(1.1) scaleX(0.95); }
                      85% { transform: translateY(0) scaleY(0.95) scaleX(1.05); }
                      90% { transform: translateY(0) scale(1.02); }
                    }

                    @keyframes alefdexSquish {
                      0%, 70%, 100% { transform: translateY(0) scale(1); }
                      75% { transform: translateY(0) scaleX(1.12) scaleY(0.9); }
                      82% { transform: translateY(0) scaleX(0.92) scaleY(1.1); }
                      88% { transform: translateY(0) scaleX(1.04) scaleY(0.98); }
                    }

                    @keyframes flyToWildTarget {
                      0% {
                        left: 2.5rem;
                        top: calc(100% - 5.5rem);
                        transform: scale(0.6) rotate(0deg);
                        opacity: 0.85;
                      }
                      50% {
                        transform: scale(1.3) rotate(180deg);
                        opacity: 1;
                      }
                      100% {
                        left: calc(100% - 5rem);
                        top: 1.5rem;
                        transform: scale(1) rotate(360deg);
                        opacity: 1;
                      }
                    }

                    @keyframes flyToPlayerTarget {
                      0% {
                        left: calc(100% - 5rem);
                        top: 1.5rem;
                        transform: scale(0.6) rotate(0deg);
                        opacity: 0.85;
                      }
                      50% {
                        transform: scale(1.3) rotate(-180deg);
                        opacity: 1;
                      }
                      100% {
                        left: 2.5rem;
                        top: calc(100% - 5.5rem);
                        transform: scale(1) rotate(-360deg);
                        opacity: 1;
                      }
                    }

                    .animate-fly-to-wild-target {
                      animation: flyToWildTarget 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }

                    .animate-fly-to-player-target {
                      animation: flyToPlayerTarget 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                  `}</style>

                  {flyingAttack && (
                    <div
                      className={`absolute z-30 p-1.5 sm:p-2 rounded-full bg-amber-400 border-2 border-amber-600 shadow-lg pointer-events-none select-none ${
                        flyingAttack.direction === 'to_player'
                          ? 'animate-fly-to-player-target'
                          : 'animate-fly-to-wild-target'
                      }`}
                    >
                      {flyingAttack.image ? (
                        <img
                          src={flyingAttack.image}
                          alt="Attack projectile"
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                        />
                      ) : (
                        <span className="text-base sm:text-lg">{flyingAttack.emoji || '⚡'}</span>
                      )}
                    </div>
                  )}

                  {(battlePhase === 'throwing_ball' || battlePhase === 'wiggling' || battlePhase === 'caught') && (
                    <div
                      className="absolute right-8 sm:right-16 top-4 z-30 flex flex-col items-center animate-ball-throw"
                    >
                      <AlefBallIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-lg" />
                    </div>
                  )}

                  {damagePopup && (
                    <div
                      className={`absolute z-40 font-bold text-2xl sm:text-4xl drop-shadow-md animate-bounce pointer-events-none select-none ${
                        damagePopup.target === 'wild' ? 'right-12 top-6' : 'left-12 bottom-12'
                      } ${
                        damagePopup.isMiss
                          ? 'text-sky-600 bg-white/95 px-3 py-1 rounded-2xl border-2 border-sky-400'
                          : damagePopup.isCrit
                          ? 'text-amber-300 bg-rose-600 px-3 py-1 rounded-2xl border-2 border-amber-300 ring-4 ring-amber-300 scale-110'
                          : 'text-rose-600'
                      }`}
                    >
                      {damagePopup.isMiss
                        ? 'MISS! 💨'
                        : damagePopup.isCrit
                        ? `💥 CRIT! -${damagePopup.amount} HP`
                        : `-${damagePopup.amount} HP!`}
                    </div>
                  )}

                  {/* Companion Player (Lower Area: Sprite & Player HP Card Grouped Together, shifted slightly upward) */}
                  <div
                    className={`flex items-center justify-start gap-2 sm:gap-3.5 w-full z-10 ml-0.5 sm:ml-1.5 mb-2 sm:mb-2.5 transition-all duration-700 ${
                      isStationTransitioning ? 'opacity-0' : (isCompanionFadingOut || playerHp <= 0 ? 'opacity-25 scale-90 blur-[0.5px]' : 'opacity-100 scale-100')
                    }`}
                  >
                    {/* Player Sprite (Side-by-side with Player HP card) */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      {isHeroActive && activeHero ? (
                        activeHero.image ? (
                          <img
                            src={activeHero.image}
                            alt={activeHero.nameEn}
                            className={`w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm transition-transform hover:scale-105 select-none ${
                              isPlayerShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                            }`}
                          />
                        ) : (
                          <span
                            className={`text-3xl sm:text-4xl drop-shadow-sm transition-transform hover:scale-105 select-none ${
                              isPlayerShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                            }`}
                          >
                            {activeHero.emoji}
                          </span>
                        )
                      ) : (
                        <span
                          className={`text-5xl sm:text-6xl font-bold font-hebrew ${
                            isSofitLetter(playerLetter)
                              ? 'text-black drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]'
                              : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]'
                          } transition-transform hover:scale-110 select-none ${
                            isPlayerShaking ? 'animate-bounce ring-4 ring-rose-400 scale-95' : ''
                          }`}
                          style={{
                            color: isSofitLetter(playerLetter) ? '#000000' : (playerLetter.color || '#000000'),
                            fontFamily: "'Akoderf', sans-serif",
                          }}
                        >
                          {playerLetter.letter}
                        </span>
                      )}
                    </div>

                    {/* Player HP & Status Card */}
                    <div
                      className={`bg-white text-slate-800 rounded-2xl p-1.5 sm:p-2 border-2 shadow-md w-38 sm:w-46 md:w-50 shrink-0 ${
                        isHeroActive
                          ? activeHero?.alignment === 'holiday'
                            ? 'border-sky-400'
                            : activeHero?.alignment === 'villain'
                            ? 'border-rose-400'
                            : 'border-purple-400'
                          : 'border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm">
                        <span className="flex items-center gap-1 overflow-hidden min-w-0">
                          {isHeroActive && activeHero ? (
                            <span
                              className={`${
                                activeHero.alignment === 'holiday'
                                  ? 'text-sky-950'
                                  : activeHero.alignment === 'villain'
                                  ? 'text-rose-950'
                                  : 'text-purple-950'
                              } font-bold truncate`}
                            >
                              {activeHero.nameEn}
                            </span>
                          ) : (
                            <span
                              className={`font-hebrew font-bold text-base shrink-0 ${isSofitLetter(playerLetter) ? 'text-black' : 'text-amber-700'}`}
                              style={{ fontFamily: "'Akoderf', sans-serif" }}
                            >
                              {playerLetter.letter}
                            </span>
                          )}
                        </span>
                        <span
                          className={`${
                            isHeroActive
                              ? activeHero?.alignment === 'holiday'
                                ? 'text-sky-700'
                                : activeHero?.alignment === 'villain'
                                ? 'text-rose-700'
                                : 'text-purple-700'
                              : 'text-amber-700'
                          } font-bold text-xs shrink-0 ml-1 flex items-center gap-1`}
                        >
                          <span>Lv.{playerLevel}</span>
                          {xpPopup && (
                            <span className="bg-purple-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full animate-bounce shadow-xs">
                              +{xpPopup.amount} XP
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {/* HP Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                            <span
                              className={`${
                                isHeroActive
                                  ? activeHero?.alignment === 'holiday'
                                    ? 'text-sky-700'
                                    : activeHero?.alignment === 'villain'
                                    ? 'text-rose-700'
                                    : 'text-purple-700'
                                  : 'text-amber-700'
                              } font-bold`}
                            >
                              HP
                            </span>
                            <span className="tabular-nums font-bold">{playerHp}/{maxPlayerHp}</span>
                          </div>
                          <div className="w-full h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300 shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                playerHp > 50 ? 'bg-emerald-500' : playerHp > 20 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                              }`}
                              style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* XP Bar */}
                        <div>
                          <div className="flex justify-between text-[9px] font-bold text-purple-700 mb-0.5">
                            <span className="font-bold flex items-center gap-0.5">
                              <span>⭐</span>
                              <span>XP</span>
                            </span>
                            <span className="tabular-nums font-bold">{playerXp} / {playerLevel * 50}</span>
                          </div>
                          <div className="w-full h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-purple-200 shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                              style={{ width: `${Math.min(100, (playerXp / (playerLevel * 50)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* In-Battlefield Tracing Overlay */}
              {tracingTargetLetter && (
                <BattlefieldTracer
                  letter={tracingTargetLetter}
                  onComplete={handleTracingComplete}
                  onCancel={handleCancelTracing}
                />
              )}
            </div>

            {/* Israel Railways / Hospital Arena Badge (Straddling Bottom Border Centered) */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 bg-white border-2 border-amber-300 rounded-xl px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-slate-800 shadow-md flex items-center gap-1.5 select-text pointer-events-auto cursor-text whitespace-nowrap"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            >
              {isInHospital ? (
                <>
                  <span className="select-none pointer-events-none">🏥</span>
                  <span className="select-text cursor-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
                    בית חולים (Hebrew Hospital & Recovery Clinic)
                  </span>
                </>
              ) : (
                <>
                  <span className="select-none pointer-events-none">🏛️</span>
                  <span className="select-text cursor-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
                    {currentStation.nameEn} Station
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Control Sidebar (Docked 30-35% width) */}
          <div className="w-full lg:w-80 shrink-0 bg-emerald-100/95 rounded-2xl md:rounded-3xl p-2 sm:p-3 border-2 border-emerald-300/90 shadow-md flex flex-col justify-between gap-1.5 sm:gap-2">
            {isInHospital ? (
              /* HOSPITAL TREATMENT CONTROLS SIDEBAR */
              <div className="flex flex-col h-full justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between px-1">
                    <span>Clinic Patients:</span>
                    <span className="text-rose-700 font-bold">
                      {damagedEntities.length} Injured
                    </span>
                  </div>

                  {damagedEntities.length === 0 ? (
                    <div className="bg-white/90 border border-emerald-300 rounded-2xl p-4 text-center space-y-2">
                      <span className="text-3xl">💚</span>
                      <h4 className="text-xs font-bold text-emerald-900">All Companions at 100% HP</h4>
                      <p className="text-[11px] text-emerald-700 font-bold">
                        No injured companions in your Alef-Dex. Everyone is ready for train battles!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-white/80 border border-emerald-300/80 px-2 py-1 rounded-xl text-[10px] font-bold text-slate-700">
                        <span>{selectedClinicIds.length}/5 Selected</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedClinicIds.length === Math.min(5, damagedEntities.length)) {
                              setSelectedClinicIds([]);
                            } else {
                              setSelectedClinicIds(damagedEntities.slice(0, 5));
                            }
                            soundManager.playPop();
                          }}
                          className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                        >
                          {selectedClinicIds.length === Math.min(5, damagedEntities.length) ? 'Clear All' : 'Select All (Max 5)'}
                        </button>
                      </div>

                      {/* Filtered list of injured companions ONLY (HP < 100) */}
                      <div className="max-h-48 sm:max-h-56 overflow-y-auto space-y-1 p-0.5">
                        {damagedEntities.map((id: string) => {
                          const letter = ALL_LETTERS.find((l) => l.id === id);
                          const hero = ALL_COMPANIONS.find((c) => c.id === id);
                          const name = hero ? hero.nameEn : letter?.nameEn || id;
                          const display = hero ? hero.emoji : letter?.letter || '?';
                          const hp = entityHpMap[id] ?? 100;
                          const isSelected = selectedClinicIds.includes(id);

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedClinicIds((prev) => prev.filter((i) => i !== id));
                                } else {
                                  if (selectedClinicIds.length >= 5) {
                                    soundManager.playPop();
                                    return;
                                  }
                                  setSelectedClinicIds((prev) => [...prev, id]);
                                }
                                soundManager.playPop();
                              }}
                              className={`w-full p-1.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-rose-50 border-rose-500 shadow-xs ring-2 ring-rose-300'
                                  : 'bg-white/90 hover:bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-sm shrink-0 font-hebrew">
                                  {display}
                                </span>
                                <div className="truncate">
                                  <div className="font-bold text-[11px] text-slate-800 truncate">
                                    {name}
                                  </div>
                                  <div className="text-[9px] font-bold text-rose-600">
                                    {hp === 0 ? '💫 Fainted (0 HP)' : `${hp}/100 HP`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                                  <div
                                    className={`h-full rounded-full ${
                                      hp > 50 ? 'bg-emerald-500' : hp > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${hp}%` }}
                                  />
                                </div>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-rose-500 text-white' : 'border border-slate-300 text-transparent'
                                }`}>
                                  ✓
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 border-t border-emerald-200/90">
                  <button
                    type="button"
                    disabled={selectedClinicIds.length === 0 || isHealingInProgress}
                    onClick={handleStartHealing}
                    className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>💚</span>
                    <span>Start Healing ({selectedClinicIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitHospital}
                    className="w-full py-1.5 px-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-300 shadow-2xs"
                  >
                    <span>🚂</span>
                    <span>Back to Train Station</span>
                  </button>
                </div>
              </div>
            ) : (
              /* NORMAL BATTLE ATTACK MOVES & ACTIONS */
              <div className="flex flex-col md:flex-row lg:flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-2.5 w-full">
                {/* Attack Moves: Left side on tablet / Top on mobile & widescreen desktop */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {/* Attack Moves Header */}
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">Attack Moves:</span>
                      {isDevMode && (
                        <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs tracking-normal shrink-0">
                          <span>🛠️</span>
                          <span>DEV MODE</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={
                          isHeroActive
                            ? activeHero?.alignment === 'holiday'
                              ? 'text-sky-800 font-bold'
                              : activeHero?.alignment === 'villain'
                              ? 'text-rose-800 font-bold'
                              : 'text-purple-800 font-bold'
                            : 'text-amber-700 font-bold'
                        }
                      >
                        {playerMoves.length}{isDevMode ? `/${fullAttackLibrary.length}` : ''} Moves
                      </span>
                    </div>
                  </div>

                  {/* Attack Buttons grid (4 or 5 moves) */}
                  <div
                    className={`grid ${
                      playerMoves.length >= 5 ? 'grid-cols-5 gap-1 sm:gap-1.5' : 'grid-cols-4 gap-2'
                    } ${
                      isDevMode && playerMoves.length > 5 ? 'max-h-48 sm:max-h-56 overflow-y-auto p-0.5' : 'p-0.5'
                    }`}
                  >
                    {playerMoves.map((move, idx) => {
                      const isNoahGoat =
                        move.wordEn.toLowerCase().includes("noah's goat") ||
                        (activeHero?.id === 'noah_and_naamah' &&
                          (move.wordEn.toLowerCase().includes('goat') || move.emoji?.includes('🐐'))) ||
                        move.wordEn.toLowerCase().includes('goat');

                      return (
                        <button
                          key={move.wordEn + idx}
                          type="button"
                          disabled={battlePhase !== 'player_turn'}
                          onClick={() => handlePlayerAttack(move)}
                          className={`aspect-square w-full rounded-xl sm:rounded-2xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 shadow-2xs group ${
                            move.isHeroMove
                              ? activeHero?.alignment === 'holiday'
                                ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 hover:border-sky-400'
                                : activeHero?.alignment === 'villain'
                                ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 hover:border-rose-400'
                                : 'bg-purple-50 hover:bg-purple-100 border-purple-300 hover:border-purple-400'
                              : 'bg-amber-50 hover:bg-amber-100/90 border-amber-300 hover:border-amber-400'
                          }`}
                          title={`${move.wordEn} (${move.power} DMG)`}
                        >
                          {/* ONLY the emoji icon */}
                          {isNoahGoat ? (
                            <div className="flex items-center justify-center gap-0.5 group-hover:scale-110 transition-transform shrink-0 select-none">
                              <span className="text-xl">🐐</span>
                              <span className="text-xs font-bold text-amber-700">×14</span>
                            </div>
                          ) : move.image ? (
                            <img
                              src={move.image}
                              alt={move.wordEn}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain group-hover:scale-110 transition-transform shrink-0"
                            />
                          ) : move.emoji ? (
                            <span className="text-xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform shrink-0 select-none leading-none">
                              {move.emoji}
                            </span>
                          ) : (
                            <span
                              className="text-base sm:text-lg md:text-xl font-bold font-hebrew text-slate-900 select-none leading-none shrink-0 group-hover:scale-110 transition-transform"
                              style={{ fontFamily: "'Akoderf', sans-serif" }}
                            >
                              {move.wordHe}
                            </span>
                          )}

                          {/* ONLY the HP badge */}
                          <span className="text-[8px] sm:text-[9px] font-bold text-rose-600 bg-rose-50/90 px-1 sm:px-1.5 py-0.5 rounded-md border border-rose-200 leading-none shrink-0">
                            {move.power} DMG
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Action Buttons: Right side column on tablet / Stacked beneath on mobile & desktop */}
                <div className="flex flex-col gap-1.5 md:w-64 md:shrink-0 lg:w-full border-t border-emerald-200/90 pt-2 md:border-t-0 md:pt-0 md:border-l md:pl-4 md:border-emerald-200/90 lg:border-l-0 lg:pl-0 lg:border-t lg:pt-2">
                  {/* Action Button 1: Throw Alef-Ball */}
                  <button
                    type="button"
                    disabled={battlePhase !== 'player_turn'}
                    onClick={handleThrowAlefBall}
                    className="w-full py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-[11px] sm:text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5"
                  >
                    <AlefBallIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 drop-shadow-xs" />
                    <span>Throw Alef-Ball</span>
                  </button>

                  {/* Action Button 2: Next Station */}
                  <button
                    type="button"
                    onClick={() => startWildEncounter()}
                    className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-emerald-200/90 hover:bg-emerald-300 text-emerald-950 font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 border border-emerald-300/80 truncate shadow-2xs active:scale-95"
                  >
                    <span className="shrink-0 text-xs sm:text-sm">🚂</span>
                    <span className="truncate">Next Station</span>
                  </button>

                  {/* Action Button 3: Visit בית חולים (Hospital) */}
                  <button
                    type="button"
                    onClick={handleOpenClinic}
                    className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border border-rose-300 shadow-2xs truncate active:scale-95"
                  >
                    <span className="shrink-0 text-xs">🏥</span>
                    <span className="truncate">Visit בית חולים (Hospital)</span>
                  </button>

                  {/* Dev Mode extra tools (Travel Station & Menu) */}
                  {isDevMode && (
                    <div className="space-y-1.5 pt-1.5 border-t border-purple-200/80">
                      {/* Station Travel Picker */}
                      <div className="space-y-1 bg-purple-50/90 border border-purple-200 rounded-xl p-1.5 text-left">
                        <div className="flex items-center justify-between text-[10px] font-bold text-purple-900">
                          <span className="flex items-center gap-1">
                            <Train className="w-3 h-3 text-purple-700 shrink-0" />
                            <span>Travel Station</span>
                          </span>
                          <span className="text-[9px] bg-purple-200/90 text-purple-900 font-bold px-1.5 py-0.5 rounded-full">Dev</span>
                        </div>
                        <select
                          value={currentStation.id}
                          onChange={(e) => {
                            const st = ISRAEL_RAILWAYS_STATIONS.find((s) => s.id === e.target.value);
                            if (st) handleTravelToStation(st);
                          }}
                          aria-label="Select Train Station"
                          className="w-full text-[10px] sm:text-[11px] font-bold text-slate-800 bg-white border border-purple-300 rounded-lg p-1 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                        >
                          {sortedDevStations.map((st, index) => (
                            <option key={st.id} value={st.id}>
                              {index + 1}. {st.nameEn} ({st.nameHe})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsDevArenaOpen(true)}
                          className="w-full py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs truncate"
                          title="Open Dev Mode Menu"
                        >
                          <Trophy className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">Dev Menu</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExitDevMode}
                          className="w-full py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1 border border-rose-200 truncate"
                          title="Exit Dev Mode"
                        >
                          <span className="shrink-0">❌</span>
                          <span className="truncate">Exit Dev</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
      </div>
    </div>
  </div>

      {/* Alef-Dex (Underneath Battle Arena) */}
      {renderAlefDex()}

      {/* Bottom Controls: Replay Intro (Left) & Dev Mode (Right) */}
      <div className="flex items-center justify-between gap-2 px-2 pt-1.5 text-emerald-300/70">
        {/* Replay Intro Button (Bottom Left) */}
        <button
          type="button"
          onClick={() => {
            cancelAllVoiceNarration();
            soundManager.setMuted(false);
            setChiptuneMuted(false);
            if (onReplayIntro) {
              onReplayIntro();
            }
            window.dispatchEvent(new CustomEvent('alefbet_replay_intro'));
          }}
          className="text-[11px] font-bold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-900 px-2.5 py-1 rounded-xl border border-emerald-700/80 shadow-2xs transition-all cursor-pointer select-none flex items-center gap-1 active:scale-95"
          title="Watch 8-bit Retro Intro Cinematic"
        >
          <span>🎬</span>
          <span>Watch Intro</span>
        </button>

        {/* Dev Mode Controls (Bottom Right) */}
        <div className="flex items-center gap-2">
          {isDevMode ? (
            <>
              <button
                type="button"
                onClick={() => setIsDevArenaOpen(true)}
                className="text-[11px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-xl border border-purple-300 shadow-2xs transition-all cursor-pointer select-none flex items-center gap-1"
                title="Re-enter Dev Mode Menu"
              >
                <span>⚙️</span>
                <span>Dev Mode Menu</span>
              </button>
              <button
                type="button"
                onClick={handleExitDevMode}
                className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-300 shadow-2xs transition-all cursor-pointer select-none flex items-center gap-1"
                title="Exit Dev Mode"
              >
                <span>❌</span>
                <span>Exit Dev Mode</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDevModeClick}
              className="text-[11px] font-bold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-900 px-2.5 py-1 rounded-xl border border-emerald-700/80 shadow-2xs transition-all cursor-pointer select-none flex items-center gap-1"
              title="Secret Dev Mode"
            >
              <span>⚙️</span>
              <span>Dev Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* DEV PASSWORD MODAL */}
      {isDevPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-300 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🔐</span>
                <span>Developer Mode</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDevPasswordModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyDevPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Enter Password:</label>
                <input
                  type="password"
                  value={devPasswordInput}
                  onChange={(e) => {
                    setDevPasswordInput(e.target.value);
                    setDevPasswordError(false);
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-purple-500 focus:outline-hidden text-base font-bold text-slate-800"
                />
                {devPasswordError && (
                  <p className="text-xs font-bold text-rose-600 mt-1">Incorrect password. Try again!</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDevPasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEV ARENA OPPONENT & STATION SELECTOR MODAL */}
      {isDevArenaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-purple-300 overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <h3 className="font-bold text-base">Dev Mode Menu: Opponents</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExitDevMode}
                  className="px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>❌</span>
                  <span>Exit Dev Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDevArenaOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold cursor-pointer"
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">📜 Letters (22)</h4>
                <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
                  {letters.map((letObj) => (
                    <button
                      key={letObj.id}
                      type="button"
                      title={letObj.nameEn}
                      onClick={() => startEncounterWithEntity(letObj)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      <span
                        className="text-base sm:text-lg font-bold font-hebrew text-amber-900 group-hover:scale-110 transition-transform leading-none"
                        style={{ fontFamily: "'Akoderf', sans-serif" }}
                      >
                        {letObj.letter}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">⚔️ Heroes</h4>
                <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
                  {CATCH_HEROES.map((hero) => (
                    <button
                      key={hero.id}
                      type="button"
                      title={hero.nameEn}
                      onClick={() => startEncounterWithEntity(hero)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      {hero.image && (!hero.emoji || hero.emoji.includes('<img')) ? (
                        <img src={hero.image} alt={hero.nameEn} className="w-5 h-5 sm:w-6 sm:h-6 object-contain inline-block group-hover:scale-110 transition-transform select-none" />
                      ) : (
                        <span className="text-base sm:text-lg md:text-xl leading-none select-none group-hover:scale-110 transition-transform">{hero.emoji}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2">🦹 Villains</h4>
                <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
                  {CATCH_VILLAINS.map((villain) => (
                    <button
                      key={villain.id}
                      type="button"
                      title={villain.nameEn}
                      onClick={() => startEncounterWithEntity(villain)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      {villain.image && (!villain.emoji || villain.emoji.includes('<img')) ? (
                        <img src={villain.image} alt={villain.nameEn} className="w-5 h-5 sm:w-6 sm:h-6 object-contain inline-block group-hover:scale-110 transition-transform select-none" />
                      ) : (
                        <span className="text-base sm:text-lg md:text-xl leading-none select-none group-hover:scale-110 transition-transform">{villain.emoji}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-2">🎉 Holidays</h4>
                <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
                  {CATCH_HOLIDAYS.map((holiday) => (
                    <button
                      key={holiday.id}
                      type="button"
                      title={holiday.nameEn}
                      onClick={() => startEncounterWithEntity(holiday)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      {holiday.image && (!holiday.emoji || holiday.emoji.includes('<img')) ? (
                        <img src={holiday.image} alt={holiday.nameEn} className="w-5 h-5 sm:w-6 sm:h-6 object-contain inline-block group-hover:scale-110 transition-transform select-none" />
                      ) : (
                        <span className="text-base sm:text-lg md:text-xl leading-none select-none group-hover:scale-110 transition-transform">{holiday.emoji}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">🥪 Kosher Food</h4>
                <div className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
                  {CATCH_KOSHER_FOODS.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      title={food.nameEn}
                      onClick={() => startEncounterWithEntity(food)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      {food.image && (!food.emoji || food.emoji.includes('<img')) ? (
                        <img src={food.image} alt={food.nameEn} className="w-5 h-5 sm:w-6 sm:h-6 object-contain inline-block group-hover:scale-110 transition-transform select-none" />
                      ) : (
                        <span className="text-base sm:text-lg md:text-xl leading-none select-none group-hover:scale-110 transition-transform">{food.emoji}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">👑 The Final Five (Sofit)</h4>
                <div dir="rtl" className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-xs mx-auto">
                  {SOFIT_LETTERS.map((sofitLetter) => (
                    <button
                      key={sofitLetter.id}
                      type="button"
                      title={sofitLetter.nameEn}
                      onClick={() => startEncounterWithEntity(sofitLetter)}
                      className="aspect-square w-full rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center transition-all cursor-pointer group hover:scale-105 active:scale-95 shadow-2xs"
                    >
                      <span
                        className="text-base sm:text-lg font-bold font-hebrew text-slate-900 group-hover:scale-110 transition-transform leading-none"
                        style={{ fontFamily: "'Akoderf', sans-serif" }}
                      >
                        {sofitLetter.letter}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
