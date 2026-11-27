import React, { useState } from 'react';
import { Check, Copy, Github, Mail } from 'lucide-react';
import { SITE_PROFILE } from '../data/profile';
import { useLanguage } from '../context/LanguageContext';
import { decodeContactEmail, openMailClient } from '../utils/contact';

interface FooterProps {
  scratchpadText?: string | null;
  onClearScratchpad?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ scratchpadText, onClearScratchpad }) => {
  const { lang } = useLanguage();
  const year = new Date().getFullYear();
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRevealAndCopy = async () => {
    const email = revealedEmail ?? decodeContactEmail();
    setRevealedEmail(email);
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: email is already revealed so the user can select or click mailto
    }
  };

  return (
    <footer className="border-t border-stone-200 bg-white/70">
      <div id="scratchpad-wall" data-vim-file="~/.scratchpad">
        {scratchpadText !== null && scratchpadText !== undefined && (
          <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-6">
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/60 dark:bg-slate-900/90 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-amber-800 dark:text-amber-300">
                  {lang === 'zh'
                    ? '🕵️ ~/.scratchpad (0666 · -rw-rw-rw-) — 隱藏彩蛋塗鴉區（僅本機預覽，重整還原）'
                    : '🕵️ ~/.scratchpad (0666 · -rw-rw-rw-) — Hidden Easter-Egg Wall (Local only; resets on reload)'}
                </span>
                {onClearScratchpad && (
                  <button
                    type="button"
                    onClick={onClearScratchpad}
                    className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800 border border-amber-300/70 dark:border-slate-700 text-[11px] font-medium text-amber-900 dark:text-amber-200 hover:underline"
                  >
                    {lang === 'zh' ? '清除塗鴉' : 'Clear'}
                  </button>
                )}
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-white/70 dark:bg-slate-950/70 rounded-lg p-3 border border-stone-200/70 dark:border-slate-800">
                {scratchpadText || (lang === 'zh' ? '（空白內容）' : '(empty)')}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-slate-700 font-medium">
            © {year} {SITE_PROFILE.name.en} ({SITE_PROFILE.name.zh}) · All Rights Reserved
          </p>
          <p>
            {lang === 'zh'
              ? '本專案與網站僅供個人學術與工程能力成果展示之用，未經授權禁止用於任何商業用途。'
              : 'For personal academic and engineering showcase only. Commercial use is prohibited without prior authorization.'}
          </p>
          <p className="text-[11px] text-slate-400">
            {lang === 'zh'
              ? '本網站採資料與畫面分離設計，所有互動運算皆於本地端執行（ISO/IEC 27701 隱私原則），不紀錄或上傳任何使用者資料。'
              : 'Modular data-driven architecture. All interactive computations run locally in-browser (ISO/IEC 27701 privacy principle) with zero data collection.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={SITE_PROFILE.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-academic-900 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>

          {!revealedEmail ? (
            <button
              type="button"
              onClick={handleRevealAndCopy}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-academic-900 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>{lang === 'zh' ? '聯絡信箱' : 'Email'}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200">
              <button
                type="button"
                onClick={openMailClient}
                className="font-mono text-xs text-academic-800 hover:underline"
                title={lang === 'zh' ? '開啟郵件軟體寄信' : 'Open mail client'}
              >
                {revealedEmail}
              </button>
              <button
                type="button"
                onClick={handleRevealAndCopy}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-academic-900 transition-colors"
                title={lang === 'zh' ? '複製信箱' : 'Copy email'}
                aria-label="Copy email address"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{lang === 'zh' ? '已複製' : 'Copied'}</span>
                  </>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
