import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';

interface ZoomableSvgFrameProps {
  src: string;
  alt: string;
  framed?: boolean;
  children?: React.ReactNode;
}

interface TransformState {
  scale: number;
  tx: number;
  ty: number;
}

interface ViewBoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type GestureState =
  | { mode: 'none' }
  | { mode: 'pan'; startX: number; startY: number; startTx: number; startTy: number }
  | {
      mode: 'pinch';
      startDist: number;
      startScale: number;
      svgPointX: number;
      svgPointY: number;
    };

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const GESTURE_COMMIT_DELAY_MS = 80;

// Module-level SVG source cache so switching tabs or views reuses fetched SVG text instantly
const svgSourceCache = new Map<string, Promise<string>>();
let nextInstanceCounter = 1;

function fetchSvgSource(src: string): Promise<string> {
  const cached = svgSourceCache.get(src);
  if (cached) return cached;
  const promise = fetch(src).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to load SVG: ${src}`);
    }
    return res.text();
  });
  svgSourceCache.set(src, promise);
  promise.catch(() => {
    svgSourceCache.delete(src);
  });
  return promise;
}

const URL_REF_ATTRS = [
  'clip-path',
  'mask',
  'filter',
  'fill',
  'stroke',
  'marker-start',
  'marker-mid',
  'marker-end',
  'style',
];

/**
 * Namespaces only internal #id references (clipPath, mask, filter, gradient, <use>)
 * so multiple SVG instances in the DOM never collide, without scanning base64 image payloads.
 */
function namespaceReferencedSvgIds(svgEl: SVGSVGElement, prefix: string): void {
  const referencedIds = new Set<string>();
  const allElements = svgEl.getElementsByTagName('*');

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];

    const href = el.getAttribute('href');
    if (href && href.charCodeAt(0) === 35 && href.length > 1) {
      const id = href.slice(1);
      referencedIds.add(id);
      el.setAttribute('href', `#${prefix}${id}`);
    }

    const xlinkHref = el.getAttribute('xlink:href');
    if (xlinkHref && xlinkHref.charCodeAt(0) === 35 && xlinkHref.length > 1) {
      const id = xlinkHref.slice(1);
      referencedIds.add(id);
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${prefix}${id}`);
    }

    for (let a = 0; a < URL_REF_ATTRS.length; a++) {
      const attrName = URL_REF_ATTRS[a];
      const val = el.getAttribute(attrName);
      if (val && val.includes('url(#')) {
        const updated = val.replace(/url\(#([^)\s"']+)\)/g, (_match, id: string) => {
          referencedIds.add(id);
          return `url(#${prefix}${id})`;
        });
        if (updated !== val) {
          el.setAttribute(attrName, updated);
        }
      }
    }
  }

  if (referencedIds.size === 0) return;

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const id = el.getAttribute('id');
    if (id && referencedIds.has(id)) {
      el.setAttribute('id', `${prefix}${id}`);
    }
  }
}

function parseBaseViewBox(svgEl: SVGSVGElement): ViewBoxRect {
  const rawVb = svgEl.getAttribute('viewBox');
  if (rawVb) {
    const nums = rawVb
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n)) && nums[2] > 0 && nums[3] > 0) {
      return { x: nums[0], y: nums[1], w: nums[2], h: nums[3] };
    }
  }
  const w = parseFloat(svgEl.getAttribute('width') || '100') || 100;
  const h = parseFloat(svgEl.getAttribute('height') || '100') || 100;
  return { x: 0, y: 0, w, h };
}

function computeViewBoxString(
  base: ViewBoxRect,
  state: TransformState,
  width: number,
  height: number
): string {
  if (state.scale <= 1.005 || width <= 0 || height <= 0) {
    return `${base.x} ${base.y} ${base.w} ${base.h}`;
  }
  const vbW = base.w / state.scale;
  const vbH = base.h / state.scale;
  const vbX = base.x + (-state.tx / (width * state.scale)) * base.w;
  const vbY = base.y + (-state.ty / (height * state.scale)) * base.h;
  return `${vbX} ${vbY} ${vbW} ${vbH}`;
}

