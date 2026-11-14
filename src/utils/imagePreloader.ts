import { ALEFBET_LETTERS } from '../data/alefbet';
import { POP_BACKGROUNDS, INVASION_BACKGROUNDS } from '../components/BalloonPopper';

/**
 * Gathers every image URL used throughout the app:
 * - POP game background scenes
 * - Primary & secondary vocabulary image icons across all 22 letters
 * - Favicon
 */
export const getAllAppImageUrls = (): string[] => {
  const urls = new Set<string>();

  // 1. POP Game Backgrounds
  POP_BACKGROUNDS.forEach((bg) => {
    if (bg) urls.add(bg);
  });
  INVASION_BACKGROUNDS.forEach((bg) => {
    if (bg) urls.add(bg);
  });

  // 2. All vocabulary image icons (local assets & remote images)
  ALEFBET_LETTERS.forEach((letter) => {
    if (letter.primaryWord?.image) {
      urls.add(letter.primaryWord.image);
    }
    if (letter.secondaryWords) {
      letter.secondaryWords.forEach((word) => {
        if (word.image) {
          urls.add(word.image);
        }
      });
    }
  });

  // 3. Category & UI icons
  urls.add('/favicon.svg');
  urls.add('/catch-and-train-logo.webp');
  urls.add('/mappy.svg');
  urls.add('https://i.imgur.com/04nTIWq.png');
  urls.add('https://i.imgur.com/aXKFshC.png');

  return Array.from(urls);
};

// Global cache of preloaded Image objects to keep decoded assets in memory
const preloadedImageElements: HTMLImageElement[] = [];
let hasPreloaded = false;

/**
 * Preloads all app images into memory and browser HTTP cache immediately on home page open
 */
export const preloadAllAppImages = (): Promise<void> => {
  if (typeof window === 'undefined' || hasPreloaded) {
    return Promise.resolve();
  }
  hasPreloaded = true;

  const urls = getAllAppImageUrls();

  const promises = urls.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Gracefully resolve so other images continue caching
      img.src = src;
      preloadedImageElements.push(img);
    });
  });

  // Preload links in document head for network cache priority
  urls.forEach((src) => {
    try {
      if (!document.querySelector(`link[rel="preload"][href="${src}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      }
    } catch {
      // Ignore head injection errors
    }
  });

  return Promise.all(promises).then(() => {});
};
