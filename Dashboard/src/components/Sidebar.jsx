import { useState } from 'react';
import {
  BarChart3,
  ShieldBan,
  Timer,
  ChevronLeft,
  Zap,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const navSections = [
  {
    title: null,
    items: [
      { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { icon: Bot, label: 'AI Coach', id: 'ai' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { icon: ShieldBan, label: 'Blocked Sites', id: 'blocked' },
      { icon: Timer, label: 'Limits', id: 'limits' },
    ],
  },
];

export function Sidebar({ activePage = 'analytics', onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-screen bg-surface border-r border-border flex flex-col overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-border shrink-0",
        collapsed ? "justify-center px-0" : "px-5"
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-focus to-focus-dim flex items-center justify-center shrink-0 glow-focus">
            <Zap size={16} className="text-text-main" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[15px] font-semibold text-text-main tracking-tight whitespace-nowrap overflow-hidden"
              >
                Voydr
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section, si) => (
          <div key={si}>
            <AnimatePresence>
              {section.title && !collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-medium text-text-muted uppercase tracking-widest px-3 mb-2"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-[13px] font-medium relative group",
                      collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
                      isActive
                        ? "bg-text-main/[0.07] text-text-main"
                        : "text-text-muted hover:text-text-muted hover:bg-text-main/[0.03]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-text-main/[0.07] rounded-xl"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={18}
                      className={cn(
                        "relative z-10 shrink-0 transition-colors",
                        isActive ? "text-focus" : ""
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="relative z-10 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border p-3 shrink-0 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:text-text-main hover:bg-text-main/[0.03] transition-all duration-200 text-[13px] font-medium",
            collapsed && "justify-center px-0"
          )}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={16} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
