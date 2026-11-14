const fs = require('fs');
const opentype = require('opentype.js');

const buffer = fs.readFileSync('./public/NotoSansHebrew-Black.ttf');
const font = opentype.parse(buffer.buffer);

const sofits = ['ך', 'ם', 'ן', 'ף', 'ץ'];
const fontSize = 260; // Slightly smaller so long descenders have plenty of margin!

sofits.forEach((char) => {
  const tmp = font.getPath(char, 0, 0, fontSize);
  const bbox = tmp.getBoundingBox();
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;

  // Center horizontally (X) and vertically (Y) inside 480x480 with ~60px padding
  const x = (480 - width) / 2 - bbox.x1;
  const y = (480 - height) / 2 - bbox.y1;

  const fontPathObj = font.getPath(char, x, y, fontSize);
  console.log(`\n=== Character ${char} ===`);
  console.log('Final bbox:', fontPathObj.getBoundingBox());
  console.log('Commands count:', fontPathObj.commands.length);
  console.log('Path data:', fontPathObj.toPathData(2));
});
