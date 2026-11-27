import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  FlaskConical,
  Github,
  Info,
  Layers,
  ShieldCheck,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  SHERRY_ARCH_LAYERS,
  SHERRY_AUDIT_COMPARISON,
  SHERRY_CORE_CAPABILITIES,
  SHERRY_KPIS,
  SHERRY_META,
  SHERRY_NESSUS_EVIDENCE,
  SHERRY_OVERVIEW_OUTCOMES,
  SHERRY_SECURITY_HIGHLIGHTS,
  SHERRY_SECURITY_TOOLS,
} from '../data/sherry';
import { useLanguage } from '../context/LanguageContext';

type ShowcaseTab = 'overview' | 'architecture' | 'security';

interface SherryShowcaseProps {
  onOpenKvCacheLab: () => void;
}

export const SherryShowcase: React.FC<SherryShowcaseProps> = ({ onOpenKvCacheLab }) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const tabs: { key: ShowcaseTab; label: { zh: string; en: string }; icon: React.ReactNode }[] = [
    {
      key: 'overview',
      label: { zh: '系統總覽（v1.10.0）', en: 'Overview (v1.10.0)' },
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      key: 'architecture',
      label: { zh: '分層與核心架構', en: 'Architecture' },
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      key: 'security',
      label: { zh: '三層資安健檢（v1.11）', en: '3-Layer Security Audit (v1.11)' },
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <section id="sherry" className="py-14 border-b border-stone-200/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Sparkles className="w-3 h-3" />
              {lang === 'zh' ? '旗艦開源專案' : 'Flagship Engineering Project'}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-academic-50 text-academic-900 border border-academic-200/70">
              GitHub {SHERRY_META.publicRelease}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Audit: {SHERRY_META.devMilestone}
            </span>
            <span className="font-mono text-xs text-slate-500">{SHERRY_META.period}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {t(SHERRY_META.name)}
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
            {t(SHERRY_META.summary)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenKvCacheLab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-academic-200 bg-academic-50 text-xs font-medium text-academic-900 hover:bg-academic-100 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? 'KV Cache 模擬實驗室' : 'KV Cache Lab'}</span>
          </button>
          <a
            href={SHERRY_META.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-medium text-ink hover:border-academic-600 hover:text-academic-900 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub ({SHERRY_META.publicRelease})</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Showcase Card */}
      <div className="academic-card p-5 sm:p-6 space-y-6">
        {/* Version Clarification Banner */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-stone-50 border border-stone-200/80 text-xs text-slate-600 leading-relaxed">
          <Info className="w-4 h-4 text-academic-700 shrink-0 mt-0.5" />
          <span>{t(SHERRY_META.versionNotice)}</span>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHERRY_KPIS.map((kpi, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1"
            >
              <div className="text-[11px] font-medium text-slate-500">{t(kpi.label)}</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-ink tracking-tight">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">{t(kpi.detail)}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div
          className="flex flex-wrap gap-2 border-b border-stone-200/80 pb-3"
          role="tablist"
          aria-label="Sherry showcase sections"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  active
                    ? 'bg-academic-900 text-white border-academic-900 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50'
                    : 'bg-white text-slate-600 border-stone-200 hover:border-stone-300 hover:text-ink dark:hover:border-slate-600'
                }`}
              >
                {tab.icon}
                <span>{t(tab.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Key Outcomes */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '關鍵工程成果' : 'Key Engineering Outcomes'}
                </span>
                <span className="text-xs text-slate-500">
                  {lang === 'zh' ? '負責角色：' : 'Role: '}
                  {t(SHERRY_META.role)}
                </span>
              </div>
              <ul className="space-y-1.5">
                {SHERRY_OVERVIEW_OUTCOMES.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-[13px] text-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-academic-700 shrink-0 mt-0.5" />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3 Core Capability Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SHERRY_CORE_CAPABILITIES.map((pillar) => (
                <div
                  key={pillar.id}
                  className="p-4 rounded-xl border border-stone-200/80 bg-white flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-academic-50 text-academic-900 border border-academic-200/60">
                      {t(pillar.tag)}
                    </span>
                    <h3 className="text-sm font-semibold text-ink leading-snug">{t(pillar.title)}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{t(pillar.summary)}</p>
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-stone-100">
                    {pillar.points.map((pt, idx) => (
                      <li key={idx} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                        <span className="text-academic-700 font-bold">•</span>
                        <span>{t(pt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Architecture */}
        {activeTab === 'architecture' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SHERRY_ARCH_LAYERS.map((item, idx) => (
                <div
                  key={item.layer}
                  className="p-4 rounded-xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50 dark:bg-slate-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-academic-900 dark:bg-sky-500/20 text-white dark:text-sky-300 dark:border dark:border-sky-400/30 font-mono text-[11px] font-semibold whitespace-nowrap shrink-0">
                      {item.layer}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      L{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink leading-snug">{t(item.title)}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t(item.desc)}</p>
                </div>
              ))}
            </div>

            {/* Interactive KV Cache Callout */}
            <div className="p-4 rounded-xl bg-academic-50 border border-academic-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-academic-900">
                  <Cpu className="w-4 h-4" />
                  <span>
                    {lang === 'zh'
                      ? 'KV Cache Zone 1 / Zone 2 前綴對齊實作原理'
                      : 'KV Cache Zone 1 / Zone 2 Prefix Alignment'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {lang === 'zh'
                    ? '將靜態人設與精簡工具索引鎖定於 Zone 1、動態上下文集中於 Zone 2，使 Pass-1 與 Pass-2 位元組 100% 對齊，直接命中 5,500+ tokens 快取並免除二次 Prefill。'
                    : 'Locks static persona & compact tool index in Zone 1 and dynamic context in Zone 2 for 100% byte-aligned Pass-1/Pass-2 prefix caching (5,500+ tokens cached, zero second prefill).'}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenKvCacheLab}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-academic-900 text-white text-xs font-medium hover:bg-academic-700 transition-colors shrink-0 self-start sm:self-center"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '開啟互動模擬器' : 'Launch Simulator'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: 3-Layer Security Audit */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* 3 Tool Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {SHERRY_SECURITY_TOOLS.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-emerald-800">{t(item.layer)}</div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold text-ink">{item.tool}</h3>
                      <span className="font-mono text-[11px] text-slate-500">{item.version}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t(item.badge)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1">{t(item.headline)}</p>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-emerald-200/60">
                    {t(item.scope)}
                  </div>
                </div>
              ))}
            </div>

            {/* Trivy & Bandit Before / After Table */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {lang === 'zh'
                    ? 'Trivy & Bandit 資安健檢修復對照（v1.11 開發版 · 兩階段強化）'
                    : 'Trivy & Bandit Remediation Summary (v1.11 dev · 2-Phase Hardening)'}
                </h3>
                <span className="font-mono text-[11px] text-slate-500">2026-11-27</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-600">
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {lang === 'zh' ? '掃描項目' : 'Audit Category'}
                      </th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {lang === 'zh' ? '修復前' : 'Before'}
                      </th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {lang === 'zh' ? '強化後' : 'After'}
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        {lang === 'zh' ? '實質處置與重構說明' : 'Remediation & Structural Hardening'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {SHERRY_AUDIT_COMPARISON.map((row, idx) => (
                      <tr key={idx} className="text-slate-700 align-top">
                        <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">
                          {t(row.category)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{t(row.before)}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700 whitespace-nowrap">
                          {t(row.after)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 leading-relaxed min-w-[260px]">
                          {t(row.remediation)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Hardening Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SHERRY_SECURITY_HIGHLIGHTS.map((hl) => (
                <div key={hl.rule} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-academic-800 font-semibold">
                    {hl.rule}
                  </span>
                  <h4 className="text-xs font-semibold text-ink">{t(hl.title)}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{t(hl.detail)}</p>
                </div>
              ))}
            </div>

            {/* Nessus DAST Evidence with Screenshot */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {t(SHERRY_NESSUS_EVIDENCE.title)}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-academic-800 hover:underline"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '放大檢視截圖' : 'Zoom Screenshot'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block w-full overflow-hidden rounded-lg border border-stone-200 bg-white hover:border-academic-600/50 transition-colors cursor-zoom-in"
              >
                <img
                  src={SHERRY_NESSUS_EVIDENCE.imageSrc}
                  alt={t(SHERRY_NESSUS_EVIDENCE.imageAlt)}
                  className="w-full max-h-64 object-contain bg-white p-2"
                  loading="lazy"
                />
              </button>

              <p className="text-xs sm:text-[13px] font-semibold text-emerald-800">
                {t(SHERRY_NESSUS_EVIDENCE.summary)}
              </p>

              <ul className="space-y-1.5">
                {SHERRY_NESSUS_EVIDENCE.analysisPoints.map((pt, idx) => (
                  <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{t(pt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer Tech Stack */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap gap-1.5">
            {SHERRY_META.techStack.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded bg-stone-100 text-slate-600 font-mono text-[11px]"
              >
                {tech}
              </span>
            ))}
          </div>

          {activeTab !== 'security' && (
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/80 text-xs font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '查看三層資安健檢報告' : 'View 3-Layer Security Audit'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Nessus Screenshot */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t(SHERRY_NESSUS_EVIDENCE.imageAlt)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-3 sm:p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={SHERRY_NESSUS_EVIDENCE.imageSrc}
              alt={t(SHERRY_NESSUS_EVIDENCE.imageAlt)}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  );
};
