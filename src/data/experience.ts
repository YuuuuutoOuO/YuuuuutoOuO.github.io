import type { EducationItem, ExperienceItem, ResearchGrant } from '../types/portfolio';

export const EDUCATION: EducationItem[] = [
  {
    id: 'ncut-phd',
    degree: {
      zh: '博士候選人（Ph.D. Candidate）',
      en: 'Ph.D. Candidate',
    },
    institution: {
      zh: '國立勤益科技大學',
      en: 'National Chin-Yi University of Technology (NCUT)',
    },
    department: {
      zh: '前瞻電資科技研究所',
      en: 'Ph.D. Program in Prospective Technology of Electrical Engineering and Computer Science',
    },
    period: '2023/08 – 2027/07 (Expected)',
    note: {
      zh: '研究方向：影像隱寫與數位鑑識（DLC-Stego / ETF-UNet）、醫療影像安全與 AI 系統工程',
      en: 'Research: Image Steganography & Digital Forensics (DLC-Stego / ETF-UNet), Medical Image Security & AI Systems',
    },
  },
  {
    id: 'ncut-ms',
    degree: {
      zh: '工學碩士（M.S.）',
      en: 'M.S. in Computer Science and Information Engineering',
    },
    institution: {
      zh: '國立勤益科技大學',
      en: 'National Chin-Yi University of Technology (NCUT)',
    },
    department: {
      zh: '資訊工程系',
      en: 'Department of Computer Science and Information Engineering',
    },
    period: '2021/08 – 2023/08',
  },
  {
    id: 'ncut-bs',
    degree: {
      zh: '工學學士（B.S.）',
      en: 'B.S. in Computer Science and Information Engineering',
    },
    institution: {
      zh: '國立勤益科技大學',
      en: 'National Chin-Yi University of Technology (NCUT)',
    },
    department: {
      zh: '資訊工程系',
      en: 'Department of Computer Science and Information Engineering',
    },
    period: '2017/08 – 2021/07',
  },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 'research-assistant',
    role: {
      zh: 'AI 與資安專案研究助理',
      en: 'AI & Cybersecurity Research Assistant',
    },
    organization: {
      zh: '國立勤益科技大學 ／ 國家資通安全研究院（NICS）合作計畫',
      en: 'National Chin-Yi University of Technology / NICS Collaborative Projects',
    },
    period: '2022/09 – Present',
    bullets: [
      {
        zh: '參與國科會醫療與工業影像安全研究計畫，發表 5 篇 SCI 期刊與 5 篇國際研討會論文。',
        en: 'Conducted NSTC-funded medical & industrial image security research, resulting in 5 SCI journal papers and 5 international conference papers.',
      },
      {
        zh: '參與 2 項國家資通安全研究院（NICS）計畫：負責 Linux GCB（TWGCB-01-008）Bash 檢測腳本與雙向驗證，以及政府 Azure 雲端安全組態基準（176 項）四大構面制定。',
        en: 'Contributed to 2 NICS projects: Linux GCB (TWGCB-01-008) Bash compliance scripts with bidirectional testing, and 4 core domains of the 176-item Government Azure Security Baseline.',
      },
      {
        zh: '協助校內 ISO/IEC 27001:2022 初步內部稽核（10+ 處室），並以 Tenable Nessus 執行多批次外部資通系統與端點主機弱點掃描及複測。',
        en: 'Assisted with campus ISO/IEC 27001:2022 internal audits (10+ departments) and conducted multi-batch Tenable Nessus vulnerability scanning & rescans for web systems and endpoints.',
      },
    ],
    tags: ['Image Security', 'NICS', 'Linux GCB', 'Azure Baseline', 'ISO 27001', 'Tenable Nessus'],
  },
  {
    id: 'industry-intern',
    role: {
      zh: '軟體研發實習工程師（博士生產學合作）',
      en: 'Software R&D Intern (Ph.D. Industry-Academia Collaboration)',
    },
    organization: {
      zh: '製造業產學合作夥伴（去識別化）',
      en: 'Manufacturing Industry Partner (De-identified)',
    },
    period: '2023/09 – Present',
    bullets: [
      {
        zh: '設計並開發精實管理智慧流程圖與產線管制系統（C# .NET 8、三層式架構），串接資料庫與 Excel 雙軌資料源。',
        en: 'Designed and developed a lean manufacturing intelligent flowchart & production control system (C# .NET 8, 3-tier architecture) supporting both SQL Server and Excel inputs.',
      },
      {
        zh: '以 Microsoft MSAGL 實作魚骨圖自動拓撲排版，並建置派工卡、缺料預警與工時統計看板，將流程圖產製時間由數小時縮短至數秒內。',
        en: 'Built automated fishbone topology layout using Microsoft MSAGL along with dispatch, shortage alert, and work-hour dashboards—cutting preparation time from hours to seconds.',
      },
    ],
    tags: ['C# (.NET 8)', 'WinForms', 'MSAGL', 'SQL Server', 'Lean Manufacturing'],
  },
];

export const RESEARCH_GRANTS: ResearchGrant[] = [
  {
    id: 'nics-2025',
    title: {
      zh: '政府雲端安全組態基準設計與檢測技術實現',
      en: 'Government Cloud Security Configuration Baseline Design & Auditing Technology',
    },
    agency: { zh: '國家資通安全研究院（NICS）', en: 'NICS' },
    period: '2025/09 – 2026/08',
    role: {
      zh: 'Azure 基準制定（身分識別、資料庫、計算機、網路四構面）',
      en: 'Azure Baseline Contributor (Identity, Database, Compute, Networking)',
    },
  },
  {
    id: 'nstc-2025',
    title: {
      zh: '整合 IoT 裝置與雲端服務情境之醫療資料安全機制研究（2/3）',
      en: 'Medical Data Security Mechanisms for Integrated IoT and Cloud Service Scenarios (2/3)',
    },
    agency: { zh: '國家科學及技術委員會（NSTC）', en: 'NSTC' },
    code: 'NSTC 113-2410-H-167-012-MY3',
    period: '2025/10 – 2026/07',
    role: { zh: '影像隱寫與資料隱藏研究', en: 'Image Steganography & Data Hiding Research' },
  },
  {
    id: 'nics-2023',
    title: {
      zh: '雲端安全組態檢測與驗證技術',
      en: 'Cloud Security Configuration Auditing & Verification Technology',
    },
    agency: { zh: '國家資通安全研究院（NICS）', en: 'NICS' },
    period: '2023/12 – 2024/07',
    role: {
      zh: 'Linux GCB Bash 自動化檢測腳本與雙向測試驗證',
      en: 'Linux GCB Bash Automation & Bidirectional Verification',
    },
  },
  {
    id: 'nstc-2024',
    title: {
      zh: '整合深度學習與區塊鏈之工業影像安全保護與追蹤管理機制（2/2）',
      en: 'Industrial Image Security Protection & Tracking Integrating Deep Learning and Blockchain (2/2)',
    },
    agency: { zh: '國家科學及技術委員會（NSTC）', en: 'NSTC' },
    code: 'NSTC 111-2410-H-167-005-MY2',
    period: '2024/01 – 2024/07',
    role: { zh: '影像隱寫與資料隱藏研究', en: 'Image Steganography & Data Hiding Research' },
  },
];
