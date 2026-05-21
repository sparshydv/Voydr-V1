import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getWeeklyUsage } from '../utils/aggregations';
import { useMemo } from 'react';
import { SafeResponsiveContainer } from '../components/SafeResponsiveContainer';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-raised/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-2xl">
        <p className="text-text-main text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-text-muted capitalize">Total Usage:</span>
            <span className="text-gray-200 font-medium tabular-nums">
              {Math.floor(entry.value / 3600)}h {Math.floor((entry.value % 3600) / 60)}m
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function WeeklyChart({ data }) {
  const chartData = useMemo(() => getWeeklyUsage(data.screenTime), [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-text-main">Weekly Usage</h2>
          <p className="text-xs text-text-muted mt-0.5">Total screen time per day</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Total Time
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <SafeResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B6CFF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#5B6CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1f" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 3600)}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#5B6CFF"
              strokeWidth={2}
              fill="url(#gradFocus)"
              dot={false}
              activeDot={{ r: 4, fill: '#5B6CFF', stroke: '#09090b', strokeWidth: 2 }}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>
    </motion.div>
  );
}
