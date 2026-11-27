import type { LocalizedText } from '../types/portfolio';

export interface SherryKpi {
  label: LocalizedText;
  value: string;
  detail: LocalizedText;
}

export interface SherryPillar {
  id: string;
  tag: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  points: LocalizedText[];
}

export interface SecurityToolSummary {
  id: 'nessus' | 'trivy' | 'bandit';
  layer: LocalizedText;
  tool: string;
  version: string;
  badge: LocalizedText;
  headline: LocalizedText;
  scope: LocalizedText;
}

export interface AuditComparisonRow {
  category: LocalizedText;
  before: LocalizedText;
  after: LocalizedText;
  remediation: LocalizedText;
}

export interface SecurityHighlight {
  rule: string;
  title: LocalizedText;
  detail: LocalizedText;
}

export const SHERRY_META = {
  name: {
    zh: 'Sherry（橘雪莉）— 模組化 AI 代理人與多推論後端平台',
    en: 'Sherry — Modular AI Agent & Multi-Backend Inference Platform',
  },
  publicRelease: 'v1.10.0',
  devMilestone: 'v1.11 dev',
  period: '2026 – Present',
  repoUrl: 'https://github.com/YuuuuutoOuO/Sherry-An-AI-Companion-Platform',
  role: {
    zh: '獨立架構設計、後端開發、LLM 效能調校與 DevSecOps 維運',
    en: 'Solo Architect, Backend & LLM Systems Engineer, DevSecOps',
  },
  summary: {
    zh: '從零打造的微核心分層 AI Agent 平台（App / Core / Handlers / Mod），統一封裝 8 種地端與雲端 LLM 推理後端，核心聚焦於 KV Cache 前綴對齊、OneBrain-TwoLanes L2 自主決策核心、SQLite WAL 自癒復原框架與 Quart Web 控制台。',
    en: 'A Clean-Architecture AI Agent platform (App / Core / Handlers / Mod) unifying 8 local & cloud LLM backends—centered on KV Cache prefix alignment, OneBrain-TwoLanes L2 autonomous decisioning, SQLite WAL crash-resilient state recovery, and a Quart Web Console.',
  },
  versionNotice: {
    zh: '版本說明：目前 GitHub 公開釋出版本為 v1.10.0（本專區功能介紹以 v1.10.0 為主）；私有開發分支已推進至 v1.11，大幅強化「賽博群友」模組的長期運行穩定性與實務可行性，並完成三層資安健檢與結構性修復（下方資安報告係基於 v1.11 開發版執行驗證）。',
    en: 'Release Note: The public GitHub repository is currently released at v1.10.0 (feature highlights below focus on v1.10.0). Private development has advanced to v1.11, substantially improving the stability and operational feasibility of the Cyber Friend subsystem alongside deep 3-layer security hardening (the Trivy & Bandit audits below were verified on v1.11 dev).',
  },
  techStack: [
    'Python (~110K LOC)',
    'asyncio',
    'Quart',
    'discord.py',
    'SQLite WAL',
    'vLLM / Ollama',
    'Tenable Nessus',
    'Trivy',
    'Bandit',
    'Docker',
    'GitHub Actions',
  ],
};

export const SHERRY_KPIS: SherryKpi[] = [
  {
    label: { zh: 'KV Cache 前綴對齊', en: 'KV Cache Alignment' },
    value: 'Zone 1 / 2',
    detail: { zh: 'Pass-1/2 位元組對齊，避免重複 Prefill', en: 'Byte-aligned Pass-1/2, avoiding redundant prefill' },
  },
  {
    label: { zh: '推理後端矩陣', en: 'LLM Backends' },
    value: '8 Engines',
    detail: { zh: '地端與雲端統一封裝、自動降級', en: 'Unified local & cloud providers w/ fallback' },
  },
  {
    label: { zh: '專案規模', en: 'Codebase Scale' },
    value: '~110K LOC',
    detail: { zh: '600+ Commits · 10 大可插拔模組', en: '600+ commits · 10 hot-pluggable modules' },
  },
  {
    label: { zh: '三層資安驗證', en: 'Security Audits' },
    value: '0 Crit / High',
    detail: { zh: 'Nessus + Trivy (109→0 CVE) + Bandit', en: 'Nessus + Trivy (109→0 CVE) + Bandit' },
  },
];

