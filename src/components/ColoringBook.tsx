import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shuffle,
  Sparkles,
  RotateCcw,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Star,
  SprayCan,
  Stamp,
  PaintBucket,
  Flame,
  Undo,
  Redo,
  Upload,
  Pencil
} from 'lucide-react';
import { LetterData } from '../types';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { randomizeSkinTone } from '../utils/emoji';
import hebrewLetterAssetsJson from '../data/hebrewLetterAssets.json';
import { SOFIT_LETTERS } from '../data/alefbet';

interface LetterAsset {
  maskDataUrl: string;
  outlineDataUrl: string;
}

const LETTER_ASSETS: Record<string, LetterAsset> = hebrewLetterAssetsJson as Record<string, LetterAsset>;

const getLetterAsset = (letterChar: string): LetterAsset => {
  const cleanChar = letterChar.replace(/[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7]/g, '');

  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 480;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 480, 480);
      ctx.fillStyle = '#000000';
      ctx.font = "900 280px 'Akoderf', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.direction = 'rtl';
      ctx.fillText(cleanChar, 240, 250);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.strokeText(cleanChar, 240, 250);
      const mask = c.toDataURL('image/png');

      ctx.clearRect(0, 0, 480, 480);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.font = "900 280px 'Akoderf', sans-serif";
      ctx.strokeText(cleanChar, 240, 250);
      const outline = c.toDataURL('image/png');

      return { maskDataUrl: mask, outlineDataUrl: outline };
    }
  }
  return { maskDataUrl: '', outlineDataUrl: '' };
};

export const COLORINGS_STORAGE_KEY = 'alefbet_saved_colorings_v1';

// Check if a canvas is completely blank (transparent / 0 alpha everywhere)
const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;
  for (let i = 3; i < len; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
};

// Retrieve map of saved drawings from localStorage
const getStoredColoringMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COLORINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

interface ColoringBookProps {
  devModeEnabled?: boolean;
  currentLetter: LetterData;
  letters: LetterData[];
  onSelectLetter: (letter: LetterData) => void;
  coloredLetters?: string[];
  onLetterColored?: (letterId: string) => void;
  onLetterCleared?: (letterId: string) => void;
}

export interface ColorItem {
  id: string;
  nameEn: string;
  nameHe: string;
  spokenHe: string;
  transliteration: string;
  hex: string;
  bgClass: string;
  emoji: string;
}

export const VOCAB_COLORS: ColorItem[] = [
  { id: 'red', nameEn: 'Red', nameHe: 'אדום', spokenHe: 'אָדוֹם', transliteration: 'ah-dom', hex: '#EF4444', bgClass: 'bg-red-500', emoji: '🔴' },
  { id: 'orange', nameEn: 'Orange', nameHe: 'כתום', spokenHe: 'כָּתֹם', transliteration: 'kah-tom', hex: '#F97316', bgClass: 'bg-orange-500', emoji: '🟠' },
  { id: 'yellow', nameEn: 'Yellow', nameHe: 'צהוב', spokenHe: 'צָהֹב', transliteration: 'tzah-hov', hex: '#EAB308', bgClass: 'bg-yellow-400', emoji: '🟡' },
  { id: 'green', nameEn: 'Green', nameHe: 'ירוק', spokenHe: 'יָרוֹק', transliteration: 'yah-rok', hex: '#22C55E', bgClass: 'bg-emerald-500', emoji: '🟢' },
  { id: 'blue', nameEn: 'Blue', nameHe: 'כחול', spokenHe: 'כָּחֹל', transliteration: 'kah-khol', hex: '#3B82F6', bgClass: 'bg-blue-500', emoji: '🔵' },
  { id: 'purple', nameEn: 'Purple', nameHe: 'סגול', spokenHe: 'סָגֹל', transliteration: 'sah-gol', hex: '#A855F7', bgClass: 'bg-purple-500', emoji: '🟣' },
  { id: 'pink', nameEn: 'Pink', nameHe: 'ורוד', spokenHe: 'וָרֹד', transliteration: 'vah-rod', hex: '#EC4899', bgClass: 'bg-pink-400', emoji: '🌸' },
  { id: 'brown', nameEn: 'Brown', nameHe: 'חום', spokenHe: 'חוּם', transliteration: 'khum', hex: '#854D0E', bgClass: 'bg-amber-800', emoji: '🟤' },
  { id: 'gray', nameEn: 'Gray', nameHe: 'אפור', spokenHe: 'אֲפֹר', transliteration: 'ah-for', hex: '#6B7280', bgClass: 'bg-slate-500', emoji: '🩶' },
  { id: 'white', nameEn: 'White', nameHe: 'לבן', spokenHe: 'לָבָן', transliteration: 'lah-vahn', hex: '#FFFFFF', bgClass: 'bg-white', emoji: '🤍' },
  { id: 'rainbow', nameEn: 'Rainbow', nameHe: 'קשת', spokenHe: 'קֶשֶׁת', transliteration: 'keh-shet', hex: 'rainbow', bgClass: 'bg-gradient-to-r from-[#FF2D55] via-[#FFCC00] via-[#4CD964] via-[#5AC8FA] via-[#007AFF] to-[#AF52DE]', emoji: '🌈' },
];

