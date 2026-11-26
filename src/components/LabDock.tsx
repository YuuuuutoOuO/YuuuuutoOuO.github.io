import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  FlaskConical,
  Image as ImageIcon,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { LabModule } from './StegoLabModal';

interface LabDockProps {
  onOpenLab: (module: LabModule) => void;
  onOpenComplianceLab: () => void;
  onOpenKvCacheLab: () => void;
  onOpenTerminal: () => void;
}

export const LabDock: React.FC<LabDockProps> = ({
  onOpenLab,
  onOpenComplianceLab,
  onOpenKvCacheLab,
  onOpenTerminal,
}) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      aria-label="Interactive Research Lab Dock"
      className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden lg:flex items-center"
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-stone-200 dark:border-slate-700 shadow-lg text-slate-600 hover:text-academic-900 transition-all"
          title={isZh ? '展開互動實驗室工具列' : 'Expand Interactive Lab Dock'}
        >
          <FlaskConical className="w-4 h-4 text-academic-700" />
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-stone-200 dark:border-slate-700/90 shadow-lg w-[192px]">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-stone-200/80 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-academic-900 tracking-wide">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>LAB TOOLS</span>
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
              aria-label="Collapse Lab Dock"
              title={isZh ? '收合工具列' : 'Collapse'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenLab('stego')}
            className="group flex items-start gap-2 p-2 rounded-xl text-left hover:bg-academic-50 border border-transparent hover:border-academic-200 transition-colors"
          >
            <span className="mt-0.5 w-6 h-6 rounded-lg bg-academic-50 text-academic-800 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink leading-tight">
                {isZh ? '影像安全實驗室' : 'Image Security Lab'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                LSB · AMBTC · AES
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenComplianceLab}
            className="group flex items-start gap-2 p-2 rounded-xl text-left hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
          >
            <span className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink leading-tight">
                {isZh ? '資安合規模擬器' : 'Compliance & CVSS'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                GCB · Azure · CVSS 3.1
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenKvCacheLab}
            className="group flex items-start gap-2 p-2 rounded-xl text-left hover:bg-academic-50 border border-transparent hover:border-academic-200 transition-colors"
          >
            <span className="mt-0.5 w-6 h-6 rounded-lg bg-academic-50 text-academic-800 flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink leading-tight">
                {isZh ? 'KV Cache 視覺化' : 'KV Cache Lab'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Zone 1/2 · TTFT
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenTerminal}
            className="group flex items-start gap-2 p-2 rounded-xl text-left hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-colors"
          >
            <span className="mt-0.5 w-6 h-6 rounded-lg bg-stone-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Terminal className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink leading-tight">
                ChuOS Shell
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                {isZh ? '指令檢索 (⌘K)' : 'CLI Search (⌘K)'}
              </div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};
