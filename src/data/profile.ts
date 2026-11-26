import type { LocalizedText } from '../types/portfolio';

/**
 * Core personal profile & UI copy.
 * Privacy note: No phone number, physical address, student ID, age, or private credentials are stored here.
 */
export const SITE_PROFILE = {
  name: {
    zh: '朱恩霆',
    en: 'En-Ting Chu',
  },
  monogram: 'EC',
  headline: {
    zh: '博士候選人 · 影像資安、雲端合規與 AI 系統工程',
    en: 'Ph.D. Candidate · Image Security, Cloud Compliance & AI Systems',
  },
  affiliation: {
    zh: '國立勤益科技大學 前瞻電資科技研究所（預計 2027/07 畢業）',
    en: 'Ph.D. Program in Prospective Technology of Electrical Engineering and Computer Science, NCUT (Expected Jul 2027)',
  },
  location: {
    zh: '臺灣',
    en: 'Taiwan',
  },
  bio: {
    zh: '我的研究橫跨影像安全與數位鑑識、電腦視覺深度學習與 AI 系統工程。我的定位是：能讀懂論文、設計演算法，也能將研究成果轉化為可運作、可驗證、可維護的工程系統。',
    en: 'My research spans image security & digital forensics, deep learning for computer vision, and AI systems engineering. I bridge academic research and production engineering—designing verifiable algorithms and building maintainable, end-to-end systems.',
  },
  seekingNotice: {
    zh: '目前預計於 2027 年 7 月畢業，歡迎 AI 系統、影像安全與資安研發領域之合作與職涯交流。',
    en: 'Expected to graduate in July 2027. Open to research collaborations and R&D opportunities in AI Systems, Image Security, and Cybersecurity.',
  },
  researchInterests: [
    {
      zh: '影像隱寫與隱寫分析 (Steganography & Steganalysis)',
      en: 'Image Steganography & Steganalysis',
    },
    {
      zh: '可逆資料隱藏與醫療影像安全 (RDH & Watermarking)',
      en: 'Reversible Data Hiding & Medical Image Security',
    },
    {
      zh: 'AI Agent 與多推論後端 LLM 系統架構',
      en: 'AI Agent & Multi-Backend LLM Inference Systems',
    },
    {
      zh: '雲端安全組態基準與自動化合規檢測 (GCB / Azure / ISO 27001)',
      en: 'Cloud Security Baselines & Automated Compliance (GCB / Azure / ISO 27001)',
    },
  ] as LocalizedText[],
  links: {
    github: 'https://github.com/YuuuuutoOuO',
    // Future extensibility: uncomment and fill in when ready
    // googleScholar: 'https://scholar.google.com/...',
    // orcid: 'https://orcid.org/...',
    // linkedin: 'https://linkedin.com/in/...',
  },
  authorHighlightNames: ['En-Ting Chu', '朱恩霆'],
};

export const NAV_ITEMS: { id: string; label: LocalizedText }[] = [
  { id: 'about', label: { zh: '關於', en: 'About' } },
  { id: 'publications', label: { zh: '論文發表', en: 'Publications' } },
  { id: 'projects', label: { zh: '研究與專案', en: 'Projects' } },
  { id: 'experience', label: { zh: '學經歷與計畫', en: 'Experience' } },
  { id: 'credentials', label: { zh: '榮譽與證照', en: 'Credentials' } },
];
