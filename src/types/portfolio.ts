export type Language = 'zh' | 'en';

export interface LocalizedText {
  zh: string;
  en: string;
}

export type PublicationType =
  | 'sci-journal'
  | 'intl-conference'
  | 'domestic-conference'
  | 'accepted';

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: PublicationType;
  badge?: LocalizedText;
  award?: LocalizedText;
  doi?: string;
  url?: string;
  tags: string[];
  bibtex: string;
}

export type ProjectCategory = 'ai-llm' | 'security-forensics' | 'systems';

export interface ProjectEvidenceRow {
  date: string;
  scope: LocalizedText;
  metrics: LocalizedText;
}

export interface ProjectEvidence {
  buttonLabel: LocalizedText;
  title: LocalizedText;
  imageSrc?: string;
  imageAlt?: LocalizedText;
  summary: LocalizedText;
  tableRows?: ProjectEvidenceRow[];
  analysisPoints: LocalizedText[];
  confidentialityNote?: LocalizedText;
}

export interface ProjectItem {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  period: string;
  category: ProjectCategory;
  categoryLabel: LocalizedText;
  role: LocalizedText;
  summary: LocalizedText;
  highlights: LocalizedText[];
  outcomes: LocalizedText[];
  techStack: string[];
  repoUrl?: string;
  status?: LocalizedText;
  featured?: boolean;
  evidence?: ProjectEvidence;
}

export interface EducationItem {
  id: string;
  degree: LocalizedText;
  institution: LocalizedText;
  department: LocalizedText;
  period: string;
  note?: LocalizedText;
}

export interface ExperienceItem {
  id: string;
  role: LocalizedText;
  organization: LocalizedText;
  period: string;
  bullets: LocalizedText[];
  tags: string[];
}

export interface ResearchGrant {
  id: string;
  title: LocalizedText;
  agency: LocalizedText;
  code?: string;
  period: string;
  role: LocalizedText;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: LocalizedText;
  date: string;
  validity?: LocalizedText;
  category: 'security' | 'networking' | 'engineering';
}

export interface AwardItem {
  id: string;
  title: LocalizedText;
  event: LocalizedText;
  date: string;
  detail: LocalizedText;
}

export interface SkillGroup {
  id: string;
  title: LocalizedText;
  skills: string[];
}
