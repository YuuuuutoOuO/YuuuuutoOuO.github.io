import React, { useEffect, useState } from 'react';
import { Power, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type SystemPowerMode = 'running' | 'shutdown' | 'reboot';

interface SystemPowerOverlayProps {
  mode: SystemPowerMode;
  onPowerOn: (reason: 'shutdown' | 'reboot') => void;
}

const SHUTDOWN_LOGS = [
  { tag: 'OK', text: 'Stopped sherry-agentd.service — Autonomous AI Companion Daemon.' },
  { tag: 'OK', text: 'Stopped selinux-gcb-auditor.service — Linux GCB & Compliance Monitor.' },
  { tag: 'OK', text: 'Closed user session guest@chuos.local (pts/0).' },
  { tag: 'OK', text: 'Unmounted /home/guest (portfoliofs, ro, nosuid, nodev).' },
  { tag: 'OK', text: 'Reached target System Power Off.' },
];

const REBOOT_LOGS = [
  { tag: 'OK', text: 'Stopping ChuOS MiniKernel services...' },
  { tag: 'OK', text: 'Flushing in-memory VFS sandbox & Hero DOM overrides...' },
  { tag: 'BOOT', text: 'Booting ChuOS MiniKernel v1.0.0-agent (vite@6 + react@18)...' },
  { tag: 'OK', text: 'Mounted /home/guest (portfoliofs) — SELinux=enforcing, GCB=100%.' },
];

export const SystemPowerOverlay: React.FC<SystemPowerOverlayProps> = ({ mode, onPowerOn }) => {
  const { lang } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(0);
  const [halted, setHalted] = useState(false);

  useEffect(() => {
    if (mode === 'running') {
      setVisibleCount(0);
      setHalted(false);
      return;
    }

    const logs = mode === 'shutdown' ? SHUTDOWN_LOGS : REBOOT_LOGS;
    setVisibleCount(0);
    setHalted(false);

    const timers: number[] = [];
    logs.forEach((_, idx) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleCount(idx + 1);
        }, (idx + 1) * 230),
      );
    });

    if (mode === 'shutdown') {
      timers.push(
        window.setTimeout(() => {
          setHalted(true);
        }, logs.length * 230 + 380),
      );
    } else {
      timers.push(
        window.setTimeout(() => {
          onPowerOn('reboot');
        }, logs.length * 230 + 420),
      );
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [mode, onPowerOn]);

  useEffect(() => {
    if (mode !== 'shutdown' || !halted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPowerOn('shutdown');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, halted, onPowerOn]);

  if (mode === 'running') return null;

  const logs = mode === 'shutdown' ? SHUTDOWN_LOGS : REBOOT_LOGS;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black text-slate-200 font-mono flex flex-col items-center justify-center p-6 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'shutdown' ? 'ChuOS System Power Off' : 'ChuOS System Reboot'}
    >
      {!halted ? (
        <div className="w-full max-w-2xl space-y-2 text-xs sm:text-sm">
          <div className="text-slate-500 mb-3 flex items-center gap-2">
            {mode === 'reboot' ? (
              <RotateCcw className="w-4 h-4 text-sky-400 animate-spin" />
            ) : (
              <Power className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {mode === 'reboot'
                ? 'ChuOS MiniKernel — Initiating System Reboot...'
                : 'ChuOS MiniKernel — Initiating System Power Off...'}
            </span>
          </div>
          {logs.slice(0, visibleCount).map((entry, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-slate-500">[</span>
              <span
                className={
                  entry.tag === 'BOOT'
                    ? 'text-sky-400 font-semibold px-1'
                    : 'text-emerald-400 font-semibold px-1.5'
                }
              >
                {entry.tag}
              </span>
              <span className="text-slate-500">]</span>{' '}
              <span className="text-slate-200">{entry.text}</span>
            </div>
          ))}
          <div className="pt-2 text-slate-600 animate-pulse">_</div>
        </div>
      ) : (
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              ChuOS MiniKernel v1.0.0-agent
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-100">
              System halted.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '系統已安全關機（僅模擬本機終端機狀態，未影響真實伺服器）。'
                : 'System powered off safely (local browser simulation only).'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPowerOn('shutdown')}
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-slate-900 hover:bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.18)] hover:shadow-[0_0_32px_rgba(16,185,129,0.35)] transition-all text-sm font-medium"
          >
            <Power className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{lang === 'zh' ? '按下電源鍵重新開機' : 'Power On ChuOS'}</span>
          </button>

          <p className="text-[11px] text-slate-600">
            {lang === 'zh' ? '提示：也可以直接按 Enter 或 Space 喚醒' : 'Tip: Press Enter or Space to boot back up'}
          </p>
        </div>
      )}
    </div>
  );
};
