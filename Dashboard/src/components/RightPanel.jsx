import { motion } from 'framer-motion';
import { useExtensionData } from '../hooks/useExtensionData';
import { storage } from '../utils/storage';
import { ShieldBan, Pause } from 'lucide-react';
import { cn } from '../utils/cn';
import { getTodayDate, formatDurationShort } from '../utils/aggregations';
import { useMemo, useState } from 'react';

function cleanInputHostname(input) {
  let urlString = input.trim().toLowerCase();
  if (!urlString) return '';
  if (!urlString.includes('://')) urlString = 'https://' + urlString;
  try {
    let hostname = new URL(urlString).hostname;
    if (hostname.startsWith('www.')) hostname = hostname.substring(4);
    return hostname;
  } catch {
    return urlString.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

function ActiveLimits({ data }) {
  const limits = useMemo(() => {
    const todayData = data.screenTime[getTodayDate()] || {};
    return Object.entries(data.limits || {}).map(([site, config]) => {
      const usedSeconds = todayData[site] || 0;
      const limitSeconds = config.limitInSeconds;
      const percent = Math.min(100, Math.round((usedSeconds / limitSeconds) * 100));
      return {
        site,
        limit: formatDurationShort(limitSeconds),
        used: formatDurationShort(usedSeconds),
        percent
      };
    });
  }, [data]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-main mb-3">Active Limits</h3>
      {limits.length === 0 ? (
        <p className="text-xs text-text-muted">No limits configured.</p>
      ) : (
        <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {limits.map((item, i) => (
            <div key={item.site} className="p-3 rounded-xl bg-text-main/[0.02] border border-border-subtle">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-muted font-medium">{item.site}</span>
                <span className={cn(
                  "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md",
                  item.percent > 80 ? "bg-warning/10 text-warning" :
                  item.percent > 50 ? "bg-focus/10 text-focus" :
                  "bg-success/10 text-success"
                )}>
                  {item.used} / {item.limit}
                </span>
              </div>
              <div className="h-1 bg-text-main/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className={cn(
                    "h-full rounded-full",
                    item.percent > 80 ? "bg-warning/70" :
                    item.percent > 50 ? "bg-focus/60" :
                    "bg-success/60"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TodaySites({ data }) {
  const sites = useMemo(() => {
    const todayData = data.screenTime[getTodayDate()] || {};
    return Object.entries(todayData)
      .map(([hostname, seconds]) => ({ hostname, seconds }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [data]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-text-main">Today's Sites</h3>
        {sites.length > 0 && (
          <span className="text-[10px] text-text-muted bg-text-main/5 px-2 py-0.5 rounded-full font-medium">
            {sites.length} total
          </span>
        )}
      </div>
      {sites.length === 0 ? (
        <p className="text-xs text-text-muted">No sites logged today.</p>
      ) : (
        <div className="space-y-2 max-h-[196px] overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {sites.map((site) => (
            <div key={site.hostname} className="flex items-center justify-between p-2.5 rounded-xl bg-text-main/[0.02] border border-border-subtle hover:bg-text-main/[0.04] transition-colors shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-focus/10 border border-focus/20 flex items-center justify-center text-focus text-[11px] font-bold shrink-0 glow-focus">
                  {site.hostname.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-text-main font-medium truncate">{site.hostname}</p>
              </div>
              <span className="text-[11px] text-text-muted font-medium whitespace-nowrap ml-2">
                {formatDurationShort(site.seconds)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickBlock({ data }) {
  const [inputValue, setInputValue] = useState('');
  const today = getTodayDate();

  const handleBlock = async () => {
    const hostname = cleanInputHostname(inputValue);
    if (!hostname) return;

    const blockedSites = data.blockedSites?.[today] || [];
    if (!blockedSites.includes(hostname)) {
      const newBlockedSites = {
        ...(data.blockedSites || {}),
        [today]: [...blockedSites, hostname]
      };
      await storage.set({ blockedSites: newBlockedSites });
    }
    setInputValue('');
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-main mb-3">Quick Block</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
          placeholder="e.g. twitter.com"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-text-main/[0.03] border border-border text-xs text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-focus/40 transition-colors"
        />
        <button
          onClick={handleBlock}
          className="px-3 py-2 rounded-xl bg-warning/15 border border-warning/25 text-warning flex items-center justify-center hover:bg-warning/25 transition-colors shrink-0"
        >
          <ShieldBan size={14} />
        </button>
      </div>
    </div>
  );
}

export function RightPanel() {
  const data = useExtensionData();

  if (data?.loading) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-[280px] shrink-0 h-screen border-l border-border bg-surface overflow-y-auto flex flex-col"
    >
      <div className="p-5 flex flex-col gap-6">
        <TodaySites data={data} />
        <div className="h-px bg-border shrink-0" />
        <ActiveLimits data={data} />
        <div className="h-px bg-border shrink-0" />
        <QuickBlock data={data} />
      </div>
    </motion.aside>
  );
}

