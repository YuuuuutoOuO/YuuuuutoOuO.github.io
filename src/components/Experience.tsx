import React from 'react';
import { Briefcase, FileCheck2, GraduationCap } from 'lucide-react';
import { EDUCATION, EXPERIENCE, RESEARCH_GRANTS } from '../data/experience';
import { useLanguage } from '../context/LanguageContext';

export const Experience: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="experience" className="py-14 border-b border-stone-200/80 space-y-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          {lang === 'zh' ? '學經歷與研究計畫' : 'Education, Experience & Grants'}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {lang === 'zh'
            ? '從學術研究、國家資安計畫到產業系統落地的完整歷程。'
            : 'Academic background, national cybersecurity research programs, and industry-academia engineering.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Education Column */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <GraduationCap className="w-4 h-4 text-academic-800" />
            <span>{lang === 'zh' ? '學歷背景' : 'Education'}</span>
          </h3>

          <div className="space-y-3">
            {EDUCATION.map((edu) => (
              <div key={edu.id} className="academic-card p-4">
                <div className="font-mono text-xs text-slate-500">{edu.period}</div>
                <div className="font-semibold text-ink text-[15px] mt-1">{t(edu.degree)}</div>
                <div className="text-sm text-slate-700 mt-0.5">{t(edu.institution)}</div>
                <div className="text-xs text-slate-500">{t(edu.department)}</div>
                {edu.note && (
                  <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-stone-100 leading-relaxed">
                    {t(edu.note)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Work / Research Experience Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <Briefcase className="w-4 h-4 text-academic-800" />
            <span>{lang === 'zh' ? '研究與實務經歷' : 'Research & Engineering Roles'}</span>
          </h3>

          <div className="space-y-4">
            {EXPERIENCE.map((exp) => (
              <div key={exp.id} className="academic-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-ink text-base">{t(exp.role)}</h4>
                  <span className="font-mono text-xs text-slate-500">{exp.period}</span>
                </div>
                <div className="text-sm text-academic-800 font-medium mt-0.5">
                  {t(exp.organization)}
                </div>

                <ul className="mt-3 space-y-1.5">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="text-stone-400 select-none">•</span>
                      <span>{t(bullet)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3 border-t border-stone-100">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-stone-100 text-slate-600 font-mono text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Funded Research Projects */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <FileCheck2 className="w-4 h-4 text-academic-800" />
          <span>{lang === 'zh' ? '代表性參與研究計畫（資安院 ／ 國科會）' : 'Selected Research Projects (NICS / NSTC)'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {RESEARCH_GRANTS.map((grant) => (
            <div key={grant.id} className="academic-card p-4 flex flex-col justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-slate-700">
                    {t(grant.agency)}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{grant.period}</span>
                </div>
                <h4 className="text-sm font-semibold text-ink leading-snug">{t(grant.title)}</h4>
              </div>
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>{t(grant.role)}</span>
                {grant.code && <span className="font-mono text-[11px] text-slate-400">{grant.code}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
