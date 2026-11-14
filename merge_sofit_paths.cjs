const fs = require('fs');
const paper = require('paper');
const opentype = require('opentype.js');

paper.setup(new paper.Size(480, 480));

const fontBuffer = fs.readFileSync('./public/NotoSansHebrew-Black.ttf');
const font = opentype.parse(fontBuffer.buffer);

const sofits = ['ך', 'ם', 'ן', 'ף', 'ץ'];
const fontSize = 260;

sofits.forEach((char) => {
  const tmp = font.getPath(char, 0, 0, fontSize);
  const bbox = tmp.getBoundingBox();
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;

  const x = (480 - width) / 2 - bbox.x1;
  const y = (480 - height) / 2 - bbox.y1;

  const fontPathObj = font.getPath(char, x, y, fontSize);
  const rawD = fontPathObj.toPathData(2);

  // Use Paper.js CompoundPath
  const compound = new paper.CompoundPath(rawD);
  console.log(`\n--- ${char} (sub-paths count: ${compound.children.length}) ---`);

  if (char === 'ן' || char === 'ץ' || char === 'ך' || char === 'ף') {
    // Perform Boolean Union on sub-paths to produce a single continuous outer boundary!
    let united = compound.children[0];
    for (let i = 1; i < compound.children.length; i++) {
      united = united.unite(compound.children[i]);
    }
    console.log(`${char} United pathData:`, united.pathData);
    console.log(`${char} United bounds:`, united.bounds.toString());
  } else if (char === 'ם') {
    // Mem Sofit has outer contour (children[0]) and inner hole (children[1])
    console.log('ם Outer contour:', compound.children[0].pathData);
    console.log('ם Inner contour:', compound.children[1].pathData);
  }
});
