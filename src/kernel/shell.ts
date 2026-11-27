import { PROJECTS } from '../data/projects';
import { PUBLICATIONS } from '../data/publications';
import { SITE_PROFILE } from '../data/profile';
import type { Language } from '../types/portfolio';
import type { ThemeMode } from '../context/ThemeContext';
import {
  buildTreeLines,
  formatDisplayPath,
  getHomeDir,
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
  'cd',
  'pwd',
  'cat',
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
          makeLine('  Navigation : ls [dir], cd <dir>, pwd, cat <file>, tree [dir]'),
          makeLine('  Search     : grep <keyword>, search <keyword>, goto <section>'),
          makeLine('  Controls   : theme [light|dark|toggle], lang [toggle], stego'),
          makeLine('  System     : neofetch, uname -a, ps, uptime, dmesg, whoami, clear'),
          makeLine('  Easter Egg : sudo hire-me, rm -rf /', 'warning'),
          makeLine('Tip: Press Tab to autocomplete, ↑/↓ for history, Esc to close.', 'muted'),
        ],
      };

    case 'pwd':
      return { lines: [makeLine(ctx.cwd)] };

    case 'whoami':
      return { lines: [makeLine('guest@chuos.local (read-only visitor)')] };

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

    case 'ls': {
      const target = args[0] ? normalizePath(ctx.cwd, args[0]) : ctx.cwd;
      const node = resolveNode(ctx.root, target);
      if (!node) {
        return { lines: [makeLine(`ls: cannot access '${args[0]}': No such file or directory`, 'error')] };
      }
      if (node.type === 'file') {
        return { lines: [makeLine(node.name)] };
      }
      const entries = Object.values(node.children ?? {}).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      if (entries.length === 0) {
        return { lines: [makeLine('(empty directory)', 'muted')] };
      }
      return {
        lines: entries.map((entry) =>
          makeLine(
            entry.type === 'dir' ? `${entry.name}/` : entry.name,
            entry.type === 'dir' ? 'accent' : 'normal',
            entry.type === 'file'
              ? { label: 'cat', command: `cat ${target === '/' ? '' : target}/${entry.name}`.replace('//', '/') }
              : { label: 'cd', command: `cd ${target === '/' ? '' : target}/${entry.name}`.replace('//', '/') },
          ),
        ),
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
      const section = (args[0] ?? '').replace(/^#/, '').toLowerCase();
      if (!VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])) {
        return {
          lines: [
            makeLine(`Available sections: ${VALID_SECTIONS.join(', ')}`, 'warning'),
          ],
        };
      }
      ctx.scrollToSection(section);
      return { lines: [makeLine(`Scrolled to #${section}.`, 'success')] };
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
