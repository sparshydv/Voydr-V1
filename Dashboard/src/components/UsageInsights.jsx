import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { cn } from '../utils/cn';
import { useMemo } from 'react';
import { getTodayDate, formatDurationShort } from '../utils/aggregations';

export function UsageInsights({ data }) {
  const insights = useMemo(() => {
    const today = getTodayDate();
    const todayData = data.screenTime[today] || {};
    let totalToday = 0;
    Object.values(todayData).forEach(sec => totalToday += sec);

    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    const yesterdayData = data.screenTime[yesterday] || {};
    let totalYesterday = 0;
    Object.values(yesterdayData).forEach(sec => totalYesterday += sec);

    const result = [];
    if (totalToday < totalYesterday && totalYesterday > 0) {
      result.push({
        icon: TrendingDown,
        title: 'Screen time decreased',
        description: `Your screen time dropped compared to yesterday. Keep it up.`,
        type: 'positive',
      });
    } else if (totalToday > totalYesterday && totalYesterday > 0) {
      result.push({
        icon: TrendingUp,
        title: 'Screen time increased',
        description: `You've spent more time on screens today than yesterday.`,
        type: 'negative',
      });
    }

    // Top site usage
    let maxUsage = 0;
    let topSite = null;
    Object.entries(todayData).forEach(([hostname, seconds]) => {
      if (seconds > maxUsage) {
        maxUsage = seconds;
        topSite = hostname;
      }
    });

    if (topSite) {
      result.push({
        icon: Lightbulb,
        title: `${topSite} is your top site`,
        description: `You've spent ${formatDurationShort(maxUsage)} on ${topSite} today.`,
        type: 'neutral',
      });
    } else {
      result.push({
        icon: Lightbulb,
        title: 'No activity yet',
        description: 'Start browsing to see insights here.',
        type: 'neutral',
      });
    }

    return result.slice(0, 3);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-5 lg:col-span-3"
    >
      <h3 className="text-sm font-semibold text-text-main mb-4">Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
              className="flex gap-3 p-3 rounded-xl bg-text-main/[0.02] border border-border-subtle group hover:bg-text-main/[0.03] transition-colors duration-200"
            >
              <div className={cn(
                "p-1.5 rounded-lg shrink-0 h-fit",
                insight.type === 'positive' ? 'bg-success/10 text-success' :
                insight.type === 'negative' ? 'bg-warning/10 text-warning' :
                'bg-primary/10 text-primary'
              )}>
                <Icon size={14} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted">{insight.title}</p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
