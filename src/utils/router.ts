/**
 * Router utility for managing clean, shareable permalinks across Cantor Yakov's Classroom.
 * Configured for HTML5 History Routing (No more hashes!).
 */

import { Curriculum, DownloadsTab, GameMode, JewishStudiesMode, LetterData } from '../types';
import { ALEFBET_LETTERS, ALL_LETTERS } from '../data/alefbet';
import { ALL_54_PARASHOT } from '../data/parashotData';
import { BIBLE_HEROES_DATA, HOLIDAYS_DATA } from '../data/jewishStudiesData';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface RouteState {
  curriculum: Curriculum;
  hebrewMode?: GameMode;
  jewishMode?: JewishStudiesMode;
  downloadsTab?: DownloadsTab;
  letterId?: string;
  parashaSlug?: string;
  heroId?: string;
  holidayId?: string;
  blessingId?: string;
  mitzvahId?: string;
  placeId?: string;
}

// Pre-built lookup dictionaries
const PARASHA_SLUG_MAP = new Map<string, typeof ALL_54_PARASHOT[0]>();
ALL_54_PARASHOT.forEach((p) => {
  if (!p || !p.nameEn) return;
  const slug = slugify(p.nameEn);
  PARASHA_SLUG_MAP.set(slug, p);
  if (p.transliteration) {
    PARASHA_SLUG_MAP.set(slugify(p.transliteration), p);
  }
});

const HERO_ID_MAP = new Map<string, typeof BIBLE_HEROES_DATA[0]>();
BIBLE_HEROES_DATA.forEach((h) => {
  if (!h || !h.id) return;
  HERO_ID_MAP.set(h.id, h);
  HERO_ID_MAP.set(slugify(h.id), h);
  if (h.nameEn) HERO_ID_MAP.set(slugify(h.nameEn), h);
});

const HOLIDAY_ID_MAP = new Map<string, typeof HOLIDAYS_DATA[0]>();
HOLIDAYS_DATA.forEach((hol) => {
  if (!hol || !hol.id) return;
  HOLIDAY_ID_MAP.set(hol.id, hol);
  HOLIDAY_ID_MAP.set(slugify(hol.id), hol);
  if (hol.nameEn) HOLIDAY_ID_MAP.set(slugify(hol.nameEn), hol);
});

const LETTER_ID_MAP = new Map<string, LetterData>();
ALL_LETTERS.forEach((l) => {
  if (!l || !l.id) return;
  LETTER_ID_MAP.set(l.id, l);
  LETTER_ID_MAP.set(slugify(l.id), l);
  if (l.nameEn) LETTER_ID_MAP.set(slugify(l.nameEn), l);
});

const daletLetter = ALL_LETTERS.find((l) => l.id === 'dalet');
if (daletLetter) LETTER_ID_MAP.set('daled', daletLetter);
const kofLetter = ALL_LETTERS.find((l) => l.id === 'kof');
if (kofLetter) LETTER_ID_MAP.set('kuf', kofLetter);

