import { stripNiqqud, stripHonorificPrefix, getLocationCardLabel } from '../utils/hebrew';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, RotateCcw, Trash2, Plus, Shuffle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ALEFBET_LETTERS } from '../data/alefbet';
import { getAllDictionaryWords } from '../data/dictionary';
import { WordExample } from '../types';
import { randomizeSkinTone } from '../utils/emoji';
import challahImg from '../assets/images/icon_challah_1791194738931.jpg';

export interface FlyingCardItem {
  id: string;
  token: WordToken;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

export interface WordToken {
  id: string;
  he: string; // strictly no vowels displayed
  vocalizedHe: string; // for TTS speech pronunciation only
  speakText?: string;
  ttsOverride?: string;
  ttsText?: string;
  pointedText?: string;
  phoneticHebrew?: string;
  en: string;
  emoji?: string;
  image?: string;
  visualBg?: string;
  type: 'person' | 'noun' | 'verb' | 'helper' | 'adjective';
  gender?: 'm' | 'f' | 'both';
  categories: string[];
  isPrefix?: boolean;
}

export const FEMININE_WORDS = new Set([
  'אמא', 'ילדה', 'מלכה', 'סבתא', 'רופאה', 'תינוקת',
  'חוה', 'נעמה', 'שרה', 'רבקה', 'רחל', 'לאה', 'אסנת', 'מרים', 'דבורה', 'רות', 'אסתר', 'יהודית',
  'אוכלת', 'אומרת', 'יושבת', 'שרה', 'קוראת', 'כותבת', 'עומדת',
  'שמחה', 'עצובה', 'עייפה', 'כועסת', 'נרגשת', 'רעבה',
  'ארנבת', 'דבורה', 'דוכיפת', 'לטאה', 'נמלה', 'פרה', 'צפרדע', 'פרת משה רבנו', 'יעל',
  'חלה', 'פיתה', 'שמש', 'גבינה', 'גלידה', 'בננה', 'עוגה', 'עוגיה', 'עוגייה',
  'מצה', 'סוכריה', 'עגבניה', 'חווה', 'כיתה', 'מכונית', 'רכבת', 'סירה', 'ביצה', 'כוס', 'קשת', 'כלנית', 'הגדה', 'גיטרה', 'מתנה', 'משפחה',
  'אוזן', 'בטן', 'יד', 'לשון', 'עין', 'רגל', 'שן', 'יונה',
  'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר',
  'ישראל', 'צדקה', 'סופגניה', 'תורה', 'שבת', 'חללית', 'משאית', 'ארוחת צהריים'
]);

export function getTokenGender(tok: {
  he: string;
  en: string;
  vocalizedHe?: string;
  gender?: 'm' | 'f' | 'both';
}): 'm' | 'f' | 'both' {
  if (tok.gender) return tok.gender;
  const lowerEn = tok.en.toLowerCase();
  if (['yes', 'no'].includes(lowerEn) || ['כן', 'לא'].includes(tok.he.replace(/[\u0591-\u05C7]/g, ''))) return 'both';
  if (lowerEn.includes('(m)')) return 'm';
  if (lowerEn.includes('(f)')) return 'f';
  if (lowerEn === 'i' || tok.he === 'אני') return 'both';
  if (['dad', 'boy', 'king', 'grandfather', 'grandpa', 'rabbi'].includes(lowerEn)) return 'm';
  if (['mom', 'girl', 'queen', 'grandmother', 'grandma'].includes(lowerEn)) return 'f';

  if (tok.vocalizedHe === 'שׁוֹתָה' || tok.vocalizedHe === 'מוֹרָה' || tok.vocalizedHe === 'חוֹלָה') return 'f';
  if (tok.vocalizedHe === 'שׁוֹתֶה' || tok.vocalizedHe === 'מוֹרֶה' || tok.vocalizedHe === 'חוֹלֶה') return 'm';

  const unvocalized = tok.he.replace(/[\u0591-\u05C7]/g, '');
  if (['אפס', 'מאה'].includes(unvocalized)) return 'both';
  if (FEMININE_WORDS.has(unvocalized)) return 'f';
  return 'm';
}

export const DRINK_WORDS_HEBREW = new Set(['מים', 'חלב', 'מיץ']);
export const DRINK_WORDS_ENGLISH = new Set(['water', 'milk', 'juice']);

export function isDrinkOrLiquid(word: { he?: string; wordHe?: string; en?: string; wordEn?: string; categories?: string[] }): boolean {
  const unv = ((word.he || word.wordHe || '') as string).replace(/[\u0591-\u05C7]/g, '');
  const lowerEn = ((word.en || word.wordEn || '') as string).trim().toLowerCase();
  if (lowerEn === 'watermelon' || unv === 'אבטיח') return false;
  if (DRINK_WORDS_HEBREW.has(unv)) return true;
  if (DRINK_WORDS_ENGLISH.has(lowerEn)) return true;
  if ((lowerEn.includes('water') && lowerEn !== 'watermelon') || lowerEn.includes('juice') || lowerEn.includes('milk')) return true;
  if (word.categories?.includes('drinks') || word.categories?.includes('beverages')) return true;
  return false;
}

// Category extraction matching vocabulary browser
export const getWordCategories = (word: { wordEn: string; wordHe: string; category?: string }): string[] => {
  if (word.wordHe === 'כתום') return ['colors'];
  if (word.wordHe === 'תפוז') return ['food'];
  if (word.wordHe === 'שלום') return ['sayings'];
  if (word.wordHe === 'נזם' || word.wordEn?.toLowerCase() === 'nose ring') return ['other'];

  const en = word.wordEn.toLowerCase();
  const categories: string[] = [];

  if (word.category) {
    word.category
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .forEach((c) => {
        const catKey = c === 'objects' ? 'other' : c;
        if (catKey && !categories.includes(catKey)) categories.push(catKey);
      });
  }

  const twentyTwoWords = [
    'nose', 'house', 'camel', 'door', 'mountain', 'hook',
    'caterpillar', 'cat', 'ring', 'hand', 'spoon', 'heart',
    'water', 'snake', 'doughnut', 'donut', 'eye', 'mouth', 'turtle',
    'monkey', 'head', 'tooth', 'musical note'
  ];
  const cleanWordHe = word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
  if (
    (twentyTwoWords.includes(en) ||
      ['אף', 'בית', 'גמל', 'דלת', 'הר', 'וו', 'זחל', 'חתול', 'טבעת', 'יד', 'כף', 'לב', 'מים', 'נחש', 'סופגניה', 'עין', 'פה', 'צב', 'קוף', 'ראש', 'שן', 'תו'].includes(cleanWordHe)) &&
    !categories.includes('22')
  ) {
    categories.push('22');
  }

  const sayingWords = ['thank you', 'sorry', 'please', 'yes', 'no', 'hello', 'shalom', 'cool', 'sababa', 'what a mess!'];
  if (sayingWords.includes(en) || ['תודה', 'סליחה', 'בבקשה', 'כן', 'לא', 'שלום', 'סבבה', 'סַבָּבָה', 'איזה בלגן'].includes(word.wordHe)) {
    if (!categories.includes('sayings')) categories.push('sayings');
  }
  
  const drinkWords = ['water', 'milk', 'juice'];
  if (drinkWords.includes(en) && !categories.includes('drinks')) {
    categories.push('drinks');
  }

  const helperWords = [
    'to / for', 'to / for (prefix)', 'for', 'to',
    'in the / with', 'in the / with (prefix)', 'in the / with the (prefix)', 'in the', 'in / at', 'in', 'and'
  ];
  if (helperWords.includes(en) || word.category === 'helpers' || word.wordHe === 'לְ' || word.wordHe === 'בַּ' || word.wordHe === 'וְ' || word.wordHe === 'ו') {
    if (!categories.includes('helpers')) categories.push('helpers');
  }

  const verbWords = [
    'eats (m)', 'eats (f)', 'eating (m)', 'eating (f)', 'eats', 'eat',
    'says (m)', 'says (f)', 'saying (m)', 'saying (f)', 'says', 'say',
    'sings (m)', 'sings (f)', 'singing (m)', 'singing (f)', 'sings', 'sing',
    'drinks (m)', 'drinks (f)', 'drinking (m)', 'drinking (f)', 'drinks', 'drink',
    'sits (m)', 'sits (f)', 'sitting (m)', 'sitting (f)', 'sits', 'sit',
    'reads (m)', 'reads (f)', 'reading (m)', 'reading (f)', 'reads', 'read',
    'writes (m)', 'writes (f)', 'writing (m)', 'writing (f)', 'writes', 'write'
  ];
  if (verbWords.includes(en) || word.category === 'verbs') {
    if (!categories.includes('verbs')) categories.push('verbs');
  }

  const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', '100', 'one hundred'];
  if ((numberWords.includes(en) || /^\d+$/.test(en)) && !categories.includes('numbers')) {
    categories.push('numbers');
  }

  const colorWords = ['red', 'gray', 'grey', 'blue', 'orange', 'yellow', 'black', 'brown', 'green', 'white', 'purple', 'pink'];
  if (colorWords.includes(en) && word.wordHe !== 'תפוז' && !categories.includes('colors')) {
    categories.push('colors');
  }

  const foodWords = ['carrot', 'ice cream', 'cheese', 'honey', 'pomegranate', 'chocolate', 'spinach', 'corn', 'watermelon', 'pineapple', 'peach', 'pear', 'cucumber', 'matzah', 'juice', 'challah', 'milk', 'falafel', 'egg', 'bottle', 'banana', 'olive', 'lemon', 'mushroom', 'cookie', 'cake', 'apple', 'bread', 'beet', 'water', 'eggplant', 'doughnut', 'donut', 'strawberry', 'grapes', 'tomato', 'orange', 'pita', 'cactus fruit', 'avocado', 'lunch'];
  if ((foodWords.includes(en) || word.wordHe === 'ארוחת צהריים') && word.wordHe !== 'כתום' && !categories.includes('food')) {
    categories.push('food');
  }

  const peopleWords = ['mom', 'dad', 'teacher (f)', 'teacher (m)', 'teacher', 'king', 'queen', 'doctor (m)', 'doctor (f)', 'doctor', 'i', 'grandfather', 'grandmother', 'boy', 'girl', 'rabbi', 'grandpa', 'grandma', 'baby boy', 'baby girl'];
  if (peopleWords.includes(en) && !categories.includes('people')) {
    categories.push('people');
  }

  const bodyWords = ['head', 'leg', 'tooth', 'nose', 'eye', 'hand', 'hair', 'ear', 'belly', 'tongue', 'heart', 'mouth'];
  if (bodyWords.includes(en) && !categories.includes('body')) {
    categories.push('body');
  }

  const animalWords = ['lion', 'duck', 'camel', 'fish', 'bear', 'bee', 'wolf', 'caterpillar', 'cat', 'dog', 'sheep', 'ant', 'horse', 'spider', 'sloth', 'elephant', 'butterfly', 'turtle', 'frog', 'monkey', 'hedgehog', 'fox', 'rock hyrax', 'snail', 'parrot', 'alligator', 'octopus', 'bunny', 'buny', 'hoopoe', 'raccoon', 'hippo', 'hippopotamus', 'pig', 'peacock', 'donkey', 'owl', 'shark', 'lizard', 'eagle', 'nubian ibex', 'snake', 'cow', 'ladybug', 'mouse'];
  if (animalWords.includes(en) && !categories.includes('animals')) {
    categories.push('animals');
  }

  const transportationWords = ['bicycle', 'motorcycle', 'car', 'truck', 'parachute', 'train', 'helicopter', 'spaceship', 'rocket ship', 'bus', 'boat'];
  if (transportationWords.includes(en) && !categories.includes('transportation')) {
    categories.push('transportation');
  }

  const adjectiveWords = ['happy (m)', 'happy (f)', 'happy', 'sad (m)', 'sad (f)', 'tired (m)', 'tired (f)', 'angry (m)', 'angry (f)', 'sick (m)', 'sick (f)', 'hungry (m)', 'hungry (f)', 'big', 'small', 'good', 'pretty', 'excited', 'excited (m)', 'excited (f)'];
  if ((adjectiveWords.includes(en) || en.includes('excited') || en.includes('happy') || en.includes('sad') || en.includes('tired') || en.includes('angry') || en.includes('sick') || en.includes('hungry')) && !categories.includes('adjectives')) {
    categories.push('adjectives');
  }

  const jewishWords = ['holiday', 'kipa', 'israel', 'tzedaka', 'torah', 'shofar', 'chanukiah', 'chanukkiah', 'dreidel', 'gragger', 'grogger', 'challah', 'doughnut', 'donut', 'falafel', 'rabbi', 'shabbat'];
  if ((jewishWords.includes(en) || word.wordHe === 'חג' || word.wordHe === 'חַג') && !categories.includes('jewish')) {
    categories.push('jewish');
  }

  const locationWords = [
    'jerusalem', 'the dead sea', 'dead sea', 'the kinneret', 'kinneret', 'tel aviv', 'haifa',
    'ben-gurion airport', 'ben gurion airport'
  ];
  const isLocation =
    word.category === 'locations' ||
    locationWords.includes(en) ||
    en.includes('kinneret') ||
    en.includes('dead sea') ||
    en.includes('jerusalem') ||
    en.includes('tel aviv') ||
    en.includes('haifa') ||
    en.includes('airport');

  if (isLocation) {
    if (!categories.includes('locations')) categories.push('locations');
    const pIdx = categories.indexOf('places');
    if (pIdx !== -1) categories.splice(pIdx, 1);
  }

  const placeWords = [
    'house', 'school', 'classroom', 'synagogue', 'mountain', 'sea', 'beach', 'farm'
  ];
  if (
    !isLocation &&
    (placeWords.includes(en) || word.category === 'places') &&
    !categories.includes('places') &&
    en !== 'motorcycle' &&
    word.wordHe !== 'אופנוע' &&
    en !== 'bicycle' &&
    word.wordHe !== 'אופניים'
  ) {
    categories.push('places');
  }

  const skyWords = ['rain', 'cloud', 'clouds', 'sun', 'moon', 'star', 'lightning', 'rainbow', 'snow'];
  if (skyWords.includes(en) && !categories.includes('sky')) {
    categories.push('sky');
  }

  if (word.category === 'heroes_villains' || word.category?.includes('heroes_villains')) {
    if (!categories.includes('heroes_villains')) categories.push('heroes_villains');
  }

  const specificCategories = categories.filter((c) => c !== 'other');
  if (specificCategories.length > 0) {
    return specificCategories;
  }

  if (categories.length === 0) {
    categories.push('other');
  }

  return categories;
};

export function isSpeechVerb(token: WordToken | null | undefined): boolean {
  if (!token) return false;
  const unv = token.he.replace(/[\u0591-\u05C7]/g, '').trim();
  return ['אומר', 'אומרת', 'אומרים', 'אומרות'].includes(unv) ||
    ['says (m)', 'says (f)', 'saying (m)', 'saying (f)', 'says', 'say'].includes(token.en.toLowerCase());
}

export const APPROVED_SPEECH_SAYINGS_HEBREW = new Set([
  'שלום',
  'שבת שלום',
  'חג שמח',
  'תודה',
  'סליחה',
  'סבבה',
  'סַבָּבָה',
  'כן',
  'לא',
  'בבקשה',
  'איזה בלגן',
  'אֵיזֶה בַּלָּגָן',
]);

export function isApprovedSpeechSaying(token: WordToken | null | undefined): boolean {
  if (!token) return false;
  const unv = token.he.replace(/[\u0591-\u05C7]/g, '').trim();
  if (APPROVED_SPEECH_SAYINGS_HEBREW.has(unv) || APPROVED_SPEECH_SAYINGS_HEBREW.has(token.he)) return true;
  if (token.id === 'saying_sababa' || token.id === 'eizeh_balagan' || token.id === 'saying_shalom') return true;
  if (token.categories?.includes('sayings')) return true;

  const lowerEn = token.en.toLowerCase().trim();
  const approvedEnglish = [
    'shalom', 'hello', 'peace',
    'shabbat shalom',
    'chag sameach',
    'todah', 'thank you', 'thanks',
    'slicha', 'sorry', 'excuse me',
    'sababa', 'cool',
    'ken', 'yes',
    'lo', 'no',
    'b\'vakasha', 'bvakasha', 'please', 'you\'re welcome', 'youre welcome',
    'eizeh balagan', 'eize balagan', 'what a mess'
  ];
  return approvedEnglish.some((s) => lowerEn === s || lowerEn.includes(s));
}

// Word library dynamically generated from regular vocabulary library, excluding numbers
export const WORD_BANK: WordToken[] = (() => {
  const tokens: WordToken[] = [];
  const seen = new Set<string>();

  const dictWords = getAllDictionaryWords();

  for (const word of dictWords) {
    if (!word || !word.wordHe) continue;
    const cats = getWordCategories(word);
    if (cats.includes('numbers') || cats.includes('sky')) continue;

    const unvocalized = word.wordHe.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim();
    const uniqueKey = word.id || `${unvocalized}-${word.wordEn.toLowerCase().trim()}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    const isHelper = cats.includes('helpers') || unvocalized === 'ל' || unvocalized === 'ב' || unvocalized === 'ו';
    const isVerb = cats.includes('verbs');
    const isPerson = cats.includes('people') || cats.includes('heroes_villains');
    const isAdjective = cats.includes('adjectives') || cats.includes('colors');

    let type: 'person' | 'noun' | 'verb' | 'helper' | 'adjective' = 'noun';
    if (isHelper) type = 'helper';
    else if (isVerb) type = 'verb';
    else if (isPerson) type = 'person';
    else if (isAdjective) type = 'adjective';

    let tokenGender: 'm' | 'f' | 'both' = 'm';
    const lowerEn = word.wordEn.toLowerCase();

    if (word.gender) {
      tokenGender = word.gender;
    } else if (lowerEn.includes('(m)')) {
      tokenGender = 'm';
    } else if (lowerEn.includes('(f)')) {
      tokenGender = 'f';
    } else if (lowerEn === 'i' || unvocalized === 'אני') {
      tokenGender = 'both';
    } else if (['dad', 'boy', 'king', 'grandfather', 'grandpa', 'rabbi'].includes(lowerEn)) {
      tokenGender = 'm';
    } else if (['mom', 'girl', 'queen', 'grandmother', 'grandma'].includes(lowerEn)) {
      tokenGender = 'f';
    } else if (word.spokenHe === 'שׁוֹתָה' || word.spokenHe === 'מוֹרָה' || word.spokenHe === 'חוֹלָה') {
      tokenGender = 'f';
    } else if (word.spokenHe === 'שׁוֹתֶה' || word.spokenHe === 'מוֹרֶה' || word.spokenHe === 'חוֹלֶה') {
      tokenGender = 'm';
    } else if (FEMININE_WORDS.has(unvocalized)) {
      tokenGender = 'f';
    } else {
      tokenGender = 'm';
    }

    tokens.push({
      id: word.id || `token-dict-${word.wordEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      he: unvocalized,
      vocalizedHe: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.speakText || word.ttsOverride || word.spokenHe || word.wordHe,
      speakText: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.speakText || word.ttsOverride,
      ttsOverride: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.ttsOverride,
      ttsText: (word as any).ttsText,
      pointedText: (word as any).pointedText,
      phoneticHebrew: (word as any).phoneticHebrew,
      en: word.wordEn.replace(/\s*\([mf]\)/gi, '').trim(),
      emoji: randomizeSkinTone(word.emoji),
      image: word.image,
      visualBg: word.visualBg || 'bg-amber-100',
      type,
      gender: tokenGender,
      categories: cats,
      isPrefix: isHelper,
    });
  }

  for (const letter of ALEFBET_LETTERS) {
    const words = [letter.primaryWord, ...(letter.secondaryWords || [])];
    for (const word of words) {
      if (!word) continue;
      const cats = getWordCategories(word);
      if (cats.includes('numbers') || cats.includes('sky')) continue; // Strictly leave out numbers and sky words

      const unvocalized = word.wordHe.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim();
      const uniqueKey = `${unvocalized}-${word.wordEn.toLowerCase().trim()}`;
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const isHelper = cats.includes('helpers') || unvocalized === 'ל' || unvocalized === 'ב' || unvocalized === 'ו';
      const isVerb = cats.includes('verbs');
      const isPerson = cats.includes('people') || cats.includes('heroes_villains');
      const isAdjective = cats.includes('adjectives') || cats.includes('colors');

      let type: 'person' | 'noun' | 'verb' | 'helper' | 'adjective' = 'noun';
      if (isHelper) type = 'helper';
      else if (isVerb) type = 'verb';
      else if (isPerson) type = 'person';
      else if (isAdjective) type = 'adjective';

      let tokenGender: 'm' | 'f' | 'both' = 'm';
      const lowerEn = word.wordEn.toLowerCase();

      if (word.gender) {
        tokenGender = word.gender;
      } else if (lowerEn.includes('(m)')) {
        tokenGender = 'm';
      } else if (lowerEn.includes('(f)')) {
        tokenGender = 'f';
      } else if (lowerEn === 'i' || unvocalized === 'אני') {
        tokenGender = 'both';
      } else if (['dad', 'boy', 'king', 'grandfather', 'grandpa', 'rabbi'].includes(lowerEn)) {
        tokenGender = 'm';
      } else if (['mom', 'girl', 'queen', 'grandmother', 'grandma'].includes(lowerEn)) {
        tokenGender = 'f';
      } else if (word.spokenHe === 'שׁוֹתָה' || word.spokenHe === 'מוֹרָה' || word.spokenHe === 'חוֹלָה') {
        tokenGender = 'f';
      } else if (word.spokenHe === 'שׁוֹתֶה' || word.spokenHe === 'מוֹרֶה' || word.spokenHe === 'חוֹלֶה') {
        tokenGender = 'm';
      } else if (FEMININE_WORDS.has(unvocalized)) {
        tokenGender = 'f';
      } else {
        tokenGender = 'm';
      }

      tokens.push({
        id: `token-${letter.id}-${word.wordEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        he: unvocalized,
        vocalizedHe: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.speakText || word.ttsOverride || word.spokenHe || word.wordHe,
        speakText: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.speakText || word.ttsOverride,
        ttsOverride: (word as any).ttsText || (word as any).pointedText || (word as any).phoneticHebrew || word.ttsOverride,
        ttsText: (word as any).ttsText,
        pointedText: (word as any).pointedText,
        phoneticHebrew: (word as any).phoneticHebrew,
        en: word.wordEn.replace(/\s*\([mf]\)/gi, '').trim(),
        emoji: randomizeSkinTone(word.emoji),
        image: word.image,
        visualBg: word.visualBg,
        type,
        gender: tokenGender,
        categories: cats,
        isPrefix: isHelper,
      });
    }
  }

  // Ensure "holiday" (חג) is available in Jewish category
  if (!tokens.some((t) => t.he === 'חג')) {
    tokens.push({
      id: 'token-chet-holiday',
      he: 'חג',
      vocalizedHe: 'חָג',
      en: 'holiday',
      emoji: '🎉',
      visualBg: 'bg-blue-100',
      type: 'noun',
      gender: 'm',
      categories: ['jewish'],
    });
  }

  return tokens;
})();

const CATEGORY_TABS = [
  { key: 'all', label: 'All Words', icon: '📚', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  { key: '22', label: '22', icon: '🪝', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  { key: 'colors', label: 'Adjectives', icon: '🎨', badgeBg: 'bg-purple-100 text-purple-800 border-purple-300' },
  { key: 'animals', label: 'Animals', icon: '🦁', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'body', label: 'Body', icon: '👀', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  { key: 'adjectives', label: 'Feelings', icon: '😊', badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  { key: 'food', label: 'Food', icon: '🍎', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'helpers', label: 'Helpers', icon: '🔤', badgeBg: 'bg-violet-100 text-violet-900 border-violet-300' },
  { key: 'heroes_villains', label: 'Heroes & Villains', icon: '🦸', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' },
  { key: 'jewish', label: 'Jewish', icon: '✡️', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300' },
  { key: 'locations', label: 'Locations', icon: '📍', badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { key: 'numbers', label: 'Numbers', icon: '🔢', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  { key: 'people', label: 'People', icon: '👥', badgeBg: 'bg-pink-100 text-pink-800 border-pink-300' },
  { key: 'places', label: 'Places', icon: '🏞️', badgeBg: 'bg-teal-100 text-teal-800 border-teal-300' },
  { key: 'sayings', label: 'Sayings', icon: '💬', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' },
  { key: 'sky', label: 'Sky', icon: '🌤️', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' },
  { key: 'transportation', label: 'Transportation', icon: '🚗', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { key: 'verbs', label: 'Verbs', icon: '🏃', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
  { key: 'other', label: 'Other', icon: '🌟', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300' },
] as const;

export function formatDisplayNoun(text: string): string {
  let cleaned = text.trim().replace(/\bnubian\b/gi, 'Nubian');
  const lower = cleaned.toLowerCase();
  if (lower === 'dad' || lower === 'abba') return 'Dad';
  if (lower === 'mom' || lower === 'ima') return 'Mom';
  return cleaned;
}

export function isHeroesVillainsToken(token: { en: string; he?: string; categories?: string[]; type?: string } | null | undefined): boolean {
  if (!token) return false;
  if (token.categories?.includes('heroes_villains') || token.type === 'heroes_villains') return true;
  return getWordCategories({ wordEn: token.en, wordHe: token.he || '', category: token.categories?.join(',') }).includes('heroes_villains');
}

export function isProperNounToken(token: { en: string; he?: string; categories?: string[] } | null | undefined): boolean {
  if (!token) return false;
  if (token.he === 'אני') return true;
  if (token.he === 'אבא' || token.he === 'אמא') return true;
  if (token.categories?.includes('heroes_villains')) return true;

  const rawEn = (token.en || '').trim().replace(/\s*\([mf]\)/gi, '');
  const lowerEn = rawEn.toLowerCase();

  const PROPER_TITLES = new Set([
    'dad', 'mom', 'grandpa', 'grandma', 'i', 'abba', 'ima', 'saba', 'savta',
    'jerusalem', 'tel aviv', 'haifa', 'ben-gurion airport', 'ben gurion airport', 'israel',
    'the kinneret', 'the dead sea', 'kinneret', 'dead sea', 'torah', 'the torah',
    'adam', 'eve', 'noah', 'naamah', 'abraham', 'sarah', 'isaac', 'rebecca', 'jacob', 'rachel', 'leah',
    'joseph', 'osnat', 'moses', 'aaron', 'miriam', 'deborah', 'ruth', 'saul', 'king saul',
    'david', 'king david', 'solomon', 'king solomon', 'esther', 'queen esther', 'mordechai',
    'judah maccabee', 'judith', 'the snake', 'snake', 'pharaoh', 'balak', 'king balak',
    'goliath', 'haman', 'antiochus', 'king antiochus', 'holofernes'
  ]);

  if (PROPER_TITLES.has(lowerEn)) return true;
  return false;
}

export function isPlaceToken(token: { he?: string; en?: string; categories?: string[] } | null | undefined): boolean {
  if (!token) return false;
  if (token.categories?.includes('places') || token.categories?.includes('locations')) return true;
  return isProperPlaceToken(token);
}

export function isProperPlaceToken(token: { he?: string; en?: string; categories?: string[] } | null | undefined): boolean {
  if (!token) return false;
  const unv = (token.he || '').replace(/[\u0591-\u05C7]/g, '').trim();
  const lowerEn = (token.en || '').trim().toLowerCase();

  const PROPER_PLACE_WORDS = new Set([
    'ירושלים', 'תל אביב', 'חיפה',
    'נמל התעופה בן גוריון', 'נמל תעופה בן גוריון', 'בן גוריון', 'ישראל'
  ]);

  if (PROPER_PLACE_WORDS.has(unv)) return true;
  if (
    lowerEn.includes('airport') ||
    lowerEn.includes('tlv') ||
    lowerEn.includes('jerusalem') ||
    lowerEn.includes('tel aviv') ||
    lowerEn.includes('haifa') ||
    lowerEn.includes('kinneret') ||
    lowerEn.includes('dead sea') ||
    lowerEn.includes('israel')
  ) {
    return true;
  }
  return false;
}

export function isInseparablePrefix(tok: WordToken | undefined): boolean {
  if (!tok) return false;
  if (tok.isPrefix) return true;
  const unv = tok.he.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim();
  return ['ב', 'כ', 'ל', 'מ', 'ש', 'ה', 'ו'].includes(unv) || tok.type === 'helper';
}

/**
 * Resolves the backend phonetic/pointed string for TTS speech synthesis.
 * Prioritizes backend phonetic/pointed fields (ttsText, pointedText, phoneticHebrew,
 * speakText, ttsOverride, vocalizedHe, spokenHe) before falling back to standard text.
 */
export function getTokenPhoneticSpeechText(tok: WordToken | any): string {
  if (!tok) return '';
  return (
    tok.ttsText ||
    tok.pointedText ||
    tok.phoneticHebrew ||
    tok.speakText ||
    tok.ttsOverride ||
    tok.vocalizedHe ||
    tok.spokenHe ||
    tok.he ||
    tok.wordHe ||
    tok.text ||
    ''
  );
}

export function buildHebrewSentenceStrings(tokens: WordToken[]): { heStr: string; vocStr: string } {
  if (tokens.length === 0) return { heStr: '', vocStr: '' };

  let heStr = '';
  let vocStr = '';

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const nextTok = tokens[i + 1];

    // Detect idiomatic phrase "חג שמח" in any order
    if ((tok.he === 'חג' && nextTok?.he === 'שמח') || (tok.he === 'שמח' && nextTok?.he === 'חג')) {
      const hasMore = i + 1 < tokens.length - 1;
      heStr += 'חג שמח' + (hasMore ? ' ' : '');
      vocStr += 'חַג שָׂמֵחַ' + (hasMore ? ' ' : '');
      i++; // skip next token
      continue;
    }

    // Contraction: ל + אני -> לי (spoken לִי li)
    const isPrepL = tok.he === 'ל' || tok.vocalizedHe === 'לְ' || tok.vocalizedHe === 'לַ';
    const isAni = nextTok && (nextTok.he === 'אני' || nextTok.vocalizedHe === 'אֲנִי');
    if (isPrepL && isAni) {
      const hasMore = i + 1 < tokens.length - 1;
      heStr += 'לי' + (hasMore ? ' ' : '');
      vocStr += 'לִי' + (hasMore ? ' ' : '');
      i++; // skip next token
      continue;
    }

    const isPrefix = isInseparablePrefix(tok);

    if (isPrefix && nextTok) {
      // Inseparable prefixes (אותיות השימוש like ו, ב, ל) glue directly onto the following word without a space!
      if (isInseparablePrefix(nextTok)) {
        // Chained prefix (e.g. ו + ב + בית)
        const cleanPref = stripNiqqud(tok.he || (tok as any).text || '');
        const prefPayload = tok.he === 'ו' ? (tok.vocalizedHe || 'וְ') : (getTokenPhoneticSpeechText(tok) || tok.he);
        heStr += cleanPref;
        vocStr += prefPayload;
      } else {
        // Conjunction or preposition attached to following word (e.g. 'ו' + 'אסנת' -> 'ואסנת' / 'וְ' + 'אוֹסְנַת')
        const hasMoreAfter = (i + 1) < (tokens.length - 1);
        const prefixVisual = stripNiqqud(tok.he || (tok as any).text || '');
        const prefixVocal = tok.he === 'ו' ? (tok.vocalizedHe || 'וְ') : (getTokenPhoneticSpeechText(tok) || tok.he);

        const nextVisual = stripNiqqud(nextTok.he || (nextTok as any).text || '');
        const nextVocal = getTokenPhoneticSpeechText(nextTok);

        heStr += prefixVisual + nextVisual + (hasMoreAfter ? ' ' : '');
        vocStr += prefixVocal + nextVocal + (hasMoreAfter ? ' ' : '');
        i++; // advance past nextTok since we processed it together with its prefix
      }
    } else {
      // Standard word or last token in the sentence
      const hasMore = i < tokens.length - 1;
      const cleanVisual = stripNiqqud(tok.he || (tok as any).text || '');
      const vocalPayload = getTokenPhoneticSpeechText(tok);
      heStr += cleanVisual + (hasMore ? ' ' : '');
      vocStr += vocalPayload + (hasMore ? ' ' : '');
    }
  }

  return { heStr, vocStr };
}

export function buildEnglishTranslation(tokens: WordToken[]): string {
  if (tokens.length === 0) return '';

  const rawHebrewText = tokens.map(t => t.he).join(' ');
  if (rawHebrewText === 'שלום') return 'Shalom';
  if (rawHebrewText === 'שבת שלום') return 'Shabbat Shalom';
  if (rawHebrewText === 'חג שמח') return 'Chag Sameach';

  const firstPersonVerbs: Record<string, string> = {
    'אוכל': 'eat',
    'אוכלת': 'eat',
    'שותה': 'drink',
    'שר': 'sing',
    'שרה': 'sing',
    'אומר': 'say',
    'אומרת': 'say',
    'קורא': 'read',
    'קוראת': 'read',
    'כותב': 'write',
    'כותבת': 'write',
    'עומד': 'stand',
    'עומדת': 'stand',
  };

  const thirdPersonVerbs: Record<string, string> = {
    'אוכל': 'eats',
    'אוכלת': 'eats',
    'שותה': 'drinks',
    'שר': 'sings',
    'שרה': 'sings',
    'אומר': 'says',
    'אומרת': 'says',
    'קורא': 'reads',
    'קוראת': 'reads',
    'כותב': 'writes',
    'כותבת': 'writes',
    'עומד': 'stands',
    'עומדת': 'stands',
  };

  const getFormattedNoun = (token: WordToken): string => {
    if (token.he === 'אבא') return 'Dad';
    if (token.he === 'אמא') return 'Mom';
    const isProper = isProperNounToken(token) || isProperPlaceToken(token);
    if (isProper) return formatDisplayNoun(token.en);
    return formatDisplayNoun(token.en).toLowerCase().replace(/\bnubian\b/gi, 'Nubian');
  };

  const parseClause = (clauseTokens: WordToken[]): string => {
    if (clauseTokens.length === 0) return '';

    const clauseRawHe = clauseTokens.map(t => t.he).join(' ');
    if (clauseRawHe === 'שלום') return 'Shalom';
    if (clauseRawHe === 'שבת שלום') return 'Shabbat Shalom';
    if (clauseRawHe === 'חג שמח') return 'Chag Sameach';

    const hasVerb = clauseTokens.some(t => t.type === 'verb');

    const shouldOmitArticle = (token: WordToken): boolean => {
      if (isDrinkOrLiquid(token)) return true;
      const lower = token.en.toLowerCase();
      if (['milk', 'water', 'juice', 'bread', 'rice', 'soup'].some(m => lower.includes(m))) return true;
      return false;
    };

    if (!hasVerb) {
      // Rule 1: Copular / Descriptive Sentences (No Verb in Clause)
      // Pattern: [NOUN] + [ADJECTIVE] -> "{A/An} [noun] is [adjective]."
      if (clauseTokens.length >= 2 && (clauseTokens[0].type === 'noun' || clauseTokens[0].type === 'person') && clauseTokens[1].type === 'adjective') {
        const nounTok = clauseTokens[0];
        const adjTok = clauseTokens[1];
        const isProper = isProperNounToken(nounTok) || isProperPlaceToken(nounTok);
        const nounEn = getFormattedNoun(nounTok);
        const adjEn = adjTok.en.trim().toLowerCase();

        if (nounTok.he === 'אני') {
          return `I am ${adjEn}`;
        }
        if (isProper) {
          return `${nounEn} is ${adjEn}`;
        }
        if (nounTok.type === 'person') {
          const article = /^[aeiou]/i.test(nounEn) ? 'An' : 'A';
          return `${article} ${nounEn} is ${adjEn}`;
        }
        const omitArt = shouldOmitArticle(nounTok);
        const article = omitArt ? '' : (/^[aeiou]/i.test(nounEn) ? 'An' : 'A');
        return article ? `${article} ${nounEn} is ${adjEn}` : `${nounEn} is ${adjEn}`;
      }

      // Single noun or token without verb
      const tok = clauseTokens[0];
      let wEn = getFormattedNoun(tok);
      if (tok.type === 'noun' || tok.type === 'person') {
        const isProper = isProperNounToken(tok) || isProperPlaceToken(tok);
        if (!isProper) {
          const omitArt = shouldOmitArticle(tok);
          const article = omitArt ? '' : (/^[aeiou]/i.test(wEn) ? 'an' : 'a');
          wEn = article ? `${article} ${wEn}` : wEn;
        }
      }
      return wEn;
    } else {
      // Rule 2: Action Sentences (Verb Present in Clause)
      // Pattern: [NOUN] + [ADJECTIVE?] + [VERB]
      const nounTok = clauseTokens.find(t => t.type === 'noun' || t.type === 'person');
      const adjTok = clauseTokens.find(t => t.type === 'adjective');
      const verbTok = clauseTokens.find(t => t.type === 'verb');

      const isFirstPerson = nounTok?.he === 'אני';
      const adjEn = adjTok ? adjTok.en.trim().toLowerCase() : '';

      let verbEn = verbTok ? verbTok.en.trim().toLowerCase() : '';
      if (verbTok) {
        if (isFirstPerson) {
          verbEn = firstPersonVerbs[verbTok.he] || verbEn;
        } else {
          verbEn = thirdPersonVerbs[verbTok.he] || verbEn;
        }
      }

      let subjectPart = '';
      if (isFirstPerson) {
        subjectPart = 'I';
      } else if (nounTok) {
        const isProper = isProperNounToken(nounTok) || isProperPlaceToken(nounTok);
        const cleanNoun = getFormattedNoun(nounTok);
        if (isProper) {
          subjectPart = cleanNoun;
        } else {
          const omitArt = shouldOmitArticle(nounTok);
          const article = omitArt ? '' : (/^[aeiou]/i.test(adjEn || cleanNoun) ? 'An' : 'A');
          if (adjEn) {
            subjectPart = article ? `${article} ${adjEn} ${cleanNoun}` : `${adjEn} ${cleanNoun}`;
          } else {
            subjectPart = article ? `${article} ${cleanNoun}` : cleanNoun;
          }
        }
      }

      const otherTokens = clauseTokens.filter(t => t !== nounTok && t !== adjTok && t !== verbTok && t.he !== 'ו');
      let restPart = '';
      if (otherTokens.length > 0) {
        const prepTok = otherTokens.find(t => t.he === 'ב' || t.he === 'ל');
        const placeTok = otherTokens.find(t => t !== prepTok);
        if (prepTok && placeTok) {
          const prepStr = prepTok.he === 'ב' ? 'in' : 'for';
          const placeStr = getFormattedNoun(placeTok);
          const isProper = isProperNounToken(placeTok) || isProperPlaceToken(placeTok);
          if (isProper || shouldOmitArticle(placeTok)) {
            restPart = ` ${prepStr} ${placeStr}`;
          } else {
            const article = /^[aeiou]/i.test(placeStr) ? 'an' : 'a';
            restPart = ` ${prepStr} ${article} ${placeStr}`;
          }
        } else {
          restPart = ' ' + otherTokens.map(t => {
            const isProper = isProperNounToken(t) || isProperPlaceToken(t);
            let tEn = getFormattedNoun(t);
            if ((t.type === 'noun' || t.type === 'person') && !isProper) {
              const omitArt = shouldOmitArticle(t);
              if (!omitArt) {
                const article = /^[aeiou]/i.test(tEn) ? 'an' : 'a';
                tEn = `${article} ${tEn}`;
              }
            }
            return tEn;
          }).join(' ');
        }
      }

      return `${subjectPart} ${verbEn}${restPart}`.trim();
    }
  };

  // Rule 3: Conjunction Handling (At most once, splitting into two independent clauses)
  const conjIndex = tokens.findIndex(t => t.he === 'ו' || t.vocalizedHe === 'וְ' || t.en.toLowerCase() === 'and');

  if (conjIndex !== -1) {
    const leftTokens = tokens.slice(0, conjIndex);
    const rightTokens = tokens.slice(conjIndex + 1);

    const leftPart = parseClause(leftTokens);
    const rightPart = parseClause(rightTokens);

    if (!leftPart) return (rightPart ? rightPart.charAt(0).toUpperCase() + rightPart.slice(1) : '').replace(/\bnubian\b/gi, 'Nubian');
    if (!rightPart) return (leftPart ? leftPart.charAt(0).toUpperCase() + leftPart.slice(1) : '').replace(/\bnubian\b/gi, 'Nubian');

    const capitalizedLeft = leftPart.charAt(0).toUpperCase() + leftPart.slice(1);
    
    // Format right part
    const firstWord = rightPart.split(' ')[0];
    const isArticleOrGeneric = ['a', 'an', 'the'].includes(firstWord.toLowerCase());
    const formattedRight = isArticleOrGeneric ? rightPart.charAt(0).toLowerCase() + rightPart.slice(1) : rightPart;
    return `${capitalizedLeft} and ${formattedRight}`.replace(/\bnubian\b/gi, 'Nubian');
  } else {
    const singleResult = parseClause(tokens);
    return (singleResult ? singleResult.charAt(0).toUpperCase() + singleResult.slice(1) : '').replace(/\bnubian\b/gi, 'Nubian');
  }
}

export function getRouletteCandidates(
  token: WordToken,
  bank: WordToken[],
  contextTokens?: WordToken[],
  tokenIndex?: number
): WordToken[] {
  // Never shuffle helper words
  if (
    token.type === 'helper' ||
    token.categories?.includes('helpers') ||
    token.vocalizedHe === 'וְ' ||
    token.vocalizedHe === 'לְ' ||
    token.vocalizedHe === 'בַּ' ||
    token.he === 'ו'
  ) {
    return [];
  }

  const tokenCategories = token.categories || [];
  const tokenGender = token.gender;
  const isPerson = token.type === 'person' || tokenCategories.includes('people');
  const isAnimal = tokenCategories.includes('animals');
  const isConsciousSubject = isPerson || isAnimal;
  const isVerb = token.type === 'verb' || tokenCategories.includes('verbs');
  const isColor = tokenCategories.includes('colors');
  const isAdjective = (token.type === 'adjective' || tokenCategories.includes('adjectives')) && !isColor;
  const isFood = tokenCategories.includes('food');

  let candidates: WordToken[] = [];

  // Preceded by speech verb (אומר/אומרת): candidate MUST be an approved dialogue saying!
  if (contextTokens && tokenIndex !== undefined && tokenIndex > 0) {
    const prevTok = contextTokens[tokenIndex - 1];
    if (isSpeechVerb(prevTok)) {
      return bank.filter((w) => isApprovedSpeechSaying(w));
    }
  }

  if (isConsciousSubject) {
    // Conscious subjects (male people + male animals in one group, female people + female animals in another)
    candidates = bank.filter((w) => {
      const cIsConscious = w.type === 'person' || w.categories.includes('people') || w.categories.includes('animals');
      if (!cIsConscious) return false;
      if (tokenGender === 'm') {
        return w.gender === 'm' || w.gender === 'both' || w.vocalizedHe === 'אֲנִי' || w.he === 'אני' || w.en.toLowerCase() === 'i';
      } else if (tokenGender === 'f') {
        return w.gender === 'f' || w.gender === 'both' || w.vocalizedHe === 'אֲנִי' || w.he === 'אני' || w.en.toLowerCase() === 'i';
      }
      return true;
    });
  } else if (isVerb) {
    // Verbs: preserve gender agreement
    candidates = bank.filter((w) => {
      const cIsVerb = w.type === 'verb' || w.categories.includes('verbs');
      if (!cIsVerb) return false;
      if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
      if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
      return true;
    });

    // Semantic agreement with direct object if present
    if (contextTokens && tokenIndex !== undefined && tokenIndex < contextTokens.length - 1) {
      const nextTok = contextTokens[tokenIndex + 1];
      if (isDrinkOrLiquid(nextTok)) {
        // Next word is a drink (milk/water/juice): verb MUST be drink (שותה)!
        candidates = candidates.filter((c) => c.he.replace(/[\u0591-\u05C7]/g, '') === 'שותה');
      } else if (nextTok.categories?.includes('food')) {
        // Next word is solid food: verb MUST NOT be drink (שותה)!
        candidates = candidates.filter((c) => c.he.replace(/[\u0591-\u05C7]/g, '') !== 'שותה');
      } else if (isApprovedSpeechSaying(nextTok)) {
        // Next word IS a speech saying: verb MUST be a speech verb (אומר/אומרת)!
        candidates = candidates.filter((c) => isSpeechVerb(c));
      } else if (!isApprovedSpeechSaying(nextTok)) {
        // Next word is NOT a speech saying: verb CANNOT be a speech verb (אומר/אומרת)!
        candidates = candidates.filter((c) => !isSpeechVerb(c));
      }
    }
  } else if (isColor) {
    // If the subject/noun preceding this color is "שלום", "מים", or "הגדה", no adjectives/colors!
    if (contextTokens && tokenIndex !== undefined && tokenIndex > 0) {
      const prevTok = contextTokens[tokenIndex - 1];
      if (prevTok?.he === 'שלום' || prevTok?.en.toLowerCase().includes('peace') || prevTok?.en.toLowerCase().includes('hello') || prevTok?.he === 'מים' || prevTok?.en.toLowerCase().includes('water') || prevTok?.he === 'הגדה' || prevTok?.en.toLowerCase().includes('haggadah')) {
        return []; // Shalom, Water, and Haggadah cannot be modified by an adjective!
      }
      const prevIsPerson = prevTok?.type === 'person' || prevTok?.categories?.includes('people') || prevTok?.he === 'אני';
      if (prevIsPerson) {
        // Don't apply colors to people! Offer feelings/adjectives only:
        candidates = bank.filter((w) => {
          const cIsAdj = (w.type === 'adjective' || w.categories.includes('adjectives')) && !w.categories.includes('colors');
          if (!cIsAdj) return false;
          if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
          if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
          return true;
        });
      } else {
        candidates = bank.filter((w) => w.categories.includes('colors') && !w.categories.includes('adjectives'));
      }
    } else {
      candidates = bank.filter((w) => w.categories.includes('colors') && !w.categories.includes('adjectives'));
    }
  } else if (isAdjective) {
    if (contextTokens && tokenIndex !== undefined && tokenIndex > 0) {
      const prevTok = contextTokens[tokenIndex - 1];
      if (prevTok?.he === 'שלום' || prevTok?.en.toLowerCase().includes('peace') || prevTok?.en.toLowerCase().includes('hello') || prevTok?.he === 'מים' || prevTok?.en.toLowerCase().includes('water') || prevTok?.he === 'הגדה' || prevTok?.en.toLowerCase().includes('haggadah')) {
        return []; // Shalom, Water, and Haggadah cannot be modified by an adjective!
      }
    }
    // Feelings / Adjectives: strictly shuffle feelings only, excluding colors
    candidates = bank.filter((w) => {
      const cIsAdj = (w.type === 'adjective' || w.categories.includes('adjectives')) && !w.categories.includes('colors');
      if (!cIsAdj) return false;
      if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
      if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
      return true;
    });
  } else if (isFood) {
    // Food / Direct Object
    candidates = bank.filter((w) => {
      if (!w.categories.includes('food')) return false;
      if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
      if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
      return true;
    });

    // Check preceding verb: eat vs drink!
    if (contextTokens && tokenIndex !== undefined && tokenIndex > 0) {
      const prevTok = contextTokens[tokenIndex - 1];
      const prevUnv = prevTok.he.replace(/[\u0591-\u05C7]/g, '');
      if (prevUnv === 'אוכל' || prevUnv === 'אוכלת') {
        // Eating: NEVER drinks (milk, water, juice)! Solid food only!
        candidates = candidates.filter((c) => !isDrinkOrLiquid(c));
      } else if (prevUnv === 'שותה') {
        // Drinking: ONLY drinks (milk, water, juice)!
        candidates = candidates.filter((c) => isDrinkOrLiquid(c));
      }
    }
  } else {
    // General Nouns (animals, places, transportation, jewish, body, etc.)
    const primaryCat = tokenCategories[0];
    if (primaryCat && primaryCat !== 'other') {
      candidates = bank.filter((w) => {
        if (!w.categories.includes(primaryCat)) return false;
        if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
        if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
        return true;
      });
    }

    if (candidates.length < 3) {
      candidates = bank.filter((w) => {
        if (w.type === 'helper' || w.type === 'verb') return false;
        if (tokenGender === 'm') return w.gender === 'm' || w.gender === 'both';
        if (tokenGender === 'f') return w.gender === 'f' || w.gender === 'both';
        return true;
      });
    }

    // If next token is an adjective, shalom cannot be modified by an adjective!
    if (contextTokens && tokenIndex !== undefined && tokenIndex < contextTokens.length - 1 && contextTokens[tokenIndex + 1]?.type === 'adjective') {
      candidates = candidates.filter((c) => c.he !== 'שלום' && !c.en.toLowerCase().includes('peace') && !c.en.toLowerCase().includes('hello'));
    }

    // You cannot do anything inside a carrot or parachute: if preceded by preposition ב, exclude carrot and parachute!
    if (contextTokens && tokenIndex !== undefined && tokenIndex > 0) {
      const prev = contextTokens[tokenIndex - 1];
      if (prev?.he === 'ב' || prev?.vocalizedHe === 'בַּ') {
        candidates = candidates.filter((c) => c.he !== 'גזר' && c.he !== 'מצנח' && !c.en.toLowerCase().includes('carrot') && !c.en.toLowerCase().includes('parachute'));
      }
    }

    // If next token or later token is preposition ל leading into a person (possession pattern), exclude proper places (like TLV Airport, Jerusalem) from candidates, while allowing non-proper places (like farm, classroom)!
    if (contextTokens && tokenIndex !== undefined) {
      const isBeforeL = contextTokens.slice(tokenIndex + 1).some((t) => t.he === 'ל' || t.vocalizedHe === 'לְ');
      if (isBeforeL) {
        candidates = candidates.filter((c) => !isProperPlaceToken(c));
      }
    }
  }

  // Strict adjective deduplication: if cycling an adjective, exclude adjectives already used elsewhere in the sentence
  if (isAdjectiveWord(token) && contextTokens) {
    const otherAdjBases = new Set<string>();
    contextTokens.forEach((t, i) => {
      if (i !== tokenIndex && isAdjectiveWord(t)) {
        otherAdjBases.add(getAdjectiveBaseKey(t));
      }
    });
    if (otherAdjBases.size > 0) {
      candidates = candidates.filter((c) => !otherAdjBases.has(getAdjectiveBaseKey(c)));
    }
  }

  // Exclude current word itself
  const unvocalizedToken = (token.vocalizedHe || token.he).replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
  candidates = candidates.filter((c) => {
    const cUnvocalized = (c.vocalizedHe || c.he).replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
    return cUnvocalized !== unvocalizedToken || c.en.toLowerCase() !== token.en.toLowerCase();
  });

  return candidates;
}

const PLURAL_VERBS_HEBREW: Record<string, { he: string; vocalizedHe: string; en: string }> = {
  'אוכל': { he: 'אוכלים', vocalizedHe: 'אוֹכְלִים', en: 'eat' },
  'אוכלת': { he: 'אוכלים', vocalizedHe: 'אוֹכְלִים', en: 'eat' },
  'שותה': { he: 'שותים', vocalizedHe: 'שׁוֹתִים', en: 'drink' },
  'שר': { he: 'שרים', vocalizedHe: 'שָׁרִים', en: 'sing' },
  'שרה': { he: 'שרים', vocalizedHe: 'שָׁרִים', en: 'sing' },
  'אומר': { he: 'אומרים', vocalizedHe: 'אוֹמְרִים', en: 'say' },
  'אומרת': { he: 'אומרים', vocalizedHe: 'אוֹמְרִים', en: 'say' },
  'קורא': { he: 'קוראים', vocalizedHe: 'קוֹרְאִים', en: 'read' },
  'קוראת': { he: 'קוראים', vocalizedHe: 'קוֹרְאִים', en: 'read' },
  'כותב': { he: 'כותבים', vocalizedHe: 'כּוֹתְבִים', en: 'write' },
  'כותבת': { he: 'כותבים', vocalizedHe: 'כּוֹתְבִים', en: 'write' },
  'עומד': { he: 'עומדים', vocalizedHe: 'עוֹמְדִים', en: 'stand' },
  'עומדת': { he: 'עומדים', vocalizedHe: 'עוֹמְדִים', en: 'stand' },
  'יושב': { he: 'יושבים', vocalizedHe: 'יוֹשְׁבִים', en: 'sit' },
  'יושבת': { he: 'יושבים', vocalizedHe: 'יוֹשְׁבִים', en: 'sit' },
};

function getPluralVerbToken(verbToken: WordToken): WordToken {
  const unv = verbToken.he.replace(/[\u0591-\u05C7]/g, '');
  const pluralData = PLURAL_VERBS_HEBREW[unv];
  if (pluralData) {
    return {
      ...verbToken,
      he: pluralData.he,
      vocalizedHe: pluralData.vocalizedHe,
      en: pluralData.en,
    };
  }
  return verbToken;
}

export function isAndConjunction(token: WordToken): boolean {
  if (!token) return false;
  const he = token.he.replace(/[֑-ׇ]/g, '').trim();
  const en = token.en.trim().toLowerCase();
  return he === 'ו' || token.vocalizedHe === 'וְ' || en === 'and' || token.id === 'gen-conj-and';
}

export function isAdjectiveWord(token: WordToken): boolean {
  if (!token) return false;
  return (
    token.type === 'adjective' ||
    Boolean(token.categories?.includes('adjectives')) ||
    Boolean(token.categories?.includes('colors'))
  );
}

export function getAdjectiveBaseKey(token: WordToken): string {
  if (!token) return '';
  const en = (token.en || '').toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
  if (en) {
    if (en.includes('happy')) return 'happy';
    if (en.includes('sad')) return 'sad';
    if (en.includes('tired')) return 'tired';
    if (en.includes('angry')) return 'angry';
    if (en.includes('sick')) return 'sick';
    if (en.includes('hungry')) return 'hungry';
    if (en.includes('excited')) return 'excited';
    if (en.includes('big')) return 'big';
    if (en.includes('small')) return 'small';
    if (en.includes('good')) return 'good';
    if (en.includes('pretty')) return 'pretty';
    if (en.includes('red')) return 'red';
    if (en.includes('orange')) return 'orange';
    if (en.includes('yellow')) return 'yellow';
    if (en.includes('green')) return 'green';
    if (en.includes('blue')) return 'blue';
    if (en.includes('purple')) return 'purple';
    if (en.includes('pink')) return 'pink';
    if (en.includes('brown')) return 'brown';
    if (en.includes('gray') || en.includes('grey')) return 'gray';
    if (en.includes('white')) return 'white';
    if (en.includes('black')) return 'black';
    return en;
  }
  const cleanHe = (token.he || '').replace(/[\u0591-\u05C7]/g, '');
  const heBaseMap: Record<string, string> = {
    'שמח': 'happy', 'שמחה': 'happy',
    'עצוב': 'sad', 'עצובה': 'sad',
    'עייף': 'tired', 'עייפה': 'tired',
    'כועס': 'angry', 'כועסת': 'angry',
    'חולה': 'sick',
    'רעב': 'hungry', 'רעבה': 'hungry',
    'נרגש': 'excited', 'נרגשת': 'excited',
    'גדול': 'big', 'גדולה': 'big',
    'קטן': 'small', 'קטנה': 'small',
    'טוב': 'good', 'טובה': 'good',
    'יפה': 'pretty',
    'אדום': 'red', 'כתום': 'orange', 'צהוב': 'yellow', 'ירוק': 'green',
    'כחול': 'blue', 'סגול': 'purple', 'ורוד': 'pink', 'חום': 'brown',
    'אפור': 'gray', 'לבן': 'white', 'שחור': 'black',
  };
  if (heBaseMap[cleanHe]) return heBaseMap[cleanHe];
  return cleanHe;
}

export function validateSentence(tokens: WordToken[]): { isGrammatical: boolean; warning: string | null } {
  if (tokens.length === 0) return { isGrammatical: true, warning: null };

  const andCount = tokens.filter(isAndConjunction).length;
  if (andCount > 1) {
    return { isGrammatical: false, warning: 'Maximum of one "and" (ו) conjunction per sentence!' };
  }

  // Rule: Compound sentence distinct verbs rule (when 'and' joins two clauses with verbs)
  if (andCount === 1) {
    const conjIdx = tokens.findIndex(isAndConjunction);
    if (conjIdx > 0 && conjIdx < tokens.length - 1) {
      const leftClause = tokens.slice(0, conjIdx);
      const rightClause = tokens.slice(conjIdx + 1);

      const leftVerbs = leftClause.filter((t) => t.type === 'verb' || t.categories?.includes('verbs'));
      const rightVerbs = rightClause.filter((t) => t.type === 'verb' || t.categories?.includes('verbs'));

      if (leftVerbs.length > 0 && rightVerbs.length > 0) {
        for (const lv of leftVerbs) {
          const lvBase = lv.he.replace(/[\u0591-\u05C7]/g, '');
          const lvEn = lv.en.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
          for (const rv of rightVerbs) {
            const rvBase = rv.he.replace(/[\u0591-\u05C7]/g, '');
            const rvEn = rv.en.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
            // Prevent same verb root in both clauses (e.g., שר and שרה, or identical verb tokens)
            if (lvBase === rvBase || lvEn === rvEn) {
              return {
                isGrammatical: false,
                warning: 'Compound sentence clauses connected by "and" must use distinct verbs!',
              };
            }
          }
        }
      }
    }
  }

  // Rule: Strict adjective deduplication (an adjective can appear AT MOST ONCE per sentence)
  const sentenceAdjs = tokens.filter(isAdjectiveWord);
  if (sentenceAdjs.length > 1) {
    const seenAdjBases = new Set<string>();
    for (const adj of sentenceAdjs) {
      const baseKey = getAdjectiveBaseKey(adj);
      if (seenAdjBases.has(baseKey)) {
        return {
          isGrammatical: false,
          warning: 'Sentences cannot reuse the same adjective or feeling more than once!',
        };
      }
      seenAdjBases.add(baseKey);
    }
  }

  // Special greetings: "שלום", "שבת שלום", and "חג שמח" are 100% complete valid phrases!
  const rawHe = tokens.map((t) => t.he).join(' ');
  if (rawHe === 'שלום' || rawHe === 'שבת שלום' || rawHe === 'חג שמח') {
    return { isGrammatical: true, warning: null };
  }

  let isGrammatical = true;
  let warning: string | null = null;

  // Rule: Shalom cannot be modified by an adjective!
  let shalomWithAdj = false;
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    if (curr.he === 'שלום' && (next.type === 'adjective' || next.categories?.includes('colors') || next.categories?.includes('adjectives'))) {
      shalomWithAdj = true;
      break;
    }
  }

  // Rule: Water in Hebrew is plural and cannot take an adjective!
  let waterWithAdj = false;
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    const isWater = curr.he === 'מים' || curr.en.toLowerCase().includes('water');
    const isAdj = next.type === 'adjective' || next.categories?.includes('colors') || next.categories?.includes('adjectives');
    if (isWater && isAdj) {
      waterWithAdj = true;
      break;
    }
  }

  // Rule: Haggadah is feminine and cannot take an adjective!
  let haggadahWithAdj = false;
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    const isHaggadah = curr.he === 'הגדה' || curr.en.toLowerCase().includes('haggadah');
    const isAdj = next.type === 'adjective' || next.categories?.includes('colors') || next.categories?.includes('adjectives');
    if (isHaggadah && isAdj) {
      haggadahWithAdj = true;
      break;
    }
  }

  // Rule: Don't apply colors to people!
  let personWithColor = false;
  let coloredPersonName = '';
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    const isPerson = curr.type === 'person' || curr.categories?.includes('people') || curr.he === 'אני';
    const isColor = next.categories?.includes('colors');
    if (isPerson && isColor) {
      personWithColor = true;
      coloredPersonName = curr.en;
      break;
    }
  }

  // Rule: Intransitive verbs cannot take direct objects directly
  let intransitiveViolation = false;
  let intransitiveVerbWord = '';
  let intransitiveNounWord = '';
  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    const isIntransitive = ['יושב', 'יושבת', 'עומד', 'עומדת', 'שר', 'שרה'].includes(curr.he.replace(/[\u0591-\u05C7]/g, ''));
    const isDirectObject = next.type === 'noun' || next.type === 'person' || next.categories?.includes('animals');
    
    if (isIntransitive && isDirectObject) {
      intransitiveViolation = true;
      intransitiveVerbWord = curr.en.toLowerCase();
      intransitiveNounWord = next.en.toLowerCase();
      break;
    }
  }

  // Rule: Prepositional location (ב) must be preceded by an animate subject (person/animal/I)
  let inanimateLocationViolation = false;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].he === 'ב' || tokens[i].vocalizedHe === 'בַּ') {
      let subjTok: WordToken | null = null;
      for (let j = i - 1; j >= 0; j--) {
        const candidate = tokens[j];
        if (candidate.type === 'person' || candidate.type === 'noun' || candidate.categories?.includes('animals')) {
          subjTok = candidate;
          break;
        }
      }
      if (subjTok) {
        const subjCats = subjTok.categories?.length ? subjTok.categories : getWordCategories({ wordEn: subjTok.en, wordHe: subjTok.he });
        const isAnimate = subjTok.type === 'person' || subjCats.includes('animals') || subjTok.he === 'אני';
        if (!isAnimate) {
          inanimateLocationViolation = true;
          break;
        }
      }
    }
  }

  if (intransitiveViolation) {
    isGrammatical = false;
    warning = `In Hebrew, you cannot "${intransitiveVerbWord}" "${intransitiveNounWord}" directly! You need the helper "ב" (in/at).`;
  } else if (inanimateLocationViolation) {
    isGrammatical = false;
    warning = 'Inanimate objects cannot be placed in locations!';
  } else if (shalomWithAdj) {
    isGrammatical = false;
    warning = '"שלום" (peace / hello) cannot be modified by an adjective!';
  } else if (haggadahWithAdj) {
    isGrammatical = false;
    warning = '"הגדה" (Haggadah) is feminine and cannot be modified by an adjective!';
  } else if (waterWithAdj) {
    isGrammatical = false;
    warning = '"מים" (water) is plural in Hebrew and cannot take an adjective!';
  } else if (personWithColor) {
    isGrammatical = false;
    warning = `Don't apply colors to people! Use a feeling (like happy, tired, or excited) instead of a color for ${coloredPersonName}.`;
  } else if (tokens.length >= 1 && (tokens[0].type === 'adjective' || tokens[0].categories?.includes('colors') || tokens[0].categories?.includes('adjectives'))) {
    isGrammatical = false;
    warning = 'In Hebrew, the noun comes before the adjective! Start with a noun first.';
  } else if (tokens.length === 1) {
    isGrammatical = false;
    warning = 'A sentence needs more than one word!';
  } else {
    const first = tokens[0];
    const second = tokens[1];
    const third = tokens[2];

    let adjFollowedByNoun = false;
    let adjFollowedByVerb = false;
    for (let i = 0; i < tokens.length - 1; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];
      if (curr.type === 'adjective' && (next.type === 'noun' || next.type === 'person')) {
        adjFollowedByNoun = true;
        break;
      }
      if (curr.type === 'adjective' && next.type === 'verb') {
        adjFollowedByVerb = true;
        break;
      }
    }

    let consecutiveNouns = false;
    for (let i = 0; i < tokens.length - 1; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];
      if ((curr.type === 'noun' || curr.type === 'person') && (next.type === 'noun' || next.type === 'person')) {
        if (curr.he === 'שבת' && next.he === 'שלום') {
          continue;
        }
        if (curr.he === 'חג' && (next.he === 'שמח' || next.en.toLowerCase().includes('happy'))) {
          continue;
        }
        consecutiveNouns = true;
        break;
      }
    }

    if (first.isPrefix && (first.he === 'ל' || first.he === 'ב')) {
      isGrammatical = false;
      warning = 'Sentences cannot start with a preposition prefix (ל/ב)!';
    }
    else if (tokens[tokens.length - 1]?.isPrefix) {
      isGrammatical = false;
      warning = 'You need to add another noun for the helper to connect to!';
    }
    else if (first.type === 'verb') {
      isGrammatical = false;
      warning = 'Sentences need a subject before the verb!';
    }
    else if (second?.he === 'ב' && third && third.type !== 'noun' && third.type !== 'person') {
      isGrammatical = false;
      warning = '"ב" (in/at) must be followed by a place or noun!';
    }
    else if (tokens.some((t, idx) => (t.he === 'ב' || t.vocalizedHe === 'בַּ') && tokens[idx + 1] && (tokens[idx + 1].he === 'אופנוע' || tokens[idx + 1].en.toLowerCase().includes('motorcycle')))) {
      isGrammatical = false;
      warning = 'In Hebrew, you cannot use "ב" with "אופנוע" (motorcycle)! You say "על אופנוע" (on a motorcycle).';
    }
    else if (tokens.some((t, idx) => (t.he === 'ב' || t.vocalizedHe === 'בַּ') && tokens[idx + 1] && (tokens[idx + 1].he === 'אופניים' || tokens[idx + 1].en.toLowerCase().includes('bicycle')))) {
      isGrammatical = false;
      warning = 'In Hebrew, you cannot use "ב" with "אופניים" (bicycle)! You say "על אופניים" (on a bicycle).';
    }
    else if (tokens.some((t, idx) => t.he === 'ל' && tokens[idx + 1] && !tokens[idx + 1].categories?.includes('people') && !tokens[idx + 1].categories?.includes('animals'))) {
      isGrammatical = false;
      warning = 'In Hebrew, "ל" (for/to) can only point to a person or animal recipient!';
    }
    else if (adjFollowedByNoun) {
      isGrammatical = false;
      warning = 'In Hebrew, adjectives must come after the noun, not before!';
    }
    else if (adjFollowedByVerb) {
      isGrammatical = false;
      warning = 'In Hebrew, you cannot put an adjective directly before a verb! Say "Moses is sad" or "Moses says hello", but not both together.';
    }
    else if (consecutiveNouns) {
      isGrammatical = false;
      warning = 'Nouns need a verb or preposition between them!';
    }
    else {
      let consecutiveAdjs = 0;
      let maxConsecutiveAdjs = 0;
      for (const tok of tokens) {
        if (tok.type === 'adjective') {
          consecutiveAdjs++;
          if (consecutiveAdjs > maxConsecutiveAdjs) maxConsecutiveAdjs = consecutiveAdjs;
        } else {
          consecutiveAdjs = 0;
        }
      }

      if (maxConsecutiveAdjs > 1) {
        isGrammatical = false;
        warning = 'Too many adjectives in a row! You can only have one adjective describing a noun.';
      }
      else {
        let semanticMismatch = false;
        let semanticWarning: string | null = null;
        let adjGenderMismatch = false;
        let adjMismatchWarning: string | null = null;

        for (let i = 0; i < tokens.length - 1; i++) {
          const curr = tokens[i];
          const next = tokens[i + 1];

          if ((curr.type === 'noun' || curr.type === 'person') && next.type === 'adjective') {
            const nounHe = curr.he;
            const adjHe = next.he;

            const feelingHebrewWords = ['שמח', 'שמחה', 'עצוב', 'עצובה', 'עייף', 'עייפה', 'כועס', 'כועסת', 'חולה', 'נרגש', 'נרגשת', 'רעב', 'רעבה'];
            const isFeelingAdj = feelingHebrewWords.includes(adjHe) || next.categories?.includes('adjectives');
            const currCats = curr.categories?.length ? curr.categories : getWordCategories({ wordEn: curr.en, wordHe: curr.he });
            const isAnimate = curr.type === 'person' || currCats.includes('animals') || curr.he === 'אני';

            if (isFeelingAdj && !isAnimate) {
              if (curr.he === 'חג' && (next.he === 'שמח' || next.en.toLowerCase().includes('happy'))) {
                // Festive holiday greeting
              } else {
                semanticMismatch = true;
                semanticWarning = `Inanimate objects like "${curr.en}" cannot have feelings!`;
                break;
              }
            }

            const nGender = getTokenGender(curr);
            const aGender = getTokenGender(next);
            if (nGender !== 'both' && aGender !== 'both' && nGender !== aGender) {
              adjGenderMismatch = true;
              adjMismatchWarning = nGender === 'm'
                ? `Gender mismatch: "${nounHe}" is masculine, but "${adjHe}" is feminine!`
                : `Gender mismatch: "${nounHe}" is feminine, but "${adjHe}" is masculine!`;
              break;
            }
          }
        }

        if (semanticMismatch && semanticWarning) {
          isGrammatical = false;
          warning = semanticWarning;
        } else if (adjGenderMismatch && adjMismatchWarning) {
          isGrammatical = false;
          warning = adjMismatchWarning;
        } else {
          let verbSubjectMismatch = false;
          let verbMismatchWarning: string | null = null;

          for (let i = 0; i < tokens.length; i++) {
            const tok = tokens[i];
            if (tok.type === 'verb') {
              let subjectTok: WordToken | null = null;
              for (let j = i - 1; j >= 0; j--) {
                const candidate = tokens[j];
                if (candidate.type === 'person' || candidate.type === 'noun') {
                  if (j > 0 && (tokens[j - 1]?.he === 'ב' || tokens[j - 1]?.he === 'ל' || tokens[j - 1]?.vocalizedHe === 'בַּ' || tokens[j - 1]?.vocalizedHe === 'לְ')) {
                    continue;
                  }
                  subjectTok = candidate;
                  break;
                }
              }

              if (!subjectTok) {
                verbSubjectMismatch = true;
                verbMismatchWarning = 'Verbs need a subject before them!';
                break;
              }

              const subjCats = subjectTok.categories?.length ? subjectTok.categories : getWordCategories({ wordEn: subjectTok.en, wordHe: subjectTok.he });
              const isAnimateSubject = subjectTok.type === 'person' || subjCats.includes('animals') || subjectTok.he === 'אני';
              if (!isAnimateSubject) {
                verbSubjectMismatch = true;
                verbMismatchWarning = `Inanimate objects like "${subjectTok.en}" cannot perform actions!`;
                break;
              }

              const sGender = getTokenGender(subjectTok);
              const vGender = getTokenGender(tok);
              if (sGender !== 'both' && vGender !== 'both' && sGender !== vGender) {
                verbSubjectMismatch = true;
                verbMismatchWarning = sGender === 'm'
                  ? `Gender mismatch: "${subjectTok.he}" is masculine, but "${tok.he}" is feminine!`
                  : `Gender mismatch: "${subjectTok.he}" is feminine, but "${tok.he}" is masculine!`;
                break;
              }
            }
          }

          if (verbSubjectMismatch && verbMismatchWarning) {
            isGrammatical = false;
            warning = verbMismatchWarning;
          } else {
            let verbObjectMismatch = false;
            let verbObjectWarning: string | null = null;

            for (let i = 0; i < tokens.length; i++) {
              const vTok = tokens[i];
              if (vTok.type === 'verb') {
                const vUnv = vTok.he.replace(/[\u0591-\u05C7]/g, '');
                const isSay = ['אומר', 'אומרת', 'אומרים', 'אומרות'].includes(vUnv) ||
                  ['says (m)', 'says (f)', 'saying (m)', 'saying (f)', 'says', 'say'].includes(vTok.en.toLowerCase());

                if (isSay || isSpeechVerb(vTok)) {
                  const oTok = tokens[i + 1];
                  if (!oTok) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `In Hebrew, "${vTok.he}" (says) cannot end a sentence by itself! Add a saying like "שלום", "תודה", or "סבבה".`;
                    break;
                  }

                  if (!isApprovedSpeechSaying(oTok)) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `In Hebrew, "${vTok.he}" (says) must be followed ONLY by a valid dialogue saying (like שלום, שבת שלום, חג שמח, תודה, סליחה, סבבה, כן, לא, בבקשה, or איזה בלגן)!`;
                    break;
                  }
                }

                const oTok = tokens[i + 1];
                if (oTok && (oTok.type === 'noun' || oTok.categories?.includes('food'))) {
                  const isEat = vUnv === 'אוכל' || vUnv === 'אוכלת' || vUnv === 'אוכלים' || vUnv === 'אוכלות';
                  const isDrink = vUnv === 'שותה' || vUnv === 'שותים' || vUnv === 'שותות';
                  const isLiquid = isDrinkOrLiquid(oTok);

                  const isWrite = vUnv === 'כותב' || vUnv === 'כותבת' || vUnv === 'כותבים' || vUnv === 'כותבות';
                  const isHolyBook = oTok.he === 'הגדה' || oTok.en.toLowerCase().includes('haggadah');

                  if (isDrink) {
                    const hasAndAfter = tokens.slice(i + 1).some(t => t.he === 'ו' || t.vocalizedHe === 'וְ' || t.en.toLowerCase() === 'and');
                    if (hasAndAfter) {
                      verbObjectMismatch = true;
                      verbObjectWarning = 'Drinking verbs cannot have compound objects (you can only drink one beverage at a time)!';
                      break;
                    }
                  }

                  if ((isEat || isDrink) && (oTok.categories?.includes('sayings') || oTok.id === 'saying_sababa' || ['כן', 'לא', 'שלום', 'תודה', 'סליחה', 'בבקשה', 'סבבה', 'סַבָּבָה'].includes(oTok.he))) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `You cannot eat or drink sayings! Use "says" (אומר/אומרת) instead.`;
                    break;
                  }

                  if (isEat && isLiquid) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `${oTok.en.charAt(0).toUpperCase() + oTok.en.slice(1)} is a drink! You drink it (שותה), you cannot eat it.`;
                    break;
                  }
                  if (isDrink && !isLiquid && oTok.categories?.includes('food')) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `You can only drink liquids (water, milk, juice)! Use "eats" (אוכל/אוכלת) for ${oTok.en}.`;
                    break;
                  }
                  if (isWrite && (oTok.he === 'תורה' || oTok.en.toLowerCase() === 'torah')) {
                    verbObjectMismatch = true;
                    verbObjectWarning = 'Don\'t connect "כותב/כותבת" directly with "תורה". Write "ספר תורה" (a Torah scroll) instead!';
                    break;
                  }
                  if (isWrite && isHolyBook) {
                    verbObjectMismatch = true;
                    verbObjectWarning = `A ${oTok.en} is read (קורא/קוראת), not written!`;
                    break;
                  }
                }
              }
            }

            if (verbObjectMismatch && verbObjectWarning) {
              isGrammatical = false;
              warning = verbObjectWarning;
            }
          }
        }
      }
    }
  }

  return { isGrammatical, warning };
}

