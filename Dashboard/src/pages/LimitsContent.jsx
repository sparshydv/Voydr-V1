import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExtensionData } from '../hooks/useExtensionData';
import { storage } from '../utils/storage';
import { Clock, ShieldBan, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { getTodayDate, formatDurationShort } from '../utils/aggregations';

function cleanInputHostname(input) {
  let urlString = input.trim().toLowerCase();
  if (!urlString) return "";
  if (!urlString.includes("://")) urlString = "https://" + urlString;
  try {
    let hostname = new URL(urlString).hostname;
    if (hostname.startsWith("www.")) hostname = hostname.substring(4);
    return hostname;
  } catch {
    return urlString.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

export function LimitsContent() {
  const data = useExtensionData();
  const [url, setUrl] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [hardBlock, setHardBlock] = useState(false);

  const handleAddLimit = async (e) => {
    e.preventDefault();
    const hostname = cleanInputHostname(url);
    if (!hostname || minutes <= 0) return;

    const newLimits = {
      ...(data.limits || {}),
      [hostname]: {
        limitInSeconds: minutes * 60,
        hardBlock
      }
    };

    await storage.set({ limits: newLimits });
    setUrl('');
  };

  const handleRemoveLimit = async (hostname) => {
    const newLimits = { ...(data.limits || {}) };
    delete newLimits[hostname];
    await storage.set({ limits: newLimits });
  };

  const limitsEntries = Object.entries(data.limits || {});
  const todayData = data.screenTime?.[getTodayDate()] || {};

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-8 py-7">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-text-main tracking-tight">Website Limits</h1>
          <p className="text-sm text-text-muted mt-1">Set daily time budgets for distracting websites.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Limit Form */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6 border border-border"
            >
              <h3 className="text-sm font-semibold text-text-main mb-5 flex items-center gap-2">
                <Plus size={16} className="text-focus" /> Add New Limit
              </h3>
              <form onSubmit={handleAddLimit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wider">Website URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="e.g. youtube.com"
                    className="w-full bg-text-main/[0.03] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-focus transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wider flex justify-between">
                    <span>Daily Limit</span>
                    <span className="text-focus">{formatDurationShort(minutes * 60)}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="300"
                    step="1"
                    value={minutes}
                    onChange={e => setMinutes(parseInt(e.target.value))}
                    className="w-full accent-focus"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-text-main/[0.02] border border-border-subtle">
                  <div>
                    <p className="text-sm text-text-muted font-medium">Hard Block</p>
                    <p className="text-[10px] text-text-muted">Redirects when limit exceeded</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHardBlock(!hardBlock)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-1 focus:ring-offset-background",
                      hardBlock ? "bg-warning" : "bg-text-main/20"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        hardBlock ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="w-full py-2.5 bg-focus hover:bg-focus-dim text-text-main text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Limit
                </button>
              </form>
            </motion.div>
          </div>

          {/* Active Limits Grid */}
          <div className="lg:col-span-2">
            {limitsEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-8 text-center">
                <Clock className="text-text-muted mb-3" size={32} />
                <p className="text-text-muted text-sm">No limits configured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {limitsEntries.map(([site, config]) => {
                  // Find used time matching site (handle www. prefix)
                  let usedSeconds = 0;
                  Object.keys(todayData).forEach(host => {
                    const hostClean = cleanInputHostname(host);
                    if (hostClean === site || hostClean.endsWith("." + site)) {
                      usedSeconds += todayData[host];
                    }
                  });
                  
                  const limitSeconds = config.limitInSeconds;
                  const percent = Math.min(100, Math.round((usedSeconds / limitSeconds) * 100));
                  const isWarning = percent > 85;

                  return (
                    <motion.div
                      key={site}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="card p-5 border border-border flex flex-col group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            isWarning ? "bg-warning/10 text-warning" : "bg-focus/10 text-focus"
                          )}>
                            {site.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-main truncate max-w-[140px]">{site}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {config.hardBlock ? (
                                <ShieldBan size={10} className="text-success" />
                              ) : (
                                <ShieldAlert size={10} className="text-text-muted" />
                              )}
                              <span className="text-[10px] text-text-muted">
                                {config.hardBlock ? "Hard Block" : "Reminder Only"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveLimit(site)}
                          className="p-1.5 text-text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-auto">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className={cn(
                            "text-lg font-bold tabular-nums tracking-tight",
                            isWarning ? "text-warning" : "text-text-main"
                          )}>
                            {formatDurationShort(usedSeconds)}
                          </span>
                          <span className="text-xs text-text-muted tabular-nums">
                            / {formatDurationShort(limitSeconds)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-text-main/[0.04] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                              isWarning ? "bg-warning" : "bg-focus"
                            )}
                          />
                        </div>
                      </div>
                      
                      {isWarning && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 blur-2xl rounded-full pointer-events-none -mr-10 -mt-10" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
