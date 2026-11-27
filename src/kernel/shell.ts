import { PROJECTS } from '../data/projects';
import { PUBLICATIONS } from '../data/publications';
import { NAV_ITEMS, SITE_PROFILE } from '../data/profile';
import type { Language } from '../types/portfolio';
import type { ThemeMode } from '../context/ThemeContext';
import {
  buildTreeLines,
  formatDisplayPath,
  formatHumanSize,
  formatOctalMode,
  formatPermissions,
  getHomeDir,
  getNodeByteSize,
  getNodeLinkCount,
  normalizePath,
  resolveNode,
  searchVfs,
  type VfsNode,
} from './vfs';

export type OutputTone = 'normal' | 'muted' | 'accent' | 'success' | 'warning' | 'error';

export interface TerminalLine {
  id: string;
  text: string;
  tone?: OutputTone;
  action?: {
    label: string;
    sectionId?: string;
    command?: string;
  };
}

export interface ShellContext {
  cwd: string;
  root: VfsNode;
  lang: Language;
  theme: ThemeMode;
  bootTimeMs: number;
  history: string[];
  setCwd: (path: string) => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  scrollToSection: (sectionId: string) => void;
  triggerPanic: () => void;
  triggerShutdown: () => void;
  triggerReboot: () => void;
  openStegoLab: () => void;
  openVim: (absPath: string, node: VfsNode) => void;
  writeVfsFile: (absPath: string, content: string) => { ok: boolean; message: string; sectionId?: string };
  clearHistory: () => void;
  closeTerminal: () => void;
}

export interface ShellResult {
  lines: TerminalLine[];
  clear?: boolean;
}

const VALID_SECTIONS = NAV_ITEMS.map((item) => item.id);

export const AVAILABLE_COMMANDS = [
  'help',
  'man',
  'ls',
  'll',
  'cd',
  'pwd',
  'cat',
  'vim',
  'vi',
  'stat',
  'file',
  'wc',
  'head',
  'tail',
  'sort',
  'uniq',
  'cut',
  'tr',
  'nl',
  'rev',
  'chmod',
  'chown',
  'touch',
  'mkdir',
  'cp',
  'mv',
  'rm',
  'tree',
  'grep',
  'search',
  'find',
  'goto',
  'open',
  'theme',
  'lang',
  'stego',
  'neofetch',
  'uname',
  'hostname',
  'whoami',
  'who',
  'w',
  'id',
  'ps',
  'kill',
  'uptime',
  'dmesg',
  'df',
  'du',
  'free',
  'env',
  'printenv',
  'history',
  'which',
  'type',
  'date',
  'cal',
  'echo',
  'ping',
  'ip',
  'ifconfig',
  'curl',
  'systemctl',
  'shutdown',
  'poweroff',
  'halt',
  'reboot',
  'sudo',
  'su',
  'clear',
  'exit',
];

const SHELL_BUILTINS = new Set(['cd', 'pwd', 'echo', 'exit', 'history', 'type', 'clear']);

const MAN_PAGES: Record<string, string[]> = {
  shutdown: [
    'SHUTDOWN(8)               ChuOS System Manager Manual              SHUTDOWN(8)',
    'NAME        shutdown, poweroff, halt — Halt or power-off ChuOS MiniKernel',
    'SYNOPSIS    shutdown [-h|-r|-c] [now]',
    'DESCRIPTION Gracefully stops portfolio services and enters System Halted state.',
    '            Use -r to reboot and reset all in-memory Vim/sandbox overrides.',
    'EXAMPLES    shutdown -h now | shutdown -r now | poweroff | reboot',
  ],
  reboot: [
    'REBOOT(8)                 ChuOS System Manager Manual                REBOOT(8)',
    'NAME        reboot — Restart ChuOS MiniKernel and restore clean DOM state',
    'SYNOPSIS    reboot',
    'DESCRIPTION Reboots the virtual portfolio kernel, resetting Vim overrides and CWD.',
  ],
  vim: [
    'VIM(1)                    ChuOS Interactive Editor                      VIM(1)',
    'NAME        vim, vi — In-terminal live DOM sandbox editor',
    'SYNOPSIS    vim [file]',
    'DESCRIPTION Opens a VFS file. Writable files (~/site.conf, ~/.scratchpad) sync',
    '            live to the page (local-only preview, resets on reload).',
    'KEYS        i (INSERT), Esc (NORMAL), :w, :wq, :q!, :reset',
  ],
  ls: [
    'LS(1)                     ChuOS User Commands                            LS(1)',
    'NAME        ls, ll — list directory contents with POSIX permissions',
    'SYNOPSIS    ls [-l] [-a] [-h] [path]',
    'EXAMPLES    ls -la | ls -lh publications | ls -la | wc -l',
  ],
  grep: [
    'GREP(1)                   ChuOS User Commands                          GREP(1)',
    'NAME        grep — search VFS files or filter piped stdin',
    'SYNOPSIS    grep <keyword>   |   cmd | grep [-i|-v|-c|-n] <pattern>',
    'EXAMPLES    grep Trivy | cat site.conf | grep -v "#"',
  ],
  kill: [
    'KILL(1)                   ChuOS User Commands                          KILL(1)',
    'NAME        kill — send a signal to a ChuOS process',
    'SYNOPSIS    kill [-9|-15] <pid>',
    'DESCRIPTION Run "ps" first to inspect PIDs (1, 42, 108, 256).',
  ],
  systemctl: [
    'SYSTEMCTL(1)              ChuOS Service Manager                   SYSTEMCTL(1)',
    'NAME        systemctl — inspect ChuOS units or control power state',
    'SYNOPSIS    systemctl [list-units | status <unit> | poweroff | reboot]',
  ],
  cut: [
    'CUT(1)                    ChuOS User Commands                           CUT(1)',
    'NAME        cut — extract columns from lines or piped stdin',
    'SYNOPSIS    cut -d <delim> -f <list> [file]',
    'EXAMPLES    cat site.conf | grep -v "#" | cut -d = -f 1',
  ],
  tr: [
    'TR(1)                     ChuOS User Commands                            TR(1)',
    'NAME        tr — translate or delete characters from piped stdin',
    'SYNOPSIS    ... | tr [-d] <set1> [set2]',
    'EXAMPLES    echo "chuos" | tr a-z A-Z',
  ],
};

let lineCounter = 0;
function makeLine(
  text: string,
  tone: OutputTone = 'normal',
  action?: TerminalLine['action'],
): TerminalLine {
  lineCounter += 1;
  return { id: `line-${Date.now()}-${lineCounter}`, text, tone, action };
}

