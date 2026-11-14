import React, { useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, CheckCircle2, Star, Sparkles, X } from 'lucide-react';
import { LetterData } from '../types';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { buildLetterModel, LetterModel } from './TracingCanvas';
import { AlefBallIcon } from './AlefBallIcon';

interface BattlefieldTracerProps {
  letter: LetterData;
  onComplete: () => void;
  onCancel?: () => void;
}

export const BattlefieldTracer: React.FC<BattlefieldTracerProps> = ({
  letter,
  onComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [coveredIndices, setCoveredIndices] = useState<Set<number>>(new Set());
  const [rainbowHue, setRainbowHue] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'success' | 'try_again'>('idle');
  const hasTriggeredSuccessRef = useRef<boolean>(false);

  // Brush thickness for 320x320 canvas
  const brushSize = 28;

  // Build model for this specific letter
  const letterModel: LetterModel = useMemo(() => {
    return buildLetterModel(letter, 320, 320);
  }, [letter]);

  // Compute coverage for each required stroke / part
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

  // Overall coverage percentage
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
    hasTriggeredSuccessRef.current = false;

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
    if (hasTriggeredSuccessRef.current) return;
    hasTriggeredSuccessRef.current = true;
    setIsCompleted(true);
    setFeedbackState('success');
    setFeedbackMessage(`כל הכבוד! ${letter.letter} is registered in your Alef-Dex!`);
    soundManager.playFanfare();
    fireCelebrationConfetti(0.5, 0.4);

    setTimeout(() => {
      onComplete();
    }, 900);
  }, [letter.letter, onComplete]);

  // Check coverage as pointer moves
  const checkHitCoverage = useCallback(
    (x: number, y: number) => {
      if (letterModel.pixels.length === 0 || hasTriggeredSuccessRef.current) return;

      setCoveredIndices((prevCovered) => {
        if (hasTriggeredSuccessRef.current) return prevCovered;

        const next = new Set(prevCovered);
        const hitRadius = brushSize / 2 + 12;
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
        const allPartsDone =
          letterModel.parts.length > 0 &&
          letterModel.parts.every((part) => {
            if (part.pixelIndices.length === 0) return true;
            let hits = 0;
            for (const idx of part.pixelIndices) {
              if (next.has(idx)) hits++;
            }
            return hits / part.pixelIndices.length >= 0.6;
          });

        const totalPct = (next.size / letterModel.pixels.length) * 100;

        if (allPartsDone && totalPct >= 60 && !hasTriggeredSuccessRef.current) {
          triggerSuccess();
        }

        return next;
      });
    },
    [letterModel, brushSize, triggerSuccess]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isCompleted) return;
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

    ctx.strokeStyle = `hsl(${rainbowHue}, 90%, 55%)`;
    setRainbowHue((h) => (h + 15) % 360);

    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    checkHitCoverage(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isCompleted) return;
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
    } catch {}
    setIsDrawing(false);
  };

  const handleManualCheck = () => {
    const incompleteParts = partStats.filter((p) => !p.isPartComplete);

    if (incompleteParts.length > 0) {
      setFeedbackState('try_again');
      soundManager.playGentleBoing();
      soundManager.speakEnglish('Keep going! Make sure to trace every stroke of the letter.');
      const missingText = incompleteParts.map((p) => `"${p.name}"`).join(' & ');
      setFeedbackMessage(`Still need to trace: ${missingText}`);
      return;
    }

    if (overallCoveragePercent < 50) {
      setFeedbackState('try_again');
      soundManager.playGentleBoing();
      soundManager.speakEnglish('Almost there! Keep tracing a little more.');
      setFeedbackMessage(`Keep going! ${overallCoveragePercent}% done.`);
      return;
    }

    triggerSuccess();
  };

  const completedStrokes = partStats.filter((p) => p.isPartComplete).length;
  const totalStrokes = partStats.length;

  return (
    <div className="absolute inset-0 z-40 w-full h-full bg-slate-950/80 backdrop-blur-xs flex flex-col justify-between p-1.5 sm:p-2.5 rounded-3xl select-none overflow-hidden animate-in fade-in duration-150">
      {/* Top Banner inside battlefield */}
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 bg-slate-900/90 border border-amber-300/40 rounded-2xl shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            <AlefBallIcon className="w-4 h-4 animate-bounce" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-amber-200 truncate">
            Trace <span className="text-white font-bold">{letter.nameEn} ({letter.letter})</span> to register!
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Strokes {completedStrokes}/{totalStrokes}</span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cancel tracing"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Tracing Arena */}
      <div className="relative flex-1 w-full max-w-[210px] sm:max-w-[240px] md:max-w-[260px] aspect-square mx-auto my-auto flex items-center justify-center select-none touch-none overflow-hidden rounded-2xl border-2 border-dashed border-amber-300/80 bg-slate-900/60 shadow-inner">
        {/* Faint Background Hebrew Letter */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          aria-hidden="true"
        >
          <span
            dir="rtl"
            lang="he"
            className="text-[140px] sm:text-[170px] font-bold leading-none select-none text-slate-300/40"
            style={{ fontFamily: "'Akoderf', sans-serif" }}
          >
            {letter.letter}
          </span>
        </div>

        {/* Stroke Number Badges */}
        <div className="absolute inset-0 pointer-events-none z-15">
          {partStats.map((part, idx) => {
            const leftPct = (part.badgePoint.x / 320) * 100;
            const topPct = (part.badgePoint.y / 320) * 100;

            return (
              <div
                key={part.id}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-md border-2 transition-all ${
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

        {/* Canvas with strict touch-action: none */}
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
          style={{ touchAction: 'none' }}
        />

        {/* Success Overlay directly inside the arena */}
        {isCompleted && (
          <div className="absolute inset-0 z-20 bg-emerald-600/95 text-white flex flex-col items-center justify-center p-2 text-center animate-in zoom-in duration-200">
            <CheckCircle2 className="w-10 h-10 text-yellow-300 animate-bounce mb-1" />
            <div className="text-base sm:text-lg font-bold">Added to Alef-Dex! 🎉</div>
            <div
              className="text-3xl font-bold font-hebrew my-0.5"
              style={{ fontFamily: "'Akoderf', sans-serif" }}
            >
              {letter.letter}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold">
              Officially registered!
            </p>
          </div>
        )}
      </div>

      {/* Feedback Message if incomplete */}
      {feedbackState === 'try_again' && feedbackMessage && (
        <div className="px-2 py-0.5 rounded-lg bg-amber-500/90 text-amber-950 text-[10px] font-bold text-center z-10 shrink-0">
          {feedbackMessage}
        </div>
      )}

      {/* Bottom Action Controls inside battlefield */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1 border-t border-amber-300/30 shrink-0 z-10">
        <button
          type="button"
          onClick={() => clearCanvas(true)}
          disabled={isCompleted}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-rose-900/80 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={isCompleted}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
            partStats.every((p) => p.isPartComplete)
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Register</span>
        </button>
      </div>
    </div>
  );
};
