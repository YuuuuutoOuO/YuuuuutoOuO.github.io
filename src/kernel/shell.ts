import { PROJECTS } from '../data/projects';
import { PUBLICATIONS } from '../data/publications';
import { SITE_PROFILE } from '../data/profile';
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
  setCwd: (path: string) => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  scrollToSection: (sectionId: string) => void;
  triggerPanic: () => void;
  openStegoLab: () => void;
  closeTerminal: () => void;
}

export interface ShellResult {
  lines: TerminalLine[];
  clear?: boolean;
}

const VALID_SECTIONS = ['about', 'publications', 'sherry', 'projects', 'experience', 'credentials'] as const;

export const AVAILABLE_COMMANDS = [
  'help',
  'ls',
  'll',
  'cd',
  'pwd',
  'cat',
  'stat',
  'file',
  'wc',
  'chmod',
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
  'whoami',
  'id',
  'ps',
  'uptime',
  'dmesg',
  'date',
  'echo',
  'sudo',
  'rm',
  'clear',
  'exit',
];

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

export function executeCommand(rawInput: string, ctx: ShellContext): ShellResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { lines: [] };

  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((t) => t.replace(/^"|"$/g, '')) ?? [];
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
          makeLine('  Inspect    : stat <path>, file <path>, wc <file>, chmod <mode> <file>'),
          makeLine('  Search     : grep <keyword>, search <keyword>, goto <section|file>'),
          makeLine('  Controls   : theme [light|dark|toggle], lang [toggle], stego'),
          makeLine('  System     : neofetch, uname -a, id, whoami, ps, uptime, dmesg, clear'),
          makeLine('  Easter Egg : sudo hire-me, rm -rf /', 'warning'),
          makeLine('Tip: Press Tab to autocomplete, ↑/↓ for history, drag edges to resize.', 'muted'),
        ],
      };

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
      if (!args[0]) {
        return { lines: [makeLine('usage: wc <file>', 'warning')] };
      }
      const target = normalizePath(ctx.cwd, args[0]);
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`wc: ${args[0]}: No such file or directory`, 'error')] };
      }
      if (node.type === 'dir') {
        return { lines: [makeLine(`wc: ${args[0]}: Is a directory`, 'error')] };
      }
      const text = node.content ?? '';
      const lineCount = text ? text.split('\n').length : 0;
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const byteCount = getNodeByteSize(node);
      return {
        lines: [
          makeLine(
            `${String(lineCount).padStart(4, ' ')} ${String(wordCount).padStart(5, ' ')} ${String(byteCount).padStart(6, ' ')} ${args[0]}`,
          ),
        ],
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

    case 'cat': {
      if (!args[0]) {
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
