import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ComplianceLabModalProps {
  open: boolean;
  onClose: () => void;
}

type ComplianceTab = 'audit' | 'cvss';
type PlatformId = 'linux-gcb' | 'azure-cis';

interface AuditControl {
  id: string;
  code: string;
  isoRef: string;
  titleZh: string;
  titleEn: string;
  checkCmd: string;
  remediationCmd: string;
  severity: 'High' | 'Medium';
  defaultCompliant: boolean;
}

const AUDIT_CONTROLS: Record<PlatformId, AuditControl[]> = {
  'linux-gcb': [
    {
      id: 'selinux',
      code: 'TWGCB-01-008-0059',
      isoRef: 'ISO A.8.9',
      titleZh: 'SELinux 必須設定為 Enforcing 強制模式',
      titleEn: 'SELinux must be set to Enforcing mode',
      checkCmd: 'getenforce | grep -qx "Enforcing"',
      remediationCmd: 'setenforce 1 && sed -i "s/^SELINUX=.*/SELINUX=enforcing/" /etc/selinux/config',
      severity: 'High',
      defaultCompliant: true,
    },
    {
      id: 'ip-forward',
      code: 'TWGCB-01-008-0135',
      isoRef: 'ISO A.8.20',
      titleZh: '停用核心 IPv4 封包轉送 (net.ipv4.ip_forward = 0)',
      titleEn: 'Disable kernel IPv4 packet forwarding (ip_forward = 0)',
      checkCmd: 'sysctl -n net.ipv4.ip_forward | grep -qx "0"',
      remediationCmd: 'sysctl -w net.ipv4.ip_forward=0 && echo "net.ipv4.ip_forward = 0" >> /etc/sysctl.d/99-gcb.conf',
      severity: 'High',
      defaultCompliant: false,
    },
    {
      id: 'ssh-root',
      code: 'TWGCB-01-008-0205',
      isoRef: 'ISO A.8.2',
      titleZh: '禁止 SSH 以 root 帳號直接遠端登入',
      titleEn: 'Disable direct SSH root login (PermitRootLogin no)',
      checkCmd: 'sshd -T | grep -iq "^permitrootlogin no$"',
      remediationCmd: 'sed -i "s/^#*PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config && systemctl reload sshd',
      severity: 'High',
      defaultCompliant: true,
    },
    {
      id: 'chrony',
      code: 'TWGCB-01-008-0092',
      isoRef: 'ISO A.8.17',
      titleZh: '啟用 Chrony 網路校時服務以確保稽核時戳一致',
      titleEn: 'Enable Chrony time synchronization daemon',
      checkCmd: 'systemctl is-active --quiet chronyd',
      remediationCmd: 'systemctl enable --now chronyd',
      severity: 'Medium',
      defaultCompliant: true,
    },
    {
      id: 'legacy-svc',
      code: 'TWGCB-01-008-0098',
      isoRef: 'ISO A.8.9',
      titleZh: '移除非必要高風險服務 (vsftpd / ypserv / squid)',
      titleEn: 'Remove unnecessary legacy services (vsftpd / ypserv)',
      checkCmd: '! rpm -q vsftpd ypserv >/dev/null 2>&1',
      remediationCmd: 'dnf remove -y vsftpd ypserv',
      severity: 'Medium',
      defaultCompliant: false,
    },
    {
      id: 'auditd',
      code: 'TWGCB-01-008-0174',
      isoRef: 'ISO A.8.15',
      titleZh: '啟用 auditd 系統稽核服務並保留稽核軌跡',
      titleEn: 'Enable auditd service for system event logging',
      checkCmd: 'systemctl is-active --quiet auditd',
      remediationCmd: 'systemctl enable --now auditd',
      severity: 'High',
      defaultCompliant: true,
    },
  ],
  'azure-cis': [
    {
      id: 'az-mfa',
      code: 'AZURE-ID-1.1',
      isoRef: 'ISO A.8.5',
      titleZh: '身分識別：所有特權管理員帳號強制啟用 MFA',
      titleEn: 'Identity: Enforce MFA for all privileged admin accounts',
      checkCmd: 'az ad sp list --query "[?mfaEnabled==false]"',
      remediationCmd: 'Enable Conditional Access policy requiring MFA for Global Admin & Privileged Roles',
      severity: 'High',
      defaultCompliant: true,
    },
    {
      id: 'az-storage-public',
      code: 'AZURE-ST-3.7',
      isoRef: 'ISO A.8.12',
      titleZh: '儲存體：停用 Storage Account Blob 匿名公開存取',
      titleEn: 'Storage: Disable anonymous public Blob access',
      checkCmd: 'az storage account list --query "[?allowBlobPublicAccess==true].name"',
      remediationCmd: 'az storage account update --name <acct> --resource-group <rg> --allow-blob-public-access false',
      severity: 'High',
      defaultCompliant: false,
    },
    {
      id: 'az-sql-tde',
      code: 'AZURE-DB-4.1',
      isoRef: 'ISO A.8.24',
      titleZh: '資料庫：Azure SQL 強制啟用 TDE 靜態資料加密',
      titleEn: 'Database: Ensure SQL Transparent Data Encryption (TDE) is On',
      checkCmd: 'az sql db tde show --resource-group <rg> --server <srv> --database <db>',
      remediationCmd: 'az sql db tde set --resource-group <rg> --server <srv> --database <db> --status Enabled',
      severity: 'High',
      defaultCompliant: true,
    },
    {
      id: 'az-nsg-rdp',
      code: 'AZURE-NET-6.1',
      isoRef: 'ISO A.8.20',
      titleZh: '網路服務：NSG 禁止對 0.0.0.0/0 開放 RDP (3389) / SSH (22)',
      titleEn: 'Networking: Restrict RDP (3389) & SSH (22) from 0.0.0.0/0',
      checkCmd: 'az network nsg rule list --query "[?sourceAddressPrefix==\'*\' && access==\'Allow\']"',
      remediationCmd: 'az network nsg rule update --nsg-name <nsg> --name <rule> --source-address-prefixes <trusted-cidr>',
      severity: 'High',
      defaultCompliant: false,
    },
    {
      id: 'az-vm-disk',
      code: 'AZURE-CMP-7.2',
      isoRef: 'ISO A.8.24',
      titleZh: '計算機服務：VM OS 與資料磁碟啟用靜態加密',
      titleEn: 'Compute: Ensure VM OS and data disks are encrypted',
      checkCmd: 'az vm encryption show --resource-group <rg> --name <vm>',
      remediationCmd: 'az vm encryption enable --resource-group <rg> --name <vm> --disk-encryption-keyvault <kv>',
      severity: 'Medium',
      defaultCompliant: true,
    },
    {
      id: 'az-activity-log',
      code: 'AZURE-LOG-5.1',
      isoRef: 'ISO A.8.15',
      titleZh: '日誌稽核：Activity Log 診斷設定留存期 ≥ 365 天',
      titleEn: 'Logging: Activity Log retention policy ≥ 365 days',
      checkCmd: 'az monitor diagnostic-settings subscription list',
      remediationCmd: 'az monitor diagnostic-settings subscription create --name gcb-audit --storage-account <id>',
      severity: 'Medium',
      defaultCompliant: true,
    },
  ],
};

