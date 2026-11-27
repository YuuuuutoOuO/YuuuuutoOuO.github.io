import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  buildVfs,
  formatDisplayPath,
  formatOctalMode,
  getHomeDir,
  resolveNode,
  type VfsNode,
} from '../kernel/vfs';
import { executeCommand, getTabCompletion, type OutputTone, type TerminalLine } from '../kernel/shell';
import type { HeroVimOverrides } from './Hero';

interface MiniTerminalProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onTriggerRampage: () => void;
  onOpenStegoLab: () => void;
  onApplyHeroOverrides: (overrides: HeroVimOverrides) => void;
  onResetHeroOverrides: () => void;
  onUpdateScratchpad: (text: string | null) => void;
}

type ResizeEdge = 'right' | 'top' | 'top-right';
type VimMode = 'NORMAL' | 'INSERT' | 'COMMAND';

interface VimSession {
  absPath: string;
  content: string;
  savedContent: string;
  readonly: boolean;
  octalMode: string;
  mode: VimMode;
  commandText: string;
  statusMsg: string;
}

const SITE_CONF_PATH = '/home/guest/site.conf';
const SCRATCHPAD_PATH = '/home/guest/.scratchpad';
const VIM_DOM_FIELD_MAP: Record<string, string> = {
  NAME: 'name',
  HEADLINE: 'headline',
  AFFILIATION: 'affiliation',
  BIO: 'bio',
  NOTICE: 'notice',
};

