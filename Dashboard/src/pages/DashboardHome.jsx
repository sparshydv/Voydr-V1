import { motion } from 'framer-motion';
import { TopStats } from '../components/TopStats';
import { WeeklyChart } from '../charts/UsageChart';
import { TopWebsites } from '../components/TopWebsites';
import { UsageInsights } from '../components/UsageInsights';
import { useExtensionData } from '../hooks/useExtensionData';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayFormatted() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardContent() {
  const data = useExtensionData();

  if (data.loading) {
    return (
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-8 py-7">
          <header className="mb-8 flex justify-between items-end animate-pulse">
            <div>
              <div className="h-4 bg-text-main/5 rounded w-32 mb-2"></div>
              <div className="h-8 bg-text-main/10 rounded-lg w-64"></div>
            </div>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             <div className="h-32 card bg-text-main/[0.02] animate-pulse"></div>
             <div className="h-32 card bg-text-main/[0.02] animate-pulse"></div>
             <div className="h-32 card bg-text-main/[0.02] animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
             <div className="lg:col-span-2 h-[350px] card bg-text-main/[0.02] animate-pulse"></div>
             <div className="lg:col-span-1 h-[350px] card bg-text-main/[0.02] animate-pulse"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-8 py-7">
        {/* Greeting Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-text-main tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-sm text-text-muted mt-1">{getTodayFormatted()}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary hover:bg-primary/90 text-text-main text-xs font-medium px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary/10"
            >
              Start Focus Session
            </motion.button>
          </div>
        </motion.header>

        <div className="space-y-6">
          {/* Top stat cards */}
          <TopStats data={data} />

          {/* Weekly chart + Top websites */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <WeeklyChart data={data} />
            </div>
            <div className="lg:col-span-2">
              <TopWebsites data={data} />
            </div>
          </div>

          {/* Insights spanning full width */}
          <div className="grid grid-cols-1">
            <UsageInsights data={data} />
          </div>
        </div>
      </div>
    </main>
  );
}
