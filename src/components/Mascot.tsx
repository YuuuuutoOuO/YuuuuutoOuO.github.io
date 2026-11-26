import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Cpu, Minimize2, RotateCcw, Sparkles, X } from 'lucide-react';
import { MASCOT_META, MASCOT_PAPER_PICKS, MASCOT_TRIVIA } from '../data/mascot';
import { useLanguage } from '../context/LanguageContext';

const MINIMIZE_STORAGE_KEY = 'portfolio_mascot_minimized';
const AVATAR_SIZE = 92;
const EDGE_MARGIN = 16;

interface Vec2 {
  x: number;
  y: number;
}

function getDefaultPos(): Vec2 {
  if (typeof window === 'undefined') return { x: 20, y: 20 };
  return {
    x: Math.max(EDGE_MARGIN, window.innerWidth - AVATAR_SIZE - 20),
    y: Math.max(EDGE_MARGIN, window.innerHeight - AVATAR_SIZE - 20),
  };
}

function clampPos(pos: Vec2): Vec2 {
  if (typeof window === 'undefined') return pos;
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - AVATAR_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - AVATAR_SIZE - EDGE_MARGIN);
  return {
    x: Math.min(maxX, Math.max(EDGE_MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(EDGE_MARGIN, pos.y)),
  };
}