// Map Hero IDs to Parasha Slugs
export const HERO_PARASHA_LINKS: Record<string, { slug: string; nameEn: string; nameHe: string }[]> = {
  'adam-eve': [{ slug: 'beresheet', nameEn: 'Beresheet', nameHe: 'בְּרֵאשִׁית' }],
  'noah-naamah': [{ slug: 'noach', nameEn: 'Noach', nameHe: 'נֹחַ' }],
  'king-og': [
    { slug: 'noach', nameEn: 'Noach (Midrash)', nameHe: 'נֹחַ' },
    { slug: 'chukat', nameEn: 'Chukat', nameHe: 'חֻקַּת' },
    { slug: 'devarim', nameEn: 'Devarim', nameHe: 'דְּבָרִים' },
  ],
  'abraham-sarah': [
    { slug: 'lech-lecha', nameEn: 'Lech Lecha', nameHe: 'לֶךְ-לְךָ' },
    { slug: 'vayera', nameEn: 'Vayera', nameHe: 'וַיֵּרָא' },
    { slug: 'chayei-sarah', nameEn: 'Chayei Sarah', nameHe: 'חַיֵּי שָׂרָה' },
  ],
  'isaac-rebecca': [
    { slug: 'vayera', nameEn: 'Vayera', nameHe: 'וַיֵּרָא' },
    { slug: 'chayei-sarah', nameEn: 'Chayei Sarah', nameHe: 'חַיֵּי שָׂרָה' },
    { slug: 'toledot', nameEn: 'Toledot', nameHe: 'תּוֹלְדֹת' },
  ],
  'jacob-rachel-leah': [
    { slug: 'toledot', nameEn: 'Toledot', nameHe: 'תּוֹלְדֹת' },
    { slug: 'vayetzei', nameEn: 'Vayetzei', nameHe: 'וַיֵּצֵא' },
    { slug: 'vayishlach', nameEn: 'Vayishlach', nameHe: 'וַיִּשְׁלַח' },
  ],
  'twelve-tribes': [{ slug: 'vayechi', nameEn: 'Vayechi', nameHe: 'וַיְחִי' }],
  'yosef-osnat': [
    { slug: 'vayeshev', nameEn: 'Vayeshev', nameHe: 'וַיֵּשֶׁב' },
    { slug: 'miketz', nameEn: 'Miketz', nameHe: 'מִקֵּץ' },
    { slug: 'vayigash', nameEn: 'Vayigash', nameHe: 'וַיִּגַּשׁ' },
  ],
  'shifra-puah': [{ slug: 'shemot', nameEn: 'Shemot', nameHe: 'שְׁמוֹת' }],
  'moses-aaron-miriam': [
    { slug: 'shemot', nameEn: 'Shemot', nameHe: 'שְׁמוֹת' },
    { slug: 'vaeira', nameEn: "Va'eira", nameHe: 'וָאֵרָא' },
    { slug: 'bo', nameEn: 'Bo', nameHe: 'בֹּא' },
    { slug: 'beshalach', nameEn: 'Beshalach', nameHe: 'בְּשַׁלַּח' },
  ],
  'devorah': [{ slug: 'beshalach', nameEn: 'Beshalach (Haftarah)', nameHe: 'בְּשַׁלַּח' }],
  'yael': [{ slug: 'beshalach', nameEn: 'Beshalach (Haftarah)', nameHe: 'בְּשַׁלַּח' }],
  'sisera': [{ slug: 'beshalach', nameEn: 'Beshalach (Haftarah)', nameHe: 'בְּשַׁלַּח' }],
  'judah-maccabee': [{ slug: 'vayechi', nameEn: 'Chanukah / Vayechi', nameHe: 'חֲנֻכָּה' }],
  'esther-mordechai': [{ slug: 'tetzaveh', nameEn: 'Purim / Tetzaveh', nameHe: 'פּוּרִים' }],
};

