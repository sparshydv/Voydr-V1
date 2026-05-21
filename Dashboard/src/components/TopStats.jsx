import { motion } from 'framer-motion';
import { Monitor, Globe, ShieldBan, TrendingDown } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { cn } from '../utils/cn';
import { getTodayStats, formatDurationShort, getTodayDate } from '../utils/aggregations';
import { useMemo } from 'react';

function StatValue({ value, suffix, display, delay }) {
  const count = useCountUp(value ?? 0, 1.2, delay);

  if (value !== null) {
    return (
      <span className="text-2xl font-semibold text-text-main tracking-tight tabular-nums">
        {count}{suffix}
      </span>
    );
  }

  return (
    <span className="text-2xl font-semibold text-text-main tracking-tight">
      {display}
    </span>
  );
}

export function TopStats({ data }) {
  const statsData = useMemo(() => {
    const { totalSeconds } = getTodayStats(data.screenTime);
    
    const today = getTodayDate();
    const todayData = data.screenTime?.[today] || {};
    const uniqueSites = Object.values(todayData).filter(s => s > 0).length;
    
    const todayBlocks = data.blockedSites?.[today] || [];
    const activeBlocks = todayBlocks.length;

    return [
      {
        title: "Today's Screen Time",
        value: null,
        display: formatDurationShort(totalSeconds),
        icon: Monitor,
        accentClass: 'text-focus',
        bgClass: 'bg-focus/8',
        glowClass: 'glow-focus',
      },
      {
        title: 'Sites Visited',
        value: uniqueSites,
        suffix: '',
        display: null,
        icon: Globe,
        accentClass: 'text-success',
        bgClass: 'bg-success/8',
        glowClass: 'glow-success',
      },
      {
        title: 'Active Blocks Today',
        value: activeBlocks,
        suffix: '',
        display: null,
        icon: ShieldBan,
        accentClass: 'text-warning',
        bgClass: 'bg-warning/8',
        glowClass: 'glow-warning',
      }
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsData.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="card card-hover p-5 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-lg", stat.bgClass)}>
                <Icon size={16} className={stat.accentClass} strokeWidth={1.8} />
              </div>
            </div>

            <StatValue value={stat.value} suffix={stat.suffix} display={stat.display} delay={0.3 + i * 0.1} />
            <p className="text-xs text-text-muted mt-1 font-medium">{stat.title}</p>

            {/* Ambient glow on hover */}
            <div className={cn(
              "absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none",
              stat.bgClass
            )} />
          </motion.div>
        );
      })}
    </div>
  );
}
