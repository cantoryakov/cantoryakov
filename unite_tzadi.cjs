const fs = require('fs');
const paper = require('paper');

// Initialize paper
paper.setup(new paper.Size(480, 480));

// Path 1 (Diagonal Stem) from raw font
const path1Data = "M264.85 409.5 L197.65 413 L177.7 338.8 Q170 309.4 159.85 280 Q149.7 250.6 138.85 221.2 L138.85 221.2 Q131.15 200.2 123.1 180.25 Q115.05 160.3 104.9 136.85 L104.9 136.85 L178.05 136.85 Q181.55 144.55 186.10 157.5 Q190.65 170.45 195.55 184.98 Q200.45 199.5 204.65 212.1 L204.65 212.1 Q215.85 243.95 226.35 275.45 Q236.85 306.95 244.9 338.8 L244.9 338.8 Z";

// Path 2 (Right Branch) from raw font
const path2Data = "M215.5 288.05 L215.5 288.05 L201.5 245 Q214.1 241.15 221.1 234.5 Q228.1 227.85 231.6 218.05 Q235.1 208.25 236.85 195.12 Q238.6 182 240.7 165.9 L240.7 165.9 L244.2 136.85 L310.35 136.85 L306.85 170.45 Q304.4 192.85 298.8 212.63 Q293.2 232.4 282.7 248.15 Q272.2 263.9 255.75 274.05 Q239.3 284.2 215.5 288.05 Z";

const p1 = new paper.Path(path1Data);
const p2 = new paper.Path(path2Data);

// Perform Boolean Union (Unite)
const united = p1.unite(p2);

console.log("United PathData:", united.pathData);
