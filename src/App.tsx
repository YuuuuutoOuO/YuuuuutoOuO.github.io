import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Publications } from './components/Publications';
import { Projects } from './components/Projects';
import { Experience } from './components/Experience';
import { Credentials } from './components/Credentials';
import { Footer } from './components/Footer';
import { Mascot } from './components/Mascot';
import { MiniTerminal } from './components/MiniTerminal';
import { PelicanRampage } from './components/PelicanRampage';
import { LabDock } from './components/LabDock';
import { StegoLabModal, type LabModule } from './components/StegoLabModal';
import { ComplianceLabModal } from './components/ComplianceLabModal';
import { KvCacheLabModal } from './components/KvCacheLabModal';

export const App: React.FC = () => {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [rampageActive, setRampageActive] = useState(false);
  const [stegoOpen, setStegoOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [kvCacheOpen, setKvCacheOpen] = useState(false);
  const [labModule, setLabModule] = useState<LabModule>('stego');

  const openLab = (module: LabModule = 'stego') => {
    setLabModule(module);
    setStegoOpen(true);
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors duration-200">
          <Navbar
            onOpenTerminal={() => setTerminalOpen((prev) => !prev)}
            onOpenStegoLab={() => openLab('stego')}
          />
          <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8">
            <Hero />
            <Publications />
            <Projects />
            <Experience />
            <Credentials />
          </main>
          <Footer />
          <LabDock
            onOpenLab={openLab}
            onOpenComplianceLab={() => setComplianceOpen(true)}
            onOpenKvCacheLab={() => setKvCacheOpen(true)}
            onOpenTerminal={() => setTerminalOpen((prev) => !prev)}
          />
          <Mascot />
          <MiniTerminal
            open={terminalOpen}
            onOpen={() => setTerminalOpen(true)}
            onClose={() => setTerminalOpen(false)}
            onTriggerRampage={() => setRampageActive(true)}
            onOpenStegoLab={() => openLab('stego')}
          />
          <StegoLabModal
            open={stegoOpen}
            onClose={() => setStegoOpen(false)}
            initialModule={labModule}
          />
          <ComplianceLabModal
            open={complianceOpen}
            onClose={() => setComplianceOpen(false)}
          />
          <KvCacheLabModal
            open={kvCacheOpen}
            onClose={() => setKvCacheOpen(false)}
          />
          <PelicanRampage
            active={rampageActive}
            onFinish={() => setRampageActive(false)}
          />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
