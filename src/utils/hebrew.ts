import { WordExample, LetterData } from '../types';
import { getAllDictionaryWords } from '../data/dictionary';

/**
 * Helper utility to strip Hebrew Nikud (vowels, dagesh, cantillation marks)
 * across displayed strings to enforce standard, clean Ktiv Maleh.
 */
export const stripNikud = (text: string | undefined | null): string => {
  if (!text) return '';
  // Unicode range 0591 (\u0591) to 05C7 (\u05C7) covers cantillation, vowel points, dagesh, and diacritics
  return text.replace(/[\u0591-\u05C7]/g, '');
};

export const stripNiqqud = stripNikud;

/**
 * Strips royal and honorific prefixes ("King ", "Queen ") and parenthetical tags
 * for minimal card display labels across Explore and Sentence Builder views,
 * while preserving full formal titles for popup definitions and audio pronunciation.
 */
export const stripHonorificPrefix = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.replace(/\s*\(.*\)/, '').replace(/^(King|Queen)\s+/i, '').trim();
};

/**
 * Returns custom short text label for specific location cards (TLV, Tel Aviv, Haifa, Jerusalem)
 * matching the character card typography.
 */
export const getLocationCardLabel = (
  wordOrToken: { wordEn?: string; en?: string; wordHe?: string; he?: string; cardLabel?: string } | null | undefined
): string | null => {
  if (!wordOrToken) return null;
  if (wordOrToken.cardLabel) return wordOrToken.cardLabel;

  const en = (wordOrToken.wordEn || wordOrToken.en || '').trim().toLowerCase();
  const he = (wordOrToken.wordHe || wordOrToken.he || '').trim().replace(/[֑-ׇ]/g, '');

  if (en === 'ben-gurion airport' || he === 'נמל התעופה בן גוריון' || en === 'tlv') {
    return 'TLV';
  }
  if (en === 'tel aviv' || he === 'תל אביב') {
    return 'Tel Aviv';
  }
  if (en === 'haifa' || he === 'חיפה') {
    return 'Haifa';
  }
  if (en === 'jerusalem' || he === 'ירושלים') {
    return 'Jerusalem';
  }
  return null;
};

/**
 * Canonical categorization logic matching the Explore database (/explore).
 * Strictly maps vocabulary words into defined categories.
 */
