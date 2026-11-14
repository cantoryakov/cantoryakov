const fs = require('fs');
const filePath = 'src/data/alefbet.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Helper to lowercase English text while preserving "Torah", "Nubian ibex", and standalone "I"
function processText(text) {
  if (typeof text !== 'string') return text;
  // If it contains Hebrew characters ([\u0591-\u05C7]), be careful, but we target English fields.
  
  // Lowercase everything first
  let lower = text.toLowerCase();
  
  // Replace "torah" with "Torah"
  lower = lower.replace(/\btorah\b/g, 'Torah');
  
  // Replace "nubian ibex" with "Nubian ibex"
  lower = lower.replace(/\bnubian ibex\b/g, 'Nubian ibex');
  
  // Replace standalone " i " or start/end "i"
  lower = lower.replace(/\bi\b/g, 'I');
  
  // Also capitalize the very first letter of sentences if needed? Wait, user said: "everything in the vocabulary book should be lowercase except for: 'I' 'Torah' and the N in 'Nubian ibex'". So EVERYTHING should be lowercase! No sentence capitalization.
  
  return lower;
}

// Let's read alefbet.ts and replace specific string literals in English fields
// Or we can parse / evaluate / use regex replacement on object property values.
console.log("Script template ready");
