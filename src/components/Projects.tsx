import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Github, ShieldCheck, Sparkles, X, ZoomIn } from 'lucide-react';
import { PROJECTS } from '../data/projects';
import type { ProjectCategory } from '../types/portfolio';
import { useLanguage } from '../context/LanguageContext';

type ProjectFilter = 'all' | ProjectCategory;

export const Projects: React.FC = () => {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'sherry-ai-platform': true,
    'dlc-stego': true,
  });
  const [evidenceOpenIds, setEvidenceOpenIds] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const filters: { key: ProjectFilter; label: { zh: string; en: string } }[] = [
    { key: 'all', label: { zh: '全部專案', en: 'All Projects' } },
    { key: 'ai-llm', label: { zh: 'AI Agent / LLM', en: 'AI Agent & LLM' } },
    { key: 'security-forensics', label: { zh: '資安與鑑識', en: 'Security & Forensics' } },
    { key: 'systems', label: { zh: '系統工程', en: 'Systems' } },
  ];

  const visibleProjects = useMemo(
    () => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEvidence = (id: string) => {
    setEvidenceOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="projects" className="py-14 border-b border-stone-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {lang === 'zh' ? '研究與工程專案' : 'Research & Engineering Projects'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'zh'
              ? '涵蓋開源 AI Agent 平台、深度學習影像鑑識、資安院雲端組態計畫與去識別化產學合作系統。'
              : 'Open-source AI Agent platform, deep learning digital forensics, NICS cloud compliance, and de-identified industry-academia systems.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  active
                    ? 'bg-academic-900 text-white border-academic-900'
                    : 'bg-white text-slate-600 border-stone-200 hover:border-stone-300 hover:text-ink'
                }`}
              >
                {t(item.label)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {visibleProjects.map((project) => {
          const isExpanded = Boolean(expandedIds[project.id]);
          return (
            <article key={project.id} className="academic-card academic-card-hover p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-academic-50 text-academic-900 border border-academic-100">
                      {t(project.categoryLabel)}
                    </span>
                    <span className="font-mono text-xs text-slate-500">{project.period}</span>
                    {project.featured && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded">
                        <Sparkles className="w-3 h-3" />
                        {lang === 'zh' ? '重點代表' : 'Featured'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-ink leading-snug pt-0.5">
                    {t(project.title)}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">{t(project.subtitle)}</p>
                </div>

                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-medium text-ink hover:border-academic-600 hover:text-academic-900 transition-colors shrink-0"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mt-3">{t(project.summary)}</p>

              {/* Key Outcomes Strip */}
              <div className="mt-4 p-3.5 rounded-lg bg-stone-50 border border-stone-200/70 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '關鍵成果' : 'Key Outcomes'}
                </div>
                <ul className="space-y-1">
                  {project.outcomes.map((outcome, idx) => (
                    <li key={idx} className="text-xs sm:text-[13px] text-slate-800 flex items-start gap-2">
                      <span className="text-academic-700 font-bold leading-5">•</span>
                      <span>{t(outcome)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expandable Technical Details */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {lang === 'zh' ? '技術架構與實作細節' : 'Technical Highlights'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {lang === 'zh' ? '負責角色：' : 'Role: '}
                      {t(project.role)}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {project.highlights.map((hl, idx) => (
                      <li key={idx} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="text-stone-400 select-none">–</span>
                        <span>{t(hl)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expandable Security / Verification Evidence */}
              {project.evidence && evidenceOpenIds[project.id] && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {t(project.evidence.title)}
                    </span>
                    {project.evidence.imageSrc && (
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImage({
                            src: project.evidence!.imageSrc!,
                            alt: project.evidence!.imageAlt ? t(project.evidence!.imageAlt) : t(project.evidence!.title),
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-academic-800 hover:underline"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>{lang === 'zh' ? '放大檢視' : 'Zoom'}</span>
                      </button>
                    )}
                  </div>

                  {project.evidence.imageSrc && (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          src: project.evidence!.imageSrc!,
                          alt: project.evidence!.imageAlt ? t(project.evidence!.imageAlt) : t(project.evidence!.title),
                        })
                      }
                      className="block w-full overflow-hidden rounded-lg border border-stone-200 bg-white hover:border-academic-600/50 transition-colors cursor-zoom-in"
                    >
                      <img
                        src={project.evidence.imageSrc}
                        alt={project.evidence.imageAlt ? t(project.evidence.imageAlt) : t(project.evidence.title)}
                        className="w-full max-h-72 object-contain bg-white p-2"
                        loading="lazy"
                      />
                    </button>
                  )}

                  <p className="text-xs sm:text-[13px] font-semibold text-emerald-900">
                    {t(project.evidence.summary)}
                  </p>

                  {project.evidence.tableRows && project.evidence.tableRows.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-slate-600">
                            <th className="py-2 px-3 font-semibold whitespace-nowrap">
                              {lang === 'zh' ? '掃描日期' : 'Date'}
                            </th>
                            <th className="py-2 px-3 font-semibold">
                              {lang === 'zh' ? '執行批次與範圍' : 'Batch & Scope'}
                            </th>
                            <th className="py-2 px-3 font-semibold">
                              {lang === 'zh' ? '去識別化規模' : 'Sanitized Scale'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {project.evidence.tableRows.map((row, idx) => (
                            <tr key={idx} className="text-slate-700">
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {row.date}
                              </td>
                              <td className="py-2 px-3 font-medium text-ink">{t(row.scope)}</td>
                              <td className="py-2 px-3 text-slate-600">{t(row.metrics)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <ul className="space-y-1.5">
                    {project.evidence.analysisPoints.map((pt, idx) => (
                      <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{t(pt)}</span>
                      </li>
                    ))}
                  </ul>

                  {project.evidence.confidentialityNote && (
                    <p className="text-[11px] text-slate-500 pt-2 border-t border-emerald-200/60 leading-relaxed">
                      {t(project.evidence.confidentialityNote)}
                    </p>
                  )}
                </div>
              )}

              {/* Footer: Tech Stack & Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-stone-100 text-slate-600 font-mono text-[11px]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {project.evidence && (
                    <button
                      type="button"
                      onClick={() => toggleEvidence(project.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/80 text-xs font-medium transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {evidenceOpenIds[project.id]
                          ? lang === 'zh'
                            ? '收合掃描佐證'
                            : 'Hide Evidence'
                          : t(project.evidence.buttonLabel)}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(project.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-academic-800 hover:text-academic-600 transition-colors"
                  >
                    <span>
                      {isExpanded
                        ? lang === 'zh'
                          ? '收合技術細節'
                          : 'Hide Details'
                        : lang === 'zh'
                          ? '展開技術細節'
                          : 'Technical Details'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Lightbox Modal for Evidence Image */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-3 sm:p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  );
};
