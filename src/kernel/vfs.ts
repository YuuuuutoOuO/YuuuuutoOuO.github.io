import { SITE_PROFILE } from '../data/profile';
import { PUBLICATIONS } from '../data/publications';
import { PROJECTS } from '../data/projects';
import {
  SHERRY_AUDIT_COMPARISON,
  SHERRY_CORE_CAPABILITIES,
  SHERRY_META,
  SHERRY_OVERVIEW_OUTCOMES,
  SHERRY_SECURITY_TOOLS,
} from '../data/sherry';
import { EDUCATION, EXPERIENCE, RESEARCH_GRANTS } from '../data/experience';
import { AWARDS, CERTIFICATIONS, SKILL_GROUPS } from '../data/credentials';
import type { Language } from '../types/portfolio';

export type VfsNodeType = 'dir' | 'file';

export interface VfsNode {
  name: string;
  type: VfsNodeType;
  content?: string;
  children?: Record<string, VfsNode>;
  sectionId?: string;
  url?: string;
  readonly?: boolean;
  mode?: number;
  owner?: string;
  group?: string;
  mtime?: string;
  inode?: number;
}

const DEFAULT_MTIME = 'Nov 27 14:18';

export function getNodeMode(node: VfsNode): number {
  if (typeof node.mode === 'number') return node.mode;
  if (node.type === 'dir') return 0o755;
  return node.readonly ? 0o444 : 0o644;
}

export function formatOctalMode(node: VfsNode): string {
  return getNodeMode(node).toString(8).padStart(4, '0');
}

export function formatPermissions(node: VfsNode): string {
  const mode = getNodeMode(node);
  const typeChar = node.type === 'dir' ? 'd' : '-';
  const triad = (shift: number) => {
    const bits = (mode >> shift) & 0b111;
    return `${bits & 4 ? 'r' : '-'}${bits & 2 ? 'w' : '-'}${bits & 1 ? 'x' : '-'}`;
  };
  return `${typeChar}${triad(6)}${triad(3)}${triad(0)}`;
}

export function getNodeByteSize(node: VfsNode): number {
  if (node.type === 'dir') return 4096;
  const text = node.content ?? '';
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length;
}

