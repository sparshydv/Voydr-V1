import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { AnalyticsContent } from './pages/AnalyticsContent';
import { LimitsContent } from './pages/LimitsContent';
import { BlockedSitesContent } from './pages/BlockedSitesContent';
import { AiCoachContent } from './pages/AiCoachContent';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

function PageWrapper({ children, pageKey }) {
  return (
    <motion.div
      key={pageKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('analytics');

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + Number to switch tabs
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setActivePage('analytics'); break;
          case '2': e.preventDefault(); setActivePage('ai'); break;
          case '3': e.preventDefault(); setActivePage('blocked'); break;
          case '4': e.preventDefault(); setActivePage('limits'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden selection:bg-focus/30 selection:text-focus">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <AnimatePresence mode="wait">
        {activePage === 'analytics' && <PageWrapper pageKey="analytics"><AnalyticsContent /></PageWrapper>}
        {activePage === 'ai' && <PageWrapper pageKey="ai"><AiCoachContent /></PageWrapper>}
        {activePage === 'limits' && <PageWrapper pageKey="limits"><LimitsContent /></PageWrapper>}
        {activePage === 'blocked' && <PageWrapper pageKey="blocked"><BlockedSitesContent /></PageWrapper>}
      </AnimatePresence>

      <RightPanel />
    </div>
  );
}

export default App;
