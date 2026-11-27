import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Copy,
  Github,
  GraduationCap,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { SITE_PROFILE } from '../data/profile';
import { PUBLICATIONS } from '../data/publications';
import { useLanguage } from '../context/LanguageContext';
import { decodeContactEmail, openMailClient } from '../utils/contact';

export interface HeroVimOverrides {
  name?: string;
  headline?: string;
  affiliation?: string;
  bio?: string;
  notice?: string;
}

interface HeroProps {
  vimOverrides?: HeroVimOverrides;
  onResetVimOverrides?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ vimOverrides = {}, onResetVimOverrides }) => {
  const { lang, t } = useLanguage();
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasVimOverrides = Object.keys(vimOverrides).length > 0;

  const sciCount = PUBLICATIONS.filter((p) => p.type === 'sci-journal').length;
  const confCount = PUBLICATIONS.filter(
    (p) => p.type === 'intl-conference' || p.type === 'domestic-conference',
  ).length;
  const acceptedCount = PUBLICATIONS.filter((p) => p.type === 'accepted').length;

  const handleRevealEmail = () => {
    setRevealedEmail(decodeContactEmail());
  };

  const handleCopyEmail = async () => {
    const email = revealedEmail ?? decodeContactEmail();
    setRevealedEmail(email);
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      openMailClient();
    }
  };

  return (
    <section id="about" className="pt-12 pb-14 sm:pt-16 sm:pb-16 border-b border-stone-200/80">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Main Bio Column */}
        <div className="lg:col-span-8 space-y-5">
          {hasVimOverrides && (
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-800">
              <span>
                {lang === 'zh'
                  ? '⚡ Vim 趣味沙盒預覽中（僅本機瀏覽器生效，重整即還原）'
                  : '⚡ Vim Fun Sandbox Active (Local preview only — resets on reload)'}
              </span>
              {onResetVimOverrides && (
                <button
                  type="button"
                  onClick={onResetVimOverrides}
                  className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800 border border-amber-300/80 text-[11px] font-medium hover:underline"
                >
                  {lang === 'zh' ? '一鍵還原' : 'Reset'}
                </button>
              )}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-academic-50 border border-academic-100 text-academic-900 text-xs font-medium">
            <GraduationCap className="w-3.5 h-3.5" />
            <span data-vim-field="headline">{vimOverrides.headline ?? t(SITE_PROFILE.headline)}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight leading-tight">
              {lang === 'zh' ? (
                <>
                  <span data-vim-field="name">{vimOverrides.name ?? SITE_PROFILE.name.zh}</span>{' '}
                  <span className="text-slate-400 font-normal text-2xl sm:text-3xl">
                    ({SITE_PROFILE.name.en})
                  </span>
                </>
              ) : (
                <>
                  <span data-vim-field="name">{vimOverrides.name ?? SITE_PROFILE.name.en}</span>{' '}
                  <span className="text-slate-400 font-normal text-2xl sm:text-3xl">
                    ({SITE_PROFILE.name.zh})
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span data-vim-field="affiliation">{vimOverrides.affiliation ?? t(SITE_PROFILE.affiliation)}</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {t(SITE_PROFILE.location)}
              </span>
            </p>
          </div>

          <p data-vim-field="bio" className="text-slate-700 leading-relaxed text-[15px] sm:text-base max-w-2xl">
            {vimOverrides.bio ?? t(SITE_PROFILE.bio)}
          </p>

          {/* Research Interests */}
          <div className="space-y-2 pt-1">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">
              {lang === 'zh' ? '研究與技術領域' : 'Research & Engineering Focus'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {SITE_PROFILE.researchInterests.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-md bg-white border border-stone-200 text-xs sm:text-[13px] text-slate-700"
                >
                  {t(item)}
                </span>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={SITE_PROFILE.links.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>

            {!revealedEmail ? (
              <button
                type="button"
                onClick={handleRevealEmail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-stone-300 text-slate-700 text-sm font-medium hover:border-academic-600 hover:text-academic-900 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{lang === 'zh' ? '顯示聯絡信箱' : 'Reveal Email'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-academic-600/40 text-sm">
                <button
                  type="button"
                  onClick={openMailClient}
                  className="font-mono text-xs sm:text-sm text-academic-900 hover:underline"
                >
                  {revealedEmail}
                </button>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1 rounded text-slate-500 hover:text-academic-900 hover:bg-stone-100 transition-colors"
                  title={lang === 'zh' ? '複製信箱' : 'Copy email'}
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            <a
              href="#publications"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-academic-800 hover:bg-academic-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'zh' ? '瀏覽論文發表' : 'View Publications'}</span>
            </a>
          </div>
        </div>

        {/* Academic Summary Sidebar Card */}
        <aside className="lg:col-span-4 academic-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {lang === 'zh' ? '學術與工程摘要' : 'At a Glance'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'zh' ? '隱私保護模式' : 'Privacy-Safe'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="font-serif text-2xl font-semibold text-academic-900">
                {sciCount}
                {acceptedCount > 0 && (
                  <span className="text-sm font-sans font-medium text-emerald-700 ml-1">
                    +{acceptedCount}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {acceptedCount > 0
                  ? lang === 'zh'
                    ? 'SCI 期刊 (+已接受)'
                    : 'SCI Journals (+Acc.)'
                  : lang === 'zh'
                    ? 'SCI 國際期刊'
                    : 'SCI Journals'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="font-serif text-2xl font-semibold text-academic-900">{confCount}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {lang === 'zh' ? '國際／國內研討會' : 'Conference Papers'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="font-serif text-2xl font-semibold text-academic-900">2</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {lang === 'zh' ? '資安院 (NICS) 計畫' : 'NICS Security Projects'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="font-serif text-2xl font-semibold text-academic-900">v1.10</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {lang === 'zh' ? 'Sherry AI Agent 平台' : 'Sherry AI Platform'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {lang === 'zh'
                  ? 'ACM ASSE 2024 Best Presentation Award（東京大學）'
                  : 'ACM ASSE 2024 Best Presentation Award (Univ. of Tokyo)'}
              </span>
            </div>
            <p data-vim-field="notice" className="text-xs text-slate-500 leading-relaxed pt-1">
              {vimOverrides.notice ?? t(SITE_PROFILE.seekingNotice)}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};
