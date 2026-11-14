const fs = require('fs');
const path = require('path');
const paper = require('paper');
const opentype = require('opentype.js');

paper.setup(new paper.Size(480, 480));

const fontBuffer = fs.readFileSync('./public/NotoSansHebrew-Black.ttf');
const font = opentype.parse(fontBuffer.buffer);

const fontSize = 260; // 260px font size gives plenty of padding on all sides in 480x480 space

function getUnifiedPath(char) {
  const tmp = font.getPath(char, 0, 0, fontSize);
  const bbox = tmp.getBoundingBox();
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;

  const x = (480 - width) / 2 - bbox.x1;
  const y = (480 - height) / 2 - bbox.y1;

  const fontPathObj = font.getPath(char, x, y, fontSize);
  const rawD = fontPathObj.toPathData(2);

  if (char === 'ם') {
    // Mem Sofit has outer contour + inner hole (donut shape)
    const compound = new paper.CompoundPath(rawD);
    const outerD = compound.children[0].pathData;
    const innerD = compound.children[1].pathData;
    return `${outerD} ${innerD}`;
  }

  if (char === 'ן') {
    // Nun Sofit single outer boundary polygon
    return 'M210.49,137.43 H274.71 V339.97 L224.79,342.57 V178.51 H205.29 Z';
  }

  // For ך, ף, ץ: use paper.js compound path
  const compound = new paper.CompoundPath(rawD);
  if (compound.children && compound.children.length > 1) {
    let united = compound.children[0];
    for (let i = 1; i < compound.children.length; i++) {
      united = united.unite(compound.children[i]);
    }
    return united.pathData;
  }
  return rawD;
}

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

const pathsFilePath = path.join(__dirname, 'src/data/hebrewLetterPaths.json');
const assetsFilePath = path.join(__dirname, 'src/data/hebrewLetterAssets.json');

const pathsData = JSON.parse(fs.readFileSync(pathsFilePath, 'utf8'));
const assetsData = JSON.parse(fs.readFileSync(assetsFilePath, 'utf8'));

const sofits = ['ך', 'ם', 'ן', 'ף', 'ץ'];

sofits.forEach((char) => {
  const pathD = getUnifiedPath(char);
  pathsData[char] = pathD;
  assetsData[char] = {
    maskDataUrl: createMaskSvgDataUrl(pathD),
    outlineDataUrl: createOutlineSvgDataUrl(pathD)
  };
  console.log(`Updated clean vector paths & assets for ${char}`);
});

fs.writeFileSync(pathsFilePath, JSON.stringify(pathsData, null, 2), 'utf8');
fs.writeFileSync(assetsFilePath, JSON.stringify(assetsData, null, 2), 'utf8');

console.log('Successfully updated all 5 Sofit letters with clean, unified, zero-overlap vector paths!');