function clampTransform(
  scale: number,
  tx: number,
  ty: number,
  width: number,
  height: number
): TransformState {
  const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  if (s <= 1.005 || width <= 0 || height <= 0) {
    return { scale: 1, tx: 0, ty: 0 };
  }
  const minTx = width * (1 - s);
  const minTy = height * (1 - s);
  return {
    scale: s,
    tx: Math.min(0, Math.max(minTx, tx)),
    ty: Math.min(0, Math.max(minTy, ty)),
  };
}

function scrollVerticalTarget(startEl: HTMLElement, dy: number): void {
  if (dy === 0) return;
  let p: HTMLElement | null = startEl.parentElement;
  while (p && p !== document.documentElement && p !== document.body) {
    const oy = window.getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) {
      const before = p.scrollTop;
      p.scrollTop += dy;
      if (p.scrollTop !== before) return;
    }
    p = p.parentElement;
  }
  window.scrollBy(0, dy);
}

export const ZoomableSvgFrame: React.FC<ZoomableSvgFrameProps> = ({
  src,
  alt,
  framed = true,
  children,
}) => {
  const instancePrefixRef = useRef<string>(`zsvg_${nextInstanceCounter++}_`);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgMountRef = useRef<HTMLDivElement | null>(null);
  const svgElRef = useRef<SVGSVGElement | null>(null);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  const baseViewBoxRef = useRef<ViewBoxRect | null>(null);
  const transformRef = useRef<TransformState>({ scale: 1, tx: 0, ty: 0 });
  const committedRef = useRef<TransformState>({ scale: 1, tx: 0, ty: 0 });
  const gestureRef = useRef<GestureState>({ mode: 'none' });
  const commitTimerRef = useRef<number | null>(null);

  const [isVectorReady, setIsVectorReady] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAtMaxScale, setIsAtMaxScale] = useState(false);
  const [isDraggingMouse, setIsDraggingMouse] = useState(false);
  const stickyBottomOffsetRef = useRef(0);

  const touchMovedRef = useRef(false);
  const singleTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  // Synchronously updates DOM viewBox / delta-transform and overlay coordinates without frame flash
  const syncDom = useCallback((next: TransformState, commitViewBoxNow: boolean) => {
    transformRef.current = next;

    const container = containerRef.current;
    const width = container ? container.clientWidth : 0;
    const height = container ? container.clientHeight : 0;

    const svgEl = svgElRef.current;
    const svgMount = svgMountRef.current;
    const baseVB = baseViewBoxRef.current;

    if (svgEl && svgMount && baseVB) {
      if (commitViewBoxNow) {
        if (commitTimerRef.current !== null) {
          window.clearTimeout(commitTimerRef.current);
          commitTimerRef.current = null;
        }
        committedRef.current = next;
        svgEl.setAttribute('viewBox', computeViewBoxString(baseVB, next, width, height));
        svgMount.style.transform = 'none';
      } else {
        const committed = committedRef.current;
        const dScale = next.scale / committed.scale;
        const dTx = next.tx - dScale * committed.tx;
        const dTy = next.ty - dScale * committed.ty;
        if (Math.abs(dScale - 1) < 0.0005 && Math.abs(dTx) < 0.05 && Math.abs(dTy) < 0.05) {
          svgMount.style.transform = 'none';
        } else {
          svgMount.style.transform = `translate(${dTx}px, ${dTy}px) scale(${dScale})`;
        }
      }
    } else if (fallbackImgRef.current) {
      fallbackImgRef.current.style.transform =
        next.scale > 1.005 ? `translate(${next.tx}px, ${next.ty}px) scale(${next.scale})` : 'none';
    }

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.width = `${next.scale * 100}%`;
      overlay.style.height = `${next.scale * 100}%`;
      overlay.style.transform =
        next.tx !== 0 || next.ty !== 0 ? `translate(${next.tx}px, ${next.ty}px)` : 'none';
      overlay.style.setProperty('--svg-zoom', String(next.scale));
    }

    const nextIsZoomed = next.scale > 1.005;
    const nextIsMax = next.scale >= MAX_SCALE - 0.001;
    setIsZoomed((prev) => (prev !== nextIsZoomed ? nextIsZoomed : prev));
    setIsAtMaxScale((prev) => (prev !== nextIsMax ? nextIsMax : prev));
  }, []);

  const scheduleViewBoxCommit = useCallback(() => {
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      syncDom(transformRef.current, true);
    }, GESTURE_COMMIT_DELAY_MS);
  }, [syncDom]);

  // Load and mount real inline vector <svg> so iOS/Android/desktop render crisp vectors at any zoom
  useEffect(() => {
    let cancelled = false;
    setIsVectorReady(false);
    svgElRef.current = null;
    baseViewBoxRef.current = null;

    fetchSvgSource(src)
      .then((svgText) => {
        if (cancelled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const parsedRoot = doc.documentElement;
        if (!parsedRoot || parsedRoot.tagName.toLowerCase() !== 'svg') {
          return;
        }

        const svgEl = document.importNode(parsedRoot, true) as unknown as SVGSVGElement;
        const baseVB = parseBaseViewBox(svgEl);
        namespaceReferencedSvgIds(svgEl, instancePrefixRef.current);

        svgEl.setAttribute('width', '100%');
        svgEl.setAttribute('height', '100%');
        svgEl.setAttribute('preserveAspectRatio', 'none');
        svgEl.setAttribute('role', 'img');
        svgEl.setAttribute('aria-label', alt);
        svgEl.style.display = 'block';
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.pointerEvents = 'none';
        svgEl.style.userSelect = 'none';

        const mountNode = svgMountRef.current;
        if (!mountNode) return;

        mountNode.replaceChildren(svgEl);
        svgElRef.current = svgEl;
        baseViewBoxRef.current = baseVB;

        syncDom(transformRef.current, true);
        if (fallbackImgRef.current) {
          fallbackImgRef.current.style.transform = 'none';
        }
        setIsVectorReady(true);
      })
      .catch((err) => {
        console.warn('Vector SVG mount fallback to img:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [src, alt, syncDom]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  const zoomAtPoint = useCallback(
    (targetScale: number, pointX: number, pointY: number, commitImmediately: boolean) => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const current = transformRef.current;
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale));
      const svgX = (pointX - current.tx) / current.scale;
      const svgY = (pointY - current.ty) / current.scale;
      const nextTx = pointX - svgX * clampedScale;
      const nextTy = pointY - svgY * clampedScale;
      const next = clampTransform(clampedScale, nextTx, nextTy, width, height);
      syncDom(next, commitImmediately);
      if (!commitImmediately) {
        scheduleViewBoxCommit();
      }
    },
    [syncDom, scheduleViewBoxCommit]
  );

  const getEffectiveViewportBottom = useCallback((el: HTMLElement): number => {
    let visibleBottom = window.innerHeight || document.documentElement.clientHeight;
    if (window.visualViewport) {
      visibleBottom = Math.min(
        visibleBottom,
        window.visualViewport.offsetTop + window.visualViewport.height
      );
    }

    let ancestor = el.parentElement;
    while (ancestor && ancestor !== document.documentElement && ancestor !== document.body) {
      const style = window.getComputedStyle(ancestor);
      const oy = style.overflowY;
      if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') {
        if (ancestor.scrollHeight > ancestor.clientHeight + 1) {
          visibleBottom = Math.min(visibleBottom, ancestor.getBoundingClientRect().bottom);
        }
      }
      ancestor = ancestor.parentElement;
    }

    const nav = document.querySelector('nav[aria-label="App Navigation"]');
    let navObstruction = 0;
    if (nav) {
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      let topEdge = Math.min(viewportH, navRect.top);

      const toggleBtn = nav.querySelector('button[aria-label*="navigation bar"]');
      if (toggleBtn) {
        const btnRect = toggleBtn.getBoundingClientRect();
        const controlsLeft = elRect.right - 110;
        const controlsRight = elRect.right;
        if (controlsRight >= btnRect.left - 6 && controlsLeft <= btnRect.right + 6) {
          topEdge = Math.min(topEdge, btnRect.top);
        }
      }

      navObstruction = Math.max(0, Math.ceil(viewportH - topEdge));
    }

    stickyBottomOffsetRef.current = navObstruction;
    return visibleBottom - navObstruction;
  }, []);

  const updateControlsPosition = useCallback(() => {
    const frame = frameRef.current;
    const controls = controlsRef.current;
    if (!frame || !controls) return;

    const rect = frame.getBoundingClientRect();
    if (rect.height <= 0) return;

    const effectiveBottom = getEffectiveViewportBottom(frame);
    const controlsH = controls.offsetHeight || 30;
    const pad = framed ? 11 : 10;

    const desiredBottom = effectiveBottom - pad - rect.top;
    const minBottom = Math.min(rect.height - pad, pad + controlsH);
    const maxBottom = Math.max(minBottom, rect.height - pad);
    const clampedBottom = Math.max(minBottom, Math.min(maxBottom, desiredBottom));
    const topPx = Math.round(clampedBottom - controlsH);

    controls.style.top = `${topPx}px`;
  }, [framed, getEffectiveViewportBottom]);

  const zoomByFactorAtCenter = useCallback(
    (factor: number) => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const rect = container.getBoundingClientRect();
      const viewportW = window.innerWidth || document.documentElement.clientWidth;
      const viewportH = getEffectiveViewportBottom(container);

      const visibleLeft = Math.max(0, Math.min(width, -rect.left));
      const visibleRight = Math.max(0, Math.min(width, viewportW - rect.left));
      const visibleTop = Math.max(0, Math.min(height, -rect.top));
      const visibleBottom = Math.max(0, Math.min(height, viewportH - rect.top));

      const pointX = visibleRight > visibleLeft ? (visibleLeft + visibleRight) / 2 : width / 2;
      const pointY = visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : height / 2;

      const nextScale = transformRef.current.scale * factor;
      zoomAtPoint(nextScale, pointX, pointY, true);
    },
    [zoomAtPoint, getEffectiveViewportBottom]
  );

  const handleReset = useCallback(() => {
    syncDom({ scale: 1, tx: 0, ty: 0 }, true);
  }, [syncDom]);

  // Pin zoom controls to the lowest visible part of the viewport within the SVG frame
  useLayoutEffect(() => {
    let navSettleTimer: number | null = null;
    let animSettleTimer: number | null = null;

    updateControlsPosition();
    animSettleTimer = window.setTimeout(updateControlsPosition, 420);

    const handleNavTransition = () => {
      updateControlsPosition();
      if (navSettleTimer !== null) window.clearTimeout(navSettleTimer);
      navSettleTimer = window.setTimeout(updateControlsPosition, 350);
    };

    window.addEventListener('scroll', updateControlsPosition, { passive: true, capture: true });
    window.addEventListener('resize', updateControlsPosition, { passive: true });
    window.addEventListener('animationend', updateControlsPosition, { passive: true });
    window.visualViewport?.addEventListener('scroll', updateControlsPosition, { passive: true });
    window.visualViewport?.addEventListener('resize', updateControlsPosition, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateControlsPosition);
      if (frameRef.current) observer.observe(frameRef.current);
      if (controlsRef.current) observer.observe(controlsRef.current);
    }

    const nav = document.querySelector('nav[aria-label="App Navigation"]');
    if (nav) {
      nav.addEventListener('transitionend', updateControlsPosition);
      nav.addEventListener('click', handleNavTransition);
    }

    return () => {
      if (navSettleTimer !== null) window.clearTimeout(navSettleTimer);
      if (animSettleTimer !== null) window.clearTimeout(animSettleTimer);
      window.removeEventListener('scroll', updateControlsPosition, { capture: true });
      window.removeEventListener('resize', updateControlsPosition);
      window.removeEventListener('animationend', updateControlsPosition);
      window.visualViewport?.removeEventListener('scroll', updateControlsPosition);
      window.visualViewport?.removeEventListener('resize', updateControlsPosition);
      if (observer) observer.disconnect();
      if (nav) {
        nav.removeEventListener('transitionend', updateControlsPosition);
        nav.removeEventListener('click', handleNavTransition);
      }
    };
  }, [updateControlsPosition, isZoomed, isVectorReady]);

  // Re-clamp and re-commit viewBox when container resizes or becomes visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;
      const cur = transformRef.current;
      syncDom(clampTransform(cur.scale, cur.tx, cur.ty, width, height), true);
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize);
      observer.observe(container);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [syncDom]);

  // Native non-passive touch + trackpad pinch listeners scoped strictly to this frame
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isInsideControls = (target: EventTarget | null) =>
      Boolean(controlsRef.current && target instanceof Node && controlsRef.current.contains(target));

    const getTouchDistance = (t1: Touch, t2: Touch) =>
      Math.max(1, Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY));

    const onTouchStart = (e: TouchEvent) => {
      if (isInsideControls(e.target)) return;
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        touchMovedRef.current = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        const mx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const my = (t1.clientY + t2.clientY) / 2 - rect.top;
        const cur = transformRef.current;
        gestureRef.current = {
          mode: 'pinch',
          startDist: dist,
          startScale: cur.scale,
          svgPointX: (mx - cur.tx) / cur.scale,
          svgPointY: (my - cur.ty) / cur.scale,
        };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchMovedRef.current = false;
        singleTouchStartRef.current = { x: t.clientX, y: t.clientY };

        if (transformRef.current.scale > 1.005) {
          gestureRef.current = {
            mode: 'pan',
            startX: t.clientX,
            startY: t.clientY,
            startTx: transformRef.current.tx,
            startTy: transformRef.current.ty,
          };
        } else {
          gestureRef.current = { mode: 'none' };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isInsideControls(e.target)) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width <= 0 || height <= 0) return;
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        touchMovedRef.current = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = getTouchDistance(t1, t2);
        const mx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const my = (t1.clientY + t2.clientY) / 2 - rect.top;

        if (gestureRef.current.mode !== 'pinch') {
          const cur = transformRef.current;
          gestureRef.current = {
            mode: 'pinch',
            startDist: dist,
            startScale: cur.scale,
            svgPointX: (mx - cur.tx) / cur.scale,
            svgPointY: (my - cur.ty) / cur.scale,
          };
          return;
        }

        const g = gestureRef.current;
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, g.startScale * (dist / g.startDist))
        );
        const nextTx = mx - g.svgPointX * nextScale;
        const nextTy = my - g.svgPointY * nextScale;
        syncDom(clampTransform(nextScale, nextTx, nextTy, width, height), false);
        scheduleViewBoxCommit();
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        let hasExceededTapThreshold = touchMovedRef.current;
        if (singleTouchStartRef.current) {
          const movedDist = Math.hypot(
            t.clientX - singleTouchStartRef.current.x,
            t.clientY - singleTouchStartRef.current.y
          );
          if (movedDist > 6) {
            touchMovedRef.current = true;
            hasExceededTapThreshold = true;
          }
        }

        if (gestureRef.current.mode === 'pan' && hasExceededTapThreshold) {
          e.preventDefault();
          e.stopPropagation();
          const g = gestureRef.current;
          const nextTx = g.startTx + (t.clientX - g.startX);
          const nextTy = g.startTy + (t.clientY - g.startY);
          syncDom(
            clampTransform(transformRef.current.scale, nextTx, nextTy, width, height),
            false
          );
          scheduleViewBoxCommit();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isInsideControls(e.target)) return;

      if (e.touches.length === 1 && transformRef.current.scale > 1.005) {
        // Commit crisp vector viewBox when lifting one finger after a pinch, then continue pan smoothly
        syncDom(transformRef.current, true);
        const t = e.touches[0];
        gestureRef.current = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startTx: transformRef.current.tx,
          startTy: transformRef.current.ty,
        };
        return;
      }

      if (e.touches.length === 0) {
        gestureRef.current = { mode: 'none' };

        if (touchMovedRef.current) {
          // Immediately re-rasterize vector SVG at the exact final zoomed viewBox
          syncDom(transformRef.current, true);
          suppressClickRef.current = true;
          if (suppressClickTimerRef.current !== null) {
            window.clearTimeout(suppressClickTimerRef.current);
          }
          suppressClickTimerRef.current = window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 120);
        }
      }
    };

    const wheelTarget = frameRef.current || el;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Trackpad pinch-to-zoom inside the SVG frame
        e.preventDefault();
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAtPoint(
          transformRef.current.scale * factor,
          e.clientX - rect.left,
          e.clientY - rect.top,
          false
        );
        return;
      }

      // Block horizontal/diagonal trackpad swipe drift (including during bottom/top bounce)
      // from triggering browser Back/Forward gestures while keeping vertical scroll smooth.
      if (Math.abs(e.deltaX) > 1.5) {
        e.preventDefault();
        if (e.deltaY !== 0) {
          let dy = e.deltaY;
          if (e.deltaMode === 1) dy *= 16;
          else if (e.deltaMode === 2) dy *= window.innerHeight || 600;
          scrollVerticalTarget(wheelTarget, dy);
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });
    wheelTarget.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      wheelTarget.removeEventListener('wheel', onWheel);
    };
  }, [syncDom, scheduleViewBoxCommit, zoomAtPoint]);

  // Desktop mouse drag panning when zoomed in (with drag threshold so clicks on overlays still work)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    if (e.button !== 0 || transformRef.current.scale <= 1.005) return;
    if (controlsRef.current && controlsRef.current.contains(e.target as Node)) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startTx = transformRef.current.tx;
    const startTy = transformRef.current.ty;
    let didDrag = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!didDrag) {
        if (Math.hypot(dx, dy) <= 4) return;
        didDrag = true;
        setIsDraggingMouse(true);
      }

      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const nextTx = startTx + dx;
      const nextTy = startTy + dy;
      syncDom(clampTransform(transformRef.current.scale, nextTx, nextTy, width, height), false);
      scheduleViewBoxCommit();
    };

    const handleMouseUp = () => {
      setIsDraggingMouse(false);
      if (didDrag) {
        syncDom(transformRef.current, true);
        suppressClickRef.current = true;
        if (suppressClickTimerRef.current !== null) {
          window.clearTimeout(suppressClickTimerRef.current);
        }
        suppressClickTimerRef.current = window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 120);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  return (
    <div ref={frameRef} className="relative w-full overscroll-x-none">
      {/* Clipped SVG & interactive overlay frame */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        style={{
          touchAction: isZoomed ? 'none' : 'pan-y',
          WebkitTouchCallout: 'none',
        }}
        className={`relative w-full overflow-hidden overscroll-x-none bg-white select-none ${
          framed ? 'border border-stone-300' : ''
        } ${isZoomed ? (isDraggingMouse ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      >
        {/* Intrinsic aspect-ratio sizer & instant initial display while inline vector SVG mounts */}
        <img
          ref={fallbackImgRef}
          src={src}
          alt={alt}
          aria-hidden={isVectorReady}
          draggable={false}
          onLoad={updateControlsPosition}
          className={`w-full block select-none pointer-events-none origin-top-left ${
            isVectorReady ? 'invisible' : ''
          }`}
        />

        {/* Live inline SVG container zoomed via native SVG viewBox for 100% crisp vector rendering */}
        <div
          ref={svgMountRef}
          className={`absolute inset-0 w-full h-full origin-top-left pointer-events-none select-none ${
            isVectorReady ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Interactive overlay layer (e.g. IsraelModule landmark targets & active highlight ring) */}
        {children && (
          <div
            ref={overlayRef}
            className="absolute top-0 left-0 z-20 origin-top-left"
            style={
              {
                width: '100%',
                height: '100%',
                '--svg-zoom': 1,
              } as React.CSSProperties
            }
          >
            {children}
          </div>
        )}
      </div>

      {/* Viewport-pinned zoom controls bounded strictly within the SVG frame */}
      <div
        ref={controlsRef}
        style={{
          right: framed ? '11px' : '10px',
          touchAction: 'manipulation',
        }}
        className="absolute z-30 flex items-center gap-1.5"
      >
        {isZoomed && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => zoomByFactorAtCenter(1.4)}
          disabled={isAtMaxScale}
          aria-label="Zoom in"
          title="Zoom in"
          className={`p-1.5 rounded-lg border shadow-sm transition-colors ${
            !isAtMaxScale
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 cursor-pointer'
              : 'bg-amber-100 text-amber-400 border-amber-300 cursor-default'
          }`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
