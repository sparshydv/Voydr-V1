import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { getTopWebsites } from '../utils/aggregations';
import { useMemo } from 'react';

export function TopWebsites({ data }) {
  const sites = useMemo(() => getTopWebsites(data.screenTime), [data]);
  const maxMinutes = sites.length > 0 ? Math.max(...sites.map(s => s.minutes)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-5"
    >
      <h3 className="text-sm font-semibold text-text-main mb-4">Top Websites</h3>
      
      {sites.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-text-muted text-sm border border-dashed border-border rounded-xl">
          No activity tracked today
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site, i) => (
            <div key={site.name} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-primary/10 text-primary">
                  {site.favicon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-medium truncate">{site.name}</span>
                    <span className="text-[11px] text-text-muted tabular-nums font-medium ml-2 shrink-0">{site.time}</span>
                  </div>
                  <div className="mt-1 h-1 bg-text-main/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(site.minutes / maxMinutes) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      className="h-full rounded-full bg-primary/60"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