export const SHERRY_OVERVIEW_OUTCOMES: LocalizedText[] = [
  {
    zh: '採用 Zone 1 / Zone 2 KV Cache 前綴對齊設計，避免 Pass-2 重複 Prefill，並以精簡工具索引減少每輪 Prompt Token 開銷。',
    en: 'Zone 1 / Zone 2 KV Cache prefix alignment avoids redundant Pass-2 prefill while Compact Tool Index trims per-turn prompt overhead.',
  },
  {
    zh: '建立 OneBrain-TwoLanes 與 L2 自主決策核心，支援主動巡航與被動回應共享同一大腦、記憶與工具契約。',
    en: 'OneBrain-TwoLanes & L2 Autonomous Mind unify proactive and passive lanes with shared memory and ToolSpec contracts.',
  },
  {
    zh: 'SQLite WAL 狀態快照與 Crash-Loop 隔離防護，實現語音音樂斷點續播與 AI 推演中斷無痛自癒對帳。',
    en: 'SQLite WAL state snapshots and Crash-Loop quarantine enable seamless voice-playback resume and in-flight AI task recovery.',
  },
  {
    zh: 'v1.11 私有開發版持續打磨「賽博群友」穩定性與可行性，並通過 Nessus、Trivy 與 Bandit 三層資安健檢驗證。',
    en: 'Private v1.11 dev further hardens Cyber Friend stability/feasibility and passes 3-layer security audits (Nessus, Trivy, Bandit).',
  },
];

export const SHERRY_CORE_CAPABILITIES: SherryPillar[] = [
  {
    id: 'multi-backend',
    tag: { zh: 'v1.10.0 核心', en: 'v1.10.0 Core' },
    title: { zh: '多推論後端抽象層與 GPU 顯存守衛', en: 'Multi-Backend Inference & GPU VRAM Guard' },
    summary: {
      zh: '統一封裝 vLLM、Ollama、LM Studio 與 OpenAI、Claude、Gemini、DeepSeek、OpenRouter 8 大引擎，支援逾時與失敗自動降級。',
      en: 'Provider-agnostic layer unifying vLLM, Ollama, LM Studio, OpenAI, Claude, Gemini, DeepSeek, and OpenRouter with automatic timeout fallback.',
    },
    points: [
      {
        zh: '非同步 GPU Mutex + PriorityQueue 協調 LLM、視覺模型與繪圖任務，避免 VRAM OOM 衝突。',
        en: 'Async GPU Mutex & PriorityQueue arbitrate concurrent LLM/VLM/diffusion workloads to prevent VRAM OOM.',
      },
      {
        zh: '內建 APM 微觀遙測（Prefill / Decode 耗時、Cache 命中率）與管理員異常告警。',
        en: 'Built-in APM telemetry tracking prefill/decode latency, cache hit ratio, and admin error alerts.',
      },
    ],
  },
  {
    id: 'l2-autonomy',
    tag: { zh: 'v1.10.0 核心 · v1.11 持續強化', en: 'v1.10.0 Core · Hardened in v1.11' },
    title: { zh: 'OneBrain-TwoLanes 與 L2 自主決策核心', en: 'OneBrain-TwoLanes & L2 Autonomous Mind' },
    summary: {
      zh: '將群組互動分為被動回應軌與主動巡航軌，由模型自主裁決發言、保持安靜或延後（SPEAK / SILENT / DELAY）並落盤內心戲歷程。',
      en: 'Splits interaction into Passive and Proactive lanes sharing one brain, letting the model autonomously decide SPEAK / SILENT / DELAY with audit logs.',
    },
    points: [
      {
        zh: '統一 ToolSpec 工具契約、追話寬限窗與跨重啟聯絡帳本，避免主動互動失控或重複打擾。',
        en: 'Unified ToolSpec contracts, follow-up grace windows, and cross-restart contact ledgers prevent runaway messages.',
      },
      {
        zh: 'v1.11 開發版大幅優化賽博群友在長時運行下的穩定性與實務可行性（細節待公開版釋出）。',
        en: 'Private v1.11 dev substantially improves long-running stability and practical feasibility of the Cyber Friend loop.',
      },
    ],
  },
  {
    id: 'resilience-webui',
    tag: { zh: 'v1.10.0 核心', en: 'v1.10.0 Core' },
    title: { zh: '系統自癒復原、SPARK 2.0 與 Web 控制台', en: 'Self-Healing Recovery, SPARK 2.0 & Web Console' },
    summary: {
      zh: '以 SQLite WAL 持久化狀態快照與 BootReconciler 實現零感知重啟復原，並整合 10 大可插拔模組與 Quart Web 控制台。',
      en: 'Zero-perception restart recovery via SQLite WAL snapshots and BootReconciler, paired with 10 pluggable modules and a Quart Web Console.',
    },
    points: [
      {
        zh: 'Crash-Loop 自動隔離（120 秒內連敗 ≥ 2 次隔離）、FFmpeg 精確秒數斷點續播、未結案 AI 任務對帳。',
        en: 'Crash-Loop quarantine (≥2 failures in 120s), FFmpeg exact-second playback resume, and in-flight AI task reconciliation.',
      },
      {
        zh: '涵蓋 SPARK 2.0 條件情報推播、地端深度研究、數位畫布與多模態視覺隔離等 10 大模組。',
        en: 'Includes SPARK 2.0 event briefings, local deep research, digital canvas, and multimodal vision isolation across 10 modules.',
      },
    ],
  },
];