export const Mascot: React.FC = () => {
  const { lang, t } = useLanguage();
  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(MINIMIZE_STORAGE_KEY) === 'true';
  });
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [messageIdx, setMessageIdx] = useState<number>(-1);
  const [mode, setMode] = useState<'greeting' | 'trivia' | 'paper'>('greeting');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [eyeOffset, setEyeOffset] = useState<Vec2>({ x: 0, y: 0 });
  const [pos, setPos] = useState<Vec2>(getDefaultPos);

  const posRef = useRef<Vec2>(pos);
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const happyTimerRef = useRef<number | null>(null);
  const dragMetaRef = useRef<{
    active: boolean;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
    lastX: number;
    lastY: number;
    lastTime: number;
  }>({
    active: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  });

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    window.localStorage.setItem(MINIMIZE_STORAGE_KEY, String(minimized));
  }, [minimized]);

  const stopPhysics = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const triggerHappy = useCallback((duration = 600) => {
    setIsHappy(true);
    if (happyTimerRef.current !== null) {
      window.clearTimeout(happyTimerRef.current);
    }
    happyTimerRef.current = window.setTimeout(() => {
      setIsHappy(false);
      happyTimerRef.current = null;
    }, duration);
  }, []);

  // Keep mascot inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => clampPos(prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      stopPhysics();
      if (happyTimerRef.current !== null) {
        window.clearTimeout(happyTimerRef.current);
      }
    };
  }, [stopPhysics]);

  // Periodic natural blink
  useEffect(() => {
    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 150);
    }, 4000);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout) window.clearTimeout(blinkTimeout);
    };
  }, []);

  // Gentle eye tracking toward pointer
  useEffect(() => {
    if (minimized) return;
    const handleMouseMove = (e: MouseEvent) => {
      const cx = posRef.current.x + AVATAR_SIZE / 2;
      const cy = posRef.current.y + AVATAR_SIZE / 2;
      const dx = (e.clientX - cx) * (facingLeft ? -1 : 1);
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(1.6, Math.hypot(dx, dy) / 160);
      setEyeOffset({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [minimized, facingLeft]);

  // Physics loop for flinging & wall bouncing
  const startPhysics = useCallback(() => {
    stopPhysics();
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(2.2, (now - lastTs) / 16.667); // normalized to 60fps
      lastTs = now;

      let { x, y } = posRef.current;
      let { x: vx, y: vy } = velRef.current;

      x += vx * dt;
      y += vy * dt;

      const minX = EDGE_MARGIN;
      const maxX = Math.max(EDGE_MARGIN, window.innerWidth - AVATAR_SIZE - EDGE_MARGIN);
      const minY = EDGE_MARGIN;
      const maxY = Math.max(EDGE_MARGIN, window.innerHeight - AVATAR_SIZE - EDGE_MARGIN);

      const restitution = 0.94;
      let bounced = false;

      if (x <= minX) {
        x = minX;
        vx = Math.abs(vx) * restitution;
        bounced = true;
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx) * restitution;
        bounced = true;
      }

      if (y <= minY) {
        y = minY;
        vy = Math.abs(vy) * restitution;
        bounced = true;
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy) * restitution;
        bounced = true;
      }

      // Ultra-low air friction so it bounces happily across the viewport
      const friction = Math.pow(0.9965, dt);
      vx *= friction;
      vy *= friction;

      posRef.current = { x, y };
      velRef.current = { x: vx, y: vy };
      setPos({ x, y });

      const speed = Math.hypot(vx, vy);
      if (Math.abs(vx) > 0.4) {
        setFacingLeft(vx < 0);
      }
      setWheelAngle((prev) => prev + speed * 2.4 * dt);
      setTilt(Math.max(-18, Math.min(18, vx * 0.7)));

      if (bounced && speed > 3) {
        triggerHappy(350);
      }

      if (speed < 0.35) {
        velRef.current = { x: 0, y: 0 };
        setTilt(0);
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, [stopPhysics, triggerHappy]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    stopPhysics();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragMetaRef.current = {
      active: true,
      pointerId: e.pointerId,
      offsetX: e.clientX - posRef.current.x,
      offsetY: e.clientY - posRef.current.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
    };
    velRef.current = { x: 0, y: 0 };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const meta = dragMetaRef.current;
    if (!meta.active || meta.pointerId !== e.pointerId) return;

    const totalDist = Math.hypot(e.clientX - meta.startX, e.clientY - meta.startY);
    if (totalDist > 6) {
      meta.moved = true;
      if (bubbleOpen) setBubbleOpen(false);
    }

    if (!meta.moved) return;

    const now = performance.now();
    const dtMs = Math.max(8, now - meta.lastTime);
    const instantVx = ((e.clientX - meta.lastX) / dtMs) * 16.667;
    const instantVy = ((e.clientY - meta.lastY) / dtMs) * 16.667;

    // Exponential smoothing for responsive, natural flinging
    velRef.current = {
      x: velRef.current.x * 0.45 + instantVx * 0.55,
      y: velRef.current.y * 0.45 + instantVy * 0.55,
    };

    const nextPos = clampPos({
      x: e.clientX - meta.offsetX,
      y: e.clientY - meta.offsetY,
    });
    posRef.current = nextPos;
    setPos(nextPos);

    if (Math.abs(instantVx) > 0.8) {
      setFacingLeft(instantVx < 0);
    }
    setTilt(Math.max(-20, Math.min(20, instantVx * 0.9)));
    setWheelAngle((prev) => prev + Math.hypot(instantVx, instantVy) * 1.4);

    meta.lastX = e.clientX;
    meta.lastY = e.clientY;
    meta.lastTime = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const meta = dragMetaRef.current;
    if (!meta.active || meta.pointerId !== e.pointerId) return;

    meta.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }

    if (!meta.moved) {
      // Treat as a click!
      triggerHappy(650);
      setWheelAngle((prev) => prev + 180);
      if (!bubbleOpen) {
        setBubbleOpen(true);
        if (messageIdx === -1) setMode('greeting');
      } else {
        setMode('trivia');
        setMessageIdx((prev) => (prev + 1) % MASCOT_TRIVIA.length);
      }
      return;
    }

    // Clamp max fling speed so it stays playful & controllable
    const maxSpeed = 42;
    const speed = Math.hypot(velRef.current.x, velRef.current.y);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      velRef.current.x *= scale;
      velRef.current.y *= scale;
    }

    // If user flung it, kick off bouncing physics!
    const timeSinceMove = performance.now() - meta.lastTime;
    if (speed > 2.2 && timeSinceMove < 90) {
      triggerHappy(450);
      startPhysics();
    } else {
      setTilt(0);
    }
  };

  const handleResetPosition = () => {
    stopPhysics();
    velRef.current = { x: 0, y: 0 };
    const home = getDefaultPos();
    posRef.current = home;
    setPos(home);
    setFacingLeft(false);
    setTilt(0);
    triggerHappy(450);
  };

  const handleTrivia = () => {
    triggerHappy(600);
    setWheelAngle((prev) => prev + 180);
    setMode('trivia');
    setMessageIdx((prev) => (prev + 1) % MASCOT_TRIVIA.length);
  };

  const handlePickPaper = () => {
    triggerHappy(600);
    setWheelAngle((prev) => prev + 180);
    setMode('paper');
    setMessageIdx((prev) => (prev + 1) % MASCOT_PAPER_PICKS.length);
    document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJumpSherry = () => {
    triggerHappy(600);
    setWheelAngle((prev) => prev + 180);
    setMode('trivia');
    setMessageIdx(0);
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentMessage =
    mode === 'greeting'
      ? t(MASCOT_META.greeting)
      : mode === 'paper'
        ? t(MASCOT_PAPER_PICKS[Math.max(0, messageIdx) % MASCOT_PAPER_PICKS.length])
        : t(MASCOT_TRIVIA[Math.max(0, messageIdx) % MASCOT_TRIVIA.length]);

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          type="button"
          onClick={() => {
            setMinimized(false);
            setBubbleOpen(true);
            triggerHappy(600);
          }}
          className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-stone-300 shadow-sm hover:border-academic-600 hover:shadow-md transition-all text-xs font-medium text-slate-700"
          title={lang === 'zh' ? '喚醒騎車的鵜鶘' : 'Show Pelican Guide'}
          aria-label="Show Pelican Guide"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:bg-academic-600 transition-colors" />
          <Sparkles className="w-3.5 h-3.5 text-academic-800" />
          <span className="hidden sm:inline">{lang === 'zh' ? '騎車鵜鶘' : 'Pelican'}</span>
        </button>
      </div>
    );
  }

  // Smart speech bubble placement relative to current pelican position
  const isNearTop = typeof window !== 'undefined' && pos.y < window.innerHeight * 0.42;
  const isNearLeft = typeof window !== 'undefined' && pos.x < window.innerWidth * 0.45;

  return (
    <div
      className="fixed top-0 left-0 z-50 pointer-events-none"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        willChange: 'transform',
      }}
    >
      {/* Smart-Positioned Speech Bubble */}
      {bubbleOpen && (
        <div
          className={`pointer-events-auto absolute w-72 sm:w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 text-left ${
            isNearTop ? 'top-[102px]' : 'bottom-[102px]'
          } ${isNearLeft ? 'left-0' : 'right-0'}`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-100">
            <span className="text-xs font-semibold text-academic-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t(MASCOT_META.name)}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleResetPosition}
                className="p-1 rounded text-slate-400 hover:text-academic-800 hover:bg-stone-100 transition-colors"
                title={lang === 'zh' ? '回到右下角' : 'Reset position'}
                aria-label="Reset mascot position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setBubbleOpen(false);
                  setMinimized(true);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
                title={lang === 'zh' ? '縮小隱藏' : 'Minimize'}
                aria-label="Minimize mascot"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setBubbleOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
                title={lang === 'zh' ? '關閉對話' : 'Close bubble'}
                aria-label="Close speech bubble"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">{currentMessage}</p>

          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-stone-100">
            <button
              type="button"
              onClick={handlePickPaper}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-academic-50 text-academic-900 border border-academic-100 hover:bg-academic-100 text-[11px] font-medium transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>{lang === 'zh' ? '推薦論文' : 'Pick a Paper'}</span>
            </button>
            <button
              type="button"
              onClick={handleJumpSherry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-slate-700 border border-stone-200 hover:bg-stone-200/70 text-[11px] font-medium transition-colors"
            >
              <Cpu className="w-3 h-3" />
              <span>{lang === 'zh' ? '看 Sherry' : 'Sherry'}</span>
            </button>
            <button
              type="button"
              onClick={handleTrivia}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 hover:bg-amber-100/80 text-[11px] font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'zh' ? '下一個彩蛋' : 'Next Fact'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Draggable & Flingable Pelican Avatar */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          touchAction: 'none',
          transform: `rotate(${tilt}deg) scale(${isDragging ? 1.07 : isHappy ? 1.05 : 1})`,
          transition: isDragging ? 'none' : 'transform 180ms ease-out, box-shadow 180ms ease-out',
        }}
        className={`pointer-events-auto relative rounded-full bg-white/95 border border-stone-200/90 flex items-center justify-center select-none focus:outline-none ${
          isDragging
            ? 'cursor-grabbing shadow-xl border-academic-600/60'
            : 'cursor-grab shadow-md hover:shadow-lg hover:border-academic-600/50'
        }`}
        title={lang === 'zh' ? '點擊對話，或按住拖曳／甩出去彈跳！' : 'Click to chat, or drag & fling to bounce!'}
        aria-label="Draggable Pelican on a Bicycle Mascot"
      >
        <svg
          viewBox="0 0 140 130"
          className="w-[84px] h-[80px] overflow-visible select-none pointer-events-none"
          style={{
            transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
            transition: 'transform 160ms ease-out',
          }}
          aria-hidden="true"
        >
          {/* Subtle ground shadow */}
          <ellipse cx="70" cy="113" rx="46" ry="4" fill="#E7E5E4" />

          {/* Rear Wheel */}
          <g
            style={{
              transformOrigin: '40px 93px',
              transform: `rotate(${wheelAngle}deg)`,
            }}
          >
            <circle cx="40" cy="93" r="18" fill="none" stroke="#1E293B" strokeWidth="3.5" />
            <circle cx="40" cy="93" r="15" fill="none" stroke="#94A3B8" strokeWidth="1" />
            <line x1="40" y1="77" x2="40" y2="109" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="24" y1="93" x2="56" y2="93" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="29" y1="82" x2="51" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="51" y1="82" x2="29" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="40" cy="93" r="3" fill="#1E3A8A" />
          </g>

          {/* Front Wheel */}
          <g
            style={{
              transformOrigin: '100px 93px',
              transform: `rotate(${wheelAngle}deg)`,
            }}
          >
            <circle cx="100" cy="93" r="18" fill="none" stroke="#1E293B" strokeWidth="3.5" />
            <circle cx="100" cy="93" r="15" fill="none" stroke="#94A3B8" strokeWidth="1" />
            <line x1="100" y1="77" x2="100" y2="109" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="84" y1="93" x2="116" y2="93" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="89" y1="82" x2="111" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="111" y1="82" x2="89" y2="104" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="100" cy="93" r="3" fill="#1E3A8A" />
          </g>

          {/* Bicycle Frame */}
          <g stroke="#1E3A8A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M40 93 L64 93 L86 67 L55 67 Z" />
            <line x1="64" y1="93" x2="53" y2="61" />
            <line x1="100" y1="93" x2="84" y2="57" />
            <path d="M84 57 L93 53 Q98 51 96 57" stroke="#1E293B" strokeWidth="3" />
          </g>
          <path d="M45 61 L61 61" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="64" cy="93" r="4.5" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2.2" />
          <line x1="64" y1="93" x2="72" y2="99" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="68" y1="99" x2="76" y2="99" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />

          {/* Pelican Leg */}
          <path
            d="M57 69 L63 85 L71 97"
            fill="none"
            stroke="#EA580C"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M68 97 L76 97 L74 99 Z"
            fill="#F97316"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Pelican Body */}
          <path
            d="M36 56 L26 52 L31 61 L25 63 L38 66 Z"
            fill="#F1F5F9"
            stroke="#1E293B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M36 58 C36 45, 56 44, 67 51 C75 56, 74 71, 61 73 C46 75, 36 69, 36 58 Z"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M47 56 C55 51, 74 52, 87 55 C83 62, 68 67, 52 65 C46 64, 44 59, 47 56 Z"
            fill="#DBEAFE"
            stroke="#1E293B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Pelican Neck & Head */}
          <path
            d="M62 52 C64 38, 63 26, 73 24 C83 22, 89 29, 86 38 C83 45, 76 48, 72 54"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Iconic Beak & Pouch */}
          <path
            d={
              isHappy || isDragging
                ? 'M84 34 L123 39 C117 51, 95 53, 83 42 Z'
                : 'M85 33 L124 35 C118 46, 96 47, 83 39 Z'
            }
            fill="#FBBF24"
            stroke="#1E293B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M84 29 C98 28, 114 30, 126 33 C124 36, 102 35, 84 34 Z"
            fill="#F59E0B"
            stroke="#1E293B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Eye */}
          {isHappy ? (
            <path
              d="M73 32 Q77 27 81 32"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ) : isBlinking ? (
            <line
              x1="73"
              y1="31"
              x2="81"
              y2="31"
              stroke="#1E293B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <g>
              <circle cx="77" cy="31" r="4.2" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
              <circle cx={77.5 + eyeOffset.x} cy={31 + eyeOffset.y} r="2.1" fill="#0F172A" />
              <circle cx={76.8 + eyeOffset.x * 0.5} cy={30 + eyeOffset.y * 0.5} r="0.9" fill="#FFFFFF" />
            </g>
          )}

          {/* Tiny Ph.D. Cap */}
          <g transform="rotate(-14 74 20)">
            <polygon
              points="74,11 91,17 74,23 57,17"
              fill="#1E3A8A"
              stroke="#1E293B"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M65 20 L83 20 L81 24 L67 24 Z"
              fill="#1E3A8A"
              stroke="#1E293B"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M74 17 Q85 19 88 26"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="88.5" cy="27" r="2.2" fill="#FBBF24" stroke="#1E293B" strokeWidth="1.2" />
          </g>
        </svg>

        {/* Subtle notification dot when bubble is closed */}
        {!bubbleOpen && !isDragging && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
        )}
      </button>
    </div>
  );
};
