import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, Shuffle, Star } from 'lucide-react';
import { LetterData } from '../types';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { SOFIT_LETTERS } from '../data/alefbet';

interface TracingCanvasProps {
  devModeEnabled?: boolean;
  currentLetter: LetterData;
  letters: LetterData[];
  onSelectLetter: (letter: LetterData) => void;
  onLetterTraced: (letterId: string) => void;
  isAlreadyTraced: boolean;
  tracedLetters: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface LetterPart {
  id: number;
  name: string;
  badgePoint: Point;
  pixelIndices: number[];
}

export interface LetterModel {
  pixels: Point[];
  parts: LetterPart[];
}

// Build the letter template on an offscreen canvas and partition every pixel into distinct parts
export function buildLetterModel(letterData: LetterData, width = 420, height = 420): LetterModel {
  const empty: LetterModel = { pixels: [], parts: [] };
  if (typeof document === 'undefined') return empty;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return empty;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';

  const cleanChar = letterData.letter.replace(/[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7]/g, '');

  ctx.font = "bold 260px 'Akoderf', sans-serif";
  const centerX = width / 2;
  const centerY = height / 2 + 10;
  ctx.fillText(cleanChar, centerX, centerY);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const pixels: Point[] = [];

  // Sample every 5th pixel for rich, dense coverage
  const step = 5;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 50) {
        pixels.push({ x, y });
      }
    }
  }

  if (pixels.length === 0) return empty;

  // Bounding box of the letter
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (const p of pixels) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const W = Math.max(1, maxX - minX);
  const H = Math.max(1, maxY - minY);

  const parts: LetterPart[] = [];

  if (letterData.id === 'alef') {
    // Alef: 3 parts -> The Slash, the right/upper branch, the left/lower branch
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    const p3Indices: number[] = [];

    pixels.forEach((p, idx) => {
      const nx = (p.x - minX) / W;
      const ny = (p.y - minY) / H;

      // Right/Upper branch: upper-right region
      if (nx >= 0.52 && ny <= 0.48) {
        p2Indices.push(idx);
      }
      // Left/Lower branch: lower-left region
      else if (nx <= 0.48 && ny >= 0.52) {
        p3Indices.push(idx);
      }
      // The Slash: central diagonal running from top-left to bottom-right
      else {
        p1Indices.push(idx);
      }
    });

    parts.push({
      id: 1,
      name: 'The Slash',
      badgePoint: { x: minX + 0.32 * W, y: minY + 0.32 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'The right/upper branch',
      badgePoint: { x: maxX - 0.15 * W, y: minY + 0.18 * H },
      pixelIndices: p2Indices,
    });
    parts.push({
      id: 3,
      name: 'The left/lower branch',
      badgePoint: { x: minX + 0.15 * W, y: maxY - 0.18 * H },
      pixelIndices: p3Indices,
    });
  } else if (letterData.id === 'bet') {
    // Bet (naked ב): 2 parts -> Roof & Wall, Flat Floor
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];

    pixels.forEach((p, idx) => {
      if (p.y >= maxY - 0.24 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });

    parts.push({
      id: 1,
      name: 'Top roof & right wall',
      badgePoint: { x: minX + 0.20 * W, y: minY + 0.12 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Flat bottom floor',
      badgePoint: { x: maxX - 0.15 * W, y: maxY - 0.08 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'kaf') {
    // Kaf (naked כ): 1 part -> Rounded outer curve
    const allIndices = pixels.map((_, i) => i);
    parts.push({
      id: 1,
      name: 'Rounded outer curve',
      badgePoint: { x: maxX - 0.15 * W, y: minY + 0.15 * H },
      pixelIndices: allIndices,
    });
  } else if (letterData.id === 'pe') {
    // Pe (naked פ): 1 part -> Big spiral
    const allIndices = pixels.map((_, i) => i);
    parts.push({
      id: 1,
      name: 'Big spiral',
      badgePoint: { x: maxX - 0.15 * W, y: minY + 0.12 * H },
      pixelIndices: allIndices,
    });
  } else if (letterData.id === 'he') {
    // He: 2 parts -> Arch and floating left leg
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.x <= minX + 0.42 * W && p.y >= minY + 0.35 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Roof and right wall',
      badgePoint: { x: minX + 0.20 * W, y: minY + 0.10 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Floating left leg',
      badgePoint: { x: minX + 0.25 * W, y: minY + 0.50 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'kof') {
    // Kof: 2 parts -> Right dome and left long leg
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.x <= minX + 0.42 * W && p.y >= minY + 0.20 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Right roof dome',
      badgePoint: { x: minX + 0.65 * W, y: minY + 0.15 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Long left leg',
      badgePoint: { x: minX + 0.25 * W, y: minY + 0.30 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'dalet') {
    // Dalet: 2 parts -> Roof bar and right leg
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.y <= minY + 0.32 * H) {
        p1Indices.push(idx);
      } else {
        p2Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Top roof bar',
      badgePoint: { x: minX + 0.20 * W, y: minY + 0.10 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Straight right leg',
      badgePoint: { x: maxX - 0.10 * W, y: minY + 0.45 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'gimel') {
    // Gimel: 2 parts -> Tall stem and walking foot
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.x <= minX + 0.45 * W && p.y >= maxY - 0.40 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Tall stem',
      badgePoint: { x: minX + 0.65 * W, y: minY + 0.15 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Walking foot',
      badgePoint: { x: minX + 0.25 * W, y: maxY - 0.20 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'chet') {
    // Chet: 3 parts -> Roof bridge (Step 1), Right wall (Step 2), Left wall (Step 3)
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    const p3Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.y <= minY + 0.25 * H) {
        p1Indices.push(idx);
      } else if (p.x >= minX + 0.60 * W) {
        p2Indices.push(idx);
      } else {
        p3Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Roof bridge',
      badgePoint: { x: minX + 0.50 * W, y: minY + 0.10 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Right wall',
      badgePoint: { x: maxX - 0.15 * W, y: maxY - 0.20 * H },
      pixelIndices: p2Indices,
    });
    parts.push({
      id: 3,
      name: 'Left wall',
      badgePoint: { x: minX + 0.15 * W, y: minY + 0.35 * H },
      pixelIndices: p3Indices,
    });
  } else if (letterData.id === 'shin') {
    // Shin: 2 parts -> Outer bowl/arms, and center post
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.x >= minX + 0.40 * W && p.x <= minX + 0.60 * W && p.y <= maxY - 0.25 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Wide bottom bowl & arms',
      badgePoint: { x: minX + 0.15 * W, y: minY + 0.25 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Middle center post',
      badgePoint: { x: minX + 0.50 * W, y: minY + 0.25 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'tav') {
    // Tav: 2 parts -> Roof & right leg, and left leg with boot toe
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.x <= minX + 0.45 * W && p.y >= minY + 0.25 * H) {
        p2Indices.push(idx);
      } else {
        p1Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Roof and right leg',
      badgePoint: { x: minX + 0.20 * W, y: minY + 0.10 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Left leg with boot toe',
      badgePoint: { x: minX + 0.25 * W, y: minY + 0.40 * H },
      pixelIndices: p2Indices,
    });
  } else if (letterData.id === 'vav') {
    // Vav: single straight vertical stroke
    const allIndices = pixels.map((_, i) => i);
    parts.push({
      id: 1,
      name: 'Straight line',
      badgePoint: { x: minX + 0.50 * W, y: minY + 0.15 * H },
      pixelIndices: allIndices,
    });
  } else if (letterData.id === 'yod') {
    // Yod: single small comma
    const allIndices = pixels.map((_, i) => i);
    parts.push({
      id: 1,
      name: 'Floating star comma',
      badgePoint: { x: minX + 0.50 * W, y: minY + 0.20 * H },
      pixelIndices: allIndices,
    });
  } else if (letterData.id === 'mem') {
    // Mem: 2 parts -> 1. Big loop (starting from bottom left), 2. Top part (upper left tail)
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];

    pixels.forEach((p, idx) => {
      const nx = (p.x - minX) / W;
      const ny = (p.y - minY) / H;

      // Part 2: Top part (upper left tail) located in the upper-left quadrant
      if (nx <= 0.36 && ny <= 0.34) {
        p2Indices.push(idx);
      } else {
        // Part 1: Big loop
        p1Indices.push(idx);
      }
    });

    // Badge 1: placed at the bottom-left of the big loop where tracing begins
    const p1Badge = p1Indices.length > 0
      ? pixels[
          p1Indices.reduce((best, currIdx) => {
            const p = pixels[currIdx];
            const dist = (p.x - minX) * (p.x - minX) + (maxY - p.y) * (maxY - p.y);
            const bestP = pixels[best];
            const bestDist = (bestP.x - minX) * (bestP.x - minX) + (maxY - bestP.y) * (maxY - bestP.y);
            return dist < bestDist ? currIdx : best;
          }, p1Indices[0])
        ]
      : { x: minX + 0.15 * W, y: maxY - 0.10 * H };

    // Badge 2: placed at the top-left tip of the upper-left tail
    const p2Badge = p2Indices.length > 0
      ? pixels[
          p2Indices.reduce((best, currIdx) => {
            const p = pixels[currIdx];
            const dist = (p.x - minX) * (p.x - minX) + (p.y - minY) * (p.y - minY);
            const bestP = pixels[best];
            const bestDist = (bestP.x - minX) * (bestP.x - minX) + (bestP.y - minY) * (bestP.y - minY);
            return dist < bestDist ? currIdx : best;
          }, p2Indices[0])
        ]
      : { x: minX + 0.10 * W, y: minY + 0.10 * H };

    parts.push({
      id: 1,
      name: 'Big loop (starting from bottom left)',
      badgePoint: p1Badge,
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Top part (upper left tail)',
      badgePoint: p2Badge,
      pixelIndices: p2Indices,
    });
  } else {
    // General fallback for other letters: divide into Top section and Bottom section
    const midY = minY + 0.45 * H;
    const p1Indices: number[] = [];
    const p2Indices: number[] = [];
    pixels.forEach((p, idx) => {
      if (p.y <= midY) {
        p1Indices.push(idx);
      } else {
        p2Indices.push(idx);
      }
    });
    parts.push({
      id: 1,
      name: 'Top section',
      badgePoint: { x: minX + 0.30 * W, y: minY + 0.15 * H },
      pixelIndices: p1Indices,
    });
    parts.push({
      id: 2,
      name: 'Bottom section',
      badgePoint: { x: minX + 0.30 * W, y: maxY - 0.20 * H },
      pixelIndices: p2Indices,
    });
  }

  return { pixels, parts };
}

export const TRACES_STORAGE_KEY = 'alefbet_saved_traces_v1';

export function saveTraceToStorage(
  letterId: string,
  canvas: HTMLCanvasElement,
  indices: Set<number>,
  completed: boolean
) {
  if (typeof window === 'undefined') return;
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const stored = localStorage.getItem(TRACES_STORAGE_KEY);
    const map = stored ? JSON.parse(stored) : {};
    map[letterId] = {
      dataUrl,
      coveredIndices: Array.from(indices),
      isCompleted: completed,
    };
    localStorage.setItem(TRACES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save trace', e);
  }
}

export const TracingCanvas: React.FC<TracingCanvasProps> = ({
  currentLetter,
  letters,
  onSelectLetter,
  onLetterTraced,
  isAlreadyTraced,
  tracedLetters = [],
  devModeEnabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const brushSize = 28; // Generous crayon size for young children
  const [isCompleted, setIsCompleted] = useState<boolean>(isAlreadyTraced);
  const [rainbowHue, setRainbowHue] = useState<number>(0);

  // Model of the letter: its actual sampled pixels and structural parts
  const [letterModel, setLetterModel] = useState<LetterModel>({ pixels: [], parts: [] });
  // Set of covered pixel indices
  const [coveredIndices, setCoveredIndices] = useState<Set<number>>(new Set());

  const [feedbackState, setFeedbackState] = useState<'idle' | 'success' | 'try_again'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const [rouletteLetterId, setRouletteLetterId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  const currentIndex = letters.findIndex((l) => l.id === currentLetter.id);
  const prevLetter = currentIndex > 0 ? letters[currentIndex - 1] : letters[letters.length - 1];
  const nextLetter = currentIndex < letters.length - 1 ? letters[currentIndex + 1] : letters[0];

  const prevLetterIdRef = useRef<string | null>(null);

  // Initialize letter model only when switching to a different letter (keeps and restores current tracing)
  useEffect(() => {
    let isCancelled = false;

    const initModel = () => {
      if (isCancelled) return;
      if (prevLetterIdRef.current !== currentLetter.id) {
        prevLetterIdRef.current = currentLetter.id;
        const model = buildLetterModel(currentLetter, 420, 420);
        setLetterModel(model);

        // Check if there is a saved trace for this letter
        let savedTrace: { dataUrl: string; coveredIndices: number[]; isCompleted: boolean } | null = null;
        try {
          const stored = localStorage.getItem(TRACES_STORAGE_KEY);
          if (stored) {
            const map = JSON.parse(stored);
            savedTrace = map[currentLetter.id] || null;
          }
        } catch {
          savedTrace = null;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (savedTrace && savedTrace.dataUrl && canvas && ctx) {
          setCoveredIndices(new Set(savedTrace.coveredIndices || []));
          setIsCompleted(savedTrace.isCompleted || isAlreadyTraced);
          setFeedbackState('idle');
          setFeedbackMessage('');

          const img = new Image();
          img.onload = () => {
            if (isCancelled || prevLetterIdRef.current !== currentLetter.id) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = savedTrace.dataUrl;
        } else {
          setCoveredIndices(new Set());
          setIsCompleted(isAlreadyTraced);
          setFeedbackState('idle');
          setFeedbackMessage('');
          if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    };

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        if (!isCancelled) initModel();
      });
    } else {
      initModel();
    }

    return () => {
      isCancelled = true;
    };
  }, [currentLetter.id, isAlreadyTraced]);

  // Compute live progress and completion for EVERY part
  const partStats = useMemo(() => {
    return letterModel.parts.map((part) => {
      const totalPoints = part.pixelIndices.length;
      let coveredCount = 0;

      for (const idx of part.pixelIndices) {
        if (coveredIndices.has(idx)) {
          coveredCount++;
        }
      }

      const coveragePct =
        totalPoints > 0 ? Math.min(100, Math.round((coveredCount / totalPoints) * 100)) : 0;

      // Each part requires at least 60% coverage to count as completed
      const isPartComplete = coveragePct >= 60;

      return {
        ...part,
        totalPoints,
        coveredCount,
        coveragePct,
        isPartComplete,
      };
    });
  }, [letterModel.parts, coveredIndices]);

  // Overall coverage percentage across the whole letter
  const overallCoveragePercent = useMemo(() => {
    if (letterModel.pixels.length === 0) return 0;
    return Math.min(100, Math.round((coveredIndices.size / letterModel.pixels.length) * 100));
  }, [letterModel.pixels, coveredIndices]);

  const clearCanvas = (playAudio = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCoveredIndices(new Set());
    setFeedbackState('idle');
    setFeedbackMessage('');
    setIsCompleted(false);

    try {
      const stored = localStorage.getItem(TRACES_STORAGE_KEY);
      if (stored) {
        const map = JSON.parse(stored);
        delete map[currentLetter.id];
        localStorage.setItem(TRACES_STORAGE_KEY, JSON.stringify(map));
      }
    } catch {
      // ignore
    }

    if (playAudio) {
      soundManager.playPop();
    }
  };

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

  const triggerSuccess = useCallback(() => {
    setIsCompleted(true);
    setFeedbackState('success');
    setFeedbackMessage(`כל הכבוד you traced the ${currentLetter.letter}!`);
    soundManager.playFanfare();
    fireCelebrationConfetti(0.5, 0.4);
    soundManager.speakTraceSuccessPrompt(currentLetter.letter);
    onLetterTraced(currentLetter.id);

    if (canvasRef.current) {
      saveTraceToStorage(currentLetter.id, canvasRef.current, coveredIndices, true);
    }
  }, [currentLetter.letter, currentLetter.id, onLetterTraced, coveredIndices]);

  // Check hit coverage when drawing at (x, y)
  const checkHitCoverage = useCallback((x: number, y: number) => {
    if (letterModel.pixels.length === 0) return;

    setCoveredIndices((prevCovered) => {
      const next = new Set(prevCovered);
      // Generous child-friendly hit radius
      const hitRadius = brushSize / 2 + 14; // ~28px radius
      const r2 = hitRadius * hitRadius;

      letterModel.pixels.forEach((p, idx) => {
        if (!next.has(idx)) {
          const dx = p.x - x;
          const dy = p.y - y;
          if (dx * dx + dy * dy <= r2) {
            next.add(idx);
          }
        }
      });

      // Check if every single part has reached >= 60%
      const allPartsDone = letterModel.parts.length > 0 && letterModel.parts.every((part) => {
        if (part.pixelIndices.length === 0) return true;
        let hits = 0;
        for (const idx of part.pixelIndices) {
          if (next.has(idx)) hits++;
        }
        return (hits / part.pixelIndices.length) >= 0.60;
      });

      // Overall coverage >= 65%
      const totalPct = (next.size / letterModel.pixels.length) * 100;

      if (allPartsDone && totalPct >= 65 && !isCompleted) {
        triggerSuccess();
      }

      return next;
    });
  }, [letterModel, brushSize, isCompleted, triggerSuccess]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    // Rainbow magic crayon
    ctx.strokeStyle = `hsl(${rainbowHue}, 90%, 55%)`;
    setRainbowHue((h) => (h + 15) % 360);

    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    checkHitCoverage(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = `hsl(${rainbowHue}, 90%, 55%)`;
    setRainbowHue((h) => (h + 5) % 360);

    ctx.lineTo(x, y);
    ctx.stroke();

    checkHitCoverage(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
    setIsDrawing(false);

    if (canvasRef.current) {
      saveTraceToStorage(currentLetter.id, canvasRef.current, coveredIndices, isCompleted);
    }
  };

  // User manually checks their work
  const handleCheckTracing = () => {
    const incompleteParts = partStats.filter((p) => !p.isPartComplete);

    if (incompleteParts.length > 0) {
      setFeedbackState('try_again');
      soundManager.playGentleBoing();
      soundManager.speakEnglish('Keep going! Make sure to trace every part of the letter.');

      const missingText = incompleteParts.map((p) => `"${p.name}"`).join(' and ');
      setFeedbackMessage(
        `Not finished yet! You still need to trace: ${missingText}. Every single part of letter ${currentLetter.nameEn} must be traced to earn a star!`
      );
      return;
    }

    if (overallCoveragePercent < 65) {
      setFeedbackState('try_again');
      soundManager.playGentleBoing();
      soundManager.speakEnglish('Almost there! Keep tracing a little more.');
      setFeedbackMessage(
        `Keep going! You have traced ${overallCoveragePercent}% of letter ${currentLetter.nameEn}. Trace along the lines to reach the finish!`
      );
      return;
    }

    triggerSuccess();
  };

  // Roulette Random Letter Spin: steps through letters with beep-boop sounds before settling
  const handleRandomLetter = () => {
    if (isSpinning) return;
    soundManager.unlockAudio();
    setIsSpinning(true);

    // Pick final target distinct from current letter
    const pool = letters.filter((l) => l.id !== currentLetter.id);
    const finalTarget = pool[Math.floor(Math.random() * pool.length)] || letters[0];

    const totalSteps = 14;
    const stepLetters: LetterData[] = [];
    let prevId = currentLetter.id;

    for (let i = 0; i < totalSteps - 1; i++) {
      const candidates = letters.filter((l) => l.id !== prevId);
      const rand = candidates[Math.floor(Math.random() * candidates.length)] || letters[0];
      stepLetters.push(rand);
      prevId = rand.id;
    }
    stepLetters.push(finalTarget);

    let step = 0;
    const runStep = () => {
      const currentStepLetter = stepLetters[step];
      setRouletteLetterId(currentStepLetter.id);
      soundManager.playRouletteBeep(step);

      step++;
      if (step < totalSteps) {
        // Starts fast (~50ms) and gradually slows down to ~260ms like a real wheel
        const progress = step / totalSteps;
        const delay = 50 + Math.pow(progress, 2.2) * 210;
        spinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Land on target
        spinTimerRef.current = window.setTimeout(() => {
          setRouletteLetterId(null);
          setIsSpinning(false);
          onSelectLetter(finalTarget);
          soundManager.speakLetter(finalTarget.letter);
        }, 160);
      }
    };

    runStep();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Full Alef-Bet Quick Letter Tray */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        {/* Centered Randomizer Button */}
        <div className="h-8 flex items-center justify-center">
          <button
            type="button"
            onClick={handleRandomLetter}
            disabled={isSpinning}
            className={`h-7 flex items-center gap-1.5 px-3 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-75 leading-none ${
              isSpinning ? 'scale-105 ring-2 ring-amber-400' : ''
            }`}
          >
            <Shuffle className={`w-3.5 h-3.5 text-amber-700 ${isSpinning ? 'animate-spin' : ''}`} />
            <span className="text-sm leading-none">🎲</span>
          </button>
        </div>

        <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
          {letters.map((letter) => {
            const isTarget = rouletteLetterId ? letter.id === rouletteLetterId : letter.id === currentLetter.id;
            const isRouletteActive = rouletteLetterId !== null && letter.id === rouletteLetterId;
            const isTraced = tracedLetters.includes(letter.id);

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
                {isTraced && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center shadow-2xs z-20"
                    title="Traced"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Five Separate Sofit Letter Icons: ך ם ן ף ץ */}
        {(() => {
          const isAllMainTraced = devModeEnabled || (letters.length > 0 && letters.every((l) => tracedLetters.includes(l.id)));
          return (
            <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto pt-2 border-t border-amber-100 mt-2">
              {SOFIT_LETTERS.map((sofitLetter, idx) => {
                const isTarget = currentLetter.id === sofitLetter.id;
                const isTraced = tracedLetters.includes(sofitLetter.id);

                return (
                  <button
                    key={sofitLetter.id}
                    disabled={isSpinning || !isAllMainTraced}
                    dir="ltr"
                    onClick={() => {
                      if (isSpinning || !isAllMainTraced) return;
                      onSelectLetter(sofitLetter);
                      soundManager.speakLetter(sofitLetter.letter);
                    }}
                    title={isAllMainTraced ? sofitLetter.nameEn : 'Trace all 22 main letters to unlock'}
                    className={`relative aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-75 flex items-center justify-center select-none border shadow-2xs ${
                      idx === 0 ? 'col-start-4' : ''
                    } ${
                      !isAllMainTraced
                        ? 'bg-slate-100/90 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        : isTarget
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 scale-105 cursor-pointer'
                        : 'bg-amber-50/70 text-slate-700 hover:bg-amber-200 hover:text-slate-900 border-amber-200/60 cursor-pointer'
                    }`}
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {isAllMainTraced ? sofitLetter.letter : '?'}
                    {isAllMainTraced && isTraced && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center shadow-2xs z-20"
                        title="Traced"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* REQUIRED PARTS CHECKLIST (Every part must be checked!) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-amber-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>Required Letter Parts ({partStats.filter((p) => p.isPartComplete).length} of {partStats.length} finished):</span>
          </span>
          <span className="text-[11px] font-semibold text-amber-700">All parts required!</span>
        </div>

        {/* Badges for each required part */}
        <div className="flex flex-row flex-wrap items-center gap-1.5 sm:gap-2">
          {partStats.map((part, idx) => {
            return (
              <div
                key={part.id}
                className={`flex-1 min-w-[85px] sm:min-w-[120px] flex items-center justify-between gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
                  part.isPartComplete
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                    : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 ${
                      part.isPartComplete
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-amber-950 ring-1 sm:ring-2 ring-amber-300'
                    }`}
                  >
                    {part.isPartComplete ? '✓' : idx + 1}
                  </span>
                  <span className="truncate leading-tight text-[10px] sm:text-xs">{part.name}</span>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold shrink-0 ${part.isPartComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {part.coveragePct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="pt-1 space-y-1">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                partStats.every((p) => p.isPartComplete)
                  ? 'bg-emerald-500'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${overallCoveragePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Total lines covered: {overallCoveragePercent}%</span>
            <span>Target: 60%+ on each part</span>
          </div>
        </div>
      </div>

      {/* Main Centered Tracing Arena */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        <div className="relative w-full max-w-[420px] aspect-square bg-slate-50/70 rounded-2xl border-2 border-dashed border-amber-300 flex items-center justify-center select-none touch-none overflow-hidden shadow-inner">
          {/* Background Guided Hebrew Letter Template (Visible letter to trace) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            aria-hidden="true"
          >
            <div className="relative flex items-center justify-center" dir="rtl" lang="he">
              <span
                dir="rtl"
                lang="he"
                className="text-[260px] font-bold leading-none select-none text-slate-300 opacity-80"
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {currentLetter.letter}
              </span>
            </div>
          </div>

          {/* Numbered Step Start Badges (Shows where each part is located) */}
          <div className="absolute inset-0 pointer-events-none z-15">
            {partStats.map((part, idx) => {
              const leftPct = (part.badgePoint.x / 420) * 100;
              const topPct = (part.badgePoint.y / 420) * 100;

              return (
                <div
                  key={part.id}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${
                      part.isPartComplete
                        ? 'bg-emerald-500 text-white border-white scale-110'
                        : 'bg-amber-400 text-amber-950 border-white ring-2 ring-amber-400/50'
                    }`}
                  >
                    {part.isPartComplete ? '✓' : idx + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={420}
            height={420}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
            style={{ touchAction: 'none' }}
          />

          {/* Success Overlay Banner */}
          {isCompleted && (
            <div className="absolute bottom-4 z-20 bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 font-bold text-sm animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-yellow-300" />
              <span>Great work! Letter traced! ✓</span>
            </div>
          )}
        </div>

        {/* Quick Tools Below the Board */}
        <div className="w-full max-w-[420px] flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => clearCanvas(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Check Tracing Button */}
          <button
            onClick={handleCheckTracing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              partStats.every((p) => p.isPartComplete)
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Check My Tracing</span>
          </button>
        </div>
      </div>

      {/* Bottom Nav to Next/Prev */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => {
            onSelectLetter(nextLetter);
            soundManager.playPop();
          }}
          className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg sm:text-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span style={{ fontFamily: "'Akoderf', sans-serif" }}>{nextLetter.letter}</span>
        </button>

        <button
          onClick={() => {
            onSelectLetter(prevLetter);
            soundManager.playPop();
          }}
          className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white hover:bg-amber-50 border border-amber-200 rounded-2xl text-slate-700 font-bold text-lg sm:text-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span style={{ fontFamily: "'Akoderf', sans-serif" }}>{prevLetter.letter}</span>
          <ChevronRight className="w-5 h-5 text-amber-600" />
        </button>
      </div>
      </div>
    </div>
  );
};
