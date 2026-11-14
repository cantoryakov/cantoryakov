const fs = require('fs');
const filePath = 'src/data/alefbet.ts';
let code = fs.readFileSync(filePath, 'utf8');

function cleanText(str) {
  if (typeof str !== 'string') return str;
  let lower = str.toLowerCase();
  
  // Preserve exceptions
  lower = lower.replace(/\bnubian ibex\b/gi, 'Nubian ibex');
  lower = lower.replace(/\btorah\b/gi, 'Torah');
  lower = lower.replace(/\bi\b/g, 'I');
  
  return lower;
}

// Since alefbet.ts contains object literals with properties like nameEn, wordEn, transliteration, soundEn, soundDescriptionEn, mnemonicEn, funFactEn, guideTextEn,
// let's use a regex to find string property values in the file or parse them.
// Actually, since alefbet.ts is valid TypeScript code exporting ALEFBET_LETTERS, we can parse/evaluate it or do intelligent regex replacements on property strings,
// OR since we know the keys: nameEn, nameHeTransliterated, soundEn, soundDescriptionEn, wordEn, transliteration, mnemonicEn, funFactEn, guideTextEn,
// let's write a regex that matches object property values for these specific keys.

const keysToProcess = [
  'nameEn',
  'nameHeTransliterated',
  'soundEn',
  'soundDescriptionEn',
  'wordEn',
  'transliteration',
  'mnemonicEn',
  'funFactEn',
  'guideTextEn',
  'promptTextEn',
  'promptSubtextEn'
];

keysToProcess.forEach(key => {
  // Match key: 'value' or key: "value" or key: `value`
  const regex = new RegExp(`(${key}\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2`, 'g');
  code = code.replace(regex, (match, prefix, quote, val) => {
    return `${prefix}${quote}${cleanText(val)}${quote}`;
  });
});

fs.writeFileSync(filePath, code, 'utf8');
console.log("Successfully applied casing rules to alefbet.ts");
