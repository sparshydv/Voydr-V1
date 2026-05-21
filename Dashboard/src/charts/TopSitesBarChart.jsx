import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getTopWebsites } from '../utils/aggregations';
import { SafeResponsiveContainer } from '../components/SafeResponsiveContainer';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-raised/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-2xl">
        <p className="text-text-main text-xs font-semibold mb-2">{data.name}</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-text-muted">Total Time:</span>
          <span className="text-gray-200 font-medium tabular-nums">{data.time}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function TopSitesBarChart({ data }) {
  const chartData = useMemo(() => {
    return getTopWebsites(data.screenTime).map(site => ({
      ...site,
      shortName: site.name.length > 15 ? site.name.substring(0, 15) + '...' : site.name
    }));
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-6 flex-1 flex flex-col h-full min-h-[300px]"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-main">Top Sites</h3>
        <p className="text-xs text-text-muted mt-0.5">Ranked by total usage today</p>
      </div>

      <div className="flex-1 w-full relative min-h-[200px]">
        {chartData.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <p className="text-xs text-text-muted">No sites tracked today.</p>
           </div>
        ) : (
          <SafeResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barSize={12}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="shortName"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                width={100}
              />
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} content={<CustomTooltip />} />
              <Bar
                dataKey="minutes"
                radius={[0, 4, 4, 0]}
                animationDuration={1500}
                fill="#5B6CFF"
              />
            </BarChart>
          </SafeResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
