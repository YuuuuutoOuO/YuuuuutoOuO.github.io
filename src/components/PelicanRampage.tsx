import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PelicanRampageProps {
  active: boolean;
  onFinish: () => void;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  label: string;
}

const TAUNTS_ZH = [
  'rm -rf / 啟動！通通吃掉！',
  '這張卡片看起來很好吃 🍽️',
  '撞飛！這不是 Bug 是 Feature！',
  '正在清除 /home/guest ...',
  '嘎嘎嘎！資料庫也要拆了！',
];

const TAUNTS_EN = [
  'rm -rf / ENGAGED! NOM NOM!',
  'This card looks delicious 🍽️',
  'YEET! Deleting DOM nodes!',
  'Purging /home/guest ...',
  'HONK! Nothing can stop the pelican!',
];

const BURST_LABELS = ['💥 rm -rf', '🔥 DELETED', '0xDEAD', '⚡ NOM!', '💨 YEET'];

export const PelicanRampage: React.FC<PelicanRampageProps> = ({ active, onFinish }) => {
  const { lang } = useLanguage();
  const [pelicanPos, setPelicanPos] = useState({ x: -120, y: 120 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [phase, setPhase] = useState<'rampage' | 'done'>('rampage');
  const [countdown, setCountdown] = useState(3);
  const [taunt, setTaunt] = useState('');
  const [bursts, setBursts] = useState<Burst[]>([]);

  const modifiedElsRef = useRef<
    { el: HTMLElement; transition: string; transform: string; opacity: string; pointerEvents: string }[]
  >([]);
  const savedScrollYRef = useRef<number>(0);

  const restoreAll = () => {
    for (const item of modifiedElsRef.current) {
      item.el.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease';
      item.el.style.transform = item.transform;
      item.el.style.opacity = item.opacity;
      item.el.style.pointerEvents = item.pointerEvents;
    }
    const snapshot = [...modifiedElsRef.current];
    modifiedElsRef.current = [];
    window.scrollTo({ top: savedScrollYRef.current, behavior: 'smooth' });
    window.setTimeout(() => {
      for (const item of snapshot) {
        item.el.style.transition = item.transition;
      }
    }, 600);
    onFinish();
  };

  // ESC to restore immediately
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        restoreAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  // Main rampage sequence
  useEffect(() => {
    if (!active) return;

    savedScrollYRef.current = window.scrollY;
    const taunts = lang === 'zh' ? TAUNTS_ZH : TAUNTS_EN;
    setPhase('rampage');
    setDestroyedCount(0);
    setCountdown(3);
    setBursts([]);
    setTaunt(taunts[0]);

    // Collect EVERY top-level block in document order (top to bottom) so 100% of the site gets eaten
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('header, main > section, footer'),
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    setTotalTargets(targets.length);

    modifiedElsRef.current = targets.map((el) => ({
      el,
      transition: el.style.transition,
      transform: el.style.transform,
      opacity: el.style.opacity,
      pointerEvents: el.style.pointerEvents,
    }));

    let cancelled = false;
    let step = 0;
    let timerId: number | null = null;

    const attackNext = () => {
      if (cancelled) return;
      if (step >= targets.length) {
        setPhase('done');
        return;
      }

      const target = targets[step];
      // Smoothly scroll the page to follow the pelican downward
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Wait briefly for smooth scroll to settle, then zig-zag wildly onto the target
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        const rect = target.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Chaotic zig-zag X: alternate wildly between left and right sides of the screen
        const sideBase = step % 2 === 0 ? vw * 0.12 : vw * 0.62;
        const randX = sideBase + Math.random() * (vw * 0.24);
        const targetX = Math.max(24, Math.min(vw - 140, randX));

        // Add playful vertical jitter around the target's visible band
        const baseY = rect.top + Math.min(rect.height * 0.35, 180);
        const jitterY = (Math.random() - 0.5) * 140;
        const targetY = Math.max(70, Math.min(vh - 150, baseY + jitterY));

        setPelicanPos((prev) => {
          setFacingLeft(targetX < prev.x);
          return { x: targetX, y: targetY };
        });
        setTaunt(taunts[step % taunts.length]);

        // After pelican arrives (~280ms), YEET the entire section
        timerId = window.setTimeout(() => {
          if (cancelled) return;
          const dirX = (step % 2 === 0 ? 1 : -1) * (320 + Math.random() * 260);
          const dirY = 180 + Math.random() * 240;
          const rot = (step % 2 === 0 ? 1 : -1) * (18 + Math.random() * 32);

          target.style.transition = 'transform 0.55s cubic-bezier(0.55, 0.06, 0.68, 0.19), opacity 0.45s ease';
          target.style.transform = `translate(${dirX}px, ${dirY}px) rotate(${rot}deg) scale(0.5)`;
          target.style.opacity = '0';
          target.style.pointerEvents = 'none';

          const burstId = Date.now() + step;
          setBursts((prev) => [
            ...prev.slice(-6),
            {
              id: burstId,
              x: targetX + 45,
              y: targetY + 35,
              label: BURST_LABELS[step % BURST_LABELS.length],
            },
          ]);

          setDestroyedCount(step + 1);
          step += 1;
          timerId = window.setTimeout(attackNext, 320);
        }, 280);
      }, 280);
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
    timerId = window.setTimeout(attackNext, 260);

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [active, lang]);

  // Auto-restore countdown after destruction finishes
  useEffect(() => {
    if (!active || phase !== 'done') return;
    if (countdown <= 0) {
      restoreAll();
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [active, phase, countdown]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none select-none overflow-hidden">
      {/* Top HUD Bar */}
      <div className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-rose-950/95 border border-rose-500/60 text-rose-100 shadow-2xl font-mono text-xs backdrop-blur-md">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-400 animate-ping" />
        <span>
          {lang === 'zh'
            ? `鵜鶘暴走中 (rm -rf /) · 已摧毀 ${destroyedCount}/${totalTargets}`
            : `PELICAN RAMPAGE (rm -rf /) · Destroyed ${destroyedCount}/${totalTargets}`}
        </span>
        <button
          type="button"
          onClick={restoreAll}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>ESC</span>
        </button>
      </div>

      {/* Burst Particles */}
      {bursts.map((b) => (
        <div
          key={b.id}
          style={{ left: b.x, top: b.y }}
          className="fixed font-mono font-bold text-sm text-amber-300 drop-shadow-[0_2px_8px_rgba(244,63,94,0.9)] animate-bounce"
        >
          {b.label}
        </div>
      ))}

      {/* Rampage Pelican */}
      {phase === 'rampage' && (
        <div
          style={{
            transform: `translate(${pelicanPos.x}px, ${pelicanPos.y}px)`,
            transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="fixed top-0 left-0 will-change-transform"
        >
          {/* Speech Bubble */}
          <div className="mb-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-rose-400/60 text-rose-200 font-mono text-[11px] whitespace-nowrap shadow-lg">
            {taunt}
          </div>

          {/* Pelican SVG (Laser-Eyes Rampage Mode!) */}
          <svg
            width="110"
            height="110"
            viewBox="0 0 120 120"
            className={`drop-shadow-[0_8px_18px_rgba(244,63,94,0.45)] ${facingLeft ? '-scale-x-100' : ''}`}
          >
            {/* Wheels */}
            <circle cx="38" cy="96" r="14" fill="none" stroke="#f43f5e" strokeWidth="4" />
            <circle cx="84" cy="96" r="14" fill="none" stroke="#f43f5e" strokeWidth="4" />
            <path d="M38 96 L58 78 L84 96 M58 78 L64 62" stroke="#94a3b8" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Pelican Body */}
            <ellipse cx="56" cy="64" rx="22" ry="16" fill="#f8fafc" stroke="#1e293b" strokeWidth="2.5" />
            {/* Wing */}
            <path d="M44 62 Q58 52 70 64 Q56 72 44 62 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
            {/* Neck & Head */}
            <path d="M68 56 Q74 34 72 28" stroke="#f8fafc" strokeWidth="14" strokeLinecap="round" fill="none" />
            <circle cx="72" cy="28" r="12" fill="#f8fafc" stroke="#1e293b" strokeWidth="2.5" />

            {/* Giant Beak + Pouch */}
            <path d="M82 24 L114 30 L82 36 Z" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
            <path d="M82 32 Q96 46 108 32" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />

            {/* Angry Glowing Laser Eye */}
            <circle cx="76" cy="26" r="3.5" fill="#ef4444" />
            <line x1="79" y1="26" x2="118" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeOpacity="0.85" />
            <line x1="74" y1="20" x2="81" y2="23" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Post-Destruction Recovery Overlay */}
      {phase === 'done' && (
        <div className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/50 bg-slate-900/95 p-6 text-center font-mono shadow-2xl space-y-3">
            <p className="text-2xl">🦢💥</p>
            <h3 className="text-base font-bold text-rose-400">
              {lang === 'zh' ? '網站已被鵜鶘吃光了！' : 'The Pelican ate your website!'}
            </h3>
            <p className="text-xs text-slate-300">
              {lang === 'zh'
                ? `正在從 ChuOS 快照自動復原中... (${countdown}s)`
                : `Auto-restoring from ChuOS snapshot... (${countdown}s)`}
            </p>
            <button
              type="button"
              onClick={restoreAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '立刻復原 (ESC)' : 'Restore Now (ESC)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