// Map Parasha Slugs to Hero IDs
export const PARASHA_HERO_LINKS: Record<string, { id: string; nameEn: string; nameHe: string; emoji: string }[]> = {
  'beresheet': [{ id: 'adam-eve', nameEn: 'Adam & Eve', nameHe: 'אָדָם וְחַוָּה', emoji: '🌳' }],
  'noach': [
    { id: 'noah-naamah', nameEn: 'Noah & Naamah', nameHe: 'נֹחַ וְנַעֲמָה', emoji: '🚢' },
    { id: 'king-og', nameEn: 'King Og (Midrash)', nameHe: 'עוֹג הַמֶּלֶךְ', emoji: '👑' },
  ],
  'lech-lecha': [{ id: 'abraham-sarah', nameEn: 'Abraham & Sarah', nameHe: 'אַבְרָהָם וְשָׂרָה', emoji: '🎪' }],
  'vayera': [
    { id: 'abraham-sarah', nameEn: 'Abraham & Sarah', nameHe: 'אַבְרָהָם וְשָׂרָה', emoji: '🎪' },
    { id: 'isaac-rebecca', nameEn: 'Baby Isaac', nameHe: 'יִצְחָק', emoji: '🏺' },
  ],
  'chayei-sarah': [{ id: 'isaac-rebecca', nameEn: 'Isaac & Rebecca', nameHe: 'יִצְחָק וְרִבְקָה', emoji: '🏺' }],
  'toledot': [
    { id: 'isaac-rebecca', nameEn: 'Isaac & Rebecca', nameHe: 'יִצְחָק וְרִבְקָה', emoji: '🏺' },
    { id: 'jacob-rachel-leah', nameEn: 'Jacob & Esau', nameHe: 'יַעֲקֹב', emoji: '🪜' },
  ],
  'vayetzei': [{ id: 'jacob-rachel-leah', nameEn: 'Jacob, Rachel & Leah', nameHe: 'יַעֲקֹב, רָחֵל וְלֵאָה', emoji: '🪜' }],
  'vayishlach': [{ id: 'jacob-rachel-leah', nameEn: 'Jacob, Rachel & Leah', nameHe: 'יַעֲקֹב, רָחֵל וְלֵאָה', emoji: '🪜' }],
  'vayeshev': [{ id: 'yosef-osnat', nameEn: 'Joseph & Osnat', nameHe: 'יוֹסֵף וְאָסְנַת', emoji: '🎨' }],
  'shemot': [
    { id: 'shifra-puah', nameEn: 'Shifra & Puah', nameHe: 'שִׁפְרָה וּפוּעָה', emoji: '👶' },
    { id: 'moses-aaron-miriam', nameEn: 'Moses, Aaron & Miriam', nameHe: 'מֹשֶׁה, אַהֲרֹן וּמִרְיָם', emoji: '📜' },
  ],
  'beshalach': [
    { id: 'moses-aaron-miriam', nameEn: 'Moses, Aaron & Miriam', nameHe: 'מֹשֶׁה, אַהֲרֹן וּמִרְיָם', emoji: '📜' },
    { id: 'devorah', nameEn: 'Deborah', nameHe: 'דְּבוֹרָה', emoji: '🌴' },
    { id: 'yael', nameEn: 'Yael', nameHe: 'יָעֵל', emoji: '⛺' },
    { id: 'sisera', nameEn: 'General Sisera', nameHe: 'סִיסְרָא', emoji: '🛞' },
  ],
  'chukat': [{ id: 'king-og', nameEn: 'King Og', nameHe: 'עוֹג הַמֶּלֶךְ', emoji: '👑' }],
};

export function parseCurrentRoute(): RouteState {
  try {
    if (typeof window === 'undefined') {
      return { curriculum: 'hebrew', hebrewMode: 'explorer' };
    }

    // CHANGED: Read from window.location.pathname instead of hash
    const pathname = window.location.pathname || '';
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      return { curriculum: 'hebrew', hebrewMode: 'explorer' };
    }

    const parts = cleanPath.split('/').map((p) => (p || '').trim().toLowerCase());
    const first = parts[0];
    const second = parts[1];

    if (first === 'downloads') {
      let downloadsTab: DownloadsTab = 'welcome';
      if (second === 'font') downloadsTab = 'font';
      else if (second === 'mapofisrael') downloadsTab = 'map';
      else if (second === 'israelrailways') downloadsTab = 'railways';
      else if (second === 'plays') downloadsTab = 'plays';
      else if (second === 'mixtape' || second === 'hiphopmixtape' || second === 'hip-hop-mixtape') {
        downloadsTab = 'mixtape';
      }
      return { curriculum: 'downloads', downloadsTab };
    }

    if (first === 'catch') return { curriculum: 'hebrew', hebrewMode: 'catch' };
    if (first === 'match') return { curriculum: 'hebrew', hebrewMode: 'match' };
    if (first === 'pop' || first === 'balloons') return { curriculum: 'hebrew', hebrewMode: 'balloons' };
    if (first === 'explorer') return { curriculum: 'hebrew', hebrewMode: 'explorer', letterId: second };
    if (first === 'tracing') return { curriculum: 'hebrew', hebrewMode: 'tracing', letterId: second };
    if (first === 'coloring') return { curriculum: 'hebrew', hebrewMode: 'coloring', letterId: second };

    if (first === 'holidays' || first === 'calendar') return { curriculum: 'jewish_studies', jewishMode: 'holidays', holidayId: second };
    if (first === 'torah' || first === 'parasha') return { curriculum: 'jewish_studies', jewishMode: 'torah', parashaSlug: second };
    if (first === 'heroes' || first === 'people') return { curriculum: 'jewish_studies', jewishMode: 'heroes', heroId: second };
    if (first === 'blessings' || first === 'prayers') return { curriculum: 'jewish_studies', jewishMode: 'blessings', blessingId: second };
    if (first === 'mitzvot') return { curriculum: 'jewish_studies', jewishMode: 'mitzvot', mitzvahId: second };
    if (first === 'israel') return { curriculum: 'jewish_studies', jewishMode: 'israel', placeId: second };

    if (PARASHA_SLUG_MAP.has(first)) return { curriculum: 'jewish_studies', jewishMode: 'torah', parashaSlug: first };
    if (HERO_ID_MAP.has(first)) return { curriculum: 'jewish_studies', jewishMode: 'heroes', heroId: HERO_ID_MAP.get(first)?.id || first };
    if (HOLIDAY_ID_MAP.has(first)) return { curriculum: 'jewish_studies', jewishMode: 'holidays', holidayId: HOLIDAY_ID_MAP.get(first)?.id || first };
    if (LETTER_ID_MAP.has(first)) return { curriculum: 'hebrew', hebrewMode: 'explorer', letterId: LETTER_ID_MAP.get(first)?.id || first };

    return { curriculum: 'hebrew', hebrewMode: 'explorer' };
  } catch (err) {
    console.error('Route parsing fallback triggered:', err);
    return { curriculum: 'hebrew', hebrewMode: 'explorer' };
  }
}

