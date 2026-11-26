import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Terminal as TerminalIcon, X, Maximize2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { buildVfs, formatDisplayPath, getHomeDir } from '../kernel/vfs';
import { executeCommand, getTabCompletion, type OutputTone, type TerminalLine } from '../kernel/shell';

interface MiniTerminalProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onTriggerRampage: () => void;
  onOpenStegoLab: () => void;
}

const QUICK_COMMANDS = ['help', 'neofetch', 'ls', 'tree', 'grep Nessus', 'theme', 'sudo hire-me'];

const TONE_CLASS: Record<OutputTone, string> = {
  normal: 'text-slate-200',
  muted: 'text-slate-400',
  accent: 'text-sky-400',
  success: 'text-emerald-400',
  warning: 'text-amber-300',
  error: 'text-rose-400',
};

export const MiniTerminal: React.FC<MiniTerminalProps> = ({
  open,
  onClose,
  onOpen,
  onTriggerRampage,
  onOpenStegoLab,
}) => {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [bootTimeMs] = useState(() => Date.now());
  const [cwd, setCwd] = useState<string>(getHomeDir);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [minimized, setMinimized] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState<number | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: 'boot-1',
      text: 'ChuOS MiniKernel v1.0.0-agent — Interactive Portfolio Shell',
      tone: 'accent',
    },
    {
      id: 'boot-2',
      text: 'Type "help", "ls", "grep <keyword>", or click a quick command below.',
      tone: 'muted',
    },
  ]);

  // Draggable offset (desktop)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const vfsRoot = useMemo(() => buildVfs(lang, bootTimeMs), [lang, bootTimeMs]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, minimized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, panicCountdown]);

  // Global Ctrl+K / Cmd+K and Ctrl+` shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      const isCtrlBacktick = (e.ctrlKey || e.metaKey) && (e.code === 'Backquote' || e.key === '`');
      if (isCtrlK || isCtrlBacktick) {
        e.preventDefault();
        if (open && !minimized) {
          onClose();
        } else {
          setMinimized(false);
          onOpen();
        }
      } else if (e.key === 'Escape' && open && !minimized) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, minimized, onClose, onOpen]);

  // Kernel panic auto-reboot countdown
  useEffect(() => {
    if (panicCountdown === null) return;
    if (panicCountdown <= 0) {
      setPanicCountdown(null);
      setCwd(getHomeDir());
      setLines([
        {
          id: `reboot-${Date.now()}`,
          text: '[REBOOT] ChuOS MiniKernel recovered from panic. Nice try! :)',
          tone: 'success',
        },
      ]);
      return;
    }
    const timer = window.setTimeout(() => setPanicCountdown((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => window.clearTimeout(timer);
  }, [panicCountdown]);

  // Drag handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onMouseUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const promptLine: TerminalLine = {
      id: `cmd-${Date.now()}-${Math.random()}`,
      text: `guest@chuos:${formatDisplayPath(cwd)}$ ${trimmed}`,
      tone: 'success',
    };

    const result = executeCommand(trimmed, {
      cwd,
      root: vfsRoot,
      lang,
      theme,
      bootTimeMs,
      setCwd,
      setTheme,
      toggleTheme,
      toggleLang,
      scrollToSection,
      triggerPanic: () => {
        onClose();
        onTriggerRampage();
      },
      openStegoLab: () => {
        onClose();
        onOpenStegoLab();
      },
      closeTerminal: onClose,
    });

    setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    if (result.clear) {
      setLines([]);
    } else {
      setLines((prev) => [...prev.slice(-160), promptLine, ...result.lines]);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] ?? '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] ?? '');
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const completed = getTabCompletion(input, cwd, vfsRoot);
      if (completed) setInput(completed);
    }
  };

  if (!open) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 text-slate-100 border border-slate-700 shadow-lg hover:bg-slate-800 transition-colors font-mono text-xs"
        aria-label="Restore Mini Terminal"
      >
        <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>ChuOS Shell</span>
        <Maximize2 className="w-3 h-3 text-slate-400" />
      </button>
    );
  }

  return (
    <div
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[560px] z-50 rounded-xl overflow-hidden border border-slate-700/90 bg-slate-950/95 backdrop-blur-md shadow-2xl text-slate-100 font-mono text-xs flex flex-col"
      role="dialog"
      aria-label="ChuOS MiniKernel Terminal"
    >
      {/* Title Bar (Draggable on desktop) */}
      <div
        onMouseDown={(e) => {
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: offset.x,
            origY: offset.y,
          };
        }}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
          <span className="ml-1.5 text-[11px] text-slate-300 font-medium">
            guest@chuos:{formatDisplayPath(cwd)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Minimize terminal"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => runCommand(cmd)}
            className="shrink-0 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Output Area */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="relative h-72 sm:h-80 overflow-y-auto px-3.5 py-3 space-y-1 leading-relaxed"
      >
        {panicCountdown !== null ? (
          <div className="h-full flex flex-col justify-center items-start bg-rose-950/60 border border-rose-500/50 rounded-lg p-4 text-rose-200 space-y-2">
            <p className="font-bold text-rose-400">*** KERNEL PANIC - NOT SYNCING ***</p>
            <p>VFS: Attempted to kill init / purge portfolio root filesystem.</p>
            <p className="text-rose-300/90">
              Sherry-Agent Guard intercepted destructive syscall.
            </p>
            <p className="text-amber-300 pt-1">
              Auto-rebooting ChuOS MiniKernel in {panicCountdown}s...
            </p>
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="flex items-start justify-between gap-2 whitespace-pre-wrap break-words">
              <span className={TONE_CLASS[line.tone ?? 'normal']}>{line.text}</span>
              {line.action && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (line.action?.sectionId) {
                      scrollToSection(line.action.sectionId);
                    } else if (line.action?.command) {
                      runCommand(line.action.command);
                    }
                  }}
                  className="shrink-0 px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 text-[10px] border border-sky-400/30 transition-colors"
                >
                  {line.action.label}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Prompt Input */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800">
        <span className="text-emerald-400 shrink-0 select-none">
          guest@chuos:{formatDisplayPath(cwd)}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={panicCountdown !== null}
          placeholder={lang === 'zh' ? '輸入指令或 grep 關鍵字...' : 'Type a command or grep <keyword>...'}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none text-xs"
        />
      </div>
    </div>
  );
};
