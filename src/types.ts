export type Curriculum = 'hebrew' | 'jewish_studies' | 'downloads';

export type DownloadsTab = 'welcome' | 'font' | 'map' | 'railways' | 'plays' | 'mixtape';

export type GameMode = 'explorer' | 'tracing' | 'coloring' | 'match' | 'balloons' | 'catch' | 'build';
export type JewishStudiesMode = 'holidays' | 'torah' | 'heroes' | 'blessings' | 'mitzvot' | 'israel';

export interface IsraelPlaceOrTopic {
  id: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  category: 'places' | 'symbols' | 'food' | 'nature';
  emoji: string;
  color: string;
  bgLight: string;
  kidDescription: string;
  funHighlights: string[];
  phraseToHear?: { he: string; en: string; transliteration: string };
  funFact: string;
}

export interface HolidayItem {
  id: string;
  nameEn: string;
  nameHe: string;
  spokenHe?: string;
  transliteration: string;
  season: string;
  monthId?: string; // Links to Hebrew month (e.g. 'tishrei', 'cheshvan', etc.)
  emoji: string;
  image?: string;
  color: string;
  bgLight: string;
  description: string;
  customs: string[];
  keyFoodsOrSymbols: { nameEn: string; nameHe: string; emoji: string; image?: string }[];
  greeting: { he: string; en: string; transliteration: string };
  funFact: string;
}

export interface HebrewMonthItem {
  id: string;
  nameEn: string;
  nameHe: string;
  speakText?: string;
  ttsOverride?: string;
  transliteration: string;
  season: string;
  emoji: string;
  color: string;
  bgLight: string;
  description: string;
  orderNumber: number; // 1 = Tishrei, 2 = Cheshvan, ... 12 = Elul
  daysCount: string;
}

export interface ParashaItem {
  numberInBook?: number;
  globalNumber?: number; // 1 to 54
  nameEn: string;
  nameHe: string;
  transliteration: string;
  storyTitle: string;
  kidSummary: string;
  keyTakeaway: string;
  emoji: string;
}

export interface TorahBook {
  id: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  parashotCount: number;
  emoji: string;
  color: string;
  summary: string;
  parashot: ParashaItem[];
}

export interface TanachBookItem {
  id: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  section: 'torah' | 'neviim' | 'ketuvim';
  categoryEn: string;
  categoryHe: string;
  chaptersCount: number | string;
  emoji: string;
  color: string;
  bgLight?: string;
  authorOrTradition?: string;
  holidayConnection?: string;
  summary: string;
  famousStories: string[];
  keyLesson: string;
  famousVerse: {
    he: string;
    transliteration: string;
    en: string;
    source?: string;
  };
  heroLinks?: { id: string; nameEn: string; emoji: string }[];
}

export interface BibleHero {
  id: string;
  nameEn: string;
  nameHe: string;
  spokenHe?: string;
  transliteration: string;
  title: string;
  emoji: string;
  color: string;
  role: string;
  keyTrait: string;
  famousStory: string;
  quoteOrMotto: { he: string; en: string; transliteration: string };
  didYouKnow: string;
  alignment?: 'hero' | 'villain';
}

export interface BlessingItem {
  id: string;
  titleEn: string;
  titleHe: string;
  category: 'daily' | 'food' | 'shabbat' | 'mitzvah';
  emoji: string;
  color: string;
  whenToSay: string;
  lines: {
    he: string;
    transliteration: string;
    en: string;
  }[];
}

export interface MitzvahItem {
  id: string;
  titleEn: string;
  titleHe: string;
  transliteration: string;
  emoji: string;
  color: string;
  actionWord: string;
  kidExplanation: string;
  howToPractice: string[];
}

export interface WordExample {
  id?: string;
  hebrew?: string;
  audioSrc?: string;
  speakText?: string;
  ttsOverride?: string;
  ttsText?: string;
  pointedText?: string;
  phoneticHebrew?: string;
  english?: string;
  wordEn: string;
  wordHe: string;
  spokenHe?: string; // Explicit vocalized Hebrew text with Niqqud for accurate speech synthesis
  transliteration: string;
  emoji?: string;
  image?: string;
  visualBg?: string;
  category?: string; // Optional semantic category to disambiguate words (e.g. 'colors' vs 'food')
  gender?: 'm' | 'f' | 'both';
  alignment?: 'hero' | 'villain';
  partOfSpeech?: string;
  icon?: string;
  antonym?: string;
  cardLabel?: string;
  excludeFromAttacks?: boolean;
}

export interface TracingStroke {
  id: number;
  points: { x: number; y: number }[];
  guideTextEn: string;
}

export interface LetterData {
  id: string;
  letter: string;
  nameEn: string;
  nameHe: string;
  nameHeTransliterated: string;
  soundEn: string;
  soundDescriptionEn: string;
  sofitLetter?: string;
  sofitNameEn?: string;
  color: string;
  bgLight: string;
  borderColor: string;
  primaryWord: WordExample;
  secondaryWords: WordExample[];
  tracingStrokes: TracingStroke[];
  funFactEn: string;
  mnemonicEn: string;
  youtubeUrl?: string;
  spokenHe?: string;
  speakText?: string;
}

export interface UserProgress {
  hasUnlockedFullCurriculum?: boolean;
  exploredLetters: string[];
  tracedLetters: string[];
  coloredLetters?: string[];
  exploredWords?: string[];
  exploredCategories?: string[];
  matchScore?: number;
  popScore?: number;
  balloonsPopped: number;
  popDollars: number;
  userName: string;
  caughtLetterIds?: string[];
  caughtHeroIds?: string[];
  caughtVillainIds?: string[];
  caughtHolidayIds?: string[];
  caughtKosherFoodIds?: string[];
  savedSentences?: Array<{ he: string; en: string }> | string[];
}
