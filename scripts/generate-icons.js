const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const fontPath = fs.existsSync('/tmp/NotoSansHebrew-Bold.ttf')
  ? '/tmp/NotoSansHebrew-Bold.ttf'
  : '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf';

const fontBuffer = fs.readFileSync(fontPath);

// 1. Standard App Icon SVG (Solid white background with bold black Alef centered)
function getIconSvg(size, fontSize = 340, yOffset = 295) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="#ffffff" />
  <text
    x="256"
    y="${yOffset}"
    text-anchor="middle"
    dominant-baseline="central"
    fill="#000000"
    font-family="Noto Sans Hebrew, FreeSans, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
  >א</text>
</svg>`;
}

// 2. Maskable Icon SVG (with extra 15% safe margin around black Alef)
function getMaskableIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="#ffffff" />
  <text
    x="256"
    y="285"
    text-anchor="middle"
    dominant-baseline="central"
    fill="#000000"
    font-family="Noto Sans Hebrew, FreeSans, sans-serif"
    font-size="280"
    font-weight="900"
  >א</text>
</svg>`;
}

// 3. Favicon SVG (Transparent or clean background)
function getFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <text
    x="256"
    y="285"
    text-anchor="middle"
    dominant-baseline="central"
    fill="#000000"
    font-family="Noto Sans Hebrew, FreeSans, sans-serif"
    font-size="420"
    font-weight="900"
  >א</text>
</svg>`;
}

function renderPng(svg, size, outputPath) {
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [fontBuffer],
      defaultFontFamily: 'Noto Sans Hebrew',
    },
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  fs.writeFileSync(outputPath, pngData.asPng());
  console.log(`Generated ${outputPath} (${size}x${size}, ${pngData.asPng().length} bytes)`);
}

// Render all icons into public/
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// apple-touch-icon.png (180x180) for iOS Safari Add to Home Screen
renderPng(getIconSvg(180, 350, 290), 180, path.join(publicDir, 'apple-touch-icon.png'));
renderPng(getIconSvg(180, 350, 290), 180, path.join(publicDir, 'apple-touch-icon-precomposed.png'));

// PWA icons (192x192 and 512x512)
renderPng(getIconSvg(192, 350, 290), 192, path.join(publicDir, 'pwa-192x192.png'));
renderPng(getIconSvg(512, 350, 290), 512, path.join(publicDir, 'pwa-512x512.png'));
renderPng(getMaskableIconSvg(512), 512, path.join(publicDir, 'pwa-maskable-512x512.png'));

// Favicons (32x32 and 16x16)
renderPng(getIconSvg(32, 360, 280), 32, path.join(publicDir, 'favicon-32x32.png'));
renderPng(getIconSvg(16, 360, 280), 16, path.join(publicDir, 'favicon-16x16.png'));

// Also update favicon.svg
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), getFaviconSvg());
console.log('Generated favicon.svg');