export const SHERRY_ARCH_LAYERS: {
  layer: string;
  title: LocalizedText;
  desc: LocalizedText;
}[] = [
  {
    layer: 'App',
    title: { zh: '應用編排層（Orchestrator & Composition Root）', en: 'Application Orchestration (Composition Root)' },
    desc: {
      zh: '統一管理生命週期、依賴倒置注入與 Two-Pass 推論管線，透過 Import-Linter 契約強制鎖定分層邊界。',
      en: 'Manages lifecycle, IoC dependency injection, and the two-pass inference pipeline, enforced by Import-Linter contracts.',
    },
  },
  {
    layer: 'Core',
    title: { zh: '基礎核心層（Contracts / DB / Guard / Recovery / TLS）', en: 'Core Primitives (Contracts / DB / Guard / Recovery / TLS)' },
    desc: {
      zh: '提供統一資料契約、共用 SQL 識別符驗證、GPU 顯存鎖、SQLite WAL 自癒儲存庫與本機自簽 TLS 憑證管理。',
      en: 'Shared contracts, SQL identifier validation, GPU mutex guard, SQLite WAL recovery storage, and TLS certificate management.',
    },
  },
  {
    layer: 'Handlers',
    title: { zh: '核心業務層（Care / Memory / SPARK / Music / Voice）', en: 'Domain Handlers (Care / Memory / SPARK / Music / Voice)' },
    desc: {
      zh: '實作賽博群友 L2 決策、記憶加權檢索、條件情報推播、語音 STT/TTS 與互動控制面板。',
      en: 'Implements Cyber Friend L2 autonomy, weighted memory retrieval, SPARK triggers, voice STT/TTS, and Discord interactive views.',
    },
  },
  {
    layer: 'Mod & WebUI',
    title: { zh: '擴充模組與控制台（10 Mods + Quart Web Console）', en: 'Pluggable Mods & Quart Web Console' },
    desc: {
      zh: '10 大熱插拔外掛（深度研究、繪圖、實況劇院、情報哨兵等）搭配深色玻璃擬態 Web 控制台與審計日誌。',
      en: '10 hot-pluggable modules (Deep Research, Painter, Livestream, Feed Sentinel, etc.) with a dark glassmorphism Web Console and audit logs.',
    },
  },
];

export const SHERRY_SECURITY_TOOLS: SecurityToolSummary[] = [
  {
    id: 'nessus',
    layer: { zh: 'DAST · 動態 Web 弱點掃描', en: 'DAST · Dynamic Web App Scan' },
    tool: 'Tenable Nessus',
    version: '2026/11',
    badge: { zh: '0 Crit / 0 High / 0 App 弱點', en: '0 Crit / 0 High / 0 App Vulns' },
    headline: {
      zh: 'Quart Web 控制台未檢出 XSS、SQLi、SSRF、認證繞過或敏感檔案外洩。',
      en: 'No XSS, SQLi, SSRF, auth bypass, or sensitive exposure found on the Quart Web Console.',
    },
    scope: { zh: '對象：Web UI 公開與管理端點（v1.10 / v1.11 共通架構）', en: 'Target: Web UI public & admin endpoints' },
  },
  {
    id: 'trivy',
    layer: { zh: 'SCA + Secrets · 供應鏈與機敏掃描', en: 'SCA + Secrets · Dependency & Leak Scan' },
    tool: 'Trivy',
    version: 'v0.76.2',
    badge: { zh: '109 CVE → 0 · 0 Secrets', en: '109 CVE → 0 · 0 Secrets' },
    headline: {
      zh: '16 個直接／傳遞套件全數升級並同步官方 PyPI SHA-256 Lockfile；Git 全歷史 0 機敏外洩。',
      en: 'All 16 vulnerable direct & transitive packages upgraded with PyPI SHA-256 lockfile sync; 0 secrets in Git history.',
    },
    scope: { zh: '對象：v1.11 dev 依賴清單與全倉機敏檢核（2026/11/27）', en: 'Target: v1.11 dev dependencies & repo secrets (Nov 27, 2026)' },
  },
  {
    id: 'bandit',
    layer: { zh: 'SAST · Python 靜態安全分析', en: 'SAST · Python Static Analysis' },
    tool: 'Bandit',
    version: 'v1.9.4',
    badge: { zh: 'High 3 → 0 · 實質風險清零', en: 'High 3 → 0 · Real Risks Cleared' },
    headline: {
      zh: 'B324 / B314 / B310 / B615 全數歸零；第二階段結構性重構將 Medium 由 65 降至 32 項（皆已人工審計）。',
      en: 'Zero B324/B314/B310/B615 findings; Phase-2 structural refactoring cut Medium from 65 to 32 audited false positives.',
    },
    scope: { zh: '對象：v1.11 dev 全專案 Python 原始碼 + 119 支回歸測試通過', en: 'Target: v1.11 dev full Python codebase + 119 regression tests passed' },
  },
];

