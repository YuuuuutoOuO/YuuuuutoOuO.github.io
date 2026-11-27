import React, { useState } from 'react';
import { FlaskConical, Languages, Menu, Moon, Sun, Terminal, X } from 'lucide-react';
import { NAV_ITEMS, SITE_PROFILE } from '../data/profile';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenTerminal: () => void;
  onOpenStegoLab: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTerminal, onOpenStegoLab }) => {
  const { lang, toggleLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-stone-200/80 dark:border-slate-800/80">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
        <a
          href="#about"
          className="flex items-center gap-2.5 group focus:outline-none shrink-0 whitespace-nowrap"
          aria-label="Back to top"
        >
          <span className="w-8 h-8 rounded-lg bg-academic-900 dark:bg-sky-500/20 dark:text-sky-300 dark:border dark:border-sky-400/30 text-paper font-serif text-sm font-semibold flex items-center justify-center tracking-wide group-hover:bg-academic-700 transition-colors">
            {SITE_PROFILE.monogram}
          </span>
          <span className="font-serif font-semibold text-base sm:text-lg text-ink tracking-tight">
            {lang === 'zh' ? `${SITE_PROFILE.name.zh} · ${SITE_PROFILE.name.en}` : SITE_PROFILE.name.en}
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-slate-600 hover:text-academic-900 transition-colors font-medium whitespace-nowrap"
            >
              {t(item.label)}
            </a>
          ))}

          <div className="flex items-center gap-2.5 pl-4 ml-1 border-l border-stone-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onOpenTerminal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-stone-300 bg-white text-xs font-mono text-slate-700 hover:border-academic-600 hover:text-academic-900 transition-colors"
              aria-label="Open Mini Kernel Terminal"
              title="ChuOS MiniKernel Terminal (Ctrl+K)"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Shell</span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 text-[10px] rounded bg-stone-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 bg-white text-slate-700 hover:border-academic-600 hover:text-academic-900 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 bg-white text-xs font-medium text-slate-700 hover:border-academic-600 hover:text-academic-900 transition-colors"
              aria-label="Switch language"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
          </div>
        </nav>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenStegoLab}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 bg-white text-slate-700"
            aria-label="Open LSB Steganography Lab"
          >
            <FlaskConical className="w-3.5 h-3.5 text-academic-700" />
          </button>
          <button
            type="button"
            onClick={onOpenTerminal}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 bg-white text-slate-700"
            aria-label="Open Mini Kernel Terminal"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 bg-white text-slate-700"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-300 bg-white text-xs font-medium text-slate-700"
            aria-label="Switch language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? 'EN' : '中文'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-700 hover:bg-stone-200/60 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <nav
          className="lg:hidden border-t border-stone-200 bg-white px-5 py-3 space-y-1"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-academic-900"
            >
              {t(item.label)}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
