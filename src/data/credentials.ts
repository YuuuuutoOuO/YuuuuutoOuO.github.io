import type { AwardItem, CertificationItem, SkillGroup } from '../types/portfolio';

/**
 * Honors, Certifications, and Technical Skills.
 * Privacy note: Certificate serial numbers and verification codes are intentionally omitted.
 */
export const AWARDS: AwardItem[] = [
  {
    id: 'asse-2024-best-presentation',
    title: {
      zh: 'Best Presentation Award（最佳論文發表獎）',
      en: 'Best Presentation Award',
    },
    event: {
      zh: 'ACM ASSE 2024 — 第五屆亞洲服務科學與軟體工程研討會（東京大學）',
      en: 'ACM ASSE 2024 — 5th Asia Service Sciences and Software Engineering Conference (The University of Tokyo)',
    },
    date: '2024/09',
    detail: {
      zh: '論文「Adaptive and Effective Data Hiding Scheme for AMBTC Compression Codes」獲 Session 6 主席評選為最佳口頭發表。',
      en: 'Selected as Best Oral Presentation in Session 6 for "Adaptive and Effective Data Hiding Scheme for AMBTC Compression Codes".',
    },
  },
];

export const CERTIFICATIONS: CertificationItem[] = [
  {
    id: 'iso-27701-2025',
    name: 'ISO/IEC 27701:2025 PIMS Lead Auditor Conversion Training',
    issuer: { zh: 'AFNOR Certification（16 小時結業）', en: 'AFNOR Certification (16-Hour Course)' },
    date: '2026/09',
    category: 'security',
  },
  {
    id: 'iso-27001',
    name: 'ISO/IEC 27001:2022 ISMS Lead Auditor Training',
    issuer: { zh: 'AFNOR Certification（40 小時結業）', en: 'AFNOR Certification (40-Hour Course)' },
    date: '2025/06',
    category: 'security',
  },
  {
    id: 'ccst-cybersecurity',
    name: 'Cisco Certified Support Technician (CCST) — Cybersecurity',
    issuer: { zh: 'Cisco', en: 'Cisco' },
    date: '2026/03',
    category: 'security',
  },
  {
    id: 'ccst-networking',
    name: 'Cisco Certified Support Technician (CCST) — Networking',
    issuer: { zh: 'Cisco', en: 'Cisco' },
    date: '2026/03',
    category: 'networking',
  },
  {
    id: 'ccst-it-support',
    name: 'Cisco Certified Support Technician (CCST) — IT Support',
    issuer: { zh: 'Cisco', en: 'Cisco' },
    date: '2026/03',
    category: 'networking',
  },
  {
    id: 'hardware-class-b',
    name: '中華民國乙級電腦硬體裝修技術士',
    issuer: { zh: '勞動部勞動力發展署技能檢定中心', en: 'Workforce Development Agency, Ministry of Labor (Taiwan)' },
    date: 'Class B Technician',
    category: 'engineering',
  },
  {
    id: 'sse-python-java',
    name: 'Python Language Today & Java Language Today',
    issuer: { zh: 'Silicon Stone Education (SSE)', en: 'Silicon Stone Education (SSE)' },
    date: '2019',
    category: 'engineering',
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'image-security',
    title: { zh: '影像安全與深度學習', en: 'Image Security & Deep Learning' },
    skills: [
      'Steganography & Steganalysis',
      'Reversible Data Hiding (RDH)',
      'Digital Watermarking',
      'TensorFlow / Keras',
      'OpenCV',
      'SRM / Haar Wavelet',
      'YOLOv5',
    ],
  },
  {
    id: 'ai-systems',
    title: { zh: 'AI Agent 與 LLM 系統工程', en: 'AI Agent & LLM Engineering' },
    skills: [
      'Python (asyncio)',
      'FastAPI / Quart / Flask',
      'vLLM / Ollama / LM Studio',
      'KV Cache / Prefix Caching',
      'ReAct & Tool Calling',
      'SQLite WAL',
      'Clean Architecture',
    ],
  },
  {
    id: 'cloud-security',
    title: { zh: '資安合規與系統開發', en: 'Cybersecurity & Software Systems' },
    skills: [
      'Linux (RHEL) & Bash',
      'SELinux & TWGCB',
      'Microsoft Azure Baseline',
      'ISO/IEC 27001:2022',
      'ISO/IEC 27701:2025',
      'Tenable Nessus',
      'C# (.NET 8) / WinForms / MSAGL',
      'SQL Server / Docker / GitHub Actions',
    ],
  },
];