export const getExploreWordCategories = (
  word: Partial<WordExample> & { [key: string]: any }
): string[] => {
  // 1. Strict Hebrew distinction for orange color (כתום) vs orange food (תפוז)
  if (word.wordHe === 'כתום') return ['colors'];
  if (word.wordHe === 'תפוז') return ['food'];
  if (word.wordHe === 'שלום') return ['sayings'];
  if (word.wordHe === 'נזם' || word.wordEn?.toLowerCase() === 'nose ring') return ['other'];

  const en = (word.wordEn || '').toLowerCase().trim();
  const categories: string[] = [];

  // Explicit database category if defined (supports comma-separated categories e.g. 'people,jewish')
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
  const cleanWordHe = (word.wordHe || '').replace(/[\u0591-\u05C7]/g, '').trim();
  if (
    (twentyTwoWords.includes(en) ||
      ['אף', 'בית', 'גמל', 'דלת', 'הר', 'וו', 'זחל', 'חתול', 'טבעת', 'יד', 'כף', 'לב', 'מים', 'נחש', 'סופגניה', 'עין', 'פה', 'צב', 'קוף', 'ראש', 'שן', 'תו'].includes(cleanWordHe)) &&
    !categories.includes('22')
  ) {
    categories.push('22');
  }

  const helperWords = [
    'to / for', 'to / for (prefix)',
    'in the / with', 'in the / with (prefix)', 'in the / with the (prefix)', 'in the'
  ];
  if (helperWords.includes(en) || word.category === 'helpers' || word.wordHe === 'לְ' || word.wordHe === 'בַּ') {
    if (!categories.includes('helpers')) categories.push('helpers');
  }

  const verbWords = [
    'eats (m)', 'eats (f)', 'eating (m)', 'eating (f)',
    'says (m)', 'says (f)', 'saying (m)', 'saying (f)',
    'sings (m)', 'sings (f)', 'singing (m)', 'singing (f)',
    'drinks (m)', 'drinks (f)', 'drinking (m)', 'drinking (f)',
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

  const foodWords = [
    'carrot', 'ice cream', 'cheese', 'honey', 'pomegranate', 'chocolate', 'spinach', 'corn',
    'watermelon', 'pineapple', 'peach', 'pear', 'cucumber', 'matzah', 'juice', 'challah', 'milk',
    'falafel', 'egg', 'bottle', 'banana', 'olive', 'lemon', 'mushroom', 'cookie', 'cake', 'apple',
    'bread', 'beet', 'water', 'eggplant', 'doughnut', 'donut', 'strawberry', 'grapes', 'tomato',
    'orange', 'pita', 'cactus fruit', 'avocado'
  ];
  if (foodWords.includes(en) && word.wordHe !== 'כתום' && !categories.includes('food')) {
    categories.push('food');
  }

  const peopleWords = [
    'mom', 'dad', 'teacher (f)', 'teacher (m)', 'king', 'queen', 'doctor (m)', 'doctor (f)',
    'i', 'grandfather', 'grandmother', 'boy', 'girl', 'rabbi', 'baby boy', 'baby girl'
  ];
  if (peopleWords.includes(en) && !categories.includes('people')) {
    categories.push('people');
  }

  const bodyWords = ['head', 'leg', 'tooth', 'nose', 'eye', 'hand', 'hair', 'ear', 'belly', 'tongue', 'heart', 'mouth'];
  if (bodyWords.includes(en) && !categories.includes('body')) {
    categories.push('body');
  }

  const animalWords = [
    'lion', 'duck', 'camel', 'fish', 'bear', 'bee', 'wolf', 'caterpillar', 'cat', 'dog', 'sheep',
    'ant', 'horse', 'spider', 'sloth', 'elephant', 'butterfly', 'turtle', 'frog', 'monkey',
    'hedgehog', 'fox', 'rock hyrax', 'snail', 'parrot', 'alligator', 'octopus', 'bunny', 'buny',
    'hoopoe', 'raccoon', 'hippo', 'hippopotamus', 'pig', 'peacock', 'donkey', 'owl', 'shark',
    'lizard', 'eagle', 'nubian ibex', 'snake', 'cow', 'ladybug', 'dove/pigeon', 'dove', 'pigeon'
  ];
  if (animalWords.includes(en) && !categories.includes('animals')) {
    categories.push('animals');
  }

  const transportationWords = [
    'bicycle', 'motorcycle', 'car', 'truck', 'parachute', 'train', 'helicopter', 'spaceship',
    'rocket ship', 'bus', 'boat'
  ];
  if (transportationWords.includes(en) && !categories.includes('transportation')) {
    categories.push('transportation');
  }

  const adjectiveWords = [
    'happy (m)', 'happy (f)', 'sad (m)', 'sad (f)', 'tired (m)', 'tired (f)', 'angry (m)',
    'angry (f)', 'sick (m)', 'sick (f)', 'hungry (m)', 'hungry (f)', 'excited', 'excited (m)',
    'excited (f)'
  ];
  if (
    (adjectiveWords.includes(en) ||
      en.includes('excited') ||
      en.includes('happy') ||
      en.includes('sad') ||
      en.includes('tired') ||
      en.includes('angry') ||
      en.includes('sick') ||
      en.includes('hungry')) &&
    !categories.includes('adjectives')
  ) {
    categories.push('adjectives');
  }

  const jewishWords = [
    'kipa', 'tzedaka', 'torah', 'shofar', 'chanukiah', 'chanukkiah', 'dreidel',
    'gragger', 'grogger', 'challah', 'doughnut', 'donut', 'falafel', 'rabbi', 'shabbat'
  ];
  if (jewishWords.includes(en) && !categories.includes('jewish')) {
    categories.push('jewish');
  }

  const locationWords = [
    'israel', 'jerusalem', 'the dead sea', 'dead sea', 'the kinneret', 'kinneret', 'tel aviv', 'haifa',
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
  if (!isLocation && (placeWords.includes(en) || word.category === 'places') && !categories.includes('places')) {
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

/**
 * Returns all unique words across the EXPLORE database (combining dictionary and all letters).
 */
export const getAllExploreWords = (letters: LetterData[]): { word: WordExample; letter: LetterData }[] => {
  const list: { word: WordExample; letter: LetterData }[] = [];
  const dictWords = getAllDictionaryWords();
  const seen = new Set<string>();
  const getWordKey = (w: WordExample) => {
    if (w.id) return w.id;
    return `${w.wordHe.trim().replace(/[\u0591-\u05C7]/g, '')}-${w.wordEn.trim().toLowerCase()}`;
  };

  dictWords.forEach((word) => {
    const key = getWordKey(word);
    if (!seen.has(key)) {
      seen.add(key);
      const cleanHe = word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
      const firstChar = cleanHe.charAt(0);
      const matchedLetter =
        letters.find((l) => l.letter.replace(/[\u0591-\u05C7]/g, '').trim() === firstChar) || letters[0];
      list.push({ word, letter: matchedLetter });
    }
  });

  letters.forEach((letter) => {
    const words = [letter.primaryWord, ...(letter.secondaryWords || [])];
    words.forEach((word) => {
      if (!word) return;
      const key = getWordKey(word);
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ word, letter });
      }
    });
  });

  return list;
};