export const SHERRY_AUDIT_COMPARISON: AuditComparisonRow[] = [
  {
    category: { zh: 'Trivy — 依賴套件漏洞（SCA）', en: 'Trivy — Dependency CVEs (SCA)' },
    before: { zh: '109 項（8 Crit / 58 High / 39 Med / 4 Low）', en: '109 (8 Crit / 58 High / 39 Med / 4 Low)' },
    after: { zh: '0 項（清零）', en: '0 (Cleared)' },
    remediation: {
      zh: '升級 Pillow、anyio、brotli、certifi、aiohttp、cryptography 等 16 套件，建立傳遞依賴安全下限並同步 requirements.lock SHA-256。',
      en: 'Upgraded 16 packages (Pillow, anyio, brotli, certifi, aiohttp, cryptography, etc.), added transitive security floors, and synced SHA-256 lockfile.',
    },
  },
  {
    category: { zh: 'Trivy — 機敏資訊（Secrets）', en: 'Trivy — Secrets Detection' },
    before: { zh: '3 項本機檔案（.env / 自簽 key.pem）', en: '3 local files (.env / self-signed key.pem)' },
    after: { zh: '0 項（Git 全歷史 0 外洩）', en: '0 (0 leaks in full Git history)' },
    remediation: {
      zh: '確認皆未進版控，新增 trivy.yaml 排除執行期目錄與 tools/run_security_scan.ps1 一鍵巡檢腳本。',
      en: 'Verified untracked in Git; added trivy.yaml exclusions and automated scan runner script.',
    },
  },
  {
    category: { zh: 'Bandit — High（B324 弱雜湊）', en: 'Bandit — High (B324 Weak Hash)' },
    before: { zh: '3 項', en: '3 findings' },
    after: { zh: '0 項（清零）', en: '0 (Cleared)' },
    remediation: {
      zh: '非密碼學用途之短 ID 與確定性抽樣全面顯式標註 usedforsecurity=False，符合 FIPS 與靜態掃描規範。',
      en: 'Explicitly annotated non-cryptographic ID/sampling hashes with usedforsecurity=False for FIPS & SAST compliance.',
    },
  },
  {
    category: { zh: 'Bandit — 實質中風險（B314 / B310 / B615）', en: 'Bandit — Real Mediums (B314/B310/B615)' },
    before: { zh: '7 項', en: '7 findings' },
    after: { zh: '0 項（清零）', en: '0 (Cleared)' },
    remediation: {
      zh: '補齊 defusedxml 與 DOCTYPE/ENTITY 正則雙層 XXE 防護、urlopen http/https 協議白名單、Hugging Face revision 版本鎖定。',
      en: 'Added dual-layer defusedxml + DOCTYPE/ENTITY XXE protection, http/https scheme allowlists for urlopen, and HF revision pinning.',
    },
  },
  {
    category: { zh: 'Bandit — 網路綁定（B104）', en: 'Bandit — Network Binding (B104)' },
    before: { zh: '19 項', en: '19 findings' },
    after: { zh: '3 項（已審計安全設計）', en: '3 (Audited safe design)' },
    remediation: {
      zh: '移除無效 0.0.0.0 TLS SAN、直播預設收斂至 127.0.0.1 並加上 ALLOW_FALLBACK_BIND fail-fast 保護、SSRF 改用 ipaddress.is_unspecified。',
      en: 'Removed invalid 0.0.0.0 TLS SAN, defaulted livestream bind to 127.0.0.1 with fail-fast guard, and unified SSRF checks via ipaddress.is_unspecified.',
    },
  },
  {
    category: { zh: 'Bandit — 動態 SQL（B608）', en: 'Bandit — Dynamic SQL (B608)' },
    before: { zh: '40 項', en: '40 findings' },
    after: { zh: '29 項（全參數化已審計）', en: '29 (Parameterized & audited)' },
    remediation: {
      zh: '於 core/db.py 抽出共用 validate_sql_identifier() 白名單驗證，將 9 處重構為純靜態 SQL 與參數化 LIMIT ?，不以散落 # nosec 掩蓋。',
      en: 'Extracted shared validate_sql_identifier() in core/db.py, refactored 9 queries to pure static parameterized SQL (incl. LIMIT ?), avoiding scattered # nosec.',
    },
  },
];