export function generateRandomGrammaticalSentence(bank: WordToken[], maxLength: number = 5): WordToken[] {
  const targetLen = Math.max(2, Math.min(10, Math.round(maxLength || 5)));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const freshToken = (t: WordToken, prefixOverride?: boolean): WordToken => ({
    ...t,
    id: `gen-${t.he}-${Math.random().toString(36).substring(2, 8)}`,
    isPrefix: prefixOverride !== undefined ? prefixOverride : t.isPrefix,
  });

  const personsAndAnimals = bank.filter((w) => {
    const isP = w.type === 'person' || w.categories.includes('people');
    const isA = w.categories.includes('animals');
    return isP || isA;
  });

  const verbs = bank.filter((w) => (w.type === 'verb' || w.categories.includes('verbs')) && w.id !== 'person_sarah');
  const foodsAndNouns = bank.filter((w) => {
    if (w.type === 'helper' || w.type === 'verb' || isPlaceToken(w)) return false;
    return w.categories.includes('food') || w.type === 'noun' || w.categories.includes('jewish') || w.categories.includes('body') || w.categories.includes('transportation');
  });

  const feelings = bank.filter((w) => (w.type === 'adjective' || w.categories.includes('adjectives')) && !w.categories.includes('colors'));
  const colors = bank.filter((w) => w.categories.includes('colors') && !w.categories.includes('adjectives'));
  const places = bank.filter((w) => (w.categories.includes('places') || w.categories.includes('locations') || isPlaceToken(w)) && w.he !== 'גזר' && w.he !== 'מצנח' && w.he !== 'אופנוע' && !w.en.toLowerCase().includes('carrot') && !w.en.toLowerCase().includes('parachute') && !w.en.toLowerCase().includes('motorcycle'));
  const helpers = bank.filter((w) => w.type === 'helper' || w.categories.includes('helpers'));

  const prepB = helpers.find((w) => w.he === 'ב' || w.vocalizedHe === 'בַּ') || {
    id: 'gen-prep-b',
    he: 'ב',
    vocalizedHe: 'בַּ',
    en: 'in the',
    type: 'helper' as const,
    gender: 'both' as const,
    categories: ['helpers'],
    isPrefix: true,
    emoji: 'בּ\n👇',
  };

  const prepL = helpers.find((w) => w.he === 'ל' || w.vocalizedHe === 'לְ') || {
    id: 'gen-prep-l',
    he: 'ל',
    vocalizedHe: 'לְ',
    en: 'for',
    type: 'helper' as const,
    gender: 'both' as const,
    categories: ['helpers'],
    isPrefix: true,
    emoji: '👈ל',
  };

  const rawAndToken = helpers.find((w) => w.he === 'ו' || w.vocalizedHe === 'וְ' || w.en.toLowerCase() === 'and') || {
    id: 'gen-conj-and',
    he: 'ו',
    vocalizedHe: 'וְ',
    en: 'and',
    type: 'helper' as const,
    gender: 'both' as const,
    categories: ['helpers'],
    isPrefix: true,
    emoji: '🔗',
  };
  const getAndToken = () => freshToken(rawAndToken, true);

  // Helper to get matching verb for a subject
  const getAgreeingVerb = (subj: WordToken, intransitiveOnly?: boolean, transitiveOnly?: boolean, excludeVerb?: WordToken | WordToken[]): WordToken => {
    const sG = subj.gender || getTokenGender(subj);
    const excludeBases = new Set<string>();
    if (excludeVerb) {
      const arr = Array.isArray(excludeVerb) ? excludeVerb : [excludeVerb];
      arr.forEach((v) => {
        if (v) {
          excludeBases.add(v.he.replace(/[\u0591-\u05C7]/g, ''));
          excludeBases.add(v.en.toLowerCase().replace(/\s*\(.*?\)/g, '').trim());
        }
      });
    }

    let pool = verbs.filter((v) => {
      const vG = v.gender || getTokenGender(v);
      const vBase = v.he.replace(/[\u0591-\u05C7]/g, '');
      const vEn = v.en.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
      if (excludeBases.has(vBase) || excludeBases.has(vEn)) return false;
      return sG === 'both' || vG === 'both' || vG === sG;
    });

    if (intransitiveOnly) {
      const intransitiveHe = ['יושב', 'יושבת', 'עומד', 'עומדת', 'שר', 'שרה'];
      const sub = pool.filter((v) => intransitiveHe.includes(v.he.replace(/[\u0591-\u05C7]/g, '')));
      if (sub.length > 0) pool = sub;
    } else if (transitiveOnly) {
      const intransitiveHe = ['יושב', 'יושבת', 'עומד', 'עומדת', 'שר', 'שרה'];
      const sub = pool.filter((v) => !intransitiveHe.includes(v.he.replace(/[\u0591-\u05C7]/g, '')));
      if (sub.length > 0) pool = sub;
    }
    return pool.length > 0 ? pick(pool) : verbs.find((v) => {
      const vBase = v.he.replace(/[\u0591-\u05C7]/g, '');
      return !excludeBases.has(vBase);
    }) || verbs[0] || subj;
  };

  // Helper to pick valid direct objects for a specific verb
  const getValidDirectObjectsForVerb = (verbToken: WordToken): WordToken[] => {
    const vHe = verbToken.he.replace(/[\u0591-\u05C7]/g, '');

    if (vHe === 'אוכל' || vHe === 'אוכלת') {
      const foodPool = bank.filter((w) => w.categories.includes('food') && !isDrinkOrLiquid(w));
      return foodPool.length > 0 ? [pick(foodPool)] : [];
    }

    if (vHe === 'שותה') {
      const liquidPool = bank.filter((w) => isDrinkOrLiquid(w));
      return liquidPool.length > 0 ? [pick(liquidPool)] : [];
    }

    if (vHe === 'כותב' || vHe === 'כותבת') {
      const writePool = bank.filter(
        (w) =>
          w.he === 'ספר' ||
          w.en.toLowerCase() === 'book'
      );
      return writePool.length > 0 ? [pick(writePool)] : [];
    }

    if (vHe === 'קורא' || vHe === 'קוראת') {
      const readPool = bank.filter(
        (w) =>
          w.he === 'ספר' ||
          w.he === 'הגדה' ||
          w.he === 'תורה' ||
          w.en.toLowerCase() === 'book' ||
          w.en.toLowerCase().includes('haggadah') ||
          w.en.toLowerCase() === 'torah'
      );
      return readPool.length > 0 ? [pick(readPool)] : [];
    }

    if (vHe === 'אומר' || vHe === 'אומרת') {
      const sayingPool = bank.filter(
        (w) =>
          w.categories?.includes('sayings') ||
          w.id === 'saying_sababa' ||
          ['שלום', 'כן', 'לא', 'תודה', 'סליחה', 'בבקשה', 'סבבה', 'סַבָּבָה'].includes(w.he) ||
          ['hello', 'peace', 'yes', 'no', 'thank you', 'sorry', 'please', 'cool', 'sababa'].some((s) => w.en.toLowerCase().includes(s))
      );
      return sayingPool.length > 0 ? [pick(sayingPool)] : [];
    }

    return [];
  };

  // Helper to draw a single clause of exact length (2, 3, 4, 5, 6, 7)
  const drawClause = (
    size: number,
    excludeVerbs?: WordToken[],
    usedAdjectives?: Set<string>,
    excludeSubjs?: WordToken[],
    preferAdj?: boolean
  ): WordToken[] => {
    const subjCandidates = personsAndAnimals.length > 0 ? personsAndAnimals : bank;
    const filteredSubj = excludeSubjs && excludeSubjs.length > 0
      ? subjCandidates.filter((s) => !excludeSubjs.some((e) => e.he === s.he || e.en.toLowerCase() === s.en.toLowerCase()))
      : subjCandidates;
    const subj = pick(filteredSubj.length > 0 ? filteredSubj : subjCandidates);
    const subjG = subj.gender || getTokenGender(subj);
    const place = pick(places.length > 0 ? places : bank);

    if (size === 2) {
      const mode = preferAdj ? 'subject_adj' : pick(['subject_adj', 'subject_verb']);
      if (mode === 'subject_adj') {
        const isPerson = subj.type === 'person' || subj.categories?.includes('people') || subj.he === 'אני';
        if (isPerson) {
          const matchFeelings = feelings.filter((f) => {
            const fG = f.gender || getTokenGender(f);
            const baseKey = getAdjectiveBaseKey(f);
            if (usedAdjectives && usedAdjectives.has(baseKey)) return false;
            return subjG === 'both' || fG === 'both' || fG === subjG;
          });
          const available = matchFeelings.length > 0 ? matchFeelings : feelings.filter(f => !usedAdjectives || !usedAdjectives.has(getAdjectiveBaseKey(f)));
          if (available.length === 0) {
            const verb = getAgreeingVerb(subj, true, false, excludeVerbs);
            return [freshToken(subj), freshToken(verb)];
          }
          const adj = pick(available);
          if (usedAdjectives) usedAdjectives.add(getAdjectiveBaseKey(adj));
          return [freshToken(subj), freshToken(adj)];
        } else {
          const matchColors = colors.filter((c) => {
            const cG = c.gender || getTokenGender(c);
            const baseKey = getAdjectiveBaseKey(c);
            if (usedAdjectives && usedAdjectives.has(baseKey)) return false;
            return subjG === 'm' && (cG === 'm' || cG === 'both');
          });
          const matchFeelings = feelings.filter((f) => {
            const fG = f.gender || getTokenGender(f);
            const baseKey = getAdjectiveBaseKey(f);
            if (usedAdjectives && usedAdjectives.has(baseKey)) return false;
            return subjG === 'both' || fG === 'both' || fG === subjG;
          });
          const pool = [...matchFeelings, ...matchColors];
          const available = pool.length > 0 ? pool : feelings.filter(f => !usedAdjectives || !usedAdjectives.has(getAdjectiveBaseKey(f)));
          if (available.length === 0) {
            const verb = getAgreeingVerb(subj, true, false, excludeVerbs);
            return [freshToken(subj), freshToken(verb)];
          }
          const adj = pick(available);
          if (usedAdjectives) usedAdjectives.add(getAdjectiveBaseKey(adj));
          return [freshToken(subj), freshToken(adj)];
        }
      } else {
        const verb = getAgreeingVerb(subj, true, false, excludeVerbs);
        return [freshToken(subj), freshToken(verb)];
      }
    }

    if (size === 3) {
      const mode = pick(['subject_verb_obj', 'subject_prep_place', 'obj_prep_subj']);
      if (mode === 'subject_verb_obj') {
        const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
        const objs = getValidDirectObjectsForVerb(verb);
        if (objs.length === 1) {
          return [freshToken(subj), freshToken(verb), freshToken(objs[0])];
        }
      }
      if (mode === 'obj_prep_subj') {
        const validObjs = foodsAndNouns.filter((w) => !isPlaceToken(w));
        const obj = pick(validObjs.length > 0 ? validObjs : bank);
        return [freshToken(obj), freshToken(prepL, true), freshToken(subj)];
      }
      return [freshToken(subj), freshToken(prepB, true), freshToken(place)];
    }

    if (size === 4) {
      const mode = pick(['subject_verb_prep_place', 'subject_verb_obj_adj', 'subject_write_sefer_torah']);
      if (mode === 'subject_write_sefer_torah') {
        const writeVerbs = verbs.filter((v) => {
          const vHe = v.he.replace(/[\u0591-\u05C7]/g, '');
          const vG = v.gender || getTokenGender(v);
          return (vHe === 'כותב' || vHe === 'כותבת') && (subjG === 'both' || vG === 'both' || vG === subjG);
        });
        if (writeVerbs.length > 0) {
          const v = pick(writeVerbs);
          const tSefer = bank.find((w) => w.he === 'ספר' || w.en.toLowerCase() === 'book');
          const tTorah = bank.find((w) => w.he === 'תורה' || w.en.toLowerCase() === 'torah');
          if (tSefer && tTorah) {
            return [freshToken(subj), freshToken(v), freshToken(tSefer), freshToken(tTorah)];
          }
        }
      }
      if (mode === 'subject_verb_obj_adj') {
        const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
        const objs = getValidDirectObjectsForVerb(verb);
        if (objs.length === 1) {
          const obj = objs[0];
          const objG = obj.gender || getTokenGender(obj);
          const isModifiable =
            obj.he !== 'שלום' &&
            obj.he !== 'כן' &&
            obj.he !== 'לא' &&
            obj.he !== 'תודה' &&
            obj.he !== 'סליחה' &&
            obj.he !== 'בבקשה' &&
            !obj.categories?.includes('sayings') &&
            obj.he !== 'שבת' &&
            obj.he !== 'תורה' &&
            obj.he !== 'הגדה' &&
            obj.he !== 'מים' &&
            !obj.en.toLowerCase().includes('water');
          if (isModifiable && objG === 'm') {
            const matchingColors = colors.filter((c) => {
              const baseKey = getAdjectiveBaseKey(c);
              if (usedAdjectives && usedAdjectives.has(baseKey)) return false;
              return c.gender === 'm' || c.gender === 'both';
            });
            if (matchingColors.length > 0) {
              const col = pick(matchingColors);
              if (usedAdjectives) usedAdjectives.add(getAdjectiveBaseKey(col));
              return [freshToken(subj), freshToken(verb), freshToken(obj), freshToken(col)];
            }
          }
        }
      }
      const verb = getAgreeingVerb(subj, false, false, excludeVerbs);
      return [freshToken(subj), freshToken(verb), freshToken(prepB, true), freshToken(place)];
    }

    if (size === 5) {
      const mode = pick(['subject_verb_obj_prep_place', 'subject_verb_compound_obj']);
      if (mode === 'subject_verb_compound_obj') {
        const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
        const vHe = verb.he.replace(/[\u0591-\u05C7]/g, '');
        if (vHe === 'אוכל' || vHe === 'אוכלת') {
          const foodPool = bank.filter((w) => w.categories.includes('food') && !isDrinkOrLiquid(w));
          if (foodPool.length >= 2) {
            const obj1 = pick(foodPool);
            const rem = foodPool.filter(w => w.he !== obj1.he);
            const obj2 = pick(rem.length > 0 ? rem : foodPool);
            return [freshToken(subj), freshToken(verb), freshToken(obj1), getAndToken(), freshToken(obj2)];
          }
        }
      }
      const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
      const objs = getValidDirectObjectsForVerb(verb);
      const obj = objs.length > 0 ? objs[0] : pick(foodsAndNouns);
      return [freshToken(subj), freshToken(verb), freshToken(obj), freshToken(prepB, true), freshToken(place)];
    }

    if (size === 6) {
      const r = Math.random();
      if (r < 0.35) {
        const writeVerbs = verbs.filter((v) => {
          const vHe = v.he.replace(/[\u0591-\u05C7]/g, '');
          const vG = v.gender || getTokenGender(v);
          return (vHe === 'כותב' || vHe === 'כותבת') && (subjG === 'both' || vG === 'both' || vG === subjG);
        });
        if (writeVerbs.length > 0) {
          const v = pick(writeVerbs);
          const tSefer = bank.find((w) => w.he === 'ספר' || w.en.toLowerCase() === 'book');
          const tTorah = bank.find((w) => w.he === 'תורה' || w.en.toLowerCase() === 'torah');
          if (tSefer && tTorah) {
            return [freshToken(subj), freshToken(v), freshToken(tSefer), freshToken(tTorah), freshToken(prepB, true), freshToken(place)];
          }
        }
      }
      const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
      const objs = getValidDirectObjectsForVerb(verb);
      const obj = objs.length > 0 ? objs[0] : foodsAndNouns.find(w => w.gender === 'm') || bank[0];
      const availColors = colors.filter((c) => {
        const baseKey = getAdjectiveBaseKey(c);
        if (usedAdjectives && usedAdjectives.has(baseKey)) return false;
        return c.gender === 'm' || c.gender === 'both';
      });
      if (availColors.length > 0) {
        const col = pick(availColors);
        if (usedAdjectives) usedAdjectives.add(getAdjectiveBaseKey(col));
        return [freshToken(subj), freshToken(verb), freshToken(obj), freshToken(col), freshToken(prepB, true), freshToken(place)];
      }
      return [freshToken(subj), freshToken(verb), freshToken(obj), freshToken(prepB, true), freshToken(place)];
    }

    if (size === 7) {
      const verb = getAgreeingVerb(subj, false, true, excludeVerbs);
      const foodPool = bank.filter((w) => w.categories.includes('food') && !isDrinkOrLiquid(w));
      const obj1 = foodPool[0] || bank[0];
      const obj2 = foodPool[1] || bank[1] || obj1;
      return [freshToken(subj), freshToken(verb), freshToken(obj1), getAndToken(), freshToken(obj2), freshToken(prepB, true), freshToken(place)];
    }

    return [freshToken(subj), freshToken(place)];
  };

  // Deterministic fallbacks for exact lengths 2-10
  const getFallback = (len: number): WordToken[] => {
    const findT = (he: string, en?: string, id?: string) => bank.find(w => (id && w.id === id) || (he && w.he === he && (!en || w.en.toLowerCase().includes(en.toLowerCase()))) || (en && w.en.toLowerCase().includes(en.toLowerCase()))) || bank[0];
    const tAbba = findT('אבא', 'dad');
    const tIma = findT('אמא', 'mom');
    const tOchel = findT('אוכל', 'eats');
    const tShoteh = findT('שותה', 'drinks');
    const tShara = findT('שרה', 'sings');
    const tSarah = findT('שרה', 'Sarah', 'person_sarah');
    const tTapuach = findT('תפוח', 'apple');
    const tGezer = findT('גזר', 'carrot');
    const tMayim = findT('מים', 'water');
    const tAdom = findT('אדום', 'red');
    const tBayit = findT('בית', 'house');
    const tKita = findT('כיתה', 'classroom');
    const tSameach = findT('שמח', 'happy');

    switch (len) {
      case 2:
        return [freshToken(tAbba), freshToken(tSameach)];
      case 3:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach)];
      case 4:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(tAdom)];
      case 5:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(prepB, true), freshToken(tBayit)];
      case 6:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(tAdom), freshToken(prepB, true), freshToken(tBayit)];
      case 7:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), getAndToken(), freshToken(tGezer), freshToken(prepB, true), freshToken(tBayit)];
      case 8:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(tAdom), getAndToken(), freshToken(tGezer), freshToken(prepB, true), freshToken(tBayit)];
      case 9:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(prepB, true), freshToken(tBayit), getAndToken(), freshToken(tIma), freshToken(tShoteh), freshToken(tMayim)];
      case 10:
        return [freshToken(tAbba), freshToken(tOchel), freshToken(tTapuach), freshToken(prepB, true), freshToken(tBayit), getAndToken(), freshToken(tIma), freshToken(tShara), freshToken(prepB, true), freshToken(tKita)];
      default:
        return [freshToken(tAbba), freshToken(tSameach)];
    }
  };

  const exclamations = bank.filter(
    (w) =>
      w.he === 'איזה בלגן' ||
      w.categories?.includes('sayings') ||
      ['איזה בלגן', 'שלום', 'סבבה'].includes(w.he)
  );
  const eizeBalaganToken = bank.find((w) => w.he === 'איזה בלגן') || exclamations[0];

  // Build sentence matching targetLen
  for (let attempt = 0; attempt < 25; attempt++) {
    let tokens: WordToken[] = [];

    if (targetLen >= 3 && Math.random() < 0.35 && eizeBalaganToken) {
      const usedAdjectives = new Set<string>();
      const baseClause = drawClause(Math.max(2, targetLen - 1), undefined, usedAdjectives);
      if (Math.random() < 0.5) {
        tokens = [freshToken(eizeBalaganToken), ...baseClause];
      } else {
        tokens = [...baseClause, freshToken(eizeBalaganToken)];
      }
    } else {
      const drawCompound = (len1: number, len2: number): WordToken[] => {
        const usedAdjectives = new Set<string>();
        // For compound sentences of two clauses (especially 2+2=5), ensure that when both clauses
        // describe their subjects with adjectives, each distinct noun receives a distinct unique adjective!
        const bothAdj = (len1 === 2 && len2 === 2 && Math.random() < 0.65);
        const c1 = drawClause(len1, undefined, usedAdjectives, undefined, bothAdj);
        const c1Verbs = c1.filter((t) => t.type === 'verb' || t.categories?.includes('verbs'));
        const c1Subjs = c1.filter((t) => t.type === 'person' || t.categories?.includes('people') || t.categories?.includes('animals'));
        const c2 = drawClause(len2, c1Verbs, usedAdjectives, c1Subjs, bothAdj);
        return [...c1, getAndToken(), ...c2];
      };

      if (targetLen === 2) {
        const usedAdjectives = new Set<string>();
        tokens = drawClause(2, undefined, usedAdjectives);
      } else if (targetLen === 3) {
        const usedAdjectives = new Set<string>();
        tokens = drawClause(3, undefined, usedAdjectives);
      } else if (targetLen === 4) {
        const usedAdjectives = new Set<string>();
        tokens = drawClause(4, undefined, usedAdjectives);
      } else if (targetLen === 5) {
        const r = Math.random();
        if (r < 0.45) {
          const usedAdjectives = new Set<string>();
          tokens = drawClause(5, undefined, usedAdjectives);
        } else {
          tokens = drawCompound(2, 2);
        }
      } else if (targetLen === 6) {
        const r = Math.random();
        if (r < 0.35) {
          const usedAdjectives = new Set<string>();
          tokens = drawClause(6, undefined, usedAdjectives);
        } else if (r < 0.68) {
          tokens = drawCompound(3, 2);
        } else {
          tokens = drawCompound(2, 3);
        }
      } else if (targetLen === 7) {
        const r = Math.random();
        if (r < 0.3) {
          const usedAdjectives = new Set<string>();
          tokens = drawClause(7, undefined, usedAdjectives);
        } else if (r < 0.65) {
          tokens = drawCompound(3, 3);
        } else {
          tokens = drawCompound(4, 2);
        }
      } else if (targetLen === 8) {
        const r = Math.random();
        if (r < 0.45) {
          tokens = drawCompound(4, 3);
        } else if (r < 0.8) {
          tokens = drawCompound(3, 4);
        } else {
          tokens = drawCompound(5, 2);
        }
      } else if (targetLen === 9) {
        const r = Math.random();
        if (r < 0.45) {
          tokens = drawCompound(4, 4);
        } else if (r < 0.75) {
          tokens = drawCompound(5, 3);
        } else {
          tokens = drawCompound(3, 5);
        }
      } else if (targetLen === 10) {
        const r = Math.random();
        if (r < 0.35) {
          tokens = drawCompound(5, 4);
        } else if (r < 0.7) {
          tokens = drawCompound(4, 5);
        } else if (r < 0.85) {
          tokens = drawCompound(6, 3);
        } else {
          tokens = drawCompound(4, 5);
        }
      }
    }

    if (tokens.length === targetLen) {
      // Strict adjective deduplication: an adjective/feeling can appear AT MOST ONCE per sentence
      const sentenceAdjs = tokens.filter(isAdjectiveWord);
      const adjKeys = sentenceAdjs.map(getAdjectiveBaseKey);
      const hasDuplicateAdj = new Set(adjKeys).size !== adjKeys.length;
      if (hasDuplicateAdj) {
        continue;
      }

      const val = validateSentence(tokens);
      if (val.isGrammatical && !val.warning) {
        // Ensure unique IDs
        const uniqueTokens = tokens.map((t, idx) => ({
          ...t,
          id: `gen-${t.he}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        }));
        return uniqueTokens;
      }
    }
  }

  // If random attempts didn't land exactly on targetLen or failed validation, return validated fallback
  const fallback = getFallback(targetLen);
  const fallbackVal = validateSentence(fallback);
  if (fallbackVal.isGrammatical && !fallbackVal.warning) {
    return fallback.map((t, idx) => ({
      ...t,
      id: `gen-fallback-${t.he}-${idx}`,
    }));
  }
  return fallback;
}

export interface SavedSentence {
  he: string;
  en: string;
  vocalized?: string;
}

export interface SentenceBuilderProps {
  savedSentences?: Array<SavedSentence | string>;
  onUpdateSavedSentences?: (newSentences: SavedSentence[]) => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  savedSentences = [],
  onUpdateSavedSentences,
}) => {
  const [paletteOrStoryMode, setPaletteOrStoryMode] = useState<'palette' | 'story'>('palette');
  const [isReadingStory, setIsReadingStory] = useState(false);
  const storyPlaybackSeqRef = useRef(0);

  const normalizedSentences: SavedSentence[] = useMemo(() => {
    return (savedSentences || []).map((s) => {
      if (typeof s === 'string') {
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch {}
        return { he: s, en: '' };
      }
      return s;
    });
  }, [savedSentences]);

  const handleAddToStory = () => {
    if (selectedTokens.length === 0) return;
    soundManager.unlockAudio();
    soundManager.playPop();

    const heText = sentenceDisplay.he;
    const vocText = sentenceDisplay.vocalized || sentenceDisplay.he;
    const enText = sentenceDisplay.en;

    const newStory = [...normalizedSentences, { he: heText, vocalized: vocText, en: enText }];
    onUpdateSavedSentences?.(newStory);
    setPaletteOrStoryMode('story');
  };

  const handleClearStory = () => {
    storyPlaybackSeqRef.current++;
    setIsReadingStory(false);
    soundManager.unlockAudio();
    soundManager.playPop();
    onUpdateSavedSentences?.([]);
  };

  const handleRemoveStorySentence = (index: number) => {
    soundManager.unlockAudio();
    soundManager.playPop();
    const updated = normalizedSentences.filter((_, idx) => idx !== index);
    onUpdateSavedSentences?.(updated);
  };

  const handleReadStory = () => {
    if (isReadingStory || normalizedSentences.length === 0) return;
    soundManager.unlockAudio();
    setIsReadingStory(true);

    const seq = ++storyPlaybackSeqRef.current;

    soundManager.speakEnglish("Once upon a time", 0.95, 1.0, () => {
      if (seq !== storyPlaybackSeqRef.current) return;

      const playSentenceAtIndex = (idx: number) => {
        if (idx >= normalizedSentences.length) {
          if (seq !== storyPlaybackSeqRef.current) return;
          setTimeout(() => {
            if (seq !== storyPlaybackSeqRef.current) return;
            soundManager.speakEnglish("And they all lived happily ever after.", 0.95, 1.0, () => {
              if (seq === storyPlaybackSeqRef.current) {
                setIsReadingStory(false);
              }
            });
          }, 500);
          return;
        }

        if (seq !== storyPlaybackSeqRef.current) return;
        const sentence = normalizedSentences[idx];
        soundManager.speakHebrew(sentence.vocalized || sentence.he, sentenceReadingSpeed, 1.0, () => {
          if (seq !== storyPlaybackSeqRef.current) return;
          setTimeout(() => {
            playSentenceAtIndex(idx + 1);
          }, 500);
        });
      };

      setTimeout(() => {
        playSentenceAtIndex(0);
      }, 300);
    });
  };
  const [selectedTokens, setSelectedTokens] = useState<WordToken[]>(() => {
    return generateRandomGrammaticalSentence(WORD_BANK, 5);
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpinningSentence, setIsSpinningSentence] = useState(false);
  const [sentenceReadingSpeed, setSentenceReadingSpeed] = useState(1.0);
  const [maxRandomSentenceLength, setMaxRandomSentenceLength] = useState(5);
  const [isLengthPopoverOpen, setIsLengthPopoverOpen] = useState(false);
  const [shufflingTokenId, setShufflingTokenId] = useState<string | null>(null);
  const [displayTokens, setDisplayTokens] = useState<Record<string, WordToken>>({});
  const [flyingCards, setFlyingCards] = useState<FlyingCardItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; side: 'left' | 'right' } | null>(null);
  const [paletteEmojiMap, setPaletteEmojiMap] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    WORD_BANK.forEach((w) => {
      if (w.emoji) {
        initialMap[w.id] = randomizeSkinTone(w.emoji);
      }
    });
    return initialMap;
  });

  // Random sentence spin button (Dynamic Grammatical Sentence Generator!)
  const handleRandomSentenceWithOptions = React.useCallback((targetLen: number) => {
    soundManager.unlockAudio();
    setIsSpinningSentence(true);
    setMaxRandomSentenceLength(targetLen);

    const totalSteps = 9;
    let step = 0;

    const runStep = () => {
      step++;
      // Flashes freshly constructed random grammatical sentences during spin
      const tempGen = generateRandomGrammaticalSentence(WORD_BANK, targetLen);
      setSelectedTokens(tempGen);
      soundManager.playPop();

      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 60 + Math.pow(progress, 2) * 180;
        setTimeout(runStep, delay);
      } else {
        setTimeout(() => {
          setIsSpinningSentence(false);
          const finalGen = generateRandomGrammaticalSentence(WORD_BANK, targetLen);
          setSelectedTokens(finalGen);

          // Get vocalized or hebrew text for TTS speech
          const { vocStr } = buildHebrewSentenceStrings(finalGen);
          soundManager.speakHebrew(vocStr, sentenceReadingSpeed);
        }, 160);
      }
    };

    runStep();
  }, [sentenceReadingSpeed]);

  const handleRandomSentence = React.useCallback(() => {
    handleRandomSentenceWithOptions(maxRandomSentenceLength);
  }, [maxRandomSentenceLength, handleRandomSentenceWithOptions]);

  useEffect(() => {
    const handleResetEverything = () => {
      setSelectedTokens([]);
      setActiveTab('all');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cantor_yakov_sentence_builder_v1');
      }
    };

    window.addEventListener('alefbet_reset_everything', handleResetEverything);
    return () => {
      window.removeEventListener('alefbet_reset_everything', handleResetEverything);
    };
  }, []);

  const handleAddTokenWithAnimation = (token: WordToken, e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (isAndConjunction(token) && selectedTokens.some(isAndConjunction)) {
      soundManager.playPop();
      soundManager.speakEnglish("Only one and per sentence");
      return;
    }

    const lastToken = selectedTokens[selectedTokens.length - 1];
    const isSpeechVerbActive = selectedTokens.length > 0 && isSpeechVerb(lastToken);
    if (isSpeechVerbActive && !isApprovedSpeechSaying(token)) {
      soundManager.playPop();
      soundManager.speakEnglish("Only sayings can follow says");
      return;
    }
    soundManager.unlockAudio();
    soundManager.playPop();

    const buttonRect = e.currentTarget.getBoundingClientRect();
    const startX = buttonRect.left;
    const startY = buttonRect.top;

    const stripElem = document.getElementById('selected-tokens-strip');
    let endX = window.innerWidth / 2 - 30;
    let endY = 220;

    if (stripElem) {
      const rect = stripElem.getBoundingClientRect();
      endX = rect.left + rect.width / 2 - 28;
      endY = rect.top + rect.height / 2 - 10;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const flyId = `fly-${Date.now()}-${Math.random()}`;

    setFlyingCards((prev) => [
      ...prev,
      {
        id: flyId,
        token,
        startX,
        startY,
        deltaX,
        deltaY,
      },
    ]);

    setTimeout(() => {
      soundManager.speakHebrew(token.vocalizedHe || token.he);
      setSelectedTokens((prev) => [...prev, token]);
      setFlyingCards((prev) => prev.filter((c) => c.id !== flyId));
    }, 400);
  };

  const handleShuffleToken = (token: WordToken, index: number) => {
    if (shufflingTokenId) return;

    const candidates = getRouletteCandidates(token, WORD_BANK, selectedTokens, index);
    if (candidates.length === 0) return;

    soundManager.unlockAudio();
    setShufflingTokenId(token.id);

    const totalSteps = 7;
    const delays = [70, 85, 105, 130, 160, 200, 250];

    const doStep = (stepIdx: number) => {
      soundManager.playRouletteBeep(stepIdx);

      const randomCand = candidates[Math.floor(Math.random() * candidates.length)];
      setDisplayTokens((prev) => ({ ...prev, [token.id]: randomCand }));

      if (stepIdx < totalSteps - 1) {
        setTimeout(() => doStep(stepIdx + 1), delays[stepIdx] || 120);
      } else {
        const finalChosen = candidates[Math.floor(Math.random() * candidates.length)];
        soundManager.playPop();

        setSelectedTokens((prevTokens) => {
          const next = [...prevTokens];
          if (next[index] && next[index].id === token.id) {
            next[index] = { ...finalChosen, id: token.id };
          }
          return next;
        });

        // Say the word in Hebrew right after the roulette animation finishes!
        soundManager.speakHebrew(finalChosen.vocalizedHe || finalChosen.he);

        setDisplayTokens((prev) => {
          const copy = { ...prev };
          delete copy[token.id];
          return copy;
        });

        setShufflingTokenId(null);
      }
    };

    doStep(0);
  };

  const validateTokens = useCallback((tokens: WordToken[]): { isGrammatical: boolean; warning: string | null } => {
    return validateSentence(tokens);
  }, []);

  // Formatted spoken string, strictly unvocalized display string, and grammar/sense analysis
  const sentenceDisplay = useMemo(() => {
    if (selectedTokens.length === 0) return { he: '', vocalized: '', en: '', isGrammatical: true, warning: null };

    const { heStr, vocStr } = buildHebrewSentenceStrings(selectedTokens);
    const enStr = buildEnglishTranslation(selectedTokens);
    const { isGrammatical, warning } = validateTokens(selectedTokens);

    return {
      he: isGrammatical ? `${heStr.trim()}.` : heStr.trim(),
      vocalized: isGrammatical ? `${vocStr.trim()}.` : vocStr.trim(),
      en: isGrammatical ? `${enStr.trim()}.` : enStr.trim(),
      isGrammatical,
      warning,
    };
  }, [selectedTokens, validateTokens]);

  // Simulate applying the Magic Fix to see if the sentence can be resolved
  const magicFixCanResolve = useMemo(() => {
    if (selectedTokens.length < 2) return false;

    // Simulate handleFixSentence logic on a copy
    let tokens = [...selectedTokens];

    // FIX 1: Word Order
    if (tokens.length === 2 && tokens[0].type === 'adjective' && (tokens[1].type === 'noun' || tokens[1].type === 'person' || tokens[1].categories?.includes('animals'))) {
      const temp = tokens[0];
      tokens[0] = tokens[1];
      tokens[1] = temp;
    }

    // FIX 2: Prepositions for nouns
    if (tokens.length === 2 && (tokens[0].type === 'person' || tokens[0].categories?.includes('animals')) && (tokens[1].categories?.includes('places') || tokens[1].categories?.includes('locations') || isPlaceToken(tokens[1]))) {
      const bToken = WORD_BANK.find(t => t.he === 'ב');
      if (bToken) tokens = [tokens[0], bToken, tokens[1]];
    }
    else if (tokens.length === 2 && tokens[0].type === 'noun' && !tokens[0].categories?.includes('places') && !tokens[0].categories?.includes('locations') && !isPlaceToken(tokens[0]) && (tokens[1].type === 'person' || tokens[1].categories?.includes('animals') || tokens[1].he === 'אני')) {
      const lToken = WORD_BANK.find(t => t.he === 'ל');
      if (lToken) tokens = [tokens[0], lToken, tokens[1]];
    }

    // FIX 3: Gender/Plural Agreement
    const subjectToken = tokens.find(t => t.type === 'person' || t.type === 'noun' || t.categories?.includes('animals'));
    if (subjectToken) {
      const subjectGender = subjectToken.gender || 'm';
      tokens = tokens.map((token) => {
        if (token.type === 'adjective') {
          if (token.gender !== subjectGender && token.gender !== 'both') {
            const baseEn = token.en.replace(/\s*\(m\)\s*/i, '').replace(/\s*\(f\)\s*/i, '').trim().toLowerCase();
            const match = WORD_BANK.find(t => t.type === 'adjective' && t.en.toLowerCase().includes(baseEn) && (t.gender === subjectGender || t.gender === 'both'));
            if (match) return match;
          }
        }
        else if (token.type === 'verb') {
          if (token.gender !== subjectGender && token.gender !== 'both') {
            const baseEn = token.en.replace(/\s*\(m\)\s*/i, '').replace(/\s*\(f\)\s*/i, '').trim().toLowerCase();
            const match = WORD_BANK.find(t => t.type === 'verb' && t.en.toLowerCase().includes(baseEn) && (t.gender === subjectGender || t.gender === 'both'));
            if (match) return match;
          }
        }
        return token;
      });
    }

    // FIX 4: Intransitive verb missing preposition helper
    const intransitiveHebrewVerbs = ['יושב', 'יושבת', 'עומד', 'עומדת', 'שר', 'שרה'];
    for (let i = 0; i < tokens.length - 1; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];
      const isIntransitive = intransitiveHebrewVerbs.includes(curr.he.replace(/[\u0591-\u05C7]/g, ''));
      const isDirectObject = next.type === 'noun' || next.type === 'person' || next.categories?.includes('animals');
      
      if (isIntransitive && isDirectObject) {
        const bToken = WORD_BANK.find(t => t.he === 'ב');
        if (bToken) {
          tokens.splice(i + 1, 0, bToken);
          break;
        }
      }
    }

    // Check if the fixed tokens are grammatical
    const { isGrammatical } = validateTokens(tokens);
    return isGrammatical;
  }, [selectedTokens, validateTokens]);

  // Automatically correct grammatical errors (word order, gender/plural mismatches, missing helpers)
  const handleFixSentence = () => {
    if (selectedTokens.length < 2) return;

    soundManager.playSparkle(); // Play magic sound
    let tokens = [...selectedTokens];

    // --- FIX 1: Noun-Adjective Word Order ---
    // If the sequence is [adjective, noun/person/animal], swap them!
    if (tokens.length === 2 && tokens[0].type === 'adjective' && (tokens[1].type === 'noun' || tokens[1].type === 'person' || tokens[1].categories?.includes('animals'))) {
      const temp = tokens[0];
      tokens[0] = tokens[1];
      tokens[1] = temp;
    }

    // --- FIX 2: Preposition helper insertion ---
    // If we have two nouns and the second is a place (e.g. [אבא, בית]): insert "ב"!
    if (tokens.length === 2 && (tokens[0].type === 'person' || tokens[0].categories?.includes('animals')) && (tokens[1].categories?.includes('places') || tokens[1].categories?.includes('locations') || isPlaceToken(tokens[1]))) {
      const bToken = WORD_BANK.find(t => t.he === 'ב');
      if (bToken) {
        tokens = [tokens[0], bToken, tokens[1]];
      }
    }
    // If we have [noun, conscious_recipient] (e.g. [אפרסק, אבא]): insert "ל"!
    else if (tokens.length === 2 && tokens[0].type === 'noun' && !tokens[0].categories?.includes('places') && !tokens[0].categories?.includes('locations') && !isPlaceToken(tokens[0]) && (tokens[1].type === 'person' || tokens[1].categories?.includes('animals') || tokens[1].he === 'אני')) {
      const lToken = WORD_BANK.find(t => t.he === 'ל');
      if (lToken) {
        tokens = [tokens[0], lToken, tokens[1]];
      }
    }

    // --- FIX 3: Gender / Plural Agreement ---
    // Search for a subject noun/person/animal, and make sure any following adjectives or verbs match its gender!
    const subjectToken = tokens.find(t => t.type === 'person' || t.type === 'noun' || t.categories?.includes('animals'));
    if (subjectToken) {
      const subjectGender = subjectToken.gender || 'm'; // default to masculine

      tokens = tokens.map((token) => {
        if (token.type === 'adjective') {
          // If adjective gender doesn't match subject gender, find its counterpart!
          if (token.gender !== subjectGender && token.gender !== 'both') {
            const baseEn = token.en.replace(/\s*\(m\)\s*/i, '').replace(/\s*\(f\)\s*/i, '').trim().toLowerCase();
            const match = WORD_BANK.find(t => 
              t.type === 'adjective' && 
              t.en.toLowerCase().includes(baseEn) && 
              (t.gender === subjectGender || t.gender === 'both')
            );
            if (match) return match;
          }
        }
        else if (token.type === 'verb') {
          // If verb gender doesn't match, swap to counterpart!
          if (token.gender !== subjectGender && token.gender !== 'both') {
            const baseEn = token.en.replace(/\s*\(m\)\s*/i, '').replace(/\s*\(f\)\s*/i, '').trim().toLowerCase();
            const match = WORD_BANK.find(t => 
              t.type === 'verb' && 
              t.en.toLowerCase().includes(baseEn) && 
              (t.gender === subjectGender || t.gender === 'both')
            );
            if (match) return match;
          }
        }
        return token;
      });
    }

    // --- FIX 4: Intransitive verb missing preposition helper (e.g. [אמא, יושבת, בית כנסת]) ---
    const intransitiveHebrewVerbs = ['יושב', 'יושבת', 'עומד', 'עומדת', 'שר', 'שרה'];
    for (let i = 0; i < tokens.length - 1; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];
      const isIntransitive = intransitiveHebrewVerbs.includes(curr.he.replace(/[\u0591-\u05C7]/g, ''));
      const isDirectObject = next.type === 'noun' || next.type === 'person' || next.categories?.includes('animals');
      
      if (isIntransitive && isDirectObject) {
        const bToken = WORD_BANK.find(t => t.he === 'ב');
        if (bToken) {
          tokens.splice(i + 1, 0, bToken);
          break; // do one insert per fix action
        }
      }
    }

    setSelectedTokens(tokens);
  };

  // Play full constructed sentence
  const handlePlaySentence = () => {
    if (!sentenceDisplay.isGrammatical) return;
    if (!sentenceDisplay.vocalized && !sentenceDisplay.he) return;
    setIsPlaying(true);
    soundManager.speakHebrew(sentenceDisplay.vocalized || sentenceDisplay.he, sentenceReadingSpeed, 1.0, () => {
      setIsPlaying(false);
    });
  };

  // Play a single token & randomize skin tone on click if applicable
  const handlePlayToken = (token: WordToken) => {
    soundManager.playPop();
    soundManager.speakHebrew(token.vocalizedHe || token.he);

    if (token.emoji) {
      const currentEmoji = paletteEmojiMap[token.id] || token.emoji;
      const freshEmoji = randomizeSkinTone(token.emoji, currentEmoji);
      if (freshEmoji !== currentEmoji) {
        setPaletteEmojiMap((prev) => ({ ...prev, [token.id]: freshEmoji }));
      }
    }
  };

  // Add word to sentence
  const handleAddToken = (token: WordToken) => {
    if (isAndConjunction(token) && selectedTokens.some(isAndConjunction)) {
      soundManager.playPop();
      soundManager.speakEnglish("Only one and per sentence");
      return;
    }
    handlePlayToken(token);
    setSelectedTokens((prev) => [...prev, token]);
  };

  // Remove word at specific index
  const handleRemoveTokenAt = (index: number) => {
    soundManager.playPop();
    setSelectedTokens((prev) => prev.filter((_, i) => i !== index));
  };

  // Cycle/randomize Fitzpatrick skin tone on placed rail token
  const handleCycleRailTokenEmoji = (index: number) => {
    soundManager.playPop();
    const tok = selectedTokens[index];
    if (tok) {
      soundManager.speakHebrew(tok.vocalizedHe || tok.he);
      if (tok.emoji) {
        const freshEmoji = randomizeSkinTone(tok.emoji, tok.emoji);
        const updated = [...selectedTokens];
        updated[index] = { ...tok, emoji: freshEmoji };
        setSelectedTokens(updated);
      }
    }
  };

  // Move word left or right in sentence
  const handleMoveToken = (index: number, direction: 'left' | 'right') => {
    soundManager.playPop();
    setSelectedTokens((prev) => {
      const arr = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return arr;
      const [moved] = arr.splice(index, 1);
      arr.splice(targetIndex, 0, moved);
      return arr;
    });
  };

  // Clear all
  const handleClear = () => {
    soundManager.playPop();
    setSelectedTokens([]);
  };

  // Undo last word
  const handleUndo = () => {
    soundManager.playPop();
    setSelectedTokens((prev) => prev.slice(0, -1));
  };

  // Total displayed word count for word palette header
  const totalWordCount = useMemo(() => {
    if (activeTab === 'all') return WORD_BANK.length;
    return WORD_BANK.filter((w) => {
      if (activeTab === 'other') return w.categories.includes('other') || w.categories.includes('objects') || w.categories.length === 0;
      return w.categories.includes(activeTab);
    }).length;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Main Building Tray Area */}
      <div id="sentence-building-tray" className="bg-white rounded-3xl p-4 sm:p-7 border-2 border-dashed border-amber-300 shadow-xs space-y-4">
        <div className="grid grid-cols-3 items-center border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2 justify-start">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              YOUR SENTENCE
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <button
              type="button"
              onClick={handleRandomSentence}
              disabled={isSpinningSentence}
              className={`h-7 flex items-center gap-1.5 px-3 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-75 leading-none ${
                isSpinningSentence ? 'scale-105 ring-2 ring-amber-400' : ''
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 text-amber-700 ${isSpinningSentence ? 'animate-spin' : ''}`} />
              <span className="text-sm leading-none">🎲</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLengthPopoverOpen(!isLengthPopoverOpen)}
                className="h-7 px-3 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl text-[11px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap leading-none"
                title="Change sentence length"
              >
                <span>📏</span>
                <span>Length: {maxRandomSentenceLength}</span>
              </button>

              {isLengthPopoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLengthPopoverOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 z-50 bg-white rounded-2xl p-3.5 border border-amber-300 shadow-xl w-60 max-w-[calc(100vw-32px)] space-y-2.5 animate-pop-burst">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Length</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 pt-1">
                      <span>2</span>
                      <div className="relative w-full h-8 flex items-center">
                        <div 
                          className="absolute inset-x-0 h-6 bg-amber-300"
                          style={{ clipPath: 'polygon(0% 85%, 100% 15%, 100% 100%, 0% 100%)' }}
                        />
                        <input 
                          type="range" 
                          min="2" 
                          max="10" 
                          step="1" 
                          value={maxRandomSentenceLength}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMaxRandomSentenceLength(val);
                          }}
                          onPointerUp={(e) => {
                            const val = parseInt((e.target as HTMLInputElement).value);
                            setIsLengthPopoverOpen(false);
                            handleRandomSentenceWithOptions(val);
                          }}
                          className="absolute inset-x-0 w-full bg-transparent appearance-none cursor-pointer fader-range z-10 h-8"
                        />
                      </div>
                      <span>10</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            <button
              type="button"
              onClick={handleAddToStory}
              disabled={selectedTokens.length === 0}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>📖</span>
              <span>Add to Story</span>
            </button>
            <span className="text-xs font-bold text-slate-400">
              {selectedTokens.length} {selectedTokens.length === 1 ? 'word' : 'words'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={selectedTokens.length === 0}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Selected Tokens Strip */}
        <div id="selected-tokens-strip" className="min-h-[90px] flex items-center justify-center p-3 sm:p-4 my-1">
          {selectedTokens.length === 0 ? (
            <div dir="ltr" className="text-slate-400 text-sm font-semibold py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl px-8 select-none">
              Your sentence tray is empty!
            </div>
          ) : (
            <div dir="rtl" className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-7 sm:gap-y-8 w-full py-2">
              {selectedTokens.map((tok, idx) => {
                const displayTok = displayTokens[tok.id] || tok;
                const isHelperWord =
                  tok.type === 'helper' ||
                  tok.categories?.includes('helpers') ||
                  tok.vocalizedHe === 'וְ' ||
                  tok.vocalizedHe === 'לְ' ||
                  tok.vocalizedHe === 'בַּ' ||
                  tok.he === 'ו';
                const isShuffling = shufflingTokenId === tok.id;

                return (
                  <div
                    key={`${tok.id}-${idx}`}
                    draggable="true"
                    onDragStart={(e) => {
                      setDraggedIndex(idx);
                      e.dataTransfer.setData('text/plain', idx.toString());
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isLeftSide = e.clientX < rect.left + rect.width / 2;
                      setDropTarget({ index: idx, side: isLeftSide ? 'left' : 'right' });
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dropTarget?.index === idx) {
                          setDropTarget(null);
                        }
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex === null || !dropTarget) return;

                      let insertIdx = dropTarget.side === 'left' ? dropTarget.index : dropTarget.index + 1;
                      if (draggedIndex < insertIdx) {
                        insertIdx--; // Adjust for item being removed prior to insertion slot
                      }

                      if (draggedIndex !== insertIdx) {
                        const updated = [...selectedTokens];
                        const [moved] = updated.splice(draggedIndex, 1);
                        updated.splice(insertIdx, 0, moved);
                        setSelectedTokens(updated);
                        soundManager.playPop();
                      }
                      setDraggedIndex(null);
                      setDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDropTarget(null);
                    }}
                    className={`select-none relative group cursor-grab touch-none active:cursor-grabbing transition-opacity ${
                      draggedIndex === idx ? 'opacity-40' : ''
                    }`}
                  >
                    {dropTarget?.index === idx && (
                      <div
                        className={`absolute top-0 bottom-0 w-1.5 bg-amber-500 rounded-full animate-pulse z-30 pointer-events-none ${
                          dropTarget.side === 'left' ? '-left-2.5' : '-right-2.5'
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleCycleRailTokenEmoji(idx)}
                      onMouseDown={(e) => {
                if (e.detail > 1) {
                  e.preventDefault();
                }
              }}
                      title={`Hear & cycle skin tone for "${tok.en}"`}
                      aria-label={`Hear and cycle skin tone for ${tok.he} (${tok.en})`}
                      className={`w-14 h-14 sm:w-16 sm:h-16 aspect-square select-none rounded-2xl border-2 shadow-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center bg-white hover:bg-amber-50 border-amber-200/80 ${
                        isShuffling ? 'scale-110 ring-4 ring-amber-400 animate-pop-burst z-20' : ''
                      }`}
                    >
                      {(() => {
                        const locLabel = getLocationCardLabel(tok);
                        const hasLabel = isHeroesVillainsToken(tok) || !!locLabel;
                        const labelText = locLabel || stripHonorificPrefix(tok.en);

                        if (hasLabel) {
                          return (
                            <div className="flex flex-col items-center justify-center p-0.5 w-full h-full text-center overflow-hidden">
                              {tok.image ? (
                                <img
                                  src={tok.image}
                                  alt={tok.en}
                                  draggable={false}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg select-none pointer-events-none"
                                />
                              ) : (
                                <span
                                  dir="ltr"
                                  className="text-lg sm:text-xl font-bold font-hebrew select-none pointer-events-none filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight"
                                  style={{ fontFamily: "'Akoderf', sans-serif" }}
                                >
                                  {tok.emoji}
                                </span>
                              )}
                              <span style={{ userSelect: 'none', WebkitUserSelect: 'none' }} className="select-none pointer-events-none text-[8px] sm:text-[9px] font-bold text-slate-800 leading-[1.1] whitespace-normal text-center max-w-full mt-0.5 px-0.5">
                                {labelText}
                              </span>
                            </div>
                          );
                        }
                        if (tok.image) {
                          return (
                            <img
                              src={tok.image}
                              alt={tok.en}
                              draggable={false}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-0.5 rounded-xl select-none pointer-events-none"
                            />
                          );
                        }
                        if (tok.emoji) {
                          return (
                            <span
                              dir="ltr"
                              className="text-xl sm:text-2xl md:text-3xl font-bold font-hebrew select-none pointer-events-none filter drop-shadow-2xs leading-tight inline-flex flex-col items-center justify-center tracking-tight whitespace-pre-line"
                              style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                            >
                              {tok.emoji}
                            </span>
                          );
                        }
                        return (
                          <span
                            className="text-2xl sm:text-3xl md:text-4xl font-bold font-hebrew text-slate-900 select-none pointer-events-none filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight"
                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                          >
                            {stripNiqqud(tok.he)}
                          </span>
                        );
                      })()}
                    </button>

                    <button
                      type="button"
                      draggable="false"
                      onMouseDown={(e) => {
                e.stopPropagation();
                if (e.detail > 1) {
                  e.preventDefault();
                }
              }}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTokenAt(idx);
                      }}
                      title={`Remove "${tok.en}"`}
                      aria-label={`Remove ${tok.he}`}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold shadow-xs flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer z-10 select-none pointer-events-auto"
                    >
                      ×
                    </button>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Big Live Sentence Readout & Speaker Button - strictly NO vowels shown */}
        <div 
          role="button"
          tabIndex={0}
          onClick={handlePlaySentence}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlaySentence();
            }
          }}
          title={selectedTokens.length > 0 && sentenceDisplay.isGrammatical ? "Click anywhere to hear sentence" : undefined}
          className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-3xl transition-all min-h-[110px] w-full text-center select-none ${
            selectedTokens.length > 0
              ? sentenceDisplay.isGrammatical
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md cursor-pointer hover:brightness-105 active:scale-[0.99]'
                : 'bg-gradient-to-r from-amber-800 via-amber-900 to-slate-900 text-amber-100 border-2 border-amber-400/60 shadow-md'
              : 'bg-amber-50/40 border-2 border-dashed border-amber-200 text-amber-800/60 flex items-center justify-center'
          }`}
        >
          {selectedTokens.length > 0 ? (
            <>
              <div className="flex flex-col items-center justify-center space-y-2 text-center w-full">
                <div
                  dir="rtl"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold font-hebrew text-center tracking-wide leading-normal drop-shadow-sm flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-0.5"
                  style={{ fontFamily: "'Akoderf', sans-serif" }}
                >
                  <span>{sentenceDisplay.he}</span>
                  {!sentenceDisplay.isGrammatical && sentenceDisplay.warning && (
                    <span dir="ltr" className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-amber-950 rounded-xl text-xs sm:text-sm font-bold shadow-xs tracking-normal animate-bounce my-1">
                      ⚠️ {sentenceDisplay.warning}
                    </span>
                  )}
                </div>

                <div className="text-sm sm:text-base md:text-lg font-bold text-amber-100 text-center drop-shadow-xs max-w-2xl mx-auto">
                  {sentenceDisplay.en}
                </div>

                {!sentenceDisplay.isGrammatical && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent playing TTS
                      handleFixSentence();
                    }}
                    className="mt-2.5 px-4.5 py-2 bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-400 hover:to-yellow-500 active:scale-95 text-amber-950 text-xs sm:text-sm font-bold rounded-2xl shadow-md border border-amber-200/80 flex items-center gap-1.5 cursor-pointer transition-all animate-pulse"
                  >
                    <span>🪄 Magic Fix!</span>
                  </button>
                )}
              </div>

              {sentenceDisplay.isGrammatical && (
                <div className="absolute bottom-3 right-4 p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer" aria-hidden="true">
                  <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce text-amber-200' : ''}`} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center w-full font-bold text-sm sm:text-base tracking-wide text-amber-900/90 py-2">
              <span>Tap the + on word cards below to build a Hebrew sentence! ✍️</span>
            </div>
          )}
        </div>

        {/* Sliders */}
        {selectedTokens.length > 0 && (
          <div className="flex flex-col gap-2 w-full px-2 mt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>🐢</span>
              <input 
                type="range" 
                min="0.3" 
                max="1.2" 
                step="0.05" 
                value={sentenceReadingSpeed}
                onChange={(e) => setSentenceReadingSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span>🐇</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher Toggles Above Word Palette */}
      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
        <button
          type="button"
          onClick={() => setPaletteOrStoryMode('palette')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
            paletteOrStoryMode === 'palette'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <span>🎨</span>
          <span>WORD PALETTE</span>
        </button>
        <button
          type="button"
          onClick={() => setPaletteOrStoryMode('story')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 relative ${
            paletteOrStoryMode === 'story'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <span>📖</span>
          <span>STORYTIME</span>
          {normalizedSentences.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-950 flex items-center justify-center text-xs font-bold ml-1 shadow-2xs">
              {normalizedSentences.length}
            </span>
          )}
        </button>
      </div>

      {paletteOrStoryMode === 'story' ? (
        /* Storytime View Layout */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-lg space-y-6 animate-fade-in">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
            <div className="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
              <span>✨</span>
              <span>FAIRY TALE STORYTIME</span>
              <span>✨</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 tracking-tight font-serif italic">
              "Once upon a time"
            </h2>
          </div>

          {/* Read Story & Clear Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-900">
                Story Sentences: ({normalizedSentences.length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              {normalizedSentences.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleReadStory}
                    disabled={isReadingStory}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 text-white font-bold text-sm shadow-md border border-amber-300 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Volume2 className={`w-5 h-5 ${isReadingStory ? 'animate-bounce text-yellow-200' : ''}`} />
                    <span>{isReadingStory ? 'Reading Story...' : '🔊✨ Read Story'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearStory}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Story</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Middle Section: Saved Sentences */}
          <div className="space-y-3 min-h-[180px]">
            {normalizedSentences.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-amber-200 rounded-3xl bg-amber-50/30 space-y-3">
                <span className="text-4xl">📖</span>
                <p className="text-base font-bold text-amber-900">Your story is empty!</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-md mx-auto">
                  Build sentences in the <span className="font-bold text-amber-800">Word Palette</span> tab above and click <span className="font-bold text-amber-800">"Add to Story"</span> to write your fairy tale!
                </p>
                <button
                  type="button"
                  onClick={() => setPaletteOrStoryMode('palette')}
                  className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Go to Word Palette
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {normalizedSentences.map((sentence, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center justify-between gap-4 transition-all hover:border-amber-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <div
                          dir="rtl"
                          className="text-xl sm:text-2xl font-bold font-hebrew text-slate-900 tracking-wide"
                          style={{ fontFamily: "'Akoderf', sans-serif" }}
                        >
                          {stripNiqqud(sentence.he)}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-amber-800/80">
                          {sentence.en}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.unlockAudio();
                          soundManager.speakHebrew(sentence.vocalized || sentence.he, sentenceReadingSpeed);
                        }}
                        title="Hear sentence"
                        className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStorySentence(index)}
                        title="Remove sentence"
                        className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Banner */}
          <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 tracking-tight font-serif italic">
              "And they all lived happily ever after."
            </h2>
            <div className="text-xs font-bold text-amber-900 uppercase tracking-widest mt-1">
              🏰✨ The End ✨🏰
            </div>
          </div>
        </div>
      ) : (
        /* Word Bank Filter Tabs & Palettes */
        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-amber-200 shadow-xs space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
              <span>WORD PALETTE</span>
              <span className="text-xs font-semibold text-slate-500">({totalWordCount} words • Tap card to hear • Tap + to add)</span>
            </h3>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      soundManager.speakEnglish(tab.label);
                      setActiveTab(tab.key);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-amber-50/70 hover:bg-amber-200 text-slate-700 hover:text-slate-900 border border-amber-200/70'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grouped Categories Word Browser */}
          {(() => {
            const categoriesToDisplay = activeTab === 'all'
              ? CATEGORY_TABS.filter((t) => t.key !== 'all')
              : CATEGORY_TABS.filter((t) => t.key === activeTab);

            return (
              <div className="space-y-5">
                {categoriesToDisplay.map((cat) => {
                  let catWords = WORD_BANK.filter((w) => {
                    if (cat.key === 'other') return w.categories.includes('other') || w.categories.includes('objects') || w.categories.length === 0;
                    return w.categories.includes(cat.key);
                  });

                  if (cat.key === 'colors') {
                    const colorOrderMap: Record<string, number> = {
                      'red': 1,
                      'orange': 2, 'orange (color)': 2,
                      'yellow': 3,
                      'green': 4,
                      'blue': 5,
                      'purple': 6,
                      'pink': 7,
                      'brown': 8,
                      'black': 9,
                      'gray': 10, 'grey': 10,
                      'white': 11,
                      'big': 12,
                      'small': 13,
                    };
                    catWords.sort((a, b) => {
                      const valA = colorOrderMap[a.en.toLowerCase()] ?? 999;
                      const valB = colorOrderMap[b.en.toLowerCase()] ?? 999;
                      return valA - valB;
                    });
                  } else {
                    catWords.sort((a, b) => a.he.localeCompare(b.he));
                  }

                  if (catWords.length === 0) return null;

                  return (
                    <div key={cat.key} className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-amber-100">
                        <span className={`px-3 py-1 rounded-2xl text-xs sm:text-sm font-bold border flex items-center gap-1.5 shadow-2xs ${cat.badgeBg}`}>
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span className="opacity-75 font-bold">({catWords.length})</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-x-3 sm:gap-x-3.5 gap-y-5 sm:gap-y-6 justify-start">
                        {catWords.map((token) => {
                          const currentEmoji = paletteEmojiMap[token.id] || token.emoji;
                          const tokenWithSkinTone = currentEmoji ? { ...token, emoji: currentEmoji } : token;

                          const lastSelectedToken = selectedTokens[selectedTokens.length - 1];
                          const isSpeechVerbActive = selectedTokens.length > 0 && isSpeechVerb(lastSelectedToken);
                          const isAndDisabled = isAndConjunction(token) && selectedTokens.some(isAndConjunction);
                          const isSpeechDisabled = isSpeechVerbActive && !isApprovedSpeechSaying(token);
                          const isDisabled = isAndDisabled || isSpeechDisabled;

                          return (
                            <div key={token.id} className="relative group aspect-square w-full">
                              <button
                                type="button"
                                onClick={() => handlePlayToken(tokenWithSkinTone)}
                                title={`Hear "${token.he}" (${token.en})`}
                                aria-label={`Hear ${token.he} - ${token.en}`}
                                className="select-none aspect-square w-full rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 shadow-xs bg-white hover:bg-amber-50 border-amber-200/80"
                              >
                                {(() => {
                                  const locLabel = getLocationCardLabel(token);
                                  const hasLabel = isHeroesVillainsToken(token) || !!locLabel;
                                  const labelText = locLabel || stripHonorificPrefix(token.en);

                                  if (hasLabel) {
                                    return (
                                      <div className="flex flex-col items-center justify-center p-0.5 w-full h-full text-center overflow-hidden">
                                        {token.image ? (
                                          <img
                                            src={token.image}
                                            alt={token.en}
                                            referrerPolicy="no-referrer"
                                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg"
                                          />
                                        ) : (
                                          <span
                                            dir="ltr"
                                            className="text-lg sm:text-xl font-bold font-hebrew select-none filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight"
                                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                                          >
                                            {currentEmoji}
                                          </span>
                                        )}
                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-800 leading-[1.1] whitespace-normal text-center max-w-full mt-0.5 px-0.5">
                                          {labelText}
                                        </span>
                                      </div>
                                    );
                                  }
                                  if (token.image) {
                                    return (
                                      <img
                                        src={token.image}
                                        alt={token.en}
                                        referrerPolicy="no-referrer"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-0.5 rounded-xl mt-1"
                                      />
                                    );
                                  }
                                  if (currentEmoji) {
                                    return (
                                      <span
                                        dir="ltr"
                                        className="text-xl sm:text-2xl md:text-3xl font-bold font-hebrew select-none filter drop-shadow-2xs leading-tight inline-flex flex-col items-center justify-center tracking-tight whitespace-pre-line"
                                        style={{ fontFamily: "'Akoderf', sans-serif" }}
                                      >
                                        {currentEmoji}
                                      </span>
                                    );
                                  }
                                  return (
                                    <span
                                      className="text-2xl sm:text-3xl md:text-4xl font-bold font-hebrew text-slate-900 select-none filter drop-shadow-2xs leading-none mt-1 inline-flex items-center justify-center tracking-tight"
                                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                                    >
                                      {stripNiqqud(token.he)}
                                    </span>
                                  );
                                })()}
                              </button>

                              {/* Plus Sign Button at Top-Right Corner */}
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddTokenWithAnimation(tokenWithSkinTone, e);
                                }}
                                title={
                                  isDisabled
                                    ? isSpeechDisabled
                                      ? 'Only sayings (like Shalom, Todah, Sababa) can follow says'
                                      : 'Only one "and" allowed per sentence'
                                    : `Add "${token.en}" to sentence`
                                }
                                aria-label={`Add ${token.he} to sentence`}
                                className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 text-white rounded-full shadow-xs flex items-center justify-center transition-transform border-1.5 border-white z-10 ${
                                  isDisabled
                                    ? 'bg-slate-300 opacity-40 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-600 active:scale-90 cursor-pointer'
                                }`}
                              >
                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3.5]" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
        )}

      {/* Flying Cards Animation Overlay */}
      {flyingCards.map((card) => (
        <div
          key={card.id}
          className="fixed z-50 pointer-events-none w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-amber-400 bg-white shadow-xl flex items-center justify-center animate-fly-to-tray"
          style={{
            left: `${card.startX}px`,
            top: `${card.startY}px`,
            '--target-x': `${card.deltaX}px`,
            '--target-y': `${card.deltaY}px`,
          } as React.CSSProperties}
        >
          {card.token.image ? (
            <img
              src={card.token.image}
              alt={card.token.en}
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-0.5 rounded-xl"
            />
          ) : card.token.emoji ? (
            <span className="text-2xl sm:text-3xl font-bold">{card.token.emoji}</span>
          ) : (
            <span className="text-2xl sm:text-3xl font-bold font-hebrew text-slate-900">{card.token.he}</span>
          )}
        </div>
      ))}
    </div>
  );
};