function formatUptime(bootTimeMs: number): string {
  const totalSec = Math.max(1, Math.floor((Date.now() - bootTimeMs) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function splitPipeline(rawInput: string): string[] {
  const stages: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < rawInput.length; i += 1) {
    const ch = rawInput[i];
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === '|') {
      stages.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  stages.push(current.trim());
  return stages;
}

function getUtf8ByteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length;
}

interface RedirectionSpec {
  mode: 'overwrite' | 'append';
  target: string;
}

function extractRedirection(stage: string): {
  cmdPart: string;
  redirect?: RedirectionSpec;
  syntaxError?: string;
} {
  let quote: '"' | "'" | null = null;
  let opIndex = -1;
  let opLen = 0;

  for (let i = 0; i < stage.length; i += 1) {
    const ch = stage[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') {
      opIndex = i;
      opLen = stage[i + 1] === '>' ? 2 : 1;
      break;
    }
  }

  if (opIndex === -1) return { cmdPart: stage };
  const cmdPart = stage.slice(0, opIndex).trim();
  const targetRaw = stage.slice(opIndex + opLen).trim();
  if (!targetRaw) {
    return { cmdPart, syntaxError: "chu-sh: syntax error near unexpected token `newline'" };
  }
  const target = targetRaw.split(/\s+/)[0]?.replace(/^["']|["']$/g, '') ?? '';
  return {
    cmdPart,
    redirect: { mode: opLen === 2 ? 'append' : 'overwrite', target },
  };
}

function computeRecursiveBytes(node: VfsNode): number {
  if (node.type === 'file') return getNodeByteSize(node);
  let total = 4096;
  for (const child of Object.values(node.children ?? {})) {
    total += computeRecursiveBytes(child);
  }
  return total;
}

function expandCharSet(spec: string): string {
  if (spec === '[:lower:]') return 'abcdefghijklmnopqrstuvwxyz';
  if (spec === '[:upper:]') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (spec === '[:digit:]') return '0123456789';
  let out = '';
  for (let i = 0; i < spec.length; i += 1) {
    if (i + 2 < spec.length && spec[i + 1] === '-') {
      const start = spec.charCodeAt(i);
      const end = spec.charCodeAt(i + 2);
      if (start <= end) {
        for (let c = start; c <= end; c += 1) out += String.fromCharCode(c);
        i += 2;
        continue;
      }
    }
    out += spec[i];
  }
  return out;
}

function buildCalendarLines(): TerminalLine[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const title = `${monthNames[month]} ${year}`;
  const padLeft = Math.max(0, Math.floor((20 - title.length) / 2));
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const out: TerminalLine[] = [
    makeLine(`${' '.repeat(padLeft)}${title}`, 'accent'),
    makeLine('Su Mo Tu We Th Fr Sa', 'muted'),
  ];

  let row = '   '.repeat(firstDay);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = day === today ? `[${String(day).padStart(2, ' ')}]` : `${String(day).padStart(2, ' ')} `;
    row += day === today ? cell.slice(0, 3) : cell;
    if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
      out.push(makeLine(row.trimEnd(), day >= today && day - 6 <= today && row.includes('[') ? 'success' : 'normal'));
      row = '';
    }
  }
  out.push(makeLine(`Today: ${year}-${String(month + 1).padStart(2, '0')}-${String(today).padStart(2, '0')}`, 'muted'));
  return out;
}

export function executeCommand(rawInput: string, ctx: ShellContext): ShellResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { lines: [] };

  const stages = splitPipeline(trimmed);
  if (stages.some((s) => !s)) {
    return { lines: [makeLine('chu-sh: syntax error near unexpected token `|`', 'error')] };
  }

  // Parse optional > or >> redirection on the final stage
  const lastIdx = stages.length - 1;
  const parsedLast = extractRedirection(stages[lastIdx]);
  if (parsedLast.syntaxError) {
    return { lines: [makeLine(parsedLast.syntaxError, 'error')] };
  }
  if (!parsedLast.cmdPart) {
    return { lines: [makeLine('chu-sh: syntax error: missing command before redirection', 'error')] };
  }
  stages[lastIdx] = parsedLast.cmdPart;

  let currentResult: ShellResult = { lines: [] };
  let stdinLines: string[] | undefined = undefined;
  for (const stage of stages) {
    currentResult = executeSingleCommand(stage, ctx, stdinLines);
    if (currentResult.clear) return currentResult;
    if (currentResult.lines.length > 0 && currentResult.lines.every((l) => l.tone === 'error')) {
      return currentResult;
    }
    stdinLines = currentResult.lines.map((l) => l.text);
  }

  if (parsedLast.redirect) {
    const { mode, target } = parsedLast.redirect;
    const absPath = normalizePath(ctx.cwd, target);
    const node = resolveNode(ctx.root, absPath);
    if (!node) {
      return {
        lines: [
          makeLine(`chu-sh: ${target}: Read-only file system (cannot create new files in portfoliofs)`, 'error'),
        ],
      };
    }
    if (node.type === 'dir') {
      return { lines: [makeLine(`chu-sh: ${target}: Is a directory`, 'error')] };
    }
    if (node.readonly) {
      return {
        lines: [
          makeLine(
            `chu-sh: ${target}: Permission denied (owner=${node.owner ?? 'root'}, mode=${formatOctalMode(node)})`,
            'error',
          ),
        ],
      };
    }

    const payload = currentResult.lines.map((l) => l.text).join('\n');
    const nextContent =
      mode === 'append' ? (node.content ? `${node.content}\n${payload}` : payload) : payload;
    const writeRes = ctx.writeVfsFile(absPath, nextContent);
    return {
      lines: [
        makeLine(
          writeRes.message,
          writeRes.ok ? 'success' : 'error',
          writeRes.sectionId ? { label: `goto #${writeRes.sectionId}`, sectionId: writeRes.sectionId } : undefined,
        ),
      ],
    };
  }

  return currentResult;
}

function executeSingleCommand(
  trimmed: string,
  ctx: ShellContext,
  stdinLines?: string[],
): ShellResult {
  const tokens =
    trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((t) => t.replace(/^["']|["']$/g, '')) ?? [];
  const cmd = tokens[0]?.toLowerCase() ?? '';
  const args = tokens.slice(1);

  switch (cmd) {
    case 'clear':
      return { lines: [], clear: true };

    case 'exit':
      ctx.closeTerminal();
      return { lines: [makeLine('Session detached.', 'muted')] };

    case 'help':
      return {
        lines: [
          makeLine('ChuOS MiniKernel Shell — Available Commands', 'accent'),
          makeLine('  Files      : ls [-la|-lh], ll, cd <dir>, pwd, cat <file>, tree [dir]'),
          makeLine('  Editor     : vim [file]  (fun local-only DOM sandbox; resets on reload)'),
          makeLine('  Pipe/Redir : cmd1 | cmd2, >, >>  (grep, wc, head, tail, sort, uniq, cut, tr, nl, rev)'),
          makeLine('  Inspect    : stat, file, chmod, chown, du [-h|-s], df [-h], free [-h]'),
          makeLine('  Search/Nav : grep <kw>, search <kw>, goto <section|file>, man <cmd>, which <cmd>'),
          makeLine('  System     : neofetch, uname -a, hostname, env, history, whoami, who, id, ps, kill, uptime, dmesg, cal'),
          makeLine('  Power/Svc  : shutdown [-h|-r] [now], poweroff, halt, reboot, systemctl [status|list-units]'),
          makeLine('  Network    : ping <host>, ip a, ifconfig, curl [-I] <url>'),
          makeLine('  Controls   : theme [light|dark|toggle], lang [toggle], stego, clear, exit'),
          makeLine('  Easter Egg : sudo hire-me, rm -rf /, ls -la (find the 0666 file!)', 'warning'),
          makeLine('Tip: Press Tab to autocomplete, ↑/↓ for history, drag edges to resize.', 'muted'),
        ],
      };

    case 'man': {
      const topic = args[0]?.toLowerCase();
      if (!topic) {
        return { lines: [makeLine('What manual page do you want? Try: man shutdown, man vim, man grep', 'warning')] };
      }
      const page = MAN_PAGES[topic];
      if (page) {
        return {
          lines: page.map((line, idx) => makeLine(line, idx === 0 ? 'accent' : 'normal')),
        };
      }
      if (AVAILABLE_COMMANDS.includes(topic)) {
        return {
          lines: [
            makeLine(`${topic.toUpperCase()}(1)              ChuOS User Commands`, 'accent'),
            makeLine(`NAME        ${topic} — built-in ChuOS MiniKernel shell command`),
            makeLine(`SYNOPSIS    ${topic} [options] [args...]`),
            makeLine(`TIP         Run "${topic}" or "help" for usage details.`, 'muted'),
          ],
        };
      }
      return { lines: [makeLine(`No manual entry for ${topic}`, 'error')] };
    }

    case 'hostname': {
      const hostNode = resolveNode(ctx.root, '/etc/hostname');
      return { lines: [makeLine((hostNode?.content ?? 'chuos.local').trim())] };
    }

    case 'who':
    case 'w':
      return {
        lines: [
          makeLine(`USER     TTY      LOGIN@   IDLE   WHAT`, 'muted'),
          makeLine(`guest    pts/0    ${formatUptime(ctx.bootTimeMs).padEnd(8, ' ')} 0.00s  /bin/chu-sh`),
        ],
      };

    case 'cal':
      return { lines: buildCalendarLines() };

    case 'history': {
      if (args.includes('-c')) {
        ctx.clearHistory();
        return { lines: [makeLine('Command history cleared.', 'muted')] };
      }
      if (ctx.history.length === 0) {
        return { lines: [makeLine('(no command history yet)', 'muted')] };
      }
      const chronological = [...ctx.history].reverse();
      return {
        lines: chronological.map((entry, idx) =>
          makeLine(`${String(idx + 1).padStart(4, ' ')}  ${entry}`),
        ),
      };
    }

    case 'env':
    case 'printenv': {
      const envMap: Record<string, string> = {
        USER: 'guest',
        HOME: getHomeDir(),
        PWD: ctx.cwd,
        SHELL: '/bin/chu-sh',
        TERM: 'xterm-256color',
        HOSTNAME: 'chuos.local',
        LANG: ctx.lang === 'zh' ? 'zh_TW.UTF-8' : 'en_US.UTF-8',
        CHUOS_THEME: ctx.theme,
        PATH: '/usr/local/bin:/usr/bin:/bin',
      };
      if (args[0]) {
        const key = args[0].toUpperCase();
        if (key in envMap) return { lines: [makeLine(envMap[key])] };
        return { lines: [] };
      }
      return {
        lines: Object.entries(envMap).map(([k, v]) => makeLine(`${k}=${v}`)),
      };
    }

    case 'which':
    case 'type': {
      if (!args[0]) {
        return { lines: [makeLine(`usage: ${cmd} <command>`, 'warning')] };
      }
      const target = args[0].toLowerCase();
      if (SHELL_BUILTINS.has(target)) {
        return {
          lines: [
            makeLine(
              cmd === 'type' ? `${target} is a shell builtin` : `${target}: shell built-in command`,
              'accent',
            ),
          ],
        };
      }
      if (AVAILABLE_COMMANDS.includes(target)) {
        return {
          lines: [
            makeLine(
              cmd === 'type' ? `${target} is /usr/bin/${target}` : `/usr/bin/${target}`,
              'success',
            ),
          ],
        };
      }
      return { lines: [makeLine(`${cmd}: ${target}: not found`, 'error')] };
    }

    case 'df': {
      const human = args.includes('-h');
      return {
        lines: [
          makeLine(
            human
              ? 'Filesystem      Size  Used Avail Use% Mounted on'
              : 'Filesystem     1K-blocks  Used Available Use% Mounted on',
            'muted',
          ),
          makeLine(
            human
              ? 'portfoliofs     128M   14M  114M  11% /home/guest (ro)'
              : 'portfoliofs       131072 14336    116736  11% /home/guest',
          ),
          makeLine(
            human
              ? 'tmpfs            64M  128K   64M   1% /tmp (rw)'
              : 'tmpfs              65536   128     65408   1% /tmp',
          ),
          makeLine(
            human
              ? 'proc               0     0     0    - /proc'
              : 'proc                   0     0         0    - /proc',
          ),
        ],
      };
    }

    case 'du': {
      const human = args.includes('-h') || args.includes('-sh') || args.includes('-hs');
      const summary = args.includes('-s') || args.includes('-sh') || args.includes('-hs');
      const pathArg = args.find((a) => !a.startsWith('-'));
      const target = pathArg ? normalizePath(ctx.cwd, pathArg) : ctx.cwd;
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`du: cannot access '${pathArg}': No such file or directory`, 'error')] };
      }
      const fmt = (bytes: number) =>
        (human ? formatHumanSize(bytes) : String(Math.max(1, Math.ceil(bytes / 1024)))).padStart(6, ' ');

      if (summary || node.type === 'file') {
        const total = computeRecursiveBytes(node);
        return { lines: [makeLine(`${fmt(total)}  ${formatDisplayPath(target)}`)] };
      }
      const out: TerminalLine[] = [];
      for (const child of Object.values(node.children ?? {})) {
        const childPath = `${target === '/' ? '' : target}/${child.name}`.replace('//', '/');
        out.push(makeLine(`${fmt(computeRecursiveBytes(child))}  ${formatDisplayPath(childPath)}`));
      }
      out.push(makeLine(`${fmt(computeRecursiveBytes(node))}  ${formatDisplayPath(target)}`, 'accent'));
      return { lines: out };
    }

    case 'free': {
      const human = args.includes('-h');
      return {
        lines: [
          makeLine('               total        used        free      shared  buff/cache   available', 'muted'),
          makeLine(
            human
              ? 'Mem:           2.0Gi       248Mi       1.4Gi        12Mi       356Mi       1.7Gi'
              : 'Mem:         2097152      253952     1474560       12288      368640     1794048',
          ),
          makeLine(
            human
              ? 'Swap:          512Mi          0B       512Mi'
              : 'Swap:         524288           0      524288',
          ),
        ],
      };
    }

    case 'cut': {
      let delim = '\t';
      let fieldSpec = '';
      let fileArg: string | undefined;

      for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '-d' && args[i + 1] !== undefined) {
          delim = args[i + 1];
          i += 1;
        } else if (arg.startsWith('-d') && arg.length > 2) {
          delim = arg.slice(2);
        } else if (arg === '-f' && args[i + 1] !== undefined) {
          fieldSpec = args[i + 1];
          i += 1;
        } else if (arg.startsWith('-f') && arg.length > 2) {
          fieldSpec = arg.slice(2);
        } else if (!arg.startsWith('-') && !fileArg) {
          fileArg = arg;
        }
      }

      if (!fieldSpec) {
        return { lines: [makeLine('usage: cut -d <delim> -f <fields> [file]  (e.g. cut -d = -f 1)', 'warning')] };
      }

      let sourceLines: string[] = [];
      if (fileArg) {
        const node = resolveNode(ctx.root, normalizePath(ctx.cwd, fileArg));
        if (!node) return { lines: [makeLine(`cut: ${fileArg}: No such file or directory`, 'error')] };
        if (node.type === 'dir') return { lines: [makeLine(`cut: ${fileArg}: Is a directory`, 'error')] };
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = stdinLines;
      } else {
        return { lines: [makeLine('usage: cut -d <delim> -f <fields> <file>  (or pipe via | cut ...)', 'warning')] };
      }

      const indices: number[] = [];
      for (const part of fieldSpec.split(',')) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map((n) => Number.parseInt(n, 10));
          if (!Number.isNaN(s) && !Number.isNaN(e) && s >= 1 && e >= s) {
            for (let k = s; k <= e; k += 1) indices.push(k - 1);
          }
        } else {
          const idx = Number.parseInt(part, 10);
          if (!Number.isNaN(idx) && idx >= 1) indices.push(idx - 1);
        }
      }

      return {
        lines: sourceLines.map((line) => {
          const cols = line.split(delim);
          if (cols.length === 1) return makeLine(line);
          return makeLine(indices.map((idx) => cols[idx] ?? '').join(delim));
        }),
      };
    }

    case 'tr': {
      if (stdinLines === undefined) {
        return { lines: [makeLine('usage: ... | tr [-d] <set1> [set2]  (e.g. echo hi | tr a-z A-Z)', 'warning')] };
      }
      const delMode = args[0] === '-d';
      const set1Raw = delMode ? args[1] : args[0];
      const set2Raw = delMode ? '' : args[1];
      if (!set1Raw || (!delMode && !set2Raw)) {
        return { lines: [makeLine('usage: ... | tr [-d] <set1> [set2]', 'warning')] };
      }
      const set1 = expandCharSet(set1Raw);
      const set2 = expandCharSet(set2Raw ?? '');
      return {
        lines: stdinLines.map((line) => {
          let result = '';
          for (const ch of line) {
            const idx = set1.indexOf(ch);
            if (idx >= 0) {
              if (!delMode) result += set2[Math.min(idx, set2.length - 1)] ?? ch;
            } else {
              result += ch;
            }
          }
          return makeLine(result);
        }),
      };
    }

    case 'nl': {
      const fileArg = args.find((a) => !a.startsWith('-'));
      let sourceLines: string[] = [];
      if (fileArg) {
        const node = resolveNode(ctx.root, normalizePath(ctx.cwd, fileArg));
        if (!node) return { lines: [makeLine(`nl: ${fileArg}: No such file or directory`, 'error')] };
        if (node.type === 'dir') return { lines: [makeLine(`nl: ${fileArg}: Is a directory`, 'error')] };
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = stdinLines;
      } else {
        return { lines: [makeLine('usage: nl <file>  (or pipe via | nl)', 'warning')] };
      }
      return {
        lines: sourceLines.map((l, idx) => makeLine(`${String(idx + 1).padStart(4, ' ')}  ${l}`)),
      };
    }

    case 'rev': {
      const fileArg = args.find((a) => !a.startsWith('-'));
      let sourceLines: string[] = [];
      if (fileArg) {
        const node = resolveNode(ctx.root, normalizePath(ctx.cwd, fileArg));
        if (!node) return { lines: [makeLine(`rev: ${fileArg}: No such file or directory`, 'error')] };
        if (node.type === 'dir') return { lines: [makeLine(`rev: ${fileArg}: Is a directory`, 'error')] };
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = stdinLines;
      } else {
        return { lines: [makeLine('usage: rev <file>  (or pipe via | rev)', 'warning')] };
      }
      return {
        lines: sourceLines.map((l) => makeLine(Array.from(l).reverse().join(''))),
      };
    }

    case 'touch':
    case 'mkdir':
    case 'cp':
    case 'mv':
    case 'chown': {
      const label = args[0] ?? 'target';
      return {
        lines: [
          makeLine(
            `${cmd}: cannot modify '${label}': Read-only file system (portfoliofs, EROFS)`,
            'error',
          ),
        ],
      };
    }

    case 'su':
      return {
        lines: [
          makeLine("su: Authentication failure (guest cannot escalate to root; try 'sudo hire-me')", 'error'),
        ],
      };

    case 'kill': {
      const pidArg = args.find((a) => !a.startsWith('-'));
      if (!pidArg) {
        return { lines: [makeLine('usage: kill [-9|-15] <pid>  (run "ps" to view PIDs)', 'warning')] };
      }
      if (pidArg === '1') {
        return { lines: [makeLine('kill: (1) - Operation not permitted (cannot terminate /sbin/init)', 'error')] };
      }
      if (pidArg === '42') {
        return {
          lines: [
            makeLine('[sherry-agentd] Nice try! Sherry politely ignored SIGTERM. :)', 'warning'),
          ],
        };
      }
      if (pidArg === '108') {
        return {
          lines: [makeLine('kill: (108) - Operation not permitted (selinux-gcb-auditor is protected)', 'error')],
        };
      }
      if (pidArg === '256') {
        ctx.closeTerminal();
        return { lines: [makeLine('Terminated (/bin/chu-sh)', 'muted')] };
      }
      return { lines: [makeLine(`kill: (${pidArg}) - No such process`, 'error')] };
    }

    case 'shutdown': {
      if (args.includes('-c')) {
        return { lines: [makeLine('shutdown: No scheduled shutdown to cancel.', 'muted')] };
      }
      if (args.includes('-r') || args.includes('reboot')) {
        ctx.triggerReboot();
        return { lines: [makeLine('Broadcast message from guest@chuos: The system is going down for reboot NOW!', 'warning')] };
      }
      ctx.triggerShutdown();
      return { lines: [makeLine('Broadcast message from guest@chuos: The system is going down for poweroff NOW!', 'warning')] };
    }

    case 'poweroff':
    case 'halt':
      ctx.triggerShutdown();
      return { lines: [makeLine('Initiating ChuOS MiniKernel power-off...', 'warning')] };

    case 'reboot':
      ctx.triggerReboot();
      return { lines: [makeLine('Initiating ChuOS MiniKernel reboot...', 'warning')] };

    case 'systemctl': {
      const sub = (args[0] ?? '').toLowerCase();
      if (sub === 'poweroff' || sub === 'halt') {
        ctx.triggerShutdown();
        return { lines: [makeLine('Starting System Power Off...', 'warning')] };
      }
      if (sub === 'reboot') {
        ctx.triggerReboot();
        return { lines: [makeLine('Starting System Reboot...', 'warning')] };
      }
      if (sub === 'list-units' || !sub) {
        return {
          lines: [
            makeLine('UNIT                          LOAD   ACTIVE SUB     DESCRIPTION', 'muted'),
            makeLine('sherry-agentd.service         loaded active running Autonomous AI Companion Daemon', 'success'),
            makeLine('selinux-gcb-auditor.service   loaded active running Linux GCB & Compliance Monitor', 'success'),
            makeLine('portfoliofs-mount.service     loaded active exited  Read-only Portfolio VFS Mount', 'normal'),
            makeLine('chu-sh@pts0.service           loaded active running Interactive Guest Shell', 'normal'),
          ],
        };
      }
      if (sub === 'status') {
        const unit = args[1] ?? 'sherry-agentd.service';
        return {
          lines: [
            makeLine(`● ${unit} — ChuOS Managed Service`, 'success'),
            makeLine(`     Loaded: loaded (/etc/systemd/system/${unit}; enabled)`),
            makeLine(`     Active: active (running) since boot (up ${formatUptime(ctx.bootTimeMs)})`, 'success'),
            makeLine(`   Security: SELinux=enforcing, Nessus=0-crit, Trivy=0-CVE, Bandit=0-high`, 'muted'),
          ],
        };
      }
      return {
        lines: [makeLine('usage: systemctl [list-units | status <unit> | poweroff | reboot]', 'warning')],
      };
    }

    case 'ping': {
      const host = args.find((a) => !a.startsWith('-')) ?? 'chuos.local';
      const resolvedIp = host === 'localhost' || host === '127.0.0.1' || host === 'chuos.local' ? '127.0.0.1' : '10.0.42.1';
      return {
        lines: [
          makeLine(`PING ${host} (${resolvedIp}) 56(84) bytes of data.`, 'accent'),
          makeLine(`64 bytes from ${host} (${resolvedIp}): icmp_seq=1 ttl=64 time=0.42 ms`),
          makeLine(`64 bytes from ${host} (${resolvedIp}): icmp_seq=2 ttl=64 time=0.38 ms`),
          makeLine(`64 bytes from ${host} (${resolvedIp}): icmp_seq=3 ttl=64 time=0.41 ms`),
          makeLine(`--- ${host} ping statistics ---`, 'muted'),
          makeLine(`3 packets transmitted, 3 received, 0% packet loss, time 2004ms`, 'success'),
        ],
      };
    }

    case 'ip':
    case 'ifconfig':
      return {
        lines: [
          makeLine('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN', 'accent'),
          makeLine('    inet 127.0.0.1/8 scope host lo'),
          makeLine('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP', 'accent'),
          makeLine('    link/ether 02:42:ac:11:00:42 brd ff:ff:ff:ff:ff:ff', 'muted'),
          makeLine('    inet 10.0.42.10/24 brd 10.0.42.255 scope global eth0 (virtual sandbox)'),
        ],
      };

    case 'curl': {
      const headOnly = args.includes('-I') || args.includes('--head');
      const url = args.find((a) => !a.startsWith('-'));
      if (!url) {
        return { lines: [makeLine('usage: curl [-I] <url>  (e.g. curl -I chuos.local)', 'warning')] };
      }
      const headerLines: TerminalLine[] = [
        makeLine('HTTP/2 200 OK', 'success'),
        makeLine('server: ChuOS-MiniKernel/1.0 (GitHub Pages)'),
        makeLine('content-type: text/html; charset=utf-8'),
        makeLine('x-security-audit: Nessus=0-crit; Trivy=0-CVE; Bandit=0-high; GCB=100%'),
      ];
      if (headOnly) return { lines: headerLines };
      return {
        lines: [
          ...headerLines,
          makeLine(''),
          makeLine(`<!-- Simulated offline sandbox response for ${url} -->`, 'muted'),
          makeLine(`<title>${SITE_PROFILE.name.en} — Portfolio</title>`),
        ],
      };
    }

    case 'pwd':
      return { lines: [makeLine(ctx.cwd)] };

    case 'whoami':
      return { lines: [makeLine('guest@chuos.local (read-only visitor)')] };

    case 'id':
      return { lines: [makeLine('uid=1000(guest) gid=1000(guest) groups=1000(guest),27(visitors)')] };

    case 'date':
      return { lines: [makeLine(new Date().toLocaleString())] };

    case 'uptime':
      return {
        lines: [
          makeLine(
            `up ${formatUptime(ctx.bootTimeMs)}, 1 user, load average: 0.08, 0.04, 0.01`,
          ),
        ],
      };

    case 'uname':
      return {
        lines: [
          makeLine(
            args.includes('-a')
              ? 'ChuOS chuos.local 1.0.0-agent #1 SMP PREEMPT_DYNAMIC x86_64 Portfolio/React'
              : 'ChuOS',
          ),
        ],
      };

    case 'echo':
      return { lines: [makeLine(args.join(' '))] };

    case 'll':
    case 'ls': {
      let showLong = cmd === 'll';
      let showAll = cmd === 'll';
      let humanReadable = false;
      let pathArg: string | undefined;

      for (const arg of args) {
        if (arg.startsWith('-') && arg.length > 1) {
          for (const ch of arg.slice(1)) {
            if (ch === 'l') showLong = true;
            else if (ch === 'a') showAll = true;
            else if (ch === 'h') humanReadable = true;
          }
        } else if (!pathArg) {
          pathArg = arg;
        }
      }

      const target = pathArg ? normalizePath(ctx.cwd, pathArg) : ctx.cwd;
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`ls: cannot access '${pathArg}': No such file or directory`, 'error')] };
      }

      const formatLongLine = (entry: VfsNode, displayName: string): string => {
        const perm = formatPermissions(entry);
        const links = String(getNodeLinkCount(entry)).padStart(2, ' ');
        const owner = (entry.owner ?? 'guest').padEnd(5, ' ');
        const group = (entry.group ?? 'guest').padEnd(5, ' ');
        const bytes = getNodeByteSize(entry);
        const sizeStr = (humanReadable ? formatHumanSize(bytes) : String(bytes)).padStart(5, ' ');
        const mtime = entry.mtime ?? 'Nov 27 14:18';
        const suffix = entry.type === 'dir' && displayName !== '.' && displayName !== '..' ? '/' : '';
        return `${perm} ${links} ${owner} ${group} ${sizeStr} ${mtime} ${displayName}${suffix}`;
      };

      if (node.type === 'file') {
        return {
          lines: [
            makeLine(showLong ? formatLongLine(node, node.name) : node.name, 'normal', {
              label: 'cat',
              command: `cat ${target}`,
            }),
          ],
        };
      }

      const allEntries = Object.values(node.children ?? {})
        .filter((entry) => showAll || !entry.name.startsWith('.'))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      const outLines: TerminalLine[] = [];

      if (showLong) {
        const totalBlocks = allEntries.reduce(
          (sum, entry) => sum + Math.max(1, Math.ceil(getNodeByteSize(entry) / 1024)),
          showAll ? 8 : 0,
        );
        outLines.push(makeLine(`total ${totalBlocks}`, 'muted'));
        if (showAll) {
          outLines.push(makeLine(formatLongLine(node, '.'), 'accent'));
          const parentPath = normalizePath(target, '..');
          const parentNode = resolveNode(ctx.root, parentPath) ?? node;
          outLines.push(
            makeLine(formatLongLine(parentNode, '..'), 'accent', {
              label: 'cd ..',
              command: 'cd ..',
            }),
          );
        }
      } else if (showAll) {
        outLines.push(makeLine('./', 'accent'));
        outLines.push(makeLine('../', 'accent', { label: 'cd ..', command: 'cd ..' }));
      }

      if (allEntries.length === 0 && !showAll) {
        return { lines: [makeLine('(empty directory)', 'muted')] };
      }

      for (const entry of allEntries) {
        const fullPath = `${target === '/' ? '' : target}/${entry.name}`.replace('//', '/');
        outLines.push(
          makeLine(
            showLong ? formatLongLine(entry, entry.name) : entry.type === 'dir' ? `${entry.name}/` : entry.name,
            entry.type === 'dir' ? 'accent' : 'normal',
            entry.type === 'file'
              ? { label: 'cat', command: `cat ${fullPath}` }
              : { label: 'cd', command: `cd ${fullPath}` },
          ),
        );
      }

      return { lines: outLines };
    }

    case 'stat': {
      if (!args[0]) {
        return { lines: [makeLine('usage: stat <file|dir>', 'warning')] };
      }
      const target = normalizePath(ctx.cwd, args[0]);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`stat: cannot stat '${args[0]}': No such file or directory`, 'error')] };
      }
      const bytes = getNodeByteSize(node);
      const blocks = Math.max(0, Math.ceil(bytes / 512));
      const fileType = node.type === 'dir' ? 'directory' : 'regular file';
      const owner = node.owner ?? 'guest';
      const group = node.group ?? 'guest';
      const uid = owner === 'root' ? '   0' : '1000';
      const gid = group === 'root' ? '   0' : group === 'adm' ? '   4' : '1000';
      const mtime = node.mtime ?? 'Nov 27 14:18';

      return {
        lines: [
          makeLine(`  File: ${formatDisplayPath(target)}`, 'accent'),
          makeLine(
            `  Size: ${String(bytes).padEnd(10, ' ')} Blocks: ${String(blocks).padEnd(8, ' ')} IO Block: 4096   ${fileType}`,
          ),
          makeLine(`Device: 0,42   Inode: ${String(node.inode ?? 1001).padEnd(10, ' ')} Links: ${getNodeLinkCount(node)}`),
          makeLine(
            `Access: (${formatOctalMode(node)}/${formatPermissions(node)})  Uid: (${uid}/${owner.padStart(5, ' ')})   Gid: (${gid}/${group.padStart(5, ' ')})`,
            'success',
          ),
          makeLine(`Modify: 2026-${mtime} +0800`, 'muted'),
          makeLine(`  Note: portfoliofs mounted read-only (SELinux enforcing)`, 'muted'),
        ],
      };
    }

    case 'file': {
      if (!args[0]) {
        return { lines: [makeLine('usage: file <path>', 'warning')] };
      }
      const target = normalizePath(ctx.cwd, args[0]);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`${args[0]}: cannot open (No such file or directory)`, 'error')] };
      }
      if (node.type === 'dir') {
        return { lines: [makeLine(`${args[0]}: directory (mode ${formatOctalMode(node)})`, 'accent')] };
      }
      const kind = node.name.endsWith('.md')
        ? 'UTF-8 Unicode Markdown text'
        : target.startsWith('/proc/')
          ? 'ASCII text (virtual procfs)'
          : target.startsWith('/var/log/')
            ? 'ASCII kernel ring buffer log'
            : 'UTF-8 Unicode text';
      return { lines: [makeLine(`${args[0]}: ${kind}, ${getNodeByteSize(node)} bytes (${formatOctalMode(node)})`)] };
    }

    case 'wc': {
      let onlyLines = false;
      let onlyWords = false;
      let onlyBytes = false;
      let fileArg: string | undefined;

      for (const arg of args) {
        if (arg.startsWith('-') && arg.length > 1) {
          for (const ch of arg.slice(1)) {
            if (ch === 'l') onlyLines = true;
            else if (ch === 'w') onlyWords = true;
            else if (ch === 'c') onlyBytes = true;
          }
        } else if (!fileArg) {
          fileArg = arg;
        }
      }

      let text = '';
      let label = '';
      if (fileArg) {
        const target = normalizePath(ctx.cwd, fileArg);
        const node = resolveNode(ctx.root, target);
        if (!node) {
          return { lines: [makeLine(`wc: ${fileArg}: No such file or directory`, 'error')] };
        }
        if (node.type === 'dir') {
          return { lines: [makeLine(`wc: ${fileArg}: Is a directory`, 'error')] };
        }
        text = node.content ?? '';
        label = ` ${fileArg}`;
      } else if (stdinLines !== undefined) {
        text = stdinLines.join('\n');
      } else {
        return { lines: [makeLine('usage: wc [-l|-w|-c] <file>  (or pipe via | wc -l)', 'warning')] };
      }

      const lineCount = fileArg
        ? text
          ? text.split('\n').length
          : 0
        : stdinLines
          ? stdinLines.length
          : 0;
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const byteCount = getUtf8ByteLength(text);

      if (onlyLines || onlyWords || onlyBytes) {
        const parts: string[] = [];
        if (onlyLines) parts.push(String(lineCount));
        if (onlyWords) parts.push(String(wordCount));
        if (onlyBytes) parts.push(String(byteCount));
        return { lines: [makeLine(`${parts.join(' ')}${label}`)] };
      }

      return {
        lines: [
          makeLine(
            `${String(lineCount).padStart(4, ' ')} ${String(wordCount).padStart(5, ' ')} ${String(byteCount).padStart(6, ' ')}${label}`,
          ),
        ],
      };
    }

    case 'head':
    case 'tail': {
      let count = 10;
      let fileArg: string | undefined;

      for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '-n' && args[i + 1]) {
          const parsed = Number.parseInt(args[i + 1], 10);
          if (!Number.isNaN(parsed) && parsed >= 0) count = parsed;
          i += 1;
        } else if (/^-\d+$/.test(arg)) {
          count = Number.parseInt(arg.slice(1), 10);
        } else if (!arg.startsWith('-') && !fileArg) {
          fileArg = arg;
        }
      }

      let sourceLines: string[] = [];
      if (fileArg) {
        const target = normalizePath(ctx.cwd, fileArg);
        const node = resolveNode(ctx.root, target);
        if (!node) {
          return { lines: [makeLine(`${cmd}: cannot open '${fileArg}': No such file or directory`, 'error')] };
        }
        if (node.type === 'dir') {
          return { lines: [makeLine(`${cmd}: error reading '${fileArg}': Is a directory`, 'error')] };
        }
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = stdinLines;
      } else {
        return { lines: [makeLine(`usage: ${cmd} [-n N] <file>  (or pipe via | ${cmd} -n 5)`, 'warning')] };
      }

      const sliced =
        cmd === 'head'
          ? sourceLines.slice(0, count)
          : count === 0
            ? []
            : sourceLines.slice(-count);
      return { lines: sliced.map((l) => makeLine(l)) };
    }

    case 'sort': {
      const reverse = args.includes('-r');
      const fileArg = args.find((a) => !a.startsWith('-'));
      let sourceLines: string[] = [];

      if (fileArg) {
        const target = normalizePath(ctx.cwd, fileArg);
        const node = resolveNode(ctx.root, target);
        if (!node) {
          return { lines: [makeLine(`sort: cannot read: ${fileArg}: No such file or directory`, 'error')] };
        }
        if (node.type === 'dir') {
          return { lines: [makeLine(`sort: read failed: ${fileArg}: Is a directory`, 'error')] };
        }
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = [...stdinLines];
      } else {
        return { lines: [makeLine('usage: sort [-r] <file>  (or pipe via | sort)', 'warning')] };
      }

      sourceLines.sort((a, b) => (reverse ? b.localeCompare(a) : a.localeCompare(b)));
      return { lines: sourceLines.map((l) => makeLine(l)) };
    }

    case 'uniq': {
      const showCount = args.includes('-c');
      const fileArg = args.find((a) => !a.startsWith('-'));
      let sourceLines: string[] = [];

      if (fileArg) {
        const target = normalizePath(ctx.cwd, fileArg);
        const node = resolveNode(ctx.root, target);
        if (!node) {
          return { lines: [makeLine(`uniq: ${fileArg}: No such file or directory`, 'error')] };
        }
        if (node.type === 'dir') {
          return { lines: [makeLine(`uniq: ${fileArg}: Is a directory`, 'error')] };
        }
        sourceLines = (node.content ?? '').split('\n');
      } else if (stdinLines !== undefined) {
        sourceLines = stdinLines;
      } else {
        return { lines: [makeLine('usage: uniq [-c] <file>  (or pipe via | uniq)', 'warning')] };
      }

      const out: string[] = [];
      for (const line of sourceLines) {
        if (out.length === 0) {
          out.push(line);
        } else if (out[out.length - 1] !== line) {
          out.push(line);
        }
      }
      if (!showCount) {
        return { lines: out.map((l) => makeLine(l)) };
      }
      const counted: string[] = [];
      for (const line of sourceLines) {
        if (counted.length === 0) {
          counted.push(`1\t${line}`);
        } else {
          const prev = counted[counted.length - 1];
          const tabIdx = prev.indexOf('\t');
          const prevText = prev.slice(tabIdx + 1);
          if (prevText === line) {
            const c = Number.parseInt(prev.slice(0, tabIdx), 10) + 1;
            counted[counted.length - 1] = `${c}\t${line}`;
          } else {
            counted.push(`1\t${line}`);
          }
        }
      }
      return {
        lines: counted.map((entry) => {
          const tabIdx = entry.indexOf('\t');
          return makeLine(`${entry.slice(0, tabIdx).padStart(4, ' ')} ${entry.slice(tabIdx + 1)}`);
        }),
      };
    }

    case 'chmod': {
      if (args.length < 2) {
        return { lines: [makeLine('usage: chmod <octal-mode> <file>  (e.g. chmod 644 about.md)', 'warning')] };
      }
      const target = normalizePath(ctx.cwd, args[1]);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`chmod: cannot access '${args[1]}': No such file or directory`, 'error')] };
      }
      return {
        lines: [
          makeLine(
            `chmod: changing permissions of '${args[1]}' (${formatOctalMode(node)} -> ${args[0]}): Read-only file system (EPERM)`,
            'error',
          ),
        ],
      };
    }

    case 'cd': {
      const target = args[0] ? normalizePath(ctx.cwd, args[0]) : getHomeDir();
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`cd: ${args[0]}: No such file or directory`, 'error')] };
      }
      if (node.type !== 'dir') {
        return { lines: [makeLine(`cd: ${args[0]}: Not a directory`, 'error')] };
      }
      ctx.setCwd(target);
      return { lines: [] };
    }

    case 'vim':
    case 'vi': {
      const rawArg = args[0] ?? '~/site.conf';
      const target = normalizePath(ctx.cwd, rawArg);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`vim: ${rawArg}: No such file or directory (try: vim ~/site.conf)`, 'error')] };
      }
      if (node.type === 'dir') {
        return { lines: [makeLine(`vim: ${rawArg}: Is a directory`, 'error')] };
      }
      ctx.openVim(target, node);
      return {
        lines: [
          makeLine(
            `Opened ${formatDisplayPath(target)} in Vim (${node.readonly ? 'readonly' : 'fun local DOM sandbox — resets on reload'}).`,
            'accent',
          ),
        ],
      };
    }

    case 'cat': {
      if (!args[0]) {
        if (stdinLines !== undefined) {
          return { lines: stdinLines.map((l) => makeLine(l)) };
        }
        return { lines: [makeLine('usage: cat <file>', 'warning')] };
      }
      const target = normalizePath(ctx.cwd, args[0]);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`cat: ${args[0]}: No such file or directory`, 'error')] };
      }
      if (node.type === 'dir') {
        return { lines: [makeLine(`cat: ${args[0]}: Is a directory`, 'error')] };
      }
      const contentLines = (node.content ?? '').split('\n').map((l) => makeLine(l));
      if (node.sectionId) {
        contentLines.push(
          makeLine(`↳ Jump to #${node.sectionId} on page`, 'accent', {
            label: `goto #${node.sectionId}`,
            sectionId: node.sectionId,
          }),
        );
      }
      return { lines: contentLines };
    }

    case 'tree': {
      const target = args[0] ? normalizePath(ctx.cwd, args[0]) : ctx.cwd;
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`tree: '${args[0]}': No such file or directory`, 'error')] };
      }
      return { lines: buildTreeLines(node).map((l) => makeLine(l)) };
    }

    case 'grep':
    case 'search':
    case 'find': {
      if (stdinLines !== undefined) {
        let invert = false;
        let countOnly = false;
        let lineNumbers = false;
        const patternParts: string[] = [];

        for (const arg of args) {
          if (arg.startsWith('-') && arg.length > 1) {
            for (const ch of arg.slice(1)) {
              if (ch === 'v') invert = true;
              else if (ch === 'c') countOnly = true;
              else if (ch === 'n') lineNumbers = true;
              // -i is supported as default case-insensitive matching
            }
          } else {
            patternParts.push(arg);
          }
        }

        const pattern = patternParts.join(' ').trim();
        if (!pattern) {
          return { lines: [makeLine(`usage: ... | ${cmd} [-i|-v|-c|-n] <pattern>`, 'warning')] };
        }
        const q = pattern.toLowerCase();
        const matched: TerminalLine[] = [];
        stdinLines.forEach((line, idx) => {
          const isMatch = line.toLowerCase().includes(q);
          if (invert ? !isMatch : isMatch) {
            matched.push(makeLine(lineNumbers ? `${idx + 1}:${line}` : line));
          }
        });

        if (countOnly) {
          return { lines: [makeLine(String(matched.length))] };
        }
        return { lines: matched };
      }

      const query = args.join(' ').trim();
      if (!query) {
        return { lines: [makeLine(`usage: ${cmd} <keyword>  (e.g. ${cmd} Nessus)`, 'warning')] };
      }
      const hits = searchVfs(ctx.root, query);
      if (hits.length === 0) {
        return { lines: [makeLine(`No matches found for "${query}".`, 'muted')] };
      }
      const lines: TerminalLine[] = [
        makeLine(`Found ${hits.length} match(es) for "${query}":`, 'success'),
      ];
      for (const hit of hits.slice(0, 12)) {
        lines.push(
          makeLine(`${formatDisplayPath(hit.path)}`, 'accent', {
            label: hit.sectionId ? `goto #${hit.sectionId}` : 'cat',
            sectionId: hit.sectionId,
            command: hit.sectionId ? undefined : `cat ${hit.path}`,
          }),
        );
        if (hit.snippet) {
          lines.push(makeLine(`  ${hit.snippet}`, 'muted'));
        }
      }
      return { lines };
    }

    case 'goto':
    case 'open': {
      const rawTarget = args[0] ?? '';
      const section = rawTarget.replace(/^#/, '').toLowerCase();
      if (VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])) {
        ctx.scrollToSection(section);
        return { lines: [makeLine(`Scrolled to #${section}.`, 'success')] };
      }
      if (rawTarget) {
        const resolved = resolveNode(ctx.root, normalizePath(ctx.cwd, rawTarget));
        if (resolved?.sectionId) {
          ctx.scrollToSection(resolved.sectionId);
          return {
            lines: [
              makeLine(
                `Scrolled to #${resolved.sectionId} (via ${resolved.name}).`,
                'success',
                resolved.type === 'file' ? { label: 'cat', command: `cat ${rawTarget}` } : undefined,
              ),
            ],
          };
        }
      }
      return {
        lines: [
          makeLine(`Available sections: ${VALID_SECTIONS.join(', ')} (or pass any VFS file)`, 'warning'),
        ],
      };
    }

    case 'theme': {
      const mode = (args[0] ?? 'toggle').toLowerCase();
      if (mode === 'dark' || mode === 'light') {
        ctx.setTheme(mode);
        return { lines: [makeLine(`Theme switched to ${mode} mode.`, 'success')] };
      }
      ctx.toggleTheme();
      const next = ctx.theme === 'dark' ? 'light' : 'dark';
      return { lines: [makeLine(`Theme toggled to ${next} mode.`, 'success')] };
    }

    case 'lang': {
      ctx.toggleLang();
      const next = ctx.lang === 'zh' ? 'English (en)' : '繁體中文 (zh)';
      return { lines: [makeLine(`Language switched to ${next}.`, 'success')] };
    }

    case 'stego': {
      ctx.openStegoLab();
      return { lines: [makeLine('Launched LSB Image Steganography Lab (ISO/IEC 27701 local mode).', 'success')] };
    }

    case 'ps':
      return {
        lines: [
          makeLine('  PID TTY      STAT   TIME COMMAND', 'muted'),
          makeLine('    1 ?        Ss     0:01 /sbin/init --portfolio'),
          makeLine('   42 ?        Sl     0:04 /usr/bin/sherry-agentd --mode=autonomous'),
          makeLine('  108 ?        S      0:00 /usr/sbin/selinux-gcb-auditor'),
          makeLine('  256 pts/0    R+     0:00 /bin/chu-sh'),
        ],
      };

    case 'dmesg': {
      const bootLog = resolveNode(ctx.root, '/var/log/boot.log');
      return {
        lines: (bootLog?.content ?? '').split('\n').map((l) => makeLine(l, 'muted')),
      };
    }

    case 'neofetch':
      return {
        lines: [
          makeLine('   ██████╗██╗  ██╗██╗   ██╗   guest@chuos.local', 'accent'),
          makeLine('  ██╔════╝██║  ██║██║   ██║   -------------------------', 'accent'),
          makeLine(`  ██║     ███████║██║   ██║   OS      : ChuOS MiniKernel v1.0`, 'normal'),
          makeLine(`  ██║     ██╔══██║██║   ██║   Owner   : ${SITE_PROFILE.name.en} (${SITE_PROFILE.name.zh})`, 'normal'),
          makeLine(`  ╚██████╗██║  ██║╚██████╔╝   Uptime  : ${formatUptime(ctx.bootTimeMs)}`, 'normal'),
          makeLine(`   ╚═════╝╚═╝  ╚═╝ ╚═════╝    Records : ${PUBLICATIONS.length} papers · 1 flagship + ${PROJECTS.length} projects`, 'normal'),
          makeLine(`                              Theme   : ${ctx.theme} | Lang: ${ctx.lang}`, 'muted'),
          makeLine(`                              Stack   : Python · AI Agents · Image Security · Cloud GCB`, 'muted'),
        ],
      };

    case 'sudo': {
      const subCmd = args[0]?.toLowerCase() ?? '';
      if (args.join(' ').toLowerCase() === 'hire-me') {
        return {
          lines: [
            makeLine('[sudo] authenticating recruiter credentials... OK', 'success'),
            makeLine('Allocating Ph.D. Candidate (AI Systems & Cybersecurity)...', 'accent'),
            makeLine('Verifying 3-layer audit (Nessus / Trivy 0 CVE / Bandit 0 High) ... PASS', 'success'),
            makeLine('Verifying Linux GCB compliance: 66/66 ... PASS', 'success'),
            makeLine('Ready for collaboration! Expected graduation: Jul 2027.', 'warning', {
              label: 'goto #about',
              sectionId: 'about',
            }),
          ],
        };
      }
      if (subCmd === 'shutdown' || subCmd === 'poweroff' || subCmd === 'halt' || subCmd === 'reboot') {
        if (subCmd === 'reboot' || args.includes('-r')) {
          ctx.triggerReboot();
          return { lines: [makeLine('[sudo] Initiating ChuOS MiniKernel reboot...', 'warning')] };
        }
        ctx.triggerShutdown();
        return { lines: [makeLine('[sudo] Initiating ChuOS MiniKernel power-off...', 'warning')] };
      }
      return {
        lines: [makeLine('guest is not in the sudoers file. This incident will be reported to Sherry.', 'error')],
      };
    }

    case 'rm': {
      const joined = args.join(' ');
      if (joined.includes('-rf') && (joined.includes('/') || joined.includes('*'))) {
        ctx.triggerPanic();
        return {
          lines: [makeLine('KERNEL PANIC: Attempted to purge root VFS! Initiating emergency reboot...', 'error')],
        };
      }
      return { lines: [makeLine('rm: cannot remove: Read-only portfolio filesystem', 'error')] };
    }

    default:
      return {
        lines: [
          makeLine(`chu-sh: command not found: ${cmd}. Type "help" for available commands.`, 'error'),
        ],
      };
  }
}

