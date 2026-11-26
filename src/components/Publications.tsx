import React, { useMemo, useState } from 'react';
import { Award, Check, Copy, ExternalLink, Search } from 'lucide-react';
import { PUBLICATIONS } from '../data/publications';
import { SITE_PROFILE } from '../data/profile';
import type { PublicationType } from '../types/portfolio';
import { useLanguage } from '../context/LanguageContext';

type FilterOption = 'all' | PublicationType;

export const Publications: React.FC = () => {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filters: { key: FilterOption; label: { zh: string; en: string }; count: number }[] = useMemo(
    () => [
      { key: 'all', label: { zh: '全部', en: 'All' }, count: PUBLICATIONS.length },
      {
        key: 'sci-journal',
        label: { zh: 'SCI 期刊', en: 'SCI Journals' },
        count: PUBLICATIONS.filter((p) => p.type === 'sci-journal').length,
      },
      {
        key: 'intl-conference',
        label: { zh: '國際研討會', en: "Int'l Conferences" },
        count: PUBLICATIONS.filter((p) => p.type === 'intl-conference').length,
      },
      {
        key: 'domestic-conference',
        label: { zh: '國內研討會', en: 'Domestic' },
        count: PUBLICATIONS.filter((p) => p.type === 'domestic-conference').length,
      },
      {
        key: 'accepted',
        label: { zh: '已接受', en: 'Accepted' },
        count: PUBLICATIONS.filter((p) => p.type === 'accepted').length,
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PUBLICATIONS.filter((pub) => {
      if (filter !== 'all' && pub.type !== filter) return false;
      if (!q) return true;
      return (
        pub.title.toLowerCase().includes(q) ||
        pub.venue.toLowerCase().includes(q) ||
        pub.authors.some((a) => a.toLowerCase().includes(q)) ||
        pub.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        String(pub.year).includes(q)
      );
    }).sort((a, b) => b.year - a.year);
  }, [filter, query]);

  const handleCopyBibtex = async (id: string, bibtex: string) => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  const renderAuthors = (authors: string[]) =>
    authors.map((author, idx) => {
      const isMe = SITE_PROFILE.authorHighlightNames.some((name) => author.includes(name));
      return (
        <React.Fragment key={`${author}-${idx}`}>
          {idx > 0 && ', '}
          <span className={isMe ? 'font-semibold text-ink underline decoration-academic-600/50 underline-offset-2' : ''}>
            {author}
          </span>
        </React.Fragment>
      );
    });

  return (
    <section id="publications" className="py-14 border-b border-stone-200/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {lang === 'zh' ? '論文發表' : 'Publications'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'zh'
              ? '涵蓋已發表之 SCI 國際期刊、國際／國內研討會與已接受論文，支援關鍵字檢索與 BibTeX 引用。'
              : 'Published SCI journals, international & domestic conferences, and accepted manuscripts with one-click BibTeX.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'zh' ? '搜尋標題、期刊、關鍵字...' : 'Search title, venue, tag...'}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-stone-300 rounded-lg text-ink placeholder:text-slate-400 focus:outline-none focus:border-academic-600 focus:ring-1 focus:ring-academic-600/30"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
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
              {t(item.label)}{' '}
              <span className={active ? 'text-academic-100' : 'text-slate-400'}>({item.count})</span>
            </button>
          );
        })}
      </div>

      {/* Publication List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="academic-card p-8 text-center text-sm text-slate-500">
            {lang === 'zh' ? '沒有符合條件的論文。' : 'No matching publications found.'}
          </div>
        ) : (
          filtered.map((pub) => (
            <article key={pub.id} className="academic-card academic-card-hover p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs font-medium text-slate-500">{pub.year}</span>

                {pub.badge && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      pub.type === 'sci-journal'
                        ? 'bg-academic-50 text-academic-900 border-academic-100'
                        : pub.type === 'accepted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                          : 'bg-stone-100 text-slate-700 border-stone-200'
                    }`}
                  >
                    {t(pub.badge)}
                  </span>
                )}

                {pub.award && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                    <Award className="w-3 h-3" />
                    {t(pub.award)}
                  </span>
                )}
              </div>

              <h3 className="text-[15px] sm:text-base font-semibold text-ink leading-snug">
                {pub.url ? (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-academic-800 hover:underline decoration-academic-600/40 underline-offset-2 transition-colors"
                  >
                    {pub.title}
                  </a>
                ) : (
                  pub.title
                )}
              </h3>

              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {renderAuthors(pub.authors)}
              </p>

              <p className="text-sm italic text-slate-500 mt-1">{pub.venue}</p>

              {pub.url && (
                <div className="mt-1.5 text-xs font-mono">
                  <span className="text-slate-400 mr-1.5">{pub.doi ? 'DOI:' : 'Link:'}</span>
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-academic-700 hover:text-academic-900 hover:underline break-all"
                  >
                    <span>{pub.doi ? `https://doi.org/${pub.doi}` : pub.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-stone-100">
                <div className="flex flex-wrap gap-1.5">
                  {pub.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-stone-100/80 text-slate-600 font-mono text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 text-xs font-medium text-academic-800 hover:bg-academic-50 hover:border-academic-200 transition-colors"
                    >
                      <span>{pub.doi ? 'DOI' : 'IEEE Xplore'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyBibtex(pub.id, pub.bibtex)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 text-xs font-medium text-slate-600 hover:text-ink hover:bg-stone-50 transition-colors"
                  >
                    {copiedId === pub.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">
                          {lang === 'zh' ? '已複製 BibTeX' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>BibTeX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        {lang === 'zh'
          ? '註：部分論文作者排序依指導教授署名慣例，本人為實際研究執行與論文撰寫者。'
          : 'Note: For selected papers, author order follows advisor convention; I served as the primary contributor to research execution and manuscript drafting.'}
      </p>
    </section>
  );
};
