import type { ProjectItem } from '../types/portfolio';

/**
 * Featured research & engineering projects.
 * Privacy note: Industry-academia project is de-identified; no internal DB schema, SP names, or proprietary screenshots are included.
 */
export const PROJECTS: ProjectItem[] = [
  {
    id: 'dlc-stego',
    title: {
      zh: 'DLC-Stego — 影像隱寫酬載定位與分類鑑識框架',
      en: 'DLC-Stego — Two-Stage Steganographic Payload Localization & Classification',
    },
    subtitle: {
      zh: '博士核心研究 · ETF-UNet + DR-CNN 雙階段深度學習框架',
      en: 'Ph.D. Core Research · ETF-UNet + DR-CNN Two-Stage Deep Learning Framework',
    },
    period: '2025/12 – Present',
    category: 'security-forensics',
    categoryLabel: { zh: '影像資安 / 深度學習', en: 'Security & Deep Learning' },
    role: {
      zh: '演算法設計、深度學習模型實作與實驗自動化平台開發',
      en: 'Lead Researcher, Model Architecture & Experiment Platform Developer',
    },
    summary: {
      zh: '針對 APT 攻擊利用影像局部區域夾帶 2-bit LSB 惡意酬載的威脅，設計「先定位、再分類」兩階段鑑識管線，將傳統全圖二元分類提升至像素級異常定位與六類負載辨識。',
      en: 'Designed a "locate-then-classify" two-stage forensic pipeline against APT attacks hiding 2-bit LSB malicious payloads in localized image regions, advancing from binary detection to pixel-level localization and 6-class payload classification.',
    },
    highlights: [
      {
        zh: '第一階段 ETF-UNet：融合 SRM 高通殘差濾波（空間域）、Haar 小波分解（頻率域）、ResBlock、CBAM 注意力與 ASPP 多尺度模組，精準定位微小嵌入區域遮罩。',
        en: 'Stage 1 (ETF-UNet): Fuses SRM high-pass residuals, Haar wavelets, ResBlocks, CBAM attention, and ASPP multi-scale modules for pixel-level anomaly mask prediction.',
      },
      {
        zh: '第二階段 DR-CNN：開發 TensorFlow 2-bit LSB 位元平面萃取層，搭配硬遮罩空間閘門與加權 Focal Loss 抑制正常背景干擾（參數量約 1.21M）。',
        en: 'Stage 2 (DR-CNN): Custom TensorFlow 2-bit LSB bit-plane extraction layer with hard-mask spatial gating and weighted Focal Loss (~1.21M parameters).',
      },
      {
        zh: '嚴謹科研驗證：建立 Cover MD5 / NPY 去重與 Payload 交集檢查防止資料洩漏，並建置 Flask + Tailwind Web 實驗管理控制台支援日誌串流與報表匯出。',
        en: 'Leakage-free 8:1:1 pipeline (Cover MD5, window dedup, payload disjointness checks) with a Flask + Tailwind web console for experiment lifecycle & Excel reporting.',
      },
    ],
    outcomes: [
      {
        zh: 'DR-CNN 在六類負載（Clean / HTML / JS / PowerShell / URL / ETH Address）基準達 95% 準確率',
        en: 'DR-CNN achieves 95% accuracy across 6 payload classes (Clean, HTML, JS, PowerShell, URL, ETH)',
      },
      {
        zh: '涵蓋 0.6%–25% 局部嵌入比例評估與 BOSSBase / BOWS2 標準驗證',
        en: 'Evaluated across 0.6%–25% localized embedding ratios on BOSSBase / BOWS2 benchmarks',
      },
    ],
    techStack: ['TensorFlow / Keras', 'Python', 'OpenCV', 'SRM / Haar Wavelet', 'Flask', 'Tailwind CSS'],
    featured: true,
  },
  {
    id: 'nics-azure-baseline',
    title: {
      zh: '政府雲端安全組態基準設計與檢測技術實現（Azure）',
      en: 'Government Cloud Security Configuration Baseline Design (Microsoft Azure)',
    },
    subtitle: {
      zh: '國家資通安全研究院（NICS）研究計畫',
      en: 'National Institute of Cyber Security (NICS) Project',
    },
    period: '2025/09 – 2026/08',
    category: 'security-forensics',
    categoryLabel: { zh: '雲端資安 / 合規', en: 'Cloud Security' },
    role: {
      zh: 'Azure 雲端安全組態基準制定成員（負責四大核心構面）',
      en: 'Cloud Security Baseline Contributor (4 Core Domains)',
    },
    summary: {
      zh: '以 CIS Microsoft Azure Foundations Benchmark 5.0 為基礎，對映 ISO/IEC 27001、ISO/IEC 27701 與我國資安法規，制定可落地於政府機關的 Azure 雲端安全組態基準。',
      en: 'Localized CIS Microsoft Azure Foundations Benchmark 5.0 to align with ISO/IEC 27001, ISO/IEC 27701, and national cybersecurity regulations for government cloud deployments.',
    },
    highlights: [
      {
        zh: '負責「身分識別」、「資料庫服務」、「計算機服務」與「網路服務」四個核心安全構面。',
        en: 'Owned four core security domains: Identity, Database Services, Compute Services, and Networking Services.',
      },
      {
        zh: '逐項完成法規條文對映、組態檢測方式撰寫與修正指引（Remediation），並定期與資安院團隊對焦。',
        en: 'Authored regulatory mappings, audit procedures, and remediation guidance in regular alignment with NICS researchers.',
      },
    ],
    outcomes: [
      {
        zh: '團隊共同交付正式版 Azure 政府雲端安全組態基準共 176 項',
        en: 'Delivered the official 176-control Government Azure Cloud Security Configuration Baseline',
      },
    ],
    techStack: ['Microsoft Azure', 'CIS Benchmark 5.0', 'ISO/IEC 27001', 'ISO/IEC 27701', 'Cloud Compliance'],
  },
  {
    id: 'nics-linux-gcb',
    title: {
      zh: '雲端安全組態檢測與驗證技術（Linux GCB 自動化）',
      en: 'Automated Linux Government Configuration Baseline (GCB) Auditing & Verification',
    },
    subtitle: {
      zh: '國家資通安全研究院（NICS）研究計畫',
      en: 'National Institute of Cyber Security (NICS) Project',
    },
    period: '2023/12 – 2024/07',
    category: 'security-forensics',
    categoryLabel: { zh: '系統資安 / 自動化', en: 'System Security' },
    role: {
      zh: '合規檢測腳本開發與雙向驗證測試（個人負責約 40 / 66 項）',
      en: 'Compliance Script Developer & Verification Engineer (~40 of 66 Controls)',
    },
    summary: {
      zh: '依據 TWGCB-01-008 規範，以 Bash 開發 Linux 主機自動化合規檢測腳本，並建立可重複執行的「合規／不合規」雙向測試環境進行嚴格驗證。',
      en: 'Developed automated Bash compliance auditing scripts for Linux hosts per TWGCB-01-008, validated with repeatable Positive & Negative testing environments.',
    },
    highlights: [
      {
        zh: '負責軟體安裝與維護、系統日誌與稽核、SELinux、sysctl 核心參數、ip_forward 與 Chrony 等約 40 項基準檢測腳本。',
        en: 'Implemented ~40 checks covering software maintenance, logging/auditing, SELinux, sysctl kernel parameters, network forwarding, and Chrony.',
      },
      {
        zh: '針對 Samba、SNMP、Squid、vsftpd、YPServ 等服務建立合規／違規模板，確保合規正確 Skip、違規準確 Fail 並定位錯誤。',
        en: 'Built compliant & non-compliant environment templates across services (Samba, SNMP, Squid, vsftpd, etc.) to verify exact Skip/Fail behavior and diagnostics.',
      },
    ],
    outcomes: [
      {
        zh: '於全新 Red Hat 環境完成雙向測試，66 項腳本與預期判定 100% 一致，達成「零誤報、零漏報」驗收標準',
        en: 'Achieved 100% agreement (0 false positives, 0 false negatives) across all 66 scripts on clean Red Hat acceptance testing',
      },
    ],
    techStack: ['Bash', 'Linux (RHEL)', 'SELinux', 'sysctl', 'TWGCB-01-008', 'Automated Testing'],
  },
  {
    id: 'manufacturing-fishbone',
    title: {
      zh: '製造業精實管理智慧流程圖生成與產線管制系統',
      en: 'Lean Manufacturing Intelligent Fishbone Flowchart & Production Control System',
    },
    subtitle: {
      zh: '製造業產學合作專案（去識別化呈現）',
      en: 'Industry-Academia Manufacturing Collaboration (De-identified)',
    },
    period: '2024/12 – Present',
    category: 'systems',
    categoryLabel: { zh: '企業系統 / 視覺化', en: 'Enterprise Systems' },
    role: {
      zh: '系統架構設計與桌面端應用程式開發',
      en: 'System Architect & Desktop Application Developer',
    },
    summary: {
      zh: '為協助製造業推行精實管理，開發桌面端智慧流程圖自動排版與產線管制看板系統，將原本耗時數小時的手繪魚骨圖與 Excel 人工核對流程自動化。',
      en: 'Built a desktop intelligent flowchart layout and production control dashboard for lean manufacturing, automating hours of manual fishbone diagramming and spreadsheet reconciliation.',
    },
    highlights: [
      {
        zh: '三層式架構設計（UI / BLL / DAL），支援資料庫連線與本地 Excel（ClosedXML）雙軌資料源切換，便於現場與測試環境驗證。',
        en: 'Clean 3-tier architecture (UI / BLL / DAL) supporting seamless switching between live SQL Server ERP/MES data and local Excel test datasets.',
      },
      {
        zh: '整合 Microsoft MSAGL 與自訂節點渲染器，實作最長前綴匹配與階層校驗演算法，自動計算魚骨拓撲座標、異常節點隔離與狀態色彩標示。',
        en: 'Integrated Microsoft MSAGL with custom node renderers and longest-prefix matching algorithms to compute fishbone topology, isolate exceptions, and color-code status.',
      },
      {
        zh: '提供製令卡片看板、單元式產線管制表與工時累計統計視圖，即時呈現進度、缺料預警與工時瓶頸。',
        en: 'Delivered card boards, unit-level production tables, and work-hour summary views highlighting progress, material shortages, and bottlenecks.',
      },
    ],
    outcomes: [
      {
        zh: '流程圖產製與工時彙整由人工數小時縮短至數秒內完成，已進入產線評估階段',
        en: 'Reduced flowchart generation and work-hour aggregation from hours to seconds; entered production-line evaluation',
      },
    ],
    techStack: ['C# (.NET 8)', 'WinForms', 'Microsoft MSAGL', 'SQL Server', 'ClosedXML', '3-Tier Architecture'],
  },
  {
    id: 'campus-isms-audit',
    title: {
      zh: '校內 ISO/IEC 27001:2022 內部稽核與 Nessus 弱點掃描實務',
      en: 'Campus ISO/IEC 27001:2022 Internal Audit & Tenable Nessus Vulnerability Scanning',
    },
    subtitle: {
      zh: '電算中心委託資安實務 · 多批次 Tenable Nessus 弱掃與複測 ＋ ISO 27001 現場查核',
      en: 'University Computer Center Practice · Multi-Batch Tenable Nessus Scanning & Rescanning + ISO 27001 Audit',
    },
    period: '2025/07 – 2025/12',
    category: 'security-forensics',
    categoryLabel: { zh: '資安稽核 / Nessus 弱掃', en: 'ISMS & Nessus' },
    role: {
      zh: '內部稽核協助與 Nessus 弱點掃描分析人員',
      en: 'Internal Audit Assistant & Nessus Vulnerability Analyst',
    },
    summary: {
      zh: '受校內電算中心委託，執行橫跨半年、多批次之 Tenable Nessus 外部資通系統（IP / URL）與使用者端點主機弱點掃描、風險分級與複掃追蹤，並協助執行 ISO/IEC 27001:2022 現場內部稽核。',
      en: 'Commissioned by the university computer center to execute a 6-month, multi-batch Tenable Nessus vulnerability assessment (external IP/URL web systems & endpoint hosts) with follow-up rescans, alongside ISO/IEC 27001:2022 on-site internal audits.',
    },
    highlights: [
      {
        zh: '多批次 Tenable Nessus 弱點掃描與複測：經電算中心授權，分批規劃並執行 5 波次以上外部資通系統（IP 與 URL 目標）及使用者端點主機弱掃，整理 CVSS 嚴重度漏洞清單（PDF／CSV／Excel）並進行多輪複掃驗證。',
        en: 'Multi-Batch Tenable Nessus Scanning & Rescanning: Executed 5+ authorized scan batches covering external information systems (IP & URL targets) and endpoint hosts, delivering structured CVSS triage lists (PDF/CSV/Excel) and follow-up verification rescans.',
      },
      {
        zh: 'ISO/IEC 27001:2022 現場查核：赴 10 個以上行政與教學處室，依附錄 A 控制項（含 A.7.7 桌面與螢幕淨空、端點防火牆、授權軟體與加密作業）執行現場稽核。',
        en: 'ISO/IEC 27001:2022 On-Site Audit: Conducted Annex A control checks (including A.7.7 clear desk/screen, endpoint firewall, software compliance, and encryption) across 10+ departments.',
      },
    ],
    outcomes: [
      {
        zh: '完成 5 波次、累計 270+ 不重複主機／目標之 Tenable Nessus 外部系統與端點弱點掃描及複測驗證',
        en: 'Completed 5 batches totaling 270+ unique hosts/assets of Tenable Nessus external & endpoint scanning and rescans',
      },
      {
        zh: '完成 10 個以上處室的 ISO/IEC 27001:2022 初步內部稽核查核紀錄',
        en: 'Completed ISO/IEC 27001:2022 preliminary internal audit records across 10+ departments',
      },
    ],
    techStack: ['Tenable Nessus', 'ISO/IEC 27001:2022', 'Vulnerability Assessment', 'ISMS Audit', 'CVSS Risk Triage'],
    evidence: {
      buttonLabel: {
        zh: '查看去識別化掃描紀錄與保密聲明',
        en: 'View Sanitized Scan Log & Confidentiality',
      },
      title: {
        zh: 'Tenable Nessus 多批次弱點掃描執行規模（去識別化摘要）',
        en: 'Tenable Nessus Multi-Batch Scan Execution Log (Sanitized)',
      },
      summary: {
        zh: '2025/07 – 2025/12 共執行 5 個掃描波次，涵蓋外部資通系統（IP / URL）與內部端點主機，累計掃描超過 270+ 不重複目標並產出 30+ 份 PDF／CSV／Excel 檢核報表。',
        en: 'Executed 5 scan waves across Jul–Dec 2025 covering external web systems (IP/URL) and internal endpoints, totaling 270+ unique targets and 30+ structured PDF/CSV/Excel reports.',
      },
      tableRows: [
        {
          date: '2025/07',
          scope: {
            zh: '外部資通系統第一批次弱點掃描',
            en: 'External Info Systems — Batch 1 Scan',
          },
          metrics: {
            zh: '約 20 個不重複主機／目標（多格式彙整報表）',
            en: '~20 unique hosts/targets (multi-format reports)',
          },
        },
        {
          date: '2025/08',
          scope: {
            zh: '外部資通系統第三批次大規模掃描（IP / URL 雙軌分組）',
            en: 'External Info Systems — Batch 3 Large-Scale Scan (IP & URL)',
          },
          metrics: {
            zh: '220+ 不重複主機／目標（IP / URL 分組報表）',
            en: '220+ unique hosts/targets (IP & URL grouped reports)',
          },
        },
        {
          date: '2025/12',
          scope: {
            zh: '使用者端點主機漏洞檢測與三波次連續複掃驗證',
            en: 'Endpoint Host Assessment & 3-Wave Follow-up Rescans',
          },
          metrics: {
            zh: '30+ 端點主機目標（完成三波次追蹤複測）',
            en: '30+ endpoint targets (tracked across 3 follow-up waves)',
          },
        },
      ],
      analysisPoints: [
        {
          zh: '作業閉環：依電算中心授權清單執行分批掃描 → 依 CVSS 嚴重度彙整漏洞追蹤表 → 針對修補後標的執行連續複掃驗證。',
          en: 'End-to-end workflow: Authorized target scoping → CVSS severity triage & tracking sheets → multi-wave post-remediation verification rescans.',
        },
      ],
      confidentialityNote: {
        zh: '保密聲明：基於資訊安全與負責任揭露（Responsible Disclosure）原則，實際受測 IP 網段、網域名稱、受稽處室與弱點明細均不公開展示。',
        en: 'Confidentiality Notice: In accordance with Responsible Disclosure principles, actual target IPs, domains, department names, and vulnerability findings are strictly omitted.',
      },
    },
  },
];