// CVSS v3.1 Base Score exact specification weights
type Av = 'N' | 'A' | 'L' | 'P';
type Ac = 'L' | 'H';
type Pr = 'N' | 'L' | 'H';
type Ui = 'N' | 'R';
type Scope = 'U' | 'C';
type Cia = 'N' | 'L' | 'H';

interface CvssMetrics {
  AV: Av;
  AC: Ac;
  PR: Pr;
  UI: Ui;
  S: Scope;
  C: Cia;
  I: Cia;
  A: Cia;
}

const AV_W: Record<Av, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_W: Record<Ac, number> = { L: 0.77, H: 0.44 };
const PR_W_U: Record<Pr, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_W_C: Record<Pr, number> = { N: 0.85, L: 0.68, H: 0.5 };
const UI_W: Record<Ui, number> = { N: 0.85, R: 0.62 };
const CIA_W: Record<Cia, number> = { N: 0, L: 0.22, H: 0.56 };

function roundupCvss(val: number): number {
  const intInput = Math.round(val * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
}

function calculateCvss31(m: CvssMetrics): { score: number; severity: string; vector: string } {
  const iss = 1 - (1 - CIA_W[m.C]) * (1 - CIA_W[m.I]) * (1 - CIA_W[m.A]);
  const impact =
    m.S === 'U' ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const prW = m.S === 'U' ? PR_W_U[m.PR] : PR_W_C[m.PR];
  const exploitability = 8.22 * AV_W[m.AV] * AC_W[m.AC] * prW * UI_W[m.UI];

  let score = 0;
  if (impact > 0) {
    const raw =
      m.S === 'U' ? Math.min(impact + exploitability, 10) : Math.min(1.08 * (impact + exploitability), 10);
    score = roundupCvss(raw);
  }

  let severity = 'None';
  if (score >= 9.0) severity = 'Critical';
  else if (score >= 7.0) severity = 'High';
  else if (score >= 4.0) severity = 'Medium';
  else if (score > 0) severity = 'Low';

  const vector = `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
  return { score, severity, vector };
}

const CVSS_PRESETS: { labelZh: string; labelEn: string; metrics: CvssMetrics }[] = [
  {
    labelZh: '自簽憑證 (Nessus Medium)',
    labelEn: 'Self-Signed SSL (Medium)',
    metrics: { AV: 'N', AC: 'H', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'N', A: 'N' },
  },
  {
    labelZh: 'ICMP Timestamp (Low)',
    labelEn: 'ICMP Timestamp (Low)',
    metrics: { AV: 'N', AC: 'H', PR: 'N', UI: 'N', S: 'U', C: 'L', I: 'N', A: 'N' },
  },
  {
    labelZh: '未授權遠端 RCE (Critical)',
    labelEn: 'Unauth Remote RCE (Critical)',
    metrics: { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' },
  },
];

export const ComplianceLabModal: React.FC<ComplianceLabModalProps> = ({ open, onClose }) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';

  const [tab, setTab] = useState<ComplianceTab>('audit');
  const [platform, setPlatform] = useState<PlatformId>('linux-gcb');
  const [states, setStates] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.values(AUDIT_CONTROLS).forEach((list) => {
      list.forEach((c) => {
        init[c.id] = c.defaultCompliant;
      });
    });
    return init;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [cvss, setCvss] = useState<CvssMetrics>(CVSS_PRESETS[0].metrics);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const currentControls = AUDIT_CONTROLS[platform];
  const passCount = currentControls.filter((c) => states[c.id]).length;
  const compliancePct = Math.round((passCount / currentControls.length) * 100);
  const failedControls = currentControls.filter((c) => !states[c.id]);

  const cvssResult = useMemo(() => calculateCvss31(cvss), [cvss]);

  const setAllForPlatform = (compliant: boolean) => {
    setStates((prev) => {
      const next = { ...prev };
      currentControls.forEach((c) => {
        next[c.id] = compliant;
      });
      return next;
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  if (!open) return null;

  const severityColor =
    cvssResult.severity === 'Critical'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : cvssResult.severity === 'High'
        ? 'text-orange-600 bg-orange-50 border-orange-200'
        : cvssResult.severity === 'Medium'
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : cvssResult.severity === 'Low'
            ? 'text-sky-700 bg-sky-50 border-sky-200'
            : 'text-slate-600 bg-stone-100 border-stone-200';

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Security Compliance & CVSS Lab"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-paper border border-stone-200 dark:border-slate-700 shadow-2xl text-ink"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-paper/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-academic-900 dark:bg-sky-500/20 text-white dark:text-sky-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif font-semibold text-base sm:text-lg leading-tight">
                {isZh ? '資安合規檢測與弱點分級實驗室' : 'Compliance Audit & CVSS 3.1 Lab'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                TWGCB-01-008 · Azure CIS 5.0 · ISO/IEC 27001 · CVSS v3.1 Triage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Compliance Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Top Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setTab('audit')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'audit'
                  ? 'bg-academic-900 text-white'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isZh ? 'GCB / Azure 雙向合規模擬' : 'GCB / Azure Audit Sim'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('cvss')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'cvss'
                  ? 'bg-academic-900 text-white'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isZh ? 'CVSS 3.1 弱點嚴重度計算器' : 'CVSS 3.1 Calculator'}</span>
            </button>
          </div>

          {tab === 'audit' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Controls Toggle */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: 'linux-gcb', label: 'Linux (TWGCB-01-008)' },
                        { id: 'azure-cis', label: 'Azure Baseline (CIS 5.0)' },
                      ] as { id: PlatformId; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          platform === p.id
                            ? 'border-academic-600 bg-academic-50 text-academic-900'
                            : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAllForPlatform(true)}
                      className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium hover:opacity-90"
                    >
                      {isZh ? '全部合規 (Positive)' : 'All Pass'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllForPlatform(false)}
                      className="px-2 py-1 rounded bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-medium hover:opacity-90"
                    >
                      {isZh ? '模擬違規 (Negative)' : 'All Fail'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentControls.map((ctrl) => {
                    const ok = states[ctrl.id];
                    return (
                      <button
                        key={ctrl.id}
                        type="button"
                        onClick={() =>
                          setStates((prev) => ({ ...prev, [ctrl.id]: !prev[ctrl.id] }))
                        }
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                          ok
                            ? 'bg-white border-stone-200 hover:border-emerald-300'
                            : 'bg-amber-50/70 border-amber-200/90 hover:border-amber-400'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-slate-600">
                              {ctrl.code}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-academic-50 text-academic-800">
                              {ctrl.isoRef}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold ${
                                ctrl.severity === 'High' ? 'text-rose-600' : 'text-amber-700'
                              }`}
                            >
                              {ctrl.severity}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-ink">
                            {isZh ? ctrl.titleZh : ctrl.titleEn}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-semibold ${
                            ok
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-rose-50 text-rose-600 border border-rose-200/80'
                          }`}
                        >
                          {ok ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              PASS
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              FAIL
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Live Audit Output & Remediation */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {isZh ? '合規達成率 (Compliance Score)' : 'Compliance Score'}
                    </div>
                    <div className="text-2xl font-mono font-bold text-academic-900">
                      {compliancePct}%
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="text-emerald-700 font-semibold">PASS: {passCount}</div>
                    <div className="text-rose-600 font-semibold">FAIL: {failedControls.length}</div>
                  </div>
                </div>

                {/* Simulated Console Output */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] text-slate-200 space-y-1.5">
                  <div className="text-slate-400">
                    $ ./audit_{platform === 'linux-gcb' ? 'twgcb.sh' : 'azure_cis.sh'} --verify
                  </div>
                  {currentControls.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-slate-300">{c.code}</span>
                      <span className={states[c.id] ? 'text-emerald-400' : 'text-rose-400'}>
                        [{states[c.id] ? 'PASS / SKIP' : 'FAIL'}]
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-800 text-sky-300">
                    Summary: {passCount}/{currentControls.length} compliant ({compliancePct}%)
                  </div>
                </div>

                {/* Remediation List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    {isZh ? '建議修正指令 (Remediation)' : 'Recommended Remediation'}
                  </div>
                  {failedControls.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800">
                      {isZh
                        ? '✅ 當前所有基準項目皆已合規，零違規項目。'
                        : '✅ All controls are compliant. Zero remediation required.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {failedControls.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-lg bg-white border border-stone-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-semibold text-rose-600">{c.code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.id, c.remediationCmd)}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-academic-900"
                            >
                              {copiedId === c.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === c.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <code className="block text-[10px] font-mono bg-stone-50 p-1.5 rounded text-slate-700 break-all">
                            {c.remediationCmd}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CVSS 3.1 Base Score Tab */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {isZh ? '快速套用常見 Nessus 弱掃情境：' : 'Quick Nessus Triage Presets:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CVSS_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCvss(p.metrics)}
                      className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200/80 text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      {isZh ? p.labelZh : p.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score Summary Banner */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-mono font-bold text-academic-900">
                    {cvssResult.score.toFixed(1)}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md border text-xs font-mono font-semibold ${severityColor}`}
                    >
                      {cvssResult.severity}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 break-all">
                      {cvssResult.vector}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('cvss-vec', cvssResult.vector)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600"
                >
                  {copiedId === 'cvss-vec' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === 'cvss-vec' ? 'Copied' : 'Copy Vector'}</span>
                </button>
              </div>

              {/* CVSS Metric Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                  [
                    {
                      key: 'AV',
                      label: isZh ? '攻擊途徑 (AV)' : 'Attack Vector (AV)',
                      opts: [
                        ['N', 'Network'],
                        ['A', 'Adjacent'],
                        ['L', 'Local'],
                        ['P', 'Physical'],
                      ],
                    },
                    {
                      key: 'AC',
                      label: isZh ? '攻擊複雜度 (AC)' : 'Complexity (AC)',
                      opts: [
                        ['L', 'Low'],
                        ['H', 'High'],
                      ],
                    },
                    {
                      key: 'PR',
                      label: isZh ? '所需權限 (PR)' : 'Privileges (PR)',
                      opts: [
                        ['N', 'None'],
                        ['L', 'Low'],
                        ['H', 'High'],
                      ],
                    },
                    {
                      key: 'UI',
                      label: isZh ? '使用者互動 (UI)' : 'User Interact. (UI)',
                      opts: [
                        ['N', 'None'],
                        ['R', 'Required'],
                      ],
                    },
                    {
                      key: 'S',
                      label: isZh ? '影響範圍 (Scope)' : 'Scope (S)',
                      opts: [
                        ['U', 'Unchanged'],
                        ['C', 'Changed'],
                      ],
                    },
                    {
                      key: 'C',
                      label: isZh ? '機密性衝擊 (C)' : 'Confidentiality (C)',
                      opts: [
                        ['N', 'None'],
                        ['L', 'Low'],
                        ['H', 'High'],
                      ],
                    },
                    {
                      key: 'I',
                      label: isZh ? '完整性衝擊 (I)' : 'Integrity (I)',
                      opts: [
                        ['N', 'None'],
                        ['L', 'Low'],
                        ['H', 'High'],
                      ],
                    },
                    {
                      key: 'A',
                      label: isZh ? '可用性衝擊 (A)' : 'Availability (A)',
                      opts: [
                        ['N', 'None'],
                        ['L', 'Low'],
                        ['H', 'High'],
                      ],
                    },
                  ] as const
                ).map((group) => (
                  <div
                    key={group.key}
                    className="p-3 rounded-xl bg-white border border-stone-200 space-y-2"
                  >
                    <div className="text-[11px] font-semibold text-slate-700">{group.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.opts.map(([val, name]) => {
                        const active = cvss[group.key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setCvss((prev) => ({ ...prev, [group.key]: val }))
                            }
                            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                              active
                                ? 'bg-academic-900 text-white'
                                : 'bg-stone-100 text-slate-600 hover:bg-stone-200/70'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