export const SHERRY_SECURITY_HIGHLIGHTS: SecurityHighlight[] = [
  {
    rule: 'Supply Chain',
    title: { zh: '傳遞依賴安全下限 + SHA-256 Lockfile', en: 'Transitive Security Floors + SHA-256 Lockfile' },
    detail: {
      zh: '針對 Pillow (52 CVE)、aiohttp (20 CVE)、filelock (9 CVE)、anyio、certifi 等 16 套件建立安全下限並完成跨主版本相容性驗證。',
      en: 'Enforced security floor constraints across 16 packages (Pillow 52 CVEs, aiohttp 20 CVEs, filelock 9 CVEs, anyio, certifi) with cross-major compatibility checks.',
    },
  },
  {
    rule: 'Defense-in-Depth',
    title: { zh: 'XXE / SSRF / SQLi / 供應鏈多層防護', en: 'XXE / SSRF / SQLi / Model Supply-Chain Guards' },
    detail: {
      zh: '整合 defusedxml 雙層防護、URL 協議白名單、SQL 識別符共用驗證器、Hugging Face revision 鎖定與 fail-fast 網路綁定策略。',
      en: 'Combined defusedxml dual-layer checks, URL scheme allowlists, shared SQL identifier validation, HF revision pinning, and fail-fast network binding.',
    },
  },
  {
    rule: 'Verification',
    title: { zh: '自動化回歸測試與一鍵巡檢 SOP', en: 'Automated Regression Tests & One-Click Audit SOP' },
    detail: {
      zh: '兩階段修復累積 119 支安全回歸測試全數通過（Diff Coverage 85%–88%），並通過 Ruff 與 Mypy 檢查。',
      en: '119 security regression tests passed across Phase 1 & 2 (85%–88% diff coverage), passing Ruff and Mypy static checks.',
    },
  },
];

export const SHERRY_NESSUS_EVIDENCE = {
  title: {
    zh: 'Tenable Nessus Web 應用弱點掃描摘要（2026/11）',
    en: 'Tenable Nessus Web Application Scan Summary (Nov 2026)',
  },
  imageSrc: './images/sherry-nessus-summary.png',
  imageAlt: {
    zh: 'Sherry Web UI 經 Tenable Nessus 掃描之弱點摘要截圖',
    en: 'Tenable Nessus vulnerability scan summary for Sherry Web UI',
  },
  summary: {
    zh: '掃描結論：0 Critical、0 High、0 應用程式層 Web 弱點（未檢出 XSS、SQLi、SSRF、認證繞過或敏感檔案外洩等風險）。',
    en: 'Verdict: 0 Critical, 0 High, and 0 application-layer web vulnerabilities (no XSS, SQLi, SSRF, auth bypass, or sensitive exposure detected).',
  },
  analysisPoints: [
    {
      zh: '3 項 Medium（Plugin 45411 / 51192 / 57582）：皆因掃描環境為本地測試虛擬網域（www.sherry-demo.test）且使用自簽 SSL 憑證所致；正式部署套用受信任 CA 憑證（如 Let’s Encrypt）即可完全消除。',
      en: '3 Medium findings (Plugins 45411 / 51192 / 57582): All stem solely from the self-signed SSL certificate on the local RFC 2606 test domain (www.sherry-demo.test); resolved automatically with a trusted CA certificate in production.',
    },
    {
      zh: '1 項 Low（Plugin 10114 — ICMP Timestamp）：屬於作業系統網路堆疊層之預設回應行為，非 Quart Web 應用程式本身弱點，於主機防火牆過濾 ICMP Type 13/14 即可緩解。',
      en: '1 Low finding (Plugin 10114 — ICMP Timestamp): An OS network-stack behavior unrelated to the Quart Web application; mitigated via host firewall rules blocking ICMP Type 13/14.',
    },
  ] as LocalizedText[],
};
