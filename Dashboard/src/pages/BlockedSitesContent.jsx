import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExtensionData } from '../hooks/useExtensionData';
import { storage } from '../utils/storage';
import { ShieldCheck, ShieldBan, Unlock, Clock, Plus, Globe } from 'lucide-react';
import { getTodayDate } from '../utils/aggregations';

function cleanInputHostname(input) {
  let urlString = input.trim().toLowerCase();
  if (!urlString) return '';

  if (!urlString.includes('://')) {
    urlString = 'https://' + urlString;
  }

  try {
    let hostname = new URL(urlString).hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return urlString.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

export function BlockedSitesContent() {
  const data = useExtensionData();
  const today = getTodayDate();
  const blockedSites = data.blockedSites?.[today] || [];
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleBlock = async () => {
    const hostname = cleanInputHostname(inputValue);
    if (!hostname) {
      setError('Please enter a valid URL or domain.');
      return;
    }

    if (blockedSites.includes(hostname)) {
      setError(`${hostname} is already blocked.`);
      return;
    }

    const newBlockedSites = {
      ...(data.blockedSites || {}),
      [today]: [...blockedSites, hostname]
    };
    await storage.set({ blockedSites: newBlockedSites });
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlock();
    }
  };

  const handleUnblock = async (siteToUnblock) => {
    const newBlockedList = blockedSites.filter(site => site !== siteToUnblock);
    const newBlockedSites = {
      ...(data.blockedSites || {}),
      [today]: newBlockedList
    };
    await storage.set({ blockedSites: newBlockedSites });
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-8 py-7">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-text-main tracking-tight">Active Blocks</h1>
          <p className="text-sm text-text-muted mt-1">Sites you are currently restricted from accessing today.</p>
        </header>

        {/* Add Site Input */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="text-focus" size={18} />
            <h2 className="text-sm font-medium text-text-main">Block a Website</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. youtube.com, reddit.com/r/all, instagram.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-text-main/[0.03] border border-border text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-focus/40 focus:ring-1 focus:ring-focus/20 transition-all"
              />
            </div>
            <button
              onClick={handleBlock}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warning/15 border border-warning/25 text-warning text-sm font-medium hover:bg-warning/25 transition-colors shrink-0"
            >
              <ShieldBan size={14} />
              Block
            </button>
          </div>
          {error && (
            <p className="text-xs text-warning mt-2.5 ml-1">{error}</p>
          )}
          <p className="text-[11px] text-text-muted mt-3 ml-1">All subdomains will be blocked automatically (e.g. blocking youtube.com also blocks m.youtube.com).</p>
        </div>

        {/* Blocked Sites List */}
        <div className="bg-text-main/[0.02] border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-text-main/[0.01]">
            <div className="flex items-center gap-3">
              <ShieldBan className="text-warning" size={20} />
              <h2 className="text-sm font-medium text-text-main">Restricted Access</h2>
              {blockedSites.length > 0 && (
                <span className="text-[10px] text-text-muted bg-text-main/5 px-2 py-0.5 rounded-full font-medium">
                  {blockedSites.length} blocked
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-text-main/[0.04] rounded-lg border border-border-subtle">
              <Clock size={12} className="text-text-muted" />
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Resets at Midnight</span>
            </div>
          </div>

          <div className="p-2">
            {blockedSites.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <ShieldCheck size={40} className="text-success mb-4 opacity-80" strokeWidth={1.5} />
                <p className="text-sm text-text-main font-medium">No active blocks</p>
                <p className="text-xs text-text-muted mt-1">Use the form above to block distracting websites.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="divide-y divide-border/50">
                  {blockedSites.map((site) => (
                    <motion.div
                      key={site}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-4 hover:bg-text-main/[0.02] rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning font-bold text-sm">
                          {site.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-main">{site}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">All subdomains blocked</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(site)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-text-main/[0.04] hover:bg-text-main/[0.08] border border-border-subtle text-xs font-medium text-text-muted transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Unlock size={14} /> Unblock
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