export function buildUrlForState(state: RouteState): string {
  try {
    if (state.curriculum === 'downloads') {
      switch (state.downloadsTab) {
        case 'font': return '/downloads/font';
        case 'map': return '/downloads/mapofisrael';
        case 'railways': return '/downloads/israelrailways';
        case 'plays': return '/downloads/plays';
        case 'mixtape': return '/downloads/mixtape';
        case 'welcome':
        default: return '/downloads';
      }
    }
    if (state.curriculum === 'hebrew') {
      switch (state.hebrewMode) {
        case 'catch': return '/catch';
        case 'match': return '/match';
        case 'balloons': return '/pop';
        case 'tracing': return state.letterId ? `/tracing/${state.letterId}` : '/tracing';
        case 'coloring': return state.letterId ? `/coloring/${state.letterId}` : '/coloring';
        case 'explorer':
        default: return state.letterId ? `/explorer/${state.letterId}` : '/explorer';
      }
    } else {
      switch (state.jewishMode) {
        case 'torah': return state.parashaSlug ? `/torah/${state.parashaSlug}` : '/torah';
        case 'heroes': return state.heroId ? `/heroes/${state.heroId}` : '/heroes';
        case 'holidays': return state.holidayId ? `/calendar/${state.holidayId}` : '/calendar';
        case 'blessings': return state.blessingId ? `/blessings/${state.blessingId}` : '/blessings';
        case 'mitzvot': return state.mitzvahId ? `/mitzvot/${state.mitzvahId}` : '/mitzvot';
        case 'israel': return state.placeId ? `/israel/${state.placeId}` : '/israel';
        default: return '/calendar';
      }
    }
  } catch {
    return '/explorer';
  }
}

export function pushRouteUrl(path: string, replace = false) {
  try {
    if (typeof window === 'undefined') return;
    // CHANGED: Push standard clean path instead of adding a '#'
    const formattedPath = path.startsWith('/') ? path : '/' + path;
    if (window.location.pathname === formattedPath) return;

    if (replace) {
      window.history.replaceState(null, '', formattedPath);
    } else {
      window.history.pushState(null, '', formattedPath);
    }
  } catch (err) {
    console.error('Error pushing route URL:', err);
  }
}

export function getParashaBySlug(slug?: string) {
  if (!slug) return undefined;
  return PARASHA_SLUG_MAP.get(slugify(slug));
}

export function getHeroByIdOrSlug(idOrSlug?: string) {
  if (!idOrSlug) return undefined;
  return HERO_ID_MAP.get(idOrSlug) || HERO_ID_MAP.get(slugify(idOrSlug));
}

export function getLetterByIdOrSlug(idOrSlug?: string): LetterData | undefined {
  if (!idOrSlug) return undefined;
  const clean = slugify(idOrSlug);
  return (
    LETTER_ID_MAP.get(idOrSlug) ||
    LETTER_ID_MAP.get(clean) ||
    ALL_LETTERS.find((l) => l.id === idOrSlug || l.id === clean || slugify(l.nameEn) === clean)
  );
}