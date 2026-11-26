import React from 'react';
import { Award, BadgeCheck, Wrench } from 'lucide-react';
import { AWARDS, CERTIFICATIONS, SKILL_GROUPS } from '../data/credentials';
import { useLanguage } from '../context/LanguageContext';

export const Credentials: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="credentials" className="py-14 space-y-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          {lang === 'zh' ? '榮譽、證照與核心技能' : 'Honors, Certifications & Skills'}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {lang === 'zh'
            ? '國際學術獎項、資訊安全與網路專業認證，以及跨領域技術堆疊。'
            : 'Academic recognition, cybersecurity & networking certifications, and technical stack.'}
        </p>
      </div>

      {/* Awards */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Award className="w-4 h-4 text-amber-600" />
          <span>{lang === 'zh' ? '學術榮譽' : 'Honors & Awards'}</span>
        </h3>
        {AWARDS.map((award) => (
          <div
            key={award.id}
            className="academic-card p-5 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="font-semibold text-ink text-base">{t(award.title)}</div>
              <div className="text-sm text-slate-700">{t(award.event)}</div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{t(award.detail)}</p>
            </div>
            <span className="font-mono text-xs text-slate-500 shrink-0">{award.date}</span>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <BadgeCheck className="w-4 h-4 text-academic-800" />
          <span>{lang === 'zh' ? '專業證照與訓練認證' : 'Certifications'}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CERTIFICATIONS.map((cert) => (
            <div key={cert.id} className="academic-card p-4 flex flex-col justify-between gap-2">
              <div className="font-medium text-sm text-ink leading-snug">{cert.name}</div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-slate-500">
                <span>{t(cert.issuer)}</span>
                <span className="font-mono text-[11px] shrink-0">{cert.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Wrench className="w-4 h-4 text-academic-800" />
          <span>{lang === 'zh' ? '核心技術能力' : 'Technical Skills'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SKILL_GROUPS.map((group) => (
            <div key={group.id} className="academic-card p-5 space-y-3">
              <h4 className="font-semibold text-sm text-ink">{t(group.title)}</h4>
              <div className="flex flex-wrap gap-1.5">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md bg-stone-100/90 text-slate-700 text-xs font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