const QUICK_COMMANDS = ['help', 'ls -la', 'vim site.conf', 'stat about.md', 'neofetch', 'grep Trivy', 'sudo hire-me'];
const MIN_WIDTH = 420;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 660;
const DEFAULT_HEIGHT = 440;

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
  onApplyHeroOverrides,
  onResetHeroOverrides,
  onUpdateScratchpad,
}) => {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [bootTimeMs] = useState(() => Date.now());
  const [cwd, setCwd] = useState<string>(getHomeDir);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true,
  );
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [panicCountdown, setPanicCountdown] = useState<number | null>(null);
  const [vfsOverrides, setVfsOverrides] = useState<Record<string, string>>({});
  const [vimSession, setVimSession] = useState<VimSession | null>(null);
  const vimTextareaRef = useRef<HTMLTextAreaElement>(null);
  const vimCmdRef = useRef<HTMLInputElement>(null);
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    {
      id: 'boot-1',
      text: 'ChuOS MiniKernel v1.0.0-agent — Interactive Portfolio Shell',
      tone: 'accent',
    },
    {
      id: 'boot-2',
      text: 'Type "help", "ls -la", "vim site.conf" (fun F12 sandbox), or drag edges to resize.',
      tone: 'muted',
    },
  ]);

  // Draggable offset & resizable handles (desktop)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const vfsRoot = useMemo(() => {
    const root = buildVfs(lang, bootTimeMs);
    for (const [absPath, content] of Object.entries(vfsOverrides)) {
      const node = resolveNode(root, absPath);
      if (node && node.type === 'file') {
        node.content = content;
      }
    }
    return root;
  }, [lang, bootTimeMs, vfsOverrides]);

  useEffect(() => {
    if (open && !minimized && !vimSession) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, minimized, vimSession]);

  useEffect(() => {
    if (!vimSession) return;
    if (vimSession.mode === 'COMMAND') {
      setTimeout(() => vimCmdRef.current?.focus(), 10);
    } else {
      setTimeout(() => vimTextareaRef.current?.focus(), 10);
    }
  }, [vimSession?.mode, Boolean(vimSession)]);

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
        if (vimSession) {
          e.preventDefault();
          setVimSession((prev) =>
            prev ? { ...prev, mode: 'NORMAL', commandText: '', statusMsg: '-- NORMAL --' } : null,
          );
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, minimized, vimSession, onClose, onOpen]);

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

  // Track viewport size & clamp terminal dimensions
  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 640);
      setSize((prev) => ({
        width: Math.min(prev.width, Math.max(MIN_WIDTH, window.innerWidth - 32)),
        height: Math.min(prev.height, Math.max(MIN_HEIGHT, window.innerHeight - 32)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Drag & resize handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
        return;
      }
      if (resizeRef.current) {
        const { edge, startX, startY, origW, origH } = resizeRef.current;
        const maxW = Math.max(MIN_WIDTH, window.innerWidth - 32);
        const maxH = Math.max(MIN_HEIGHT, window.innerHeight - 32);
        const nextW =
          edge === 'right' || edge === 'top-right'
            ? Math.min(maxW, Math.max(MIN_WIDTH, origW + (e.clientX - startX)))
            : origW;
        const nextH =
          edge === 'top' || edge === 'top-right'
            ? Math.min(maxH, Math.max(MIN_HEIGHT, origH - (e.clientY - startY)))
            : origH;
        setSize({ width: nextW, height: nextH });
      }
    };
    const onMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
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

  const applySiteConfToDom = (content: string): number => {
    const parsed: HeroVimOverrides = {};
    let updatedCount = 0;
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const normalized = line.replace('＝', '=');
      const eqIdx = normalized.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = normalized.slice(0, eqIdx).trim().toUpperCase();
      const val = normalized.slice(eqIdx + 1).trim();
      const field = VIM_DOM_FIELD_MAP[key] as keyof HeroVimOverrides | undefined;
      if (!field || !val) continue;
      parsed[field] = val;
      updatedCount += 1;
    }
    if (updatedCount > 0) {
      onApplyHeroOverrides(parsed);
    }
    return updatedCount;
  };

  const resetSiteConfDom = () => {
    onResetHeroOverrides();
    setVfsOverrides((prev) => {
      const next = { ...prev };
      delete next[SITE_CONF_PATH];
      return next;
    });
  };

  const openVimEditor = (absPath: string, node: VfsNode) => {
    const initial = node.content ?? '';
    setVimSession({
      absPath,
      content: initial,
      savedContent: initial,
      readonly: Boolean(node.readonly),
      octalMode: formatOctalMode(node),
      mode: 'NORMAL',
      commandText: '',
      statusMsg: node.readonly
        ? `"${formatDisplayPath(absPath)}" [readonly]`
        : `"${formatDisplayPath(absPath)}" ${initial.split('\n').length}L — press 'i' to edit, ':wq' to apply`,
    });
  };

  const executeVimCommand = (rawCmd: string) => {
    if (!vimSession) return;
    const cmd = rawCmd.trim().replace(/^:/, '');
    const isDirty = vimSession.content !== vimSession.savedContent;

    if (cmd === 'q!') {
      setVimSession(null);
      setLines((prev) => [
        ...prev.slice(-160),
        { id: `vim-q-${Date.now()}`, text: `[vim] Discarded changes to ${formatDisplayPath(vimSession.absPath)}.`, tone: 'muted' },
      ]);
      return;
    }

    if (cmd === 'q') {
      if (isDirty) {
        setVimSession((prev) =>
          prev
            ? { ...prev, mode: 'NORMAL', commandText: '', statusMsg: 'E37: No write since last change (add ! to override)' }
            : null,
        );
        return;
      }
      setVimSession(null);
      return;
    }

    if (cmd === 'reset') {
      if (vimSession.absPath === SITE_CONF_PATH) {
        resetSiteConfDom();
        const freshRoot = buildVfs(lang, bootTimeMs);
        const freshContent = resolveNode(freshRoot, SITE_CONF_PATH)?.content ?? '';
        setVimSession((prev) =>
          prev
            ? {
                ...prev,
                content: freshContent,
                savedContent: freshContent,
                mode: 'NORMAL',
                commandText: '',
                statusMsg: 'Restored original page DOM & site.conf.',
              }
            : null,
        );
        return;
      }
      if (vimSession.absPath === SCRATCHPAD_PATH) {
        onUpdateScratchpad(null);
        setVfsOverrides((prev) => {
          const next = { ...prev };
          delete next[SCRATCHPAD_PATH];
          return next;
        });
        const freshRoot = buildVfs(lang, bootTimeMs);
        const freshContent = resolveNode(freshRoot, SCRATCHPAD_PATH)?.content ?? '';
        setVimSession((prev) =>
          prev
            ? {
                ...prev,
                content: freshContent,
                savedContent: freshContent,
                mode: 'NORMAL',
                commandText: '',
                statusMsg: 'Cleared scratchpad wall & restored default .scratchpad.',
              }
            : null,
        );
        return;
      }
      setVimSession((prev) =>
        prev ? { ...prev, mode: 'NORMAL', commandText: '', statusMsg: 'Nothing to reset on this file.' } : null,
      );
      return;
    }

    if (cmd === 'w' || cmd === 'wq' || cmd === 'x' || cmd === 'wq!' || cmd === 'w!') {
      if (vimSession.readonly) {
        setVimSession((prev) =>
          prev
            ? {
                ...prev,
                mode: 'NORMAL',
                commandText: '',
                statusMsg:
                  lang === 'zh'
                    ? "E45: 此檔為 root 擁有 (0644 唯讀)，無法寫入；想改首頁畫面請開 vim ~/site.conf"
                    : "E45: 'readonly' option is set (root-owned 0644); run 'vim ~/site.conf' to edit live page",
              }
            : null,
        );
        return;
      }

      const nextContent = vimSession.content;
      setVfsOverrides((prev) => ({ ...prev, [vimSession.absPath]: nextContent }));

      let domSummary = '';
      if (vimSession.absPath === SITE_CONF_PATH) {
        const changed = applySiteConfToDom(nextContent);
        domSummary =
          lang === 'zh'
            ? `已套用 ${changed} 項首頁欄位（僅限本機瀏覽器預覽，如同 F12，重整即還原）`
            : `Applied ${changed} live Hero field(s) (local browser preview only, like F12; resets on reload)`;
        if (changed > 0) {
          setMaximized(false);
          scrollToSection('about');
        }
      } else if (vimSession.absPath === SCRATCHPAD_PATH) {
        const nonCommentLines = nextContent
          .split('\n')
          .filter((l) => !l.trim().startsWith('#'))
          .join('\n')
          .trim();
        onUpdateScratchpad(nonCommentLines || nextContent.trim());
        domSummary =
          lang === 'zh'
            ? '🕵️ 已將 ~/.scratchpad (0666) 內容即時同步到頁尾彩蛋塗鴉區！（僅本機預覽，重整即還原）'
            : '🕵️ Synced ~/.scratchpad (0666) to the live Footer easter-egg wall! (Local only; resets on reload)';
        setMaximized(false);
        setTimeout(() => scrollToSection('scratchpad-wall'), 40);
      } else {
        domSummary =
          lang === 'zh'
            ? `[vim] 已寫入記憶體 VFS：${formatDisplayPath(vimSession.absPath)}（若要即時改首頁畫面請執行 vim ~/site.conf）`
            : `[vim] Wrote in-memory VFS: ${formatDisplayPath(vimSession.absPath)} (run "vim ~/site.conf" to edit live Hero DOM)`;
      }

      if (cmd === 'w' || cmd === 'w!') {
        setVimSession((prev) =>
          prev
            ? {
                ...prev,
                savedContent: nextContent,
                mode: 'NORMAL',
                commandText: '',
                statusMsg: domSummary || `"${formatDisplayPath(prev.absPath)}" written (session memory only)`,
              }
            : null,
        );
        return;
      }

      setVimSession(null);
      setLines((prev) => [
        ...prev.slice(-160),
        {
          id: `vim-w-${Date.now()}`,
          text:
            domSummary ||
            `[vim] Wrote ${formatDisplayPath(vimSession.absPath)} (session-only memory; resets on reload).`,
          tone: 'success',
          action:
            vimSession.absPath === SITE_CONF_PATH
              ? { label: 'goto #about', sectionId: 'about' }
              : vimSession.absPath === SCRATCHPAD_PATH
                ? { label: 'goto #scratchpad-wall', sectionId: 'scratchpad-wall' }
                : undefined,
        },
      ]);
      return;
    }

    setVimSession((prev) =>
      prev
        ? { ...prev, mode: 'NORMAL', commandText: '', statusMsg: `E492: Not an editor command: ${cmd}` }
        : null,
    );
  };

  const runCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) {
      setLines((prev) => [
        ...prev.slice(-160),
        {
          id: `cmd-${Date.now()}-${Math.random()}`,
          text: `guest@chuos:${formatDisplayPath(cwd)}$ `,
          tone: 'success',
        },
      ]);
      setHistoryIdx(-1);
      setInput('');
      return;
    }

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
      openVim: openVimEditor,
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

  const startResize = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (maximized) return;
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      origW: size.width,
      origH: size.height,
    };
  };

  const windowStyle: React.CSSProperties | undefined = maximized
    ? undefined
    : isDesktop
      ? {
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }
      : { height: '70vh' };

  return (
    <div
      style={windowStyle}
      className={`fixed z-50 rounded-xl overflow-hidden border border-slate-700/90 bg-slate-950/95 backdrop-blur-md shadow-2xl text-slate-100 font-mono text-xs flex flex-col ${
        maximized ? 'inset-3 sm:inset-6' : 'bottom-4 left-4 right-4 sm:right-auto'
      }`}
      role="dialog"
      aria-label="ChuOS MiniKernel Terminal"
    >
      {/* Desktop Resize Handles (Top, Right, Top-Right Corner) */}
      {!maximized && isDesktop && (
        <>
          <div
            onMouseDown={startResize('top')}
            className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-20"
            title={lang === 'zh' ? '上下拖曳調整高度' : 'Drag to resize height'}
          />
          <div
            onMouseDown={startResize('right')}
            className="absolute top-3 right-0 bottom-3 w-1.5 cursor-ew-resize z-20"
            title={lang === 'zh' ? '左右拖曳調整寬度' : 'Drag to resize width'}
          />
          <div
            onMouseDown={startResize('top-right')}
            className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize z-30"
            title={lang === 'zh' ? '拖曳右上角同時調整寬高' : 'Drag corner to resize'}
          />
        </>
      )}

      {/* Title Bar (Draggable on desktop, double-click to maximize) */}
      <div
        onMouseDown={(e) => {
          if (maximized || !isDesktop) return;
          if ((e.target as HTMLElement).closest('button')) return;
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: offset.x,
            origY: offset.y,
          };
        }}
        onDoubleClick={() => setMaximized((prev) => !prev)}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 select-none ${
          maximized ? 'cursor-default' : 'cursor-move'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-2.5 h-2.5 rounded-full bg-rose-500/90 hover:bg-rose-400 transition-colors shrink-0"
            aria-label="Close terminal"
            title={lang === 'zh' ? '關閉' : 'Close'}
          />
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="w-2.5 h-2.5 rounded-full bg-amber-400/90 hover:bg-amber-300 transition-colors shrink-0"
            aria-label="Minimize terminal"
            title={lang === 'zh' ? '縮小' : 'Minimize'}
          />
          <button
            type="button"
            onClick={() => setMaximized((prev) => !prev)}
            className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 transition-colors shrink-0"
            aria-label={maximized ? 'Restore terminal size' : 'Maximize terminal'}
            title={maximized ? (lang === 'zh' ? '還原視窗' : 'Restore') : lang === 'zh' ? '放大全螢幕' : 'Maximize'}
          />
          <span className="ml-1.5 text-[11px] text-slate-300 font-medium truncate">
            guest@chuos:{formatDisplayPath(cwd)}
          </span>
          {isDesktop && (
            <span className="hidden sm:inline text-[10px] text-slate-500 shrink-0">
              {maximized ? 'MAX' : `${Math.round(size.width)}×${Math.round(size.height)}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Minimize terminal"
            title={lang === 'zh' ? '縮小' : 'Minimize'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMaximized((prev) => !prev)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={maximized ? 'Restore terminal size' : 'Maximize terminal'}
            title={maximized ? (lang === 'zh' ? '還原視窗' : 'Restore') : lang === 'zh' ? '放大視窗' : 'Maximize'}
          >
            {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close terminal"
            title={lang === 'zh' ? '關閉' : 'Close'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Command Chips (hidden while in Vim) */}
      {!vimSession && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto shrink-0">
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
      )}

      {vimSession ? (
        /* Inline Vim Editor (Fun Local-Only DOM Sandbox) */
        <div className="flex-1 min-h-0 flex flex-col bg-slate-950">
          {/* Fun-only Disclaimer Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-400/25 text-[11px] text-amber-200 shrink-0">
            <span>
              {lang === 'zh'
                ? '⚡ 趣味沙盒（純屬好玩）：僅修改本機瀏覽器畫面，等同 F12 暫時預覽，重整頁面即還原。'
                : '⚡ Fun Sandbox (Just for fun): Local browser DOM preview only (like F12); resets on reload.'}
            </span>
            <span className="font-mono text-[10px] text-amber-300/80">
              {formatDisplayPath(vimSession.absPath)} ({vimSession.octalMode})
              {vimSession.content !== vimSession.savedContent ? ' [+]' : ''}
              {vimSession.readonly ? ' [RO]' : ''}
            </span>
          </div>

          {/* Vim Buffer Area with Line Numbers */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            <div className="select-none py-2.5 px-2 text-right text-[11px] leading-relaxed text-slate-600 bg-slate-900/50 border-r border-slate-800/80 overflow-hidden shrink-0">
              {vimSession.content.split('\n').map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>
            <textarea
              ref={vimTextareaRef}
              value={vimSession.content}
              readOnly={vimSession.mode !== 'INSERT'}
              onChange={(e) =>
                setVimSession((prev) => (prev ? { ...prev, content: e.target.value } : null))
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setVimSession((prev) =>
                    prev ? { ...prev, mode: 'NORMAL', statusMsg: '-- NORMAL --' } : null,
                  );
                  return;
                }
                if (vimSession.mode === 'NORMAL') {
                  if (e.key === 'i' || e.key === 'a') {
                    e.preventDefault();
                    if (vimSession.readonly) {
                      setVimSession((prev) =>
                        prev
                          ? {
                              ...prev,
                              statusMsg:
                                lang === 'zh'
                                  ? 'W10: 唯讀檔 (root:guest 0644，guest 無寫入權限) — 請改開 vim ~/site.conf'
                                  : 'W10: Readonly file (root-owned 0644) — run "vim ~/site.conf" for live sandbox',
                            }
                          : null,
                      );
                      return;
                    }
                    setVimSession((prev) =>
                      prev ? { ...prev, mode: 'INSERT', statusMsg: '-- INSERT -- (Esc to return)' } : null,
                    );
                  } else if (e.key === ':') {
                    e.preventDefault();
                    setVimSession((prev) =>
                      prev ? { ...prev, mode: 'COMMAND', commandText: '', statusMsg: '' } : null,
                    );
                  }
                }
              }}
              spellCheck={false}
              className={`flex-1 w-full h-full resize-none bg-transparent px-3 py-2.5 text-xs leading-relaxed focus:outline-none overflow-y-auto ${
                vimSession.mode === 'INSERT' ? 'text-slate-100' : 'text-slate-300 caret-amber-400'
              }`}
            />
          </div>

          {/* Vim Status & Command Bar */}
          <div className="border-t border-slate-800 bg-slate-900/95 px-3 py-2 space-y-1.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                    vimSession.mode === 'INSERT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : vimSession.mode === 'COMMAND'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  }`}
                >
                  {vimSession.mode}
                </span>
                {vimSession.mode === 'COMMAND' ? (
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <span className="text-amber-300 font-bold">:</span>
                    <input
                      ref={vimCmdRef}
                      type="text"
                      value={vimSession.commandText}
                      onChange={(e) =>
                        setVimSession((prev) => (prev ? { ...prev, commandText: e.target.value } : null))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          executeVimCommand(vimSession.commandText);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setVimSession((prev) =>
                            prev ? { ...prev, mode: 'NORMAL', commandText: '', statusMsg: '-- NORMAL --' } : null,
                          );
                        }
                      }}
                      placeholder="wq / w / q! / reset"
                      spellCheck={false}
                      className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 truncate">{vimSession.statusMsg}</span>
                )}
              </div>

              {/* Clickable helpers so non-Vim visitors never get trapped */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!vimSession.readonly && vimSession.mode !== 'INSERT' && (
                  <button
                    type="button"
                    onClick={() =>
                      setVimSession((prev) =>
                        prev ? { ...prev, mode: 'INSERT', statusMsg: '-- INSERT -- (Esc to return)' } : null,
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px]"
                  >
                    i {lang === 'zh' ? '編輯' : 'Insert'}
                  </button>
                )}
                {!vimSession.readonly && (
                  <button
                    type="button"
                    onClick={() => executeVimCommand('wq')}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px]"
                  >
                    :wq {lang === 'zh' ? '套用' : 'Apply'}
                  </button>
                )}
                {(vimSession.absPath === SITE_CONF_PATH || vimSession.absPath === SCRATCHPAD_PATH) && (
                  <button
                    type="button"
                    onClick={() => executeVimCommand('reset')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px]"
                  >
                    :reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => executeVimCommand('q!')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[10px]"
                >
                  :q! {lang === 'zh' ? '離開' : 'Quit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Output Area */}
          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="relative flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-1 leading-relaxed"
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
        </>
      )}
    </div>
  );
};
