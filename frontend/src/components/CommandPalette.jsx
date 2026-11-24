import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CreditCard,
  Download,
  FileArchive,
  FileJson,
  FileSpreadsheet,
  FileText,
  Home,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Mic,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Keyboard-navigable Ctrl+K / ⌘K Spotlight Command Palette.
 */
export default function CommandPalette({
  open,
  onClose,
  sessions = [],
  onNavigate,
  onInspectSession,
  onOpenSettingsTab,
  onExportSessionsCsv,
  onExportActionsCsv,
  onExportJson,
  onPingHealth,
  onGoSplash,
}) {
  const { isDark, isLight, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();

    const navCommands = [
      {
        id: 'nav-overview',
        group: 'Navigation',
        label: 'Overview Dashboard',
        hint: 'KPIs, engagement charts & priority tasks',
        icon: LayoutDashboard,
        shortcut: 'G O',
        run: () => onNavigate('overview'),
      },
      {
        id: 'nav-capture',
        group: 'Navigation',
        label: 'Launch Capture & NLP Studio',
        hint: 'Analyze transcript, upload .txt or dictate live',
        icon: Mic,
        shortcut: 'G C',
        run: () => onNavigate('capture'),
      },
      {
        id: 'nav-archive',
        group: 'Navigation',
        label: 'Sessions & Minutes Archive',
        hint: 'Browse processed sessions & export Markdown minutes',
        icon: FileArchive,
        shortcut: 'G A',
        run: () => onNavigate('archive'),
      },
      {
        id: 'nav-followups',
        group: 'Navigation',
        label: 'Follow-Ups & Milestones Board',
        hint: 'Update task statuses & academic readiness sliders',
        icon: ListChecks,
        shortcut: 'G F',
        run: () => onNavigate('followups'),
      },
      {
        id: 'nav-settings',
        group: 'Navigation',
        label: 'Workspace Settings, Billing & API',
        hint: 'Appearance, quotas, ms_live keys & compliance logs',
        icon: Settings,
        shortcut: 'G S',
        run: () => onOpenSettingsTab('appearance'),
      },
      {
        id: 'nav-splash',
        group: 'Navigation',
        label: 'View Marketing Splash & Pricing',
        hint: 'Return to public SaaS landing page',
        icon: Home,
        run: () => onGoSplash(),
      },
    ];

    const sessionCommands = sessions.slice(0, 12).map((s) => ({
      id: `session-${s.id}`,
      group: 'Live Mentoring Sessions',
      label: s.title,
      hint: `${s.session_code} · ${s.mentee_name || 'Mentee'} · Eng ${s.engagement_score ?? 0}%`,
      badge: s.session_code,
      icon: FileText,
      searchMeta: `${s.session_code} ${s.title} ${s.mentee_name || ''} ${s.mentor_name || ''} ${s.top_topic || ''} ${s.course_or_track || ''}`,
      run: () => onInspectSession(s.id),
    }));

    const actionCommands = [
      {
        id: 'act-theme',
        group: 'Quick Actions & Exports',
        label: isDark ? 'Switch to Editorial Light Mode' : 'Switch to Obsidian Dark Mode',
        hint: 'Toggle theme globally across all charts & ReactBits',
        icon: isDark ? Sun : Moon,
        shortcut: 'T',
        run: () => toggleTheme(),
      },
      {
        id: 'act-billing',
        group: 'Quick Actions & Exports',
        label: 'Open Plan & Usage Quotas',
        hint: 'Inspect Department Pro limits & invoices',
        icon: CreditCard,
        run: () => onOpenSettingsTab('billing'),
      },
      {
        id: 'act-api',
        group: 'Quick Actions & Exports',
        label: 'Manage API Keys & LMS Webhooks',
        hint: 'Generate ms_live_ keys & inspect Django diagnostics',
        icon: KeyRound,
        run: () => onOpenSettingsTab('api'),
      },
      {
        id: 'act-ping',
        group: 'Quick Actions & Exports',
        label: 'Ping Django NLP Engine Health',
        hint: 'Measure live /api/health/ round-trip latency',
        icon: Activity,
        run: () => onPingHealth(),
      },
      {
        id: 'act-export-sessions',
        group: 'Quick Actions & Exports',
        label: 'Export Mentoring Sessions CSV',
        hint: `Download ${sessions.length} live sessions as CSV`,
        icon: FileSpreadsheet,
        run: () => onExportSessionsCsv(),
      },
      {
        id: 'act-export-actions',
        group: 'Quick Actions & Exports',
        label: 'Export Action Items CSV',
        hint: 'Download cross-session follow-up ledger as CSV',
        icon: Download,
        run: () => onExportActionsCsv(),
      },
      {
        id: 'act-export-json',
        group: 'Quick Actions & Exports',
        label: 'Export Full Academic Intelligence JSON',
        hint: 'Complete compliance bundle with KPIs, sessions & milestones',
        icon: FileJson,
        run: () => onExportJson(),
      },
    ];

    const all = [...navCommands, ...sessionCommands, ...actionCommands];
    if (!q) return all;

    return all.filter((item) => {
      const hay = `${item.label} ${item.hint} ${item.group} ${item.searchMeta || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [
    query,
    sessions,
    isDark,
    onNavigate,
    onInspectSession,
    onOpenSettingsTab,
    onExportSessionsCsv,
    onExportActionsCsv,
    onExportJson,
    onPingHealth,
    onGoSplash,
    toggleTheme,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (items.length ? (prev + 1) % items.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          items.length ? (prev - 1 + items.length) % items.length : 0
        );
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].run();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, items, selectedIndex, onClose]);

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item, flatIdx) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push({ ...item, flatIdx });
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="no-print fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/60 px-4 pt-[11vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${
              isLight
                ? 'border-slate-200/90 bg-white/98 text-slate-900 shadow-[0_28px_70px_-16px_rgba(15,23,42,0.28)]'
                : 'border-slate-700/80 bg-[#0A1525]/96 text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.75)]'
            }`}
          >
            {/* Search Header */}
            <div
              className={`flex items-center gap-3 border-b px-4 py-3.5 ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <Search className="h-4.5 w-4.5 shrink-0 text-teal-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions, navigate views, export CSV/JSON, or switch theme..."
                className="w-full !border-0 !bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onClose}
                className={`cursor-pointer rounded-lg p-1 transition ${
                  isLight
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2.5">
              {grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-6 w-6 text-teal-500/70" />
                  <p className="mt-2 text-sm font-medium">No matching commands or sessions</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Try searching a session code, &ldquo;CSV&rdquo;, &ldquo;Light Mode&rdquo;, or &ldquo;Billing&rdquo;.
                  </p>
                </div>
              ) : (
                grouped.map(([groupName, groupItems]) => (
                  <div key={groupName} className="mb-3 last:mb-0">
                    <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {groupName}
                    </div>
                    <div className="space-y-0.5">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const active = item.flatIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setSelectedIndex(item.flatIdx)}
                            onClick={() => {
                              item.run();
                              onClose();
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                              active
                                ? isLight
                                  ? 'bg-teal-50 text-slate-900 ring-1 ring-teal-500/30'
                                  : 'bg-teal-500/15 text-white ring-1 ring-teal-400/35'
                                : isLight
                                ? 'text-slate-700 hover:bg-slate-50'
                                : 'text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                  active
                                    ? isLight
                                      ? 'border-teal-500/40 bg-white text-teal-600'
                                      : 'border-teal-400/50 bg-teal-500/20 text-teal-300'
                                    : isLight
                                    ? 'border-slate-200 bg-slate-50 text-slate-500'
                                    : 'border-slate-800 bg-slate-900/90 text-slate-400'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{item.label}</div>
                                <div className="truncate text-[11px] text-slate-500">{item.hint}</div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {item.badge && (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                    isLight
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'bg-indigo-500/15 text-indigo-300'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {item.shortcut && (
                                <kbd
                                  className={`hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block ${
                                    isLight
                                      ? 'border-slate-200 bg-slate-100 text-slate-500'
                                      : 'border-slate-700 bg-slate-900 text-slate-400'
                                  }`}
                                >
                                  {item.shortcut}
                                </kbd>
                              )}
                              {active && <ArrowRight className="h-3.5 w-3.5 text-teal-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Hints */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] font-mono ${
                isLight
                  ? 'border-slate-200 bg-slate-50/90 text-slate-500'
                  : 'border-slate-800 bg-[#07111F]/90 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Execute</span>
                <span>ESC Close</span>
              </div>
              <span className="text-teal-500">MentorSync AI Spotlight</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
