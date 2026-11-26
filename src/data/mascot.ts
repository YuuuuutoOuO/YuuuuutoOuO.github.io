import type { LocalizedText } from '../types/portfolio';

export const MASCOT_META = {
  name: {
    zh: '騎車的鵜鶘 · AI 評測吉祥物',
    en: 'Pelican on a Bicycle · AI Benchmark Mascot',
  },
  greeting: {
    zh: '嘎！我是 AI 評測梗「騎腳踏車的鵜鶘」🚲 點我可以逛論文或聽彩蛋，也可以按住我拖到別處、甚至把我甩出去彈跳喔！',
    en: 'Squawk! I am the "Pelican on a bicycle" LLM benchmark 🚲 Click me for papers & trivia, or drag & fling me to bounce around the page!',
  },
};

export const MASCOT_TRIVIA: LocalizedText[] = [
  {
    zh: '小知識：Sherry 透過 Zone 1 / Zone 2 前綴對齊，讓 Pass-2 直接命中 5,500+ tokens 的 KV Cache，首字延遲降到 200ms 內！',
    en: 'Fun fact: Sherry aligns Zone 1 / Zone 2 prefixes so Pass-2 hits 5,500+ cached tokens, keeping TTFT under 200ms!',
  },
  {
    zh: '小知識：DLC-Stego 結合空間域 SRM 殘差與頻率域 Haar 小波，能從僅佔 0.6% 面積的局部區域揪出 2-bit LSB 隱寫酬載！',
    en: 'Fun fact: DLC-Stego fuses SRM spatial residuals and Haar wavelets to locate 2-bit LSB payloads covering as little as 0.6% of an image!',
  },
  {
    zh: '小技巧：每篇論文都有完整 DOI 超連結與一鍵 BibTeX 複製按鈕，引用起來超方便！',
    en: 'Tip: Every publication has a clickable DOI link and a one-click BibTeX copy button!',
  },
  {
    zh: '小知識：在資安院 Linux GCB 專案中，66 項 Bash 檢測腳本都經過合規／不合規雙向測試，達成零誤報、零漏報！',
    en: 'Fun fact: All 66 Linux GCB Bash scripts passed bidirectional Positive & Negative testing with zero false positives and zero false negatives!',
  },
  {
    zh: '資安亮點：Sherry 的 Quart Web 控制台經過 Tenable Nessus 弱點掃描驗證，達成 0 嚴重、0 高風險與 0 應用程式層 Web 弱點！',
    en: 'Security highlight: Sherry’s Quart Web UI passed Tenable Nessus scanning with 0 Critical, 0 High, and 0 application-layer web vulnerabilities!',
  },
  {
    zh: '冷知識：為什麼是騎腳踏車的鵜鶘？因為 Simon Willison 用「畫一隻騎腳踏車的鵜鶘 SVG」當作各大 LLM 空間推理與繪圖能力的經典基準測試！',
    en: 'Meta trivia: Why a pelican on a bicycle? Simon Willison popularized "SVG of a pelican riding a bicycle" as the iconic benchmark for testing LLM spatial reasoning!',
  },
];

export const MASCOT_PAPER_PICKS: LocalizedText[] = [
  {
    zh: '推薦閱讀 IEEE Access (2025) 的《HEP-DHMI》，專為 AMBTC 壓縮醫療影像設計的高效率高酬載資料隱藏方法！',
    en: 'Check out "HEP-DHMI" (IEEE Access, 2025) — a high-efficiency data hiding scheme for AMBTC-compressed medical images!',
  },
  {
    zh: '推薦閱讀 Mathematics (2024) 的《MRA-VSS》，利用雙重有意義影像實現可逆且可驗證的視覺秘密分享！',
    en: 'Check out "MRA-VSS" (Mathematics, 2024) — a matrix-based reversible & authenticable visual secret-sharing scheme!',
  },
  {
    zh: '推薦閱讀 ACM ASSE ’24 榮獲最佳發表獎的論文，點擊標題或 DOI 就能直接開啟論文頁面喔！',
    en: 'Check out the ACM ASSE ’24 Best Presentation Award paper — click its title or DOI link to read it directly!',
  },
];
