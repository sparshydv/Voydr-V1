import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getWeeklyUsage } from '../utils/aggregations';
import { SafeResponsiveContainer } from '../components/SafeResponsiveContainer';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-raised/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-2xl">
        <p className="text-text-main text-xs font-semibold mb-2">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-focus" />
          <span className="text-text-muted">Total Screen Time:</span>
          <span className="text-gray-200 font-medium tabular-nums">
            {Math.floor(payload[0].value / 3600)}h {Math.floor((payload[0].value % 3600) / 60)}m
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function WeeklyTrendChart({ data }) {
  const chartData = useMemo(() => {
    return getWeeklyUsage(data.screenTime);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="card p-6 flex-1 flex flex-col h-full min-h-[300px]"
    >
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-main">Screen Time Trend</h3>
        <p className="text-xs text-text-muted mt-0.5">Your daily total usage over the past week</p>
      </div>

      <div className="flex-1 w-full relative min-h-[200px]">
        <SafeResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B6CFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5B6CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1a1a1f" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 3600)}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#5B6CFF"
              strokeWidth={2.5}
              fill="url(#trendGradient)"
              animationDuration={1500}
              animationEasing="ease-in-out"
              activeDot={{ r: 4, fill: '#5B6CFF', stroke: '#09090b', strokeWidth: 2 }}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>
    </motion.div>
  );
}