export function getTabCompletion(input: string, cwd: string, root: VfsNode): string | null {
  const parts = input.split(' ');
  if (parts.length <= 1) {
    const prefix = parts[0]?.toLowerCase() ?? '';
    if (!prefix) return null;
    const match = AVAILABLE_COMMANDS.find((c) => c.startsWith(prefix));
    return match ? `${match} ` : null;
  }

  const lastToken = parts[parts.length - 1] ?? '';
  const slashIdx = lastToken.lastIndexOf('/');
  const dirPart = slashIdx >= 0 ? lastToken.slice(0, slashIdx + 1) : '';
  const filePrefix = slashIdx >= 0 ? lastToken.slice(slashIdx + 1) : lastToken;

  const lookupDir = dirPart ? normalizePath(cwd, dirPart) : cwd;
  const dirNode = resolveNode(root, lookupDir);
  if (!dirNode || dirNode.type !== 'dir' || !dirNode.children) return null;

  const names = Object.keys(dirNode.children);
  const match = names.find((name) => name.toLowerCase().startsWith(filePrefix.toLowerCase()));
  if (!match) return null;

  const matchedNode = dirNode.children[match];
  const suffix = matchedNode.type === 'dir' ? '/' : '';
  const completedToken = `${dirPart}${match}${suffix}`;
  return [...parts.slice(0, -1), completedToken].join(' ');
}