export type ToolType = 'crayon' | 'spray' | 'stamp' | 'bucket';

export const ColoringBook: React.FC<ColoringBookProps> = ({
  currentLetter,
  letters,
  onSelectLetter,
  coloredLetters,
  onLetterColored,
  onLetterCleared,
  devModeEnabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stencilCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isResettingRef = useRef<boolean>(false);
  const onLetterColoredRef = useRef(onLetterColored);
  onLetterColoredRef.current = onLetterColored;
  const onLetterClearedRef = useRef(onLetterCleared);
  onLetterClearedRef.current = onLetterCleared;

  const [activeColor, setActiveColor] = useState<ColorItem>(VOCAB_COLORS[0]);
  const [activeTool, setActiveTool] = useState<ToolType>('crayon');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [rainbowHue, setRainbowHue] = useState<number>(0);
  const [stayInsideLines, setStayInsideLines] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rouletteLetterId, setRouletteLetterId] = useState<string | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // In-memory cache of saved letter coloring data URLs
  const coloringsCacheRef = useRef<Record<string, string>>({});
  // Track previous letter to save before switching
  const prevLetterIdRef = useRef<string>(currentLetter.id);
  const activeLetterIdRef = useRef<string>(currentLetter.id);

  // Keep track of which letters have saved coloring for UI quick selector badge
  const [coloredLetterIds, setColoredLetterIds] = useState<Set<string>>(() => {
    const initialMap = getStoredColoringMap();
    coloringsCacheRef.current = initialMap;
    return new Set(Object.keys(initialMap));
  });

  useEffect(() => {
  if (devModeEnabled && letters) {
    setColoredLetterIds(new Set(letters.map((l) => l.id)));
  }
}, [devModeEnabled, letters]);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyIndexRef = useRef<number>(-1);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [shareDataUrl, setShareDataUrl] = useState<string>('');

  const CANVAS_SIZE = 480;

  const stampCandidates = useMemo(() => {
    const items = [];
    if (currentLetter.primaryWord) {
      items.push(currentLetter.primaryWord);
    }
    if (currentLetter.secondaryWords) {
      items.push(...currentLetter.secondaryWords);
    }
    return items.filter((w) => w.emoji || w.image);
  }, [currentLetter]);

  const outlineImageRef = useRef<HTMLImageElement | null>(null);

  // Re-composite main visible display canvas
  const redrawMainCanvas = useCallback(() => {
    const mainCanvas = canvasRef.current;
    const paintCanvas = paintCanvasRef.current;
    const stencilCanvas = stencilCanvasRef.current;
    if (!mainCanvas || !paintCanvas || !stencilCanvas) return;

    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw clean crisp white paper background
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Faint coloring book grid dots
    ctx.fillStyle = '#F1F5F9';
    for (let x = 12; x < CANVAS_SIZE; x += 24) {
      for (let y = 12; y < CANVAS_SIZE; y += 24) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // 2. Draw user's paint layer
    if (stayInsideLines && stencilCanvas) {
      if (!scratchCanvasRef.current && typeof document !== 'undefined') {
        const scratch = document.createElement('canvas');
        scratch.width = CANVAS_SIZE;
        scratch.height = CANVAS_SIZE;
        scratchCanvasRef.current = scratch;
      }
      const scratch = scratchCanvasRef.current;
      if (scratch) {
        const sCtx = scratch.getContext('2d');
        if (sCtx) {
          sCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          // 2a. Draw stencil silhouette (letter mask)
          sCtx.drawImage(stencilCanvas, 0, 0);
          // 2b. Retain only paint that falls within the letter silhouette
          sCtx.globalCompositeOperation = 'source-in';
          sCtx.drawImage(paintCanvas, 0, 0);
          sCtx.globalCompositeOperation = 'source-over';

          // 2c. Composite masked paint onto main canvas
          ctx.drawImage(scratch, 0, 0);
        }
      }
    } else {
      // Free drawing mode: paint visible anywhere across canvas
      ctx.drawImage(paintCanvas, 0, 0);
    }

    // 3. Draw clean crisp outer boundary outline ON TOP (zero intersecting internal lines!)
    if (outlineImageRef.current && outlineImageRef.current.complete && outlineImageRef.current.naturalWidth > 0) {
      ctx.drawImage(outlineImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  }, [stayInsideLines]);

  // Save current paint canvas state for a specific letter ID
  const saveLetterDrawing = useCallback((letterId: string) => {
    if (isResettingRef.current) return;
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;

    if (isCanvasBlank(paintCanvas)) {
      delete coloringsCacheRef.current[letterId];
      setColoredLetterIds((prev) => {
        if (!prev.has(letterId)) return prev;
        const next = new Set(prev);
        next.delete(letterId);
        return next;
      });
      onLetterClearedRef.current?.(letterId);
      if (typeof window !== 'undefined') {
        try {
          const map = getStoredColoringMap();
          if (map[letterId]) {
            delete map[letterId];
            localStorage.setItem(COLORINGS_STORAGE_KEY, JSON.stringify(map));
          }
        } catch (e) {
          console.error('Failed to update coloring storage', e);
        }
      }
      return;
    }

    try {
      const dataUrl = paintCanvas.toDataURL('image/png');
      coloringsCacheRef.current[letterId] = dataUrl;
      setColoredLetterIds((prev) => {
        if (prev.has(letterId)) return prev;
        const next = new Set(prev);
        next.add(letterId);
        return next;
      });
      onLetterColoredRef.current?.(letterId);
      if (typeof window !== 'undefined') {
        const map = getStoredColoringMap();
        map[letterId] = dataUrl;
        localStorage.setItem(COLORINGS_STORAGE_KEY, JSON.stringify(map));
      }
    } catch (e) {
      console.error('Failed to save coloring', e);
    }
  }, []);

  // Clear saved drawing for a letter (e.g. Dynamite explosion)
  const clearLetterDrawing = useCallback((letterId: string) => {
    delete coloringsCacheRef.current[letterId];
    setColoredLetterIds((prev) => {
      if (!prev.has(letterId)) return prev;
      const next = new Set(prev);
      next.delete(letterId);
      return next;
    });
    onLetterClearedRef.current?.(letterId);
    if (typeof window !== 'undefined') {
      try {
        const map = getStoredColoringMap();
        if (map[letterId]) {
          delete map[letterId];
          localStorage.setItem(COLORINGS_STORAGE_KEY, JSON.stringify(map));
        }
      } catch (e) {
        console.error('Failed to clear coloring from storage', e);
      }
    }
  }, []);

  // Sync when parent resets coloredLetters array to empty
  useEffect(() => {
    if (coloredLetters && coloredLetters.length === 0) {
      coloringsCacheRef.current = {};
      setColoredLetterIds(new Set());
      const paintCanvas = paintCanvasRef.current;
      if (paintCanvas) {
        const ctx = paintCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
      redrawMainCanvas();
    }
  }, [coloredLetters, redrawMainCanvas]);

  // Global reset listener
  useEffect(() => {
    const handleResetAll = () => {
      isResettingRef.current = true;
      coloringsCacheRef.current = {};
      setColoredLetterIds(new Set());
      const paintCanvas = paintCanvasRef.current;
      if (paintCanvas) {
        const ctx = paintCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
      }
      setHistory([]);
      setHistoryIndex(-1);
      historyIndexRef.current = -1;
      redrawMainCanvas();
      setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    };
    window.addEventListener('alefbet_reset_everything', handleResetAll);
    return () => {
      window.removeEventListener('alefbet_reset_everything', handleResetAll);
    };
  }, [redrawMainCanvas]);

  // Render the current letter stencil offscreen
  const renderStencil = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!stencilCanvasRef.current) {
      const stencil = document.createElement('canvas');
      stencil.width = CANVAS_SIZE;
      stencil.height = CANVAS_SIZE;
      stencilCanvasRef.current = stencil;
    }
    const canvas = stencilCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const asset = getLetterAsset(currentLetter.letter);
    if (asset && asset.maskDataUrl) {
      const maskImg = new Image();
      maskImg.onload = () => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(maskImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        redrawMainCanvas();
      };
      maskImg.src = asset.maskDataUrl;
    }
  }, [currentLetter.letter, redrawMainCanvas]);

  // Load the crisp boundary outline image
  useEffect(() => {
    let isCancelled = false;

    const loadOutline = () => {
      const asset = getLetterAsset(currentLetter.letter);
      if (asset && asset.outlineDataUrl) {
        const img = new Image();
        img.onload = () => {
          if (isCancelled) return;
          outlineImageRef.current = img;
          redrawMainCanvas();
        };
        img.src = asset.outlineDataUrl;
      } else {
        outlineImageRef.current = null;
      }
    };

    loadOutline();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.load("900 280px 'Akoderf'").then(() => {
        if (isCancelled) return;
        renderStencil();
        loadOutline();
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [currentLetter.letter, redrawMainCanvas, renderStencil]);

  // Save current paint layer state to history stack (stable callback)
  const pushHistory = useCallback(() => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    setHistory((prev) => {
      const currIdx = historyIndexRef.current;
      const next = prev.slice(0, currIdx + 1);
      next.push(imgData);
      // Keep max 20 history steps
      if (next.length > 20) {
        next.shift();
      }
      const newIdx = next.length - 1;
      historyIndexRef.current = newIdx;
      setHistoryIndex(newIdx);
      return next;
    });
  }, []);

  // Initialize or restore paint canvas when current letter changes
  useEffect(() => {
    let isCancelled = false;
    const targetLetterId = currentLetter.id;
    activeLetterIdRef.current = targetLetterId;

    // 1. If switching from a previous letter, persist previous letter's canvas first
    if (paintCanvasRef.current && prevLetterIdRef.current && prevLetterIdRef.current !== targetLetterId) {
      saveLetterDrawing(prevLetterIdRef.current);
    }
    prevLetterIdRef.current = targetLetterId;

    // 2. Render stencil mask offscreen
    renderStencil();

    // 3. Ensure paint offscreen canvas exists
    if (!paintCanvasRef.current && typeof document !== 'undefined') {
      const paint = document.createElement('canvas');
      paint.width = CANVAS_SIZE;
      paint.height = CANVAS_SIZE;
      paintCanvasRef.current = paint;
    }

    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    // 4. Check if there is an existing saved coloring for this letter
    const savedDataUrl = coloringsCacheRef.current[targetLetterId] || getStoredColoringMap()[targetLetterId];

    if (savedDataUrl) {
      // Clear canvas temporarily while image loads so previous letter paint doesn't linger
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      redrawMainCanvas();

      const img = new Image();
      img.onload = () => {
        if (isCancelled || activeLetterIdRef.current !== targetLetterId) return;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const baseline = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        setHistory([baseline]);
        setHistoryIndex(0);
        historyIndexRef.current = 0;
        redrawMainCanvas();
      };
      img.src = savedDataUrl;
    } else {
      // Clean blank canvas for new uncolored letter
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const emptyBaseline = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      setHistory([emptyBaseline]);
      setHistoryIndex(0);
      historyIndexRef.current = 0;
      redrawMainCanvas();
    }

    return () => {
      isCancelled = true;
      if (paintCanvasRef.current) {
        saveLetterDrawing(targetLetterId);
      }
    };
  }, [currentLetter.id, renderStencil, redrawMainCanvas, saveLetterDrawing]);

  // Get mouse/touch pointer coordinates scaled to canvas geometry
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Get active drawing style / color string
  const getCurrentStyle = useCallback((): string => {
    if (activeColor.id === 'rainbow') {
      return `hsl(${rainbowHue}, 100%, 60%)`;
    }
    return activeColor.hex;
  }, [activeColor, rainbowHue]);

  // Flood fill / bucket tool handler (MS Paint 2D flood fill respecting all lines on canvas)
  const handleBucketFill = useCallback((clickX?: number, clickY?: number) => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const paintCtx = paintCanvas.getContext('2d');
    if (!paintCtx) return;

    soundManager.playBucketFill();

    // 1. Determine tap coordinates
    let startX = Math.floor(clickX !== undefined ? clickX : CANVAS_SIZE / 2);
    let startY = Math.floor(clickY !== undefined ? clickY : CANVAS_SIZE / 2);
    startX = Math.max(0, Math.min(CANVAS_SIZE - 1, startX));
    startY = Math.max(0, Math.min(CANVAS_SIZE - 1, startY));

    // 2. Build composite snapshot of all currently visible lines & strokes
    const compCanvas = document.createElement('canvas');
    compCanvas.width = CANVAS_SIZE;
    compCanvas.height = CANVAS_SIZE;
    const compCtx = compCanvas.getContext('2d');
    if (!compCtx) return;

    compCtx.fillStyle = '#FFFFFF';
    compCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    compCtx.drawImage(paintCanvas, 0, 0);
    if (outlineImageRef.current && outlineImageRef.current.complete && outlineImageRef.current.naturalWidth > 0) {
      compCtx.drawImage(outlineImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    const compImgData = compCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const compData = compImgData.data;

    const getCompRgba = (x: number, y: number) => {
      const p = (y * CANVAS_SIZE + x) * 4;
      return [compData[p], compData[p + 1], compData[p + 2], compData[p + 3]];
    };

    let [r0, g0, b0] = getCompRgba(startX, startY);

    // If user tapped directly on a dark outline line, search nearby (radius 6px) for non-line area
    if (r0 + g0 + b0 < 180) {
      let found = false;
      for (let r = 1; r <= 6; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const nx = startX + dx;
            const ny = startY + dy;
            if (nx >= 0 && nx < CANVAS_SIZE && ny >= 0 && ny < CANVAS_SIZE) {
              const [nr, ng, nb] = getCompRgba(nx, ny);
              if (nr + ng + nb >= 180) {
                startX = nx;
                startY = ny;
                r0 = nr;
                g0 = ng;
                b0 = nb;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (!found) return;
    }

    // Parse fill color
    let fillR = 0, fillG = 0, fillB = 0;
    if (activeColor.id !== 'rainbow') {
      const hex = activeColor.hex.replace('#', '');
      fillR = parseInt(hex.substring(0, 2), 16) || 0;
      fillG = parseInt(hex.substring(2, 4), 16) || 0;
      fillB = parseInt(hex.substring(4, 6), 16) || 0;
    }

    // Avoid redundant fill if target area is already fill color
    if (
      activeColor.id !== 'rainbow' &&
      Math.abs(r0 - fillR) < 12 &&
      Math.abs(g0 - fillG) < 12 &&
      Math.abs(b0 - fillB) < 12
    ) {
      return;
    }

    // 3. Queue-based BFS Flood Fill with increased color match tolerance
    const visited = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
    const startIdx = startY * CANVAS_SIZE + startX;
    const queue: number[] = [startIdx];
    visited[startIdx] = 1;

    // Tolerance threshold for color matching:
    // Per-channel delta <= 45 or Euclidean distance <= 55 prevents stopping prematurely on
    // semi-transparent or gray anti-aliased edge pixels while preserving distinct color boundaries.
    const TOLERANCE_DELTA = 45;
    const TOLERANCE_SQ = 55 * 55; // 3025

    const isStartDark = (r0 + g0 + b0) < 160;

    while (queue.length > 0) {
      const idx = queue.pop()!;
      const x = idx % CANVAS_SIZE;
      const y = Math.floor(idx / CANVAS_SIZE);

      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < CANVAS_SIZE - 1 ? idx + 1 : -1,
        y > 0 ? idx - CANVAS_SIZE : -1,
        y < CANVAS_SIZE - 1 ? idx + CANVAS_SIZE : -1,
      ];

      for (let i = 0; i < 4; i++) {
        const nIdx = neighbors[i];
        if (nIdx !== -1 && !visited[nIdx]) {
          const np = nIdx * 4;
          const nr = compData[np];
          const ng = compData[np + 1];
          const nb = compData[np + 2];

          // Stop at solid dark outline / drawn lines
          const isDarkBorder = isStartDark ? (nr + ng + nb < 60) : (nr + ng + nb < 150);
          if (isDarkBorder) {
            visited[nIdx] = 2; // boundary marker
            continue;
          }

          const dr = nr - r0;
          const dg = ng - g0;
          const db = nb - b0;
          const maxDelta = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
          const distSq = dr * dr + dg * dg + db * db;

          if (maxDelta <= TOLERANCE_DELTA || distSq <= TOLERANCE_SQ) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }

    // 4. Morphological Dilation / Bleed Expansion (1.5 to 2 pixels)
    // Expand the filled area outward by 1.5 to 2 pixels into the thick black border.
    // When composited on the main canvas with the outline layer on top,
    // this ensures the color tucks cleanly beneath the black stroke with zero white fringe.
    const dilatedMask = new Uint8Array(visited);
    const DILATION_OFFSETS: [number, number][] = [
      // Distance 1.0 px
      [-1, 0], [1, 0], [0, -1], [0, 1],
      // Distance ~1.41 px
      [-1, -1], [-1, 1], [1, -1], [1, 1],
      // Distance 2.0 px
      [-2, 0], [2, 0], [0, -2], [0, 2],
    ];

    const paintImgData = paintCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const paintPixels = new Uint32Array(paintImgData.data.buffer);

    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const idx = y * CANVAS_SIZE + x;
        if (visited[idx] === 1) {
          for (let k = 0; k < DILATION_OFFSETS.length; k++) {
            const nx = x + DILATION_OFFSETS[k][0];
            const ny = y + DILATION_OFFSETS[k][1];
            if (nx >= 0 && nx < CANVAS_SIZE && ny >= 0 && ny < CANVAS_SIZE) {
              const nIdx = ny * CANVAS_SIZE + nx;
              if (dilatedMask[nIdx] !== 1) {
                const np = nIdx * 4;
                const cnr = compData[np];
                const cng = compData[np + 1];
                const cnb = compData[np + 2];

                // Bleed outward into:
                // 1) The dark black outline border and its anti-aliased edge
                // 2) Or unpainted/white gap on the paint canvas
                const isOutlineOrEdge = (cnr + cng + cnb) < 220;
                const isUnpainted = paintPixels[nIdx] === 0;

                if (isOutlineOrEdge || isUnpainted) {
                  dilatedMask[nIdx] = 1;
                }
              }
            }
          }
        }
      }
    }

    // 5. Update paint canvas
    if (activeColor.id === 'rainbow') {
      const regCanvas = document.createElement('canvas');
      regCanvas.width = CANVAS_SIZE;
      regCanvas.height = CANVAS_SIZE;
      const regCtx = regCanvas.getContext('2d')!;

      const grad = regCtx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      grad.addColorStop(0, '#FF2D55');
      grad.addColorStop(0.2, '#FFCC00');
      grad.addColorStop(0.4, '#4CD964');
      grad.addColorStop(0.6, '#5AC8FA');
      grad.addColorStop(0.8, '#007AFF');
      grad.addColorStop(1, '#AF52DE');

      const maskData = regCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
      const mask32 = new Uint32Array(maskData.data.buffer);
      for (let i = 0; i < dilatedMask.length; i++) {
        if (dilatedMask[i] === 1) {
          mask32[i] = 0xFF000000;
        }
      }
      regCtx.putImageData(maskData, 0, 0);

      regCtx.globalCompositeOperation = 'source-in';
      regCtx.fillStyle = grad;
      regCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      paintCtx.drawImage(regCanvas, 0, 0);
    } else {
      const fill32 = (255 << 24) | (fillB << 16) | (fillG << 8) | fillR;
      for (let i = 0; i < dilatedMask.length; i++) {
        if (dilatedMask[i] === 1) {
          paintPixels[i] = fill32;
        }
      }
      paintCtx.putImageData(paintImgData, 0, 0);
    }

    pushHistory();
    redrawMainCanvas();
    saveLetterDrawing(currentLetter.id);
  }, [activeColor, pushHistory, redrawMainCanvas, saveLetterDrawing, currentLetter.id]);

  // Dynamite clear handler
  const handleDynamiteClear = useCallback(() => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    soundManager.playDynamite();
    fireCelebrationConfetti(0.3, 0.5);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    clearLetterDrawing(currentLetter.id);
    pushHistory();
    redrawMainCanvas();
  }, [currentLetter.id, clearLetterDrawing, pushHistory, redrawMainCanvas]);

  // Handle pointer down / start stroke
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }

    const { x, y } = getCanvasCoords(e);
    lastPointRef.current = { x, y };

    if (activeTool === 'bucket') {
      handleBucketFill(x, y);
      return;
    }

    setIsDrawing(true);
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    // Apply brush specifics
    if (activeTool === 'spray') {
      soundManager.playSpray();
      // Draw initial spray burst
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * (brushSize / 2);
        const px = x + Math.cos(angle) * rad;
        const py = y + Math.sin(angle) * rad;
        ctx.fillStyle = getCurrentStyle();
        ctx.fillRect(px, py, 2.5, 2.5);
      }
    } else if (activeTool === 'stamp') {
      if (stampCandidates.length > 0) {
        // Pick an item at random from the database associated with the currently selected letter
        const randomIndex = Math.floor(Math.random() * stampCandidates.length);
        const activeStamp = stampCandidates[randomIndex];
        soundManager.playSparkle();
        soundManager.speakHebrew(activeStamp.ttsOverride || activeStamp.spokenHe || activeStamp.wordHe || "");

        if (activeStamp.image) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW = brushSize * 1.5;
            let drawH = brushSize * 1.5;
            if (aspect > 1) {
              drawH = drawW / aspect;
            } else {
              drawW = drawH * aspect;
            }
            ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
            redrawMainCanvas();
            pushHistory();
            saveLetterDrawing(currentLetter.id);
          };
          img.src = activeStamp.image;
        } else if (activeStamp.emoji) {
          if (activeStamp.emoji.includes('<img')) {
            const match = activeStamp.emoji.match(/src="([^"]+)"/);
            const imgSrc = match ? match[1] : '';
            if (imgSrc) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                const aspect = img.naturalWidth / img.naturalHeight;
                let drawW = brushSize * 1.5;
                let drawH = brushSize * 1.5;
                if (aspect > 1) {
                  drawH = drawW / aspect;
                } else {
                  drawW = drawH * aspect;
                }
                ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
                redrawMainCanvas();
                pushHistory();
                saveLetterDrawing(currentLetter.id);
              };
              img.src = imgSrc;
            }
          } else {
            // Apply standard site skin tone randomization across all available tones
            const finalEmoji = randomizeSkinTone(activeStamp.emoji);
            ctx.font = `${brushSize * 1.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(finalEmoji, x, y);
            redrawMainCanvas();
          }
        }
      }
    } else {
      // Crayon / standard dot: draw initial dot so even a tap/click leaves color
      soundManager.playPop();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = getCurrentStyle();
      ctx.globalAlpha = 1.0;
      ctx.fill();
    }

    redrawMainCanvas();
  };

  // Handle pointer move / drag stroke
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    if (activeColor.id === 'rainbow') {
      setRainbowHue((h) => (h + 10) % 360);
    }

    if (activeTool === 'spray') {
      soundManager.playSpray();
      // Airbrush spray particles
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * (brushSize / 2);
        const px = x + Math.cos(angle) * rad;
        const py = y + Math.sin(angle) * rad;
        ctx.fillStyle = getCurrentStyle();
        ctx.fillRect(px, py, 2, 2);
      }
    } else if (activeTool === 'stamp') {
      // One stamp per click, no dragging trail stamps
      return;
    } else {
      // Line draw for Crayon with continuous connecting stroke at full 100% opacity
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = getCurrentStyle();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
      ctx.stroke();
      lastPointRef.current = { x, y };
    }

    redrawMainCanvas();
  };

  // Handle pointer up / end stroke
  const handlePointerUp = () => {
    if (!isDrawing) return;
    try {
      // safe fallback
    } catch {
      // Safe fallback
    }
    setIsDrawing(false);
    const paintCanvas = paintCanvasRef.current;
    if (paintCanvas) {
      const ctx = paintCanvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1.0;
      }
    }
    pushHistory();
    saveLetterDrawing(currentLetter.id);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      redrawMainCanvas();
      soundManager.playPop();
      saveLetterDrawing(currentLetter.id);
    }
  };

  // Redo stroke
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];
    if (nextState) {
      ctx.putImageData(nextState, 0, 0);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      redrawMainCanvas();
      soundManager.playPop();
      saveLetterDrawing(currentLetter.id);
    }
  };

  // Spinning letter randomizer
  const handleRandomLetter = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    soundManager.playPop();

    const candidates = letters.filter((l) => l.id !== currentLetter.id);
    let steps = 0;
    const maxSteps = 16;
    const baseInterval = 60;

    const runStep = () => {
      const randomIdx = Math.floor(Math.random() * candidates.length);
      const chosen = candidates[randomIdx];
      setRouletteLetterId(chosen.id);
      soundManager.playRouletteBeep(steps);
      steps++;

      if (steps < maxSteps) {
        const currentDelay = baseInterval + Math.pow(steps, 1.8) * 3.5;
        spinTimerRef.current = window.setTimeout(runStep, currentDelay);
      } else {
        spinTimerRef.current = window.setTimeout(() => {
          setRouletteLetterId(null);
          setIsSpinning(false);
          onSelectLetter(chosen);
          soundManager.speakLetter(chosen.letter);
        }, 160);
      }
    };

    runStep();
  };

  // Open Share Modal
  const handleOpenShareModal = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    // Create export framed artwork
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 600;
    exportCanvas.height = 720;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // White background card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 720);

    // Decorative Header Banner
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, 600, 90);

    // Header Title
    ctx.fillStyle = '#92400E';
    ctx.font = "bold 26px 'Akoderf', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`Cantor Yakov's Classroom — ${currentLetter.nameEn} (${currentLetter.letter})`, 300, 52);

    // Draw Main Coloring Canvas artwork in middle
    ctx.drawImage(mainCanvas, 60, 110, 480, 480);

    // Decorative Border around artwork
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.strokeRect(57, 107, 486, 486);

    // Footer Info
    ctx.fillStyle = '#475569';
    ctx.font = "bold 20px 'Akoderf', sans-serif";
    ctx.fillText(`${currentLetter.letter} - ${currentLetter.nameHeTransliterated} · Transliteration: ${currentLetter.soundEn}`, 300, 640);

    ctx.fillStyle = '#D97706';
    ctx.font = "16px sans-serif";
    ctx.fillText("🎨 Created in Cantor Yakov's Hebrew Coloring Book", 300, 680);

    const dataUrl = exportCanvas.toDataURL('image/png');
    setShareDataUrl(dataUrl);
    setIsShareModalOpen(true);
    soundManager.playFanfare();
    fireCelebrationConfetti(0.6, 0.4);
  };

  // Native Web Share API or fallback
  const handleNativeShare = async () => {
    if (!shareDataUrl) return;
    try {
      const res = await fetch(shareDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Hebrew_Letter_${currentLetter.nameEn}_Coloring.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Hebrew Letter ${currentLetter.letter} (${currentLetter.nameEn}) Coloring Artwork`,
          text: `Check out my colored Hebrew letter ${currentLetter.letter} (${currentLetter.nameEn}) from Cantor Yakov's Classroom!`,
        });
        soundManager.playCorrect();
      } else {
        // Fallback to copy image or download
        handleDownloadImage();
      }
    } catch {
      handleDownloadImage();
    }
  };

  // Download image PNG
  const handleDownloadImage = () => {
    if (!shareDataUrl) return;
    const a = document.createElement('a');
    a.href = shareDataUrl;
    a.download = `Hebrew_Letter_${currentLetter.nameEn}_Artwork.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundManager.playCorrect();
  };

  // Print image
  const handlePrintImage = () => {
    if (!shareDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Hebrew Letter ${currentLetter.nameEn}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; items-center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; }
            img { max-width: 90%; max-height: 85vh; border: 4px solid #f59e0b; border-radius: 16px; }
          </style>
        </head>
        <body>
          <img src="${shareDataUrl}" alt="Colored Hebrew Letter ${currentLetter.letter}" />
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!shareDataUrl) return;
    try {
      const res = await fetch(shareDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedSuccess(true);
      soundManager.playCorrect();
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {
      handleDownloadImage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-4">
      {/* 22-Letter Quick Selector Bar with Spinning Randomizer */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-2.5">
        {/* Centered Spinning Randomizer Button */}
        <div className="h-8 flex items-center justify-center">
          <button
            type="button"
            onClick={handleRandomLetter}
            disabled={isSpinning}
            aria-label="Shuffle Letter"
            className={`px-3 h-8 flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-75 ${
              isSpinning ? 'scale-105 ring-2 ring-amber-400' : ''
            }`}
          >
            <Shuffle className={`w-4 h-4 text-amber-700 ${isSpinning ? 'animate-spin' : ''}`} />
            <span className="text-sm">🎲</span>
          </button>
        </div>

        {/* 22 Letters Grid */}
        <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
          {letters.map((letter) => {
            const isTarget = rouletteLetterId ? letter.id === rouletteLetterId : letter.id === currentLetter.id;
            const isRouletteActive = rouletteLetterId !== null && letter.id === rouletteLetterId;
            const isColored = coloredLetterIds.has(letter.id);

            return (
              <button
                key={letter.id}
                disabled={isSpinning}
                onClick={() => {
                  if (isSpinning) return;
                  onSelectLetter(letter);
                  soundManager.speakLetter(letter.letter);
                }}
                className={`relative aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-75 flex items-center justify-center cursor-pointer ${
                  isRouletteActive
                    ? 'bg-amber-400 text-white shadow-md scale-125 ring-4 ring-amber-300 z-10'
                    : isTarget
                    ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                    : 'bg-amber-50/70 text-slate-700 hover:bg-amber-200 hover:text-slate-900 border border-amber-200/60'
                }`}
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {letter.letter}
                {isColored && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-2xs"
                    title="Colored"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Five Separate Sofit Letter Icons: ך ם ן ף ץ */}
        {(() => {
          const isAllMainColored = devModeEnabled || (letters.length > 0 && letters.every((l) => coloredLetterIds.has(l.id)));
          return (
            <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto pt-2 border-t border-amber-100 mt-2">
              {SOFIT_LETTERS.map((sofitLetter, idx) => {
                const isTarget = currentLetter.id === sofitLetter.id;
                const isColored = coloredLetterIds.has(sofitLetter.id);

                return (
                  <button
                    key={sofitLetter.id}
                    disabled={isSpinning || !isAllMainColored}
                    dir="ltr"
                    onClick={() => {
                      if (isSpinning || !isAllMainColored) return;
                      onSelectLetter(sofitLetter);
                      soundManager.speakLetter(sofitLetter.letter);
                    }}
                    title={isAllMainColored ? sofitLetter.nameEn : 'Color all 22 main letters to unlock'}
                    className={`relative aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-75 flex items-center justify-center select-none border shadow-2xs ${
                      idx === 0 ? 'col-start-4' : ''
                    } ${
                      !isAllMainColored
                        ? 'bg-slate-100/90 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        : isTarget
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 scale-105 cursor-pointer'
                        : 'bg-amber-50/70 text-slate-700 hover:bg-amber-200 hover:text-slate-900 border-amber-200/60 cursor-pointer'
                    }`}
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {isAllMainColored ? sofitLetter.letter : '?'}
                    {isAllMainColored && isColored && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-2xs"
                        title="Colored"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

        {/* Main Studio Workspace: Left Canvas, Right Palette & Tools */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Interactive Canvas Stage */}
          <div className="md:col-span-7 bg-white p-3 sm:p-5 rounded-3xl border border-amber-200 shadow-xs flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-[440px] aspect-square rounded-2xl border-4 border-amber-300 shadow-inner bg-white overflow-hidden touch-none select-none">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full cursor-crosshair block"
              />
            </div>
          </div>

          {/* Tools & Color Palette Sidebar */}
          <div className="md:col-span-5 space-y-4">
            {/* Tool Selector */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-2.5">
              <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTool('crayon');
                  soundManager.playPop();
                }}
                title="Crayon"
                aria-label="Crayon"
                className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  activeTool === 'crayon'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Pencil className="w-6 h-6 text-rose-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('spray');
                  soundManager.playSpray();
                }}
                title="Spray"
                aria-label="Spray"
                className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  activeTool === 'spray'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <SprayCan className="w-6 h-6 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('stamp');
                  soundManager.playSparkle();
                }}
                title="Stamps"
                aria-label="Stamps"
                className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  activeTool === 'stamp'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Stamp className="w-6 h-6 text-purple-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('bucket');
                  soundManager.playBucketFill();
                }}
                title="Bucket"
                aria-label="Bucket"
                className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  activeTool === 'bucket'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PaintBucket className="w-6 h-6 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={handleDynamiteClear}
                className="p-2.5 rounded-2xl flex items-center justify-center border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Dynamite / Clear Canvas"
                aria-label="Dynamite / Clear Canvas"
              >
                <span className="text-2xl leading-none">🧨</span>
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2.5 rounded-2xl flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Undo stroke"
                aria-label="Undo stroke"
              >
                <Undo className="w-6 h-6 text-slate-700" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2.5 rounded-2xl flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Redo stroke"
                aria-label="Redo stroke"
              >
                <Redo className="w-6 h-6 text-slate-700" />
              </button>

              <button
                type="button"
                onClick={handleOpenShareModal}
                className="p-2.5 rounded-2xl flex items-center justify-center border border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                title="Share artwork"
                aria-label="Share artwork"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Brush Size Slider */}
            <div 
              className="pt-2 space-y-1"
              style={{ visibility: activeTool !== 'bucket' ? 'visible' : 'hidden' }}
            >
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Brush Size:</span>
                <span className="font-bold text-amber-800">{brushSize}px</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold">Thin</span>
                <input
                  type="range"
                  min="8"
                  max="48"
                  step="2"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-xs text-slate-600 font-bold">Thick</span>
              </div>
            </div>
          </div>

          {/* Color Palette (hidden when stamp tool is active) */}
          {activeTool !== 'stamp' && (
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-2.5">
              {/* Grid of Colors */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 gap-2">
                {VOCAB_COLORS.map((col) => {
                  const isSelected = activeColor.id === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        setActiveColor(col);
                        if (col.id === 'rainbow') {
                          soundManager.playRainbowChime();
                        } else {
                          soundManager.playPop();
                          soundManager.speakHebrew(col.spokenHe);
                        }
                      }}
                      className={`group relative aspect-square rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer ${col.bgClass} ${
                        isSelected
                          ? 'border-amber-950 scale-110 shadow-md ring-4 ring-amber-300 z-10'
                          : 'border-slate-200 hover:scale-105'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share / Export Masterpiece Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border-2 border-amber-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-800">Your Masterpiece!</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Image */}
            {shareDataUrl && (
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex items-center justify-center shadow-inner">
                <img
                  src={shareDataUrl}
                  alt={`Hebrew Letter ${currentLetter.nameEn} Artwork`}
                  className="max-h-[320px] w-auto object-contain rounded-xl shadow-xs"
                />
              </div>
            )}

            {/* Share Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share / Send</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintImage}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
