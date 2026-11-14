const fs = require('fs');
const path = require('path');

// Clean, 480x480 centered, zero-overlap vector paths for all 5 Sofit letters
const cleanPaths = {
  // ך (Kaf Sofit): Centered 174 to 305 X, 137 to 342 Y
  'ך': 'M305.91 339.97 L255.99 342.57 V200.35 Q255.99 189.69 250.79 184.10 Q245.59 178.51 235.19 178.51 H174.09 L179.29 137.43 H237.27 Q271.07 137.43 288.49 153.42 Q305.91 169.41 305.91 200.35 Z',

  // ם (Mem Sofit): Outer contour + inner hole
  'ם': 'M164.08 160.83 H255.60 Q288.10 160.83 304.61 175.65 Q321.12 190.47 321.12 219.85 V319.17 H171.88 V231.81 Q171.88 227.91 173.18 222.06 Q174.48 216.21 177.73 210.62 Q180.98 205.03 187.48 201.91 H158.88 L164.08 160.83 Z M221.80 278.09 H271.20 V220.63 Q271.20 211.27 266.39 206.59 Q261.58 201.91 253.26 201.91 H224.40 Q222.58 206.07 222.19 210.49 Q221.80 214.91 221.80 219.33 Z',

  // ן (Nun Sofit): Single continuous polygon, centered 205 to 274 X, 137 to 342 Y
  'ן': 'M210.49 137.43 H274.71 V339.97 L224.79 342.57 V178.51 H205.29 Z',

  // ף (Pay Sofit): Centered 163 to 316 X, 136 to 343 Y
  'ף': 'M316.18 341.27 L266.26 343.87 V216.47 Q266.26 198.27 259.11 187.74 Q251.96 177.21 235.06 177.21 Q221.80 177.21 216.60 181.76 Q211.40 186.31 211.40 193.59 Q211.40 198.27 213.61 201.52 Q215.82 204.77 219.72 206.85 Q222.06 207.89 224.66 208.67 Q227.26 209.45 229.08 209.45 L224.92 244.81 Q220.76 245.59 215.04 245.07 Q209.32 244.55 201.00 242.73 Q184.36 239.09 174.09 225.70 Q163.82 212.31 163.82 192.03 Q163.82 175.65 171.62 163.04 Q179.42 150.43 195.28 143.28 Q211.14 136.13 235.06 136.13 Q273.80 136.13 294.99 157.58 Q316.18 179.03 316.18 216.21 Z',

  // ץ (Tzadi Sofit): Single continuous outer boundary path, centered 163 to 316 X, 137 to 342 Y
  'ץ': 'M163.69 137.43 H218.03 Q220.63 143.15 224.01 152.77 Q227.39 162.39 231.03 173.18 Q234.67 183.97 237.79 193.33 Q260.41 190.47 261.71 180.72 Q263.01 170.97 264.57 159.01 L267.17 137.43 H316.31 L313.71 162.39 Q311.89 179.03 307.73 193.72 Q303.57 208.41 295.77 220.11 Q287.97 231.81 275.75 239.35 Q263.53 246.89 245.85 249.75 Q261.71 263.79 267.69 287.45 L282.51 339.97 L232.59 342.57 L217.77 287.45 Q212.05 265.61 204.51 243.77 Q196.97 221.93 188.91 200.09 Q183.19 184.49 177.21 169.67 Q171.23 154.85 163.69 137.43 Z'
};

function createMaskSvgDataUrl(pathStr) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
    <rect width="480" height="480" fill="#FFFFFF"/>
    <path d="${pathStr}" fill="#000000" fill-rule="evenodd"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createOutlineSvgDataUrl(pathStr) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
    <path d="${pathStr}" fill="none" stroke="#1f2937" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const pathsFilePath = path.resolve('src/data/hebrewLetterPaths.json');
const assetsFilePath = path.resolve('src/data/hebrewLetterAssets.json');

const pathsData = JSON.parse(fs.readFileSync(pathsFilePath, 'utf8'));
const assetsData = JSON.parse(fs.readFileSync(assetsFilePath, 'utf8'));

Object.keys(cleanPaths).forEach((char) => {
  const pathD = cleanPaths[char];
  pathsData[char] = pathD;
  assetsData[char] = {
    maskDataUrl: createMaskSvgDataUrl(pathD),
    outlineDataUrl: createOutlineSvgDataUrl(pathD)
  };
  console.log(`Updated clean vector paths & assets for ${char}`);
});

fs.writeFileSync(pathsFilePath, JSON.stringify(pathsData, null, 2), 'utf8');
fs.writeFileSync(assetsFilePath, JSON.stringify(assetsData, null, 2), 'utf8');

console.log('Successfully updated all 5 Sofit letters with perfect centered, zero-overlap vector paths!');