export function formatHumanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}K`;
}

export function getNodeLinkCount(node: VfsNode): number {
  if (node.type !== 'dir' || !node.children) return 1;
  const subdirs = Object.values(node.children).filter((c) => c.type === 'dir').length;
  return 2 + subdirs;
}

function hydrateVfsMetadata(
  node: VfsNode,
  inSystemTree: boolean,
  counter: { nextInode: number },
  parentOwner = 'root',
  parentGroup = 'root',
): void {
  node.inode = counter.nextInode++;
  if (!node.mtime) node.mtime = DEFAULT_MTIME;
  if (typeof node.mode !== 'number') {
    node.mode = node.type === 'dir' ? 0o755 : node.readonly ? 0o444 : 0o644;
  }
  if (!node.owner) node.owner = inSystemTree ? parentOwner : 'guest';
  if (!node.group) node.group = inSystemTree ? parentGroup : 'guest';

  if (node.type === 'dir' && node.children) {
    for (const child of Object.values(node.children)) {
      const childIsSystem =
        inSystemTree && child.name !== 'guest' && !(node.name === 'home' && child.name === 'guest');
      hydrateVfsMetadata(
        child,
        node.name === 'home' && child.name === 'guest' ? false : childIsSystem,
        counter,
        node.owner,
        node.group,
      );
    }
  }
}

export interface SearchHit {
  path: string;
  name: string;
  snippet: string;
  sectionId?: string;
}

const HOME_DIR = '/home/guest';

export function getHomeDir(): string {
  return HOME_DIR;
}

export function buildVfs(lang: Language, bootTimeMs: number): VfsNode {
  const isZh = lang === 'zh';
  const pick = (text: { zh: string; en: string }) => (isZh ? text.zh : text.en);

  const pubFiles: Record<string, VfsNode> = {};
  for (const pub of PUBLICATIONS) {
    const filename = `${pub.id}.txt`;
    pubFiles[filename] = {
      name: filename,
      type: 'file',
      sectionId: 'publications',
      url: pub.url,
      content: [
        `Title   : ${pub.title}`,
        `Authors : ${pub.authors.join(', ')}`,
        `Venue   : ${pub.venue}`,
        pub.badge ? `Type    : ${pick(pub.badge)}` : null,
        pub.award ? `Award   : ${pick(pub.award)}` : null,
        pub.doi ? `DOI     : ${pub.doi}` : null,
        `Tags    : ${pub.tags.join(', ')}`,
        '',
        '--- BibTeX ---',
        pub.bibtex,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
    };
  }

  const projectFiles: Record<string, VfsNode> = {};
  for (const proj of PROJECTS) {
    const filename = `${proj.id}.md`;
    projectFiles[filename] = {
      name: filename,
      type: 'file',
      sectionId: 'projects',
      url: proj.repoUrl,
      content: [
        `# ${pick(proj.title)}`,
        `${pick(proj.subtitle)} | ${proj.period}`,
        `Role: ${pick(proj.role)}`,
        '',
        pick(proj.summary),
        '',
        'Highlights:',
        ...proj.highlights.map((h) => `  - ${pick(h)}`),
        '',
        'Outcomes:',
        ...proj.outcomes.map((o) => `  * ${pick(o)}`),
        '',
        `Tech Stack: ${proj.techStack.join(', ')}`,
        proj.repoUrl ? `Repo: ${proj.repoUrl}` : null,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
    };
  }

  const aboutContent = [
    `${SITE_PROFILE.name.zh} (${SITE_PROFILE.name.en})`,
    pick(SITE_PROFILE.headline),
    pick(SITE_PROFILE.affiliation),
    `Location: ${pick(SITE_PROFILE.location)}`,
    `GitHub  : ${SITE_PROFILE.links.github}`,
    '',
    pick(SITE_PROFILE.bio),
    '',
    'Research Interests:',
    ...SITE_PROFILE.researchInterests.map((item) => `  - ${pick(item)}`),
    '',
    `Note: ${pick(SITE_PROFILE.seekingNotice)}`,
  ].join('\n');

  const educationContent = EDUCATION.map((ed) =>
    [
      `[${ed.period}] ${pick(ed.degree)}`,
      `  ${pick(ed.institution)} — ${pick(ed.department)}`,
      ed.note ? `  ${pick(ed.note)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  ).join('\n\n');

  const experienceContent = EXPERIENCE.map((exp) =>
    [
      `[${exp.period}] ${pick(exp.role)}`,
      `  @ ${pick(exp.organization)}`,
      ...exp.bullets.map((b) => `  - ${pick(b)}`),
      `  Tags: ${exp.tags.join(', ')}`,
    ].join('\n'),
  ).join('\n\n');

  const grantsContent = RESEARCH_GRANTS.map((g) =>
    [
      `[${g.period}] ${pick(g.title)}`,
      `  Agency: ${pick(g.agency)}${g.code ? ` (${g.code})` : ''}`,
      `  Role  : ${pick(g.role)}`,
    ].join('\n'),
  ).join('\n\n');

  const awardsContent = AWARDS.map((a) =>
    [`[${a.date}] ${pick(a.title)}`, `  Event : ${pick(a.event)}`, `  Detail: ${pick(a.detail)}`].join('\n'),
  ).join('\n\n');

  const certsContent = CERTIFICATIONS.map(
    (c) => `[${c.date}] ${c.name}\n  Issuer: ${pick(c.issuer)} (${c.category})`,
  ).join('\n\n');

  const skillsContent = SKILL_GROUPS.map(
    (g) => `[${pick(g.title)}]\n  ${g.skills.join(' · ')}`,
  ).join('\n\n');

  const sherryOverviewContent = [
    `# ${pick(SHERRY_META.name)}`,
    `Public Release: ${SHERRY_META.publicRelease} | Internal Audit: ${SHERRY_META.devMilestone} | ${SHERRY_META.period}`,
    `Role: ${pick(SHERRY_META.role)}`,
    '',
    pick(SHERRY_META.summary),
    '',
    pick(SHERRY_META.versionNotice),
    '',
    'Key Outcomes:',
    ...SHERRY_OVERVIEW_OUTCOMES.map((o) => `  * ${pick(o)}`),
    '',
    'Core Capabilities (v1.10.0):',
    ...SHERRY_CORE_CAPABILITIES.map((c) => `  - ${pick(c.title)}: ${pick(c.summary)}`),
    '',
    `Tech Stack: ${SHERRY_META.techStack.join(', ')}`,
    `Repo: ${SHERRY_META.repoUrl}`,
  ].join('\n');

  const sherrySecurityContent = [
    '# Sherry 3-Layer Security Audit (DAST + SCA/Secrets + SAST)',
    `Scope: Web UI (${SHERRY_META.publicRelease}) & Codebase Hardening (${SHERRY_META.devMilestone})`,
    '',
    'Tools:',
    ...SHERRY_SECURITY_TOOLS.map(
      (tool) => `  - ${tool.tool} (${tool.version}) [${pick(tool.badge)}]: ${pick(tool.headline)}`,
    ),
    '',
    'Remediation Summary (Before -> After):',
    ...SHERRY_AUDIT_COMPARISON.map(
      (row) => `  * ${pick(row.category)}: ${pick(row.before)} -> ${pick(row.after)}`,
    ),
  ].join('\n');

  const uptimeSec = Math.max(1, Math.floor((Date.now() - bootTimeMs) / 1000));

  const root: VfsNode = {
    name: '/',
    type: 'dir',
    mode: 0o755,
    owner: 'root',
    group: 'root',
    children: {
      home: {
        name: 'home',
        type: 'dir',
        mode: 0o755,
        owner: 'root',
        group: 'root',
        children: {
          guest: {
            name: 'guest',
            type: 'dir',
            mode: 0o750,
            owner: 'guest',
            group: 'guest',
            children: {
              '.bashrc': {
                name: '.bashrc',
                type: 'file',
                mode: 0o644,
                content: [
                  '# ~/.bashrc: executed by chu-sh for interactive shells.',
                  'export PS1="guest@chuos:\\w$ "',
                  'export LANG="zh_TW.UTF-8"',
                  'alias ll="ls -la"',
                  'alias la="ls -a"',
                ].join('\n'),
              },
              '.profile': {
                name: '.profile',
                type: 'file',
                mode: 0o644,
                content: '# ~/.profile: ChuOS guest session environment\nPATH="/usr/local/bin:/usr/bin:/bin"\n',
              },
              'about.md': {
                name: 'about.md',
                type: 'file',
                sectionId: 'about',
                content: aboutContent,
              },
              publications: {
                name: 'publications',
                type: 'dir',
                sectionId: 'publications',
                children: pubFiles,
              },
              sherry: {
                name: 'sherry',
                type: 'dir',
                sectionId: 'sherry',
                children: {
                  'overview.md': {
                    name: 'overview.md',
                    type: 'file',
                    sectionId: 'sherry',
                    url: SHERRY_META.repoUrl,
                    content: sherryOverviewContent,
                  },
                  'security-audit.md': {
                    name: 'security-audit.md',
                    type: 'file',
                    sectionId: 'sherry',
                    content: sherrySecurityContent,
                  },
                },
              },
              projects: {
                name: 'projects',
                type: 'dir',
                sectionId: 'projects',
                children: projectFiles,
              },
              experience: {
                name: 'experience',
                type: 'dir',
                sectionId: 'experience',
                children: {
                  'education.txt': {
                    name: 'education.txt',
                    type: 'file',
                    sectionId: 'experience',
                    content: educationContent,
                  },
                  'experience.txt': {
                    name: 'experience.txt',
                    type: 'file',
                    sectionId: 'experience',
                    content: experienceContent,
                  },
                  'grants.txt': {
                    name: 'grants.txt',
                    type: 'file',
                    sectionId: 'experience',
                    content: grantsContent,
                  },
                },
              },
              credentials: {
                name: 'credentials',
                type: 'dir',
                sectionId: 'credentials',
                children: {
                  'awards.txt': {
                    name: 'awards.txt',
                    type: 'file',
                    sectionId: 'credentials',
                    content: awardsContent,
                  },
                  'certifications.txt': {
                    name: 'certifications.txt',
                    type: 'file',
                    sectionId: 'credentials',
                    content: certsContent,
                  },
                  'skills.txt': {
                    name: 'skills.txt',
                    type: 'file',
                    sectionId: 'credentials',
                    content: skillsContent,
                  },
                },
              },
            },
          },
        },
      },
      etc: {
        name: 'etc',
        type: 'dir',
        children: {
          'os-release': {
            name: 'os-release',
            type: 'file',
            mode: 0o644,
            readonly: true,
            content: [
              'NAME="ChuOS MiniKernel"',
              'VERSION="1.0.0-agent"',
              'ID=chuos',
              'PRETTY_NAME="ChuOS 1.0 (Agent-Powered Portfolio Kernel)"',
              'HOME_URL="https://github.com/YuuuuutoOuO"',
            ].join('\n'),
          },
          hostname: {
            name: 'hostname',
            type: 'file',
            mode: 0o644,
            readonly: true,
            content: 'chuos.local',
          },
        },
      },
      proc: {
        name: 'proc',
        type: 'dir',
        mode: 0o555,
        children: {
          uptime: {
            name: 'uptime',
            type: 'file',
            mode: 0o444,
            readonly: true,
            content: `${uptimeSec}.00 ${Math.floor(uptimeSec * 0.92)}.42`,
          },
          version: {
            name: 'version',
            type: 'file',
            mode: 0o444,
            readonly: true,
            content: 'ChuOS version 1.0.0-agent (vite@6 + react@18) #1 SMP PREEMPT_DYNAMIC',
          },
        },
      },
      var: {
        name: 'var',
        type: 'dir',
        children: {
          log: {
            name: 'log',
            type: 'dir',
            mode: 0o755,
            owner: 'root',
            group: 'adm',
            children: {
              'boot.log': {
                name: 'boot.log',
                type: 'file',
                mode: 0o640,
                owner: 'root',
                group: 'adm',
                readonly: true,
                content: [
                  '[    0.000000] Booting ChuOS MiniKernel v1.0.0-agent...',
                  '[    0.012401] VFS: Mounted /home/guest (portfoliofs, ro, nosuid, nodev)',
                  `[    0.024882] Loaded ${PUBLICATIONS.length} publications, 1 flagship (Sherry) + ${PROJECTS.length} projects, ${CERTIFICATIONS.length} certifications`,
                  '[    0.041920] Security: SELinux=enforcing, Nessus=0-crit, Trivy=0-CVE, Bandit=0-high, GCB=100%',
                  '[    0.058110] Agent Daemon (sherry-core): READY',
                  '[    0.064000] Welcome! Type "help", "ls -la", or "stat about.md" to explore.',
                ].join('\n'),
              },
            },
          },
        },
      },
    },
  };

  hydrateVfsMetadata(root, true, { nextInode: 1001 });
  return root;
}

