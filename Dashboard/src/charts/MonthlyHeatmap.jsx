import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export function MonthlyHeatmap({ data }) {
  const { blocks } = useMemo(() => {
    // Generate last 30 days
    const days = [];
    let max = 0;
    
    // First pass to find max
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = data.screenTime[dateStr] || {};
      
      let totalSeconds = 0;
      Object.values(dayData).forEach((seconds) => {
        totalSeconds += seconds;
      });
      
      if (totalSeconds > max) max = totalSeconds;
    }
    
    // Second pass to create blocks
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = data.screenTime[dateStr] || {};
      
      let totalSeconds = 0;
      Object.values(dayData).forEach((seconds) => {
        totalSeconds += seconds;
      });
      
      const score = max === 0 ? 0 : Math.round((totalSeconds / max) * 100);
      
      days.push({
        date: dateStr,
        score,
        totalSeconds,
      });
    }
    
    return { blocks: days };
  }, [data]);

  const getIntensityClass = (score) => {
    if (score === 0) return 'bg-text-main/[0.03] border-border-subtle';
    if (score < 30) return 'bg-focus/20 border-focus/10 text-text-main';
    if (score < 60) return 'bg-focus/40 border-focus/20 text-text-main';
    if (score < 85) return 'bg-focus/70 border-focus/40 text-text-main';
    return 'bg-focus border-focus text-text-main shadow-[0_0_8px_rgba(91,108,255,0.4)]';
  };
  
  const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-6 min-h-[160px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Screen Time Intensity</h3>
          <p className="text-xs text-text-muted mt-0.5">30-day usage heatmap</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-text-main/[0.03] border border-border-subtle" />
            <div className="w-3 h-3 rounded-sm bg-focus/20 border border-focus/10" />
            <div className="w-3 h-3 rounded-sm bg-focus/40 border border-focus/20" />
            <div className="w-3 h-3 rounded-sm bg-focus/70 border border-focus/40" />
            <div className="w-3 h-3 rounded-sm bg-focus border border-focus" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] md:grid-cols-[repeat(30,minmax(0,1fr))] gap-1.5 md:gap-2">
        {blocks.map((block) => (
          <div
            key={block.date}
            title={`${block.date}: ${formatTime(block.totalSeconds)}`}
            className={cn(
              "aspect-square rounded-[4px] md:rounded-md border transition-all duration-300 hover:scale-110 cursor-default",
              getIntensityClass(block.score)
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}
