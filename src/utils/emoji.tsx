import React from 'react';

/**
 * Emoji utility helper for skin tone randomization and human emoji detection.
 */

export const FITZPATRICK_TONES = [
  '\u{1F3FB}', // Light skin tone
  '\u{1F3FC}', // Medium-light skin tone
  '\u{1F3FD}', // Medium skin tone
  '\u{1F3FE}', // Medium-dark skin tone
  '\u{1F3FF}', // Dark skin tone
];

// All 6 skin tone options for single human / hand emojis:
// pure yellow (empty modifier: '') + 5 Fitzpatrick tones
export const ALL_SKIN_TONE_MODIFIERS: string[] = [
  '',          // Pure yellow default
  '\u{1F3FB}', // Light
  '\u{1F3FC}', // Medium-light
  '\u{1F3FD}', // Medium
  '\u{1F3FE}', // Medium-dark
  '\u{1F3FF}', // Dark
];

// Generate all 26 distinct skin tone combinations for the handshake emoji:
// 1 default yellow + 5 uniform tones + 20 mixed dual-tone combinations
export const ALL_HANDSHAKE_EMOJIS: string[] = ['🤝'];
FITZPATRICK_TONES.forEach((tone1) => {
  FITZPATRICK_TONES.forEach((tone2) => {
    if (tone1 === tone2) {
      ALL_HANDSHAKE_EMOJIS.push(`\u{1F91D}${tone1}`);
    } else {
      ALL_HANDSHAKE_EMOJIS.push(`\u{1FAF1}${tone1}\u200D\u{1FAF2}${tone2}`);
    }
  });
});

// Matches human base characters and body parts supporting skin tones:
// boy, girl, man, woman, older man, older woman, adult person, prince, princess, hand, ear, nose, leg, thumbs up, thumbs down, bearded person, finger pointing down
// Adding: praying hands (\u{1F64F}), bowing person (\u{1F647}), person raising hands (\u{1F64C}), palms up together (\u{1F932})
const SKIN_TONE_SUPPORTED_REGEX = /(\u{1F466}|\u{1F467}|\u{1F468}|\u{1F469}|\u{1F474}|\u{1F475}|\u{1F9D1}|\u{1F934}|\u{1F478}|\u{270B}|\u{1F442}|\u{1F443}|\u{1F9B5}|\u{1F44D}|\u{1F44E}|\u{1F9D4}|\u{1F447}|\u{1F64F}|\u{1F647}|\u{1F64C}|\u{1F932}|\u{1F476}|\u{1F930}|\u{1F3C3}|\u{270C}|\u{1F590})/u;

/**
 * Renders an emoji string or HTML image string safely.
 */
export function renderEmoji(emoji?: string): React.ReactNode {
  if (!emoji) return null;
  if (emoji.includes('<img')) {
    return <span dangerouslySetInnerHTML={{ __html: emoji }} />;
  }
  return <>{emoji}</>;
}

/**
 * Returns a randomized skin tone variation of a human, hand, or handshake emoji.
 * - Handshake (🤝): uniformly randomized among all 26 possible skin tone combinations (including pure yellow).
 * - Hand (✋), Nose (👃), Leg (🦵), Thumbs (👍/👎), and Human emojis: uniformly randomized among all 6 skin tones (including pure yellow).
 * If the emoji does not support skin tones, returns it as is.
 */
export function randomizeSkinTone(emoji?: string, currentEmoji?: string): string {
  if (!emoji) return '';
  if (emoji.includes('<img')) return emoji;

  // 1. Handshake emoji: randomize across all 26 skin tone possibilities (including pure yellow)
  if (emoji.includes('🤝') || emoji.includes('\u{1F91D}') || emoji.includes('\u{1FAF1}')) {
    let candidates = ALL_HANDSHAKE_EMOJIS;
    if (currentEmoji && ALL_HANDSHAKE_EMOJIS.length > 1) {
      candidates = ALL_HANDSHAKE_EMOJIS.filter((e) => e !== currentEmoji);
    }
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  // 2. Preserve composite ZWJ emoji sequences (e.g., Family: 🧑‍🧑‍🧒‍🧒 / 👨‍👩‍👧‍👦, couples, etc.)
  // Never strip or modify with single-person skin tones, which would break the unified glyph.
  if (emoji.includes('\u200D')) {
    return emoji;
  }

  // 3. Human & Body part emojis with skin tones (Nose, Leg, Hand, Thumbs Up/Down, People)
  if (SKIN_TONE_SUPPORTED_REGEX.test(emoji)) {
    const stripped = emoji.replace(/[\u{1F3FB}-\u{1F3FF}\u{FE0F}]/gu, '');
    let modifiers = ALL_SKIN_TONE_MODIFIERS;
    if (currentEmoji) {
      let currentMod = '';
      for (const m of ALL_SKIN_TONE_MODIFIERS) {
        if (m) {
          if (currentEmoji.includes(m)) {
            currentMod = m;
            break;
          }
        } else {
          const hasAnyMod = ALL_SKIN_TONE_MODIFIERS.some((mod) => mod && currentEmoji.includes(mod));
          if (!hasAnyMod) {
            currentMod = '';
            break;
          }
        }
      }
      modifiers = ALL_SKIN_TONE_MODIFIERS.filter((m) => m !== currentMod);
      if (modifiers.length === 0) {
        modifiers = ALL_SKIN_TONE_MODIFIERS;
      }
    }
    const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    if (!randomModifier) {
      return stripped;
    }
    return stripped.replace(SKIN_TONE_SUPPORTED_REGEX, `$1${randomModifier}`);
  }

  return emoji;
}