export function normalizePath(cwd: string, target: string): string {
  if (!target || target === '~') return HOME_DIR;
  let raw = target;
  if (raw.startsWith('~/')) {
    raw = `${HOME_DIR}/${raw.slice(2)}`;
  }
  const combined = raw.startsWith('/') ? raw : `${cwd}/${raw}`;
  const parts = combined.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}

export function resolveNode(root: VfsNode, absPath: string): VfsNode | null {
  if (absPath === '/') return root;
  const parts = absPath.split('/').filter(Boolean);
  let current: VfsNode = root;
  for (const part of parts) {
    if (current.type !== 'dir' || !current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  return current;
}

export function formatDisplayPath(absPath: string): string {
  if (absPath === HOME_DIR) return '~';
  if (absPath.startsWith(`${HOME_DIR}/`)) {
    return `~${absPath.slice(HOME_DIR.length)}`;
  }
  return absPath;
}

export function buildTreeLines(node: VfsNode, prefix = '', isLast = true, isRoot = true): string[] {
  const lines: string[] = [];
  if (isRoot) {
    lines.push(node.name === '/' ? '/' : node.name);
  } else {
    const connector = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${connector}${node.name}${node.type === 'dir' ? '/' : ''}`);
  }

  if (node.type === 'dir' && node.children) {
    const entries = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const nextPrefix = isRoot ? '' : `${prefix}${isLast ? '    ' : '│   '}`;
    entries.forEach((child, index) => {
      lines.push(...buildTreeLines(child, nextPrefix, index === entries.length - 1, false));
    });
  }
  return lines;
}

export function searchVfs(root: VfsNode, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  const walk = (node: VfsNode, currentPath: string) => {
    if (node.type === 'file') {
      const content = node.content ?? '';
      const nameMatch = node.name.toLowerCase().includes(q);
      const lines = content.split('\n');
      const matchedLine = lines.find((line) => line.toLowerCase().includes(q));
      if (nameMatch || matchedLine) {
        hits.push({
          path: currentPath,
          name: node.name,
          snippet: (matchedLine ?? lines[0] ?? '').trim().slice(0, 110),
          sectionId: node.sectionId,
        });
      }
      return;
    }

    if (node.children) {
      for (const child of Object.values(node.children)) {
        const nextPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
        walk(child, nextPath);
      }
    }
  };

  walk(root, '/');
  return hits;
}
