const fs = require('fs');
const paper = require('paper');
const opentype = require('opentype.js');

paper.setup(new paper.Size(480, 480));

const fontBuffer = fs.readFileSync('./public/NotoSansHebrew-Black.ttf');
const font = opentype.parse(fontBuffer.buffer);

function getCleanSofitPath(char) {
  const fontSize = 260;
  const tmp = font.getPath(char, 0, 0, fontSize);
  const bbox = tmp.getBoundingBox();
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;

  const x = (480 - width) / 2 - bbox.x1;
  const y = (480 - height) / 2 - bbox.y1;

  const fontPathObj = font.getPath(char, x, y, fontSize);
  const rawD = fontPathObj.toPathData(2);

  const compound = new paper.CompoundPath(rawD);

  if (char === 'ם') {
    // Mem Sofit has outer contour + inner hole
    const outerD = compound.children[0].pathData;
    const innerD = compound.children[1].pathData;
    return `${outerD} ${innerD}`;
  }

  let united = compound.children[0];
  for (let i = 1; i < compound.children.length; i++) {
    united = united.unite(compound.children[i]);
  }
  return united.pathData;
}

const result = {};
['ך', 'ם', 'ן', 'ף', 'ץ'].forEach((char) => {
  const p = getCleanSofitPath(char);
  result[char] = p;
  console.log(`\nCHARACTER ${char}:`);
  console.log(p);
});

fs.writeFileSync('clean_sofits.json', JSON.stringify(result, null, 2));
console.log('\nSaved clean_sofits.json successfully!');
