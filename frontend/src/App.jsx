import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AudioWaveform,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Command,
  FileArchive,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Mic,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  api,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from './api/client';
import { useTheme } from './context/ThemeContext';
import { ClickSpark, Dock, DotGrid } from './components/reactbits';
import BootPreloader from './components/BootPreloader';
import SplashPage from './components/SplashPage';
import AuthModal from './components/AuthModal';
import OverviewDashboard from './components/OverviewDashboard';
import CaptureStudio from './components/CaptureStudio';
import SessionsArchive from './components/SessionsArchive';
import SessionInspector from './components/SessionInspector';
import FollowUpsBoard from './components/FollowUpsBoard';
import ThemeToggle from './components/ThemeToggle';
import CommandPalette from './components/CommandPalette';
import {
  buildIntelligenceAlerts,
  NotificationsDrawer,
  ToastStack,
} from './components/NotificationsDrawer';
import SaaSSettingsView from './components/SaaSSettingsView';
import {
  exportActionItemsCsv,
  exportIntelligenceJson,
  exportSessionsCsv,
} from './utils/exporters';

const ROLE_COLORS = {
  MENTOR: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200',
  MENTEE: 'border-teal-400/40 bg-teal-500/15 text-teal-200',
  COORDINATOR: 'border-orange-400/40 bg-orange-500/15 text-orange-200',
};

const WORKSPACES = [
  {
    id: 'anna-ece',
    name: 'Anna Univ — ECE Mentoring',
    subtitle: 'Department Pro · 2026 Cohort',
    badge: 'ECE',
    icon: GraduationCap,
  },
  {
    id: 'capstone-lab',
    name: 'Capstone Research Group',
    subtitle: 'ECE-499 Final Year Studio',
    badge: 'LAB',
    icon: Sparkles,
  },
  {
    id: 'placement-cell',
    name: 'Placement Mentorship Cell',
    subtitle: 'Career, DSA & Mock Interviews',
    badge: 'CAREER',
    icon: Users,
  },
];

const DEFAULT_ORG_SETTINGS = {
  institutionName: 'Anna University, Chennai',
  departmentName: 'Electronics & Communication Engineering',
  accreditationCode: 'NAAC-A++ / NBA-ECE-2026',
  defaultConfidential: false,
};

export default function App() {
  const { isLight } = useTheme();
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState('splash'); // 'splash' | 'auth' | 'workspace'
  const [pendingTab, setPendingTab] = useState('overview');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'capture' | 'archive' | 'followups' | 'settings'
  const [settingsSubTab, setSettingsSubTab] = useState('appearance');
  const [inspectedSessionId, setInspectedSessionId] = useState(null);

  // SaaS Shell UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    try {
      return localStorage.getItem('mentorsync_workspace') || 'anna-ece';
    } catch {
      return 'anna-ece';
    }
  });

  const [showDock, setShowDock] = useState(() => {
    try {
      const saved = localStorage.getItem('mentorsync_show_dock');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [orgSettings, setOrgSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('mentorsync_org_settings');
      return saved ? { ...DEFAULT_ORG_SETTINGS, ...JSON.parse(saved) } : DEFAULT_ORG_SETTINGS;
    } catch {
      return DEFAULT_ORG_SETTINGS;
    }
  });

  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mentorsync_read_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auth & Workspace Data
  const [user, setUser] = useState(() => getStoredUser());
  const [directory, setDirectory] = useState({ mentors: [], mentees: [] });
  const [publicStats, setPublicStats] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Live Django Health Ping Telemetry
  const [healthStatus, setHealthStatus] = useState({
    ok: false,
    latencyMs: null,
    payload: null,
    checkedAt: null,
    pinging: false,
  });

  // Toast Stack & Runtime Audit Trail
  const [toasts, setToasts] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);

  const activeWorkspace = useMemo(
    () => WORKSPACES.find((w) => w.id === activeWorkspaceId) || WORKSPACES[0],
    [activeWorkspaceId]
  );

  const notify = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logAudit = useCallback(
    (category, detail) => {
      setAuditEvents((prev) => [
        {
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: new Date().toISOString(),
          category,
          actor: user?.full_name || 'Authenticated Member',
          detail,
        },
        ...prev.slice(0, 29),
      ]);
    },
    [user]
  );

  // Persist SaaS preferences
  useEffect(() => {
    try {
      localStorage.setItem('mentorsync_workspace', activeWorkspaceId);
    } catch {
      // ignore
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    try {
      localStorage.setItem('mentorsync_show_dock', String(showDock));
    } catch {
      // ignore
    }
  }, [showDock]);

  useEffect(() => {
    try {
      localStorage.setItem('mentorsync_org_settings', JSON.stringify(orgSettings));
    } catch {
      // ignore
    }
  }, [orgSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('mentorsync_read_alerts', JSON.stringify(readAlertIds));
    } catch {
      // ignore
    }
  }, [readAlertIds]);

  const pingBackendHealth = useCallback(
    async (announce = false) => {
      setHealthStatus((prev) => ({ ...prev, pinging: true }));
      const t0 = performance.now();
      try {
        const payload = await api.health();
        const latencyMs = Math.max(1, Math.round(performance.now() - t0));
        setHealthStatus({
          ok: true,
          latencyMs,
          payload,
          checkedAt: Date.now(),
          pinging: false,
        });
        if (announce) {
          notify(`Django NLP Engine healthy (${latencyMs}ms · ${payload?.sessions_indexed ?? 0} sessions indexed).`, 'info');
        }
      } catch {
        setHealthStatus((prev) => ({
          ...prev,
          ok: false,
          pinging: false,
          checkedAt: Date.now(),
        }));
        if (announce) {
          notify('Django backend unreachable on 127.0.0.1:8003.', 'info');
        }
      }
    },
    [notify]
  );

  const fetchPublicStats = useCallback(async () => {
    try {
      const data = await api.publicStats();
      setPublicStats(data);
    } catch {
      // Backend might be warming up
    }
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!getStoredToken()) return;
    setLoadingWorkspace(true);
    try {
      const [meData, dashData, sessData, actionsData, msData] = await Promise.all([
        api.me(),
        api.dashboard(),
        api.listSessions(),
        api.listActionItems(),
        api.listMilestones(),
      ]);
      if (meData?.user) {
        setUser(meData.user);
        setAuthSession(getStoredToken(), meData.user);
      }
      if (meData?.directory) setDirectory(meData.directory);
      setDashboard(dashData);
      setSessions(sessData || []);
      setActionItems(actionsData || []);
      setMilestones(msData || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
        setUser(null);
        setView('auth');
      }
    } finally {
      setLoadingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicStats();
    pingBackendHealth(false);
    if (getStoredToken()) {
      loadWorkspaceData();
    }
  }, [fetchPublicStats, pingBackendHealth, loadWorkspaceData]);

  // Periodic health telemetry refresh while in workspace
  useEffect(() => {
    if (view !== 'workspace') return undefined;
    const id = setInterval(() => pingBackendHealth(false), 30000);
    return () => clearInterval(id);
  }, [view, pingBackendHealth]);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (view === 'workspace') {
          e.preventDefault();
          setCommandOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view]);

  const enterWorkspace = (targetTab = 'overview') => {
    if (getStoredToken() && user) {
      setActiveTab(targetTab);
      setInspectedSessionId(null);
      setView('workspace');
      loadWorkspaceData();
      pingBackendHealth(false);
    } else {
      setPendingTab(targetTab);
      setView('auth');
    }
  };

  const handleAuthenticated = (token, userProfile) => {
    setAuthSession(token, userProfile);
    setUser(userProfile);
    setActiveTab(pendingTab || 'overview');
    setInspectedSessionId(null);
    setView('workspace');
    loadWorkspaceData();
    pingBackendHealth(false);
    notify(`Signed in securely as ${userProfile.full_name} (${userProfile.role})`, 'success');
    logAudit('SECURITY', `Authenticated HS256 JWT session for ${userProfile.email}`);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setDashboard(null);
    setInspectedSessionId(null);
    setCommandOpen(false);
    setNotifOpen(false);
    setView('splash');
    fetchPublicStats();
    notify('Signed out cleanly. JWT session cleared.', 'info');
  };

  const handleSwitchWorkspace = (ws) => {
    setActiveWorkspaceId(ws.id);
    setWorkspaceMenuOpen(false);
    logAudit('WORKSPACE', `Switched active workspace to ${ws.name}`);
    notify(`Active workspace switched to ${ws.name}.`, 'accent');
  };

  const handleToggleQuickAction = async (item) => {
    const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await api.updateActionItem(item.id, { status: nextStatus });
    await loadWorkspaceData();
    logAudit('FOLLOWUP', `Marked "${item.description.slice(0, 50)}" as ${nextStatus}`);
    notify('Action item updated & academic minutes synchronized.', 'success');
  };

  const handleDeleteSession = async (id, title) => {
    if (!window.confirm(`Delete session "${title}" and its extracted follow-ups?`)) return;
    await api.deleteSession(id);
    if (inspectedSessionId === id) setInspectedSessionId(null);
    await loadWorkspaceData();
    fetchPublicStats();
    logAudit('SESSION', `Deleted mentoring session "${title}"`);
    notify('Session removed from archive.', 'info');
  };

  // Compliance Exports
  const handleExportSessionsCsv = useCallback(() => {
    const res = exportSessionsCsv(sessions);
    logAudit('EXPORT', `Exported ${res.count} sessions to ${res.filename}`);
    notify(`Exported ${res.count} sessions to ${res.filename}`, 'success');
  }, [sessions, logAudit, notify]);

  const handleExportActionsCsv = useCallback(() => {
    const res = exportActionItemsCsv(actionItems);
    logAudit('EXPORT', `Exported ${res.count} action items to ${res.filename}`);
    notify(`Exported ${res.count} action items to ${res.filename}`, 'success');
  }, [actionItems, logAudit, notify]);

  const handleExportJson = useCallback(() => {
    const res = exportIntelligenceJson({
      user,
      workspace: activeWorkspace,
      dashboard,
      sessions,
      actionItems,
      milestones,
    });
    logAudit('EXPORT', `Exported full academic JSON bundle (${res.filename})`);
    notify(`Downloaded complete JSON bundle (${res.sessionsCount} sessions, ${res.actionsCount} tasks).`, 'accent');
  }, [user, activeWorkspace, dashboard, sessions, actionItems, milestones, logAudit, notify]);

  const openActionCount = actionItems.filter((a) => a.status !== 'COMPLETED').length;

  const alerts = useMemo(
    () => buildIntelligenceAlerts({ sessions, actionItems, milestones, user }),
    [sessions, actionItems, milestones, user]
  );

  const unreadAlertCount = useMemo(() => {
    const set = new Set(readAlertIds);
    return alerts.filter((a) => !set.has(a.id)).length;
  }, [alerts, readAlertIds]);

  const handleMarkAlertRead = (id) => {
    setReadAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleMarkAllRead = () => {
    setReadAlertIds(alerts.map((a) => a.id));
    notify('All intelligence notifications marked as read.', 'info');
  };

  const handleSelectAlert = (alert) => {
    if (alert.actionType === 'session' && alert.sessionId) {
      setActiveTab('archive');
      setInspectedSessionId(alert.sessionId);
    } else if (alert.actionType === 'followups') {
      setInspectedSessionId(null);
      setActiveTab('followups');
    } else if (alert.actionType === 'settings') {
      setInspectedSessionId(null);
      setSettingsSubTab('compliance');
      setActiveTab('settings');
    }
  };

  const navigateTab = (tabId) => {
    setInspectedSessionId(null);
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  const openSettingsTab = (subTab = 'appearance') => {
    setInspectedSessionId(null);
    setSettingsSubTab(subTab);
    setActiveTab('settings');
    setMobileSidebarOpen(false);
  };

  const intelligenceNav = [
    { id: 'overview', label: 'Overview Dashboard', shortLabel: 'Overview', icon: LayoutDashboard },
    { id: 'capture', label: 'Capture & NLP Studio', shortLabel: 'NLP Studio', icon: Mic },
    { id: 'archive', label: 'Sessions & Minutes', shortLabel: 'Archive', icon: FileArchive },
    {
      id: 'followups',
      label: 'Follow-Ups & Milestones',
      shortLabel: 'Follow-Ups',
      icon: ListChecks,
      badge: openActionCount,
    },
  ];

  const orgNav = [
    { id: 'settings', label: 'Workspace, Billing & API', shortLabel: 'Settings', icon: Settings },
  ];

  const dockItems = [...intelligenceNav, ...orgNav];

  const kpis = dashboard?.kpis || {};
  const processedSessionsCount = kpis.processed_sessions ?? sessions.length;
  const quotaPct = Math.min(100, Math.max(18, processedSessionsCount * 11));

  const renderSidebarBody = (mobile = false) => {
    const compact = sidebarCollapsed && !mobile;
    const WsIcon = activeWorkspace.icon;

    return (
      <div className="flex h-full flex-col justify-between p-3">
        <div>
          {/* Brand Header */}
          <div className={`mb-3 flex items-center ${compact ? 'justify-center' : 'justify-between'} px-1`}>
            <button
              type="button"
              onClick={() => navigateTab('overview')}
              className="flex cursor-pointer items-center gap-2.5 text-left"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  isLight
                    ? 'border-teal-500/35 bg-teal-50 text-teal-600'
                    : 'border-teal-400/40 bg-[#0B1626] text-teal-400 shadow-[0_0_18px_rgba(20,184,166,0.22)]'
                }`}
              >
                <AudioWaveform className="h-4.5 w-4.5" />
              </div>
              {!compact && (
                <div>
                  <div className="font-display text-sm font-bold leading-none text-white">
                    MentorSync <span className="text-teal-400">AI</span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400">
                    Dept. Pro SaaS
                  </div>
                </div>
              )}
            </button>

            {mobile ? (
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              !compact && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                  className={`cursor-pointer rounded-lg p-1.5 transition ${
                    isLight
                      ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              )
            )}
          </div>

          {compact && !mobile && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
              className={`mb-3 flex w-full cursor-pointer items-center justify-center rounded-xl border py-2 transition ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-500 hover:text-teal-600'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-teal-300'
              }`}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}

          {/* Department / Mentoring Workspace Switcher */}
          <div className="relative mb-5">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen((o) => !o)}
              title={activeWorkspace.name}
              className={`flex w-full cursor-pointer items-center ${
                compact ? 'justify-center px-2' : 'justify-between px-2.5'
              } rounded-xl border py-2 text-left transition ${
                isLight
                  ? 'border-slate-200 bg-slate-50/90 hover:border-teal-500/40'
                  : 'border-slate-800 bg-[#081322]/90 hover:border-teal-400/40'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="preserve-white flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-indigo-600 text-white">
                  <WsIcon className="h-3.5 w-3.5" />
                </div>
                {!compact && (
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">
                      {activeWorkspace.name}
                    </div>
                    <div className="truncate text-[10px] font-mono text-slate-400">
                      {activeWorkspace.subtitle}
                    </div>
                  </div>
                )}
              </div>
              {!compact && (
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                    workspaceMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            <AnimatePresence>
              {workspaceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border p-1.5 shadow-2xl ${
                    isLight
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-700/80 bg-[#0A1628]'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Switch Mentoring Workspace
                  </div>
                  {WORKSPACES.map((ws) => {
                    const Icon = ws.icon;
                    const active = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                          active
                            ? isLight
                              ? 'bg-teal-50 text-slate-900'
                              : 'bg-teal-500/15 text-teal-200'
                            : isLight
                            ? 'text-slate-700 hover:bg-slate-50'
                            : 'text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold">{ws.name}</div>
                            <div className="truncate text-[10px] text-slate-500">{ws.subtitle}</div>
                          </div>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 shrink-0 text-teal-500" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Intelligence Section */}
          <div className="space-y-1">
            {!compact && (
              <div className="px-2.5 pb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500">
                Intelligence
              </div>
            )}
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                (inspectedSessionId ? 'archive' : activeTab) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTab(item.id)}
                  title={compact ? item.label : undefined}
                  className={`flex w-full cursor-pointer items-center ${
                    compact ? 'justify-center px-2' : 'justify-between px-3'
                  } rounded-xl py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? isLight
                        ? 'preserve-white bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-sm'
                        : 'border border-teal-400/35 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-teal-200'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0" />
                    {!compact && <span className="truncate">{item.label}</span>}
                  </span>
                  {!compact && item.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        isActive && isLight
                          ? 'bg-white/20 text-white'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Organization Section */}
          <div className="mt-5 space-y-1">
            {!compact && (
              <div className="px-2.5 pb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500">
                Organization
              </div>
            )}
            {orgNav.map((item) => {
              const Icon = item.icon;
              const isActive = !inspectedSessionId && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSettingsTab('appearance')}
                  title={compact ? item.label : undefined}
                  className={`flex w-full cursor-pointer items-center ${
                    compact ? 'justify-center px-2' : 'gap-2.5 px-3'
                  } rounded-xl py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? isLight
                        ? 'preserve-white bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-sm'
                        : 'border border-teal-400/35 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-teal-200'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!compact && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Live Plan & Quota Meter Widget */}
        {!compact ? (
          <button
            type="button"
            onClick={() => openSettingsTab('billing')}
            className={`mt-4 w-full cursor-pointer rounded-2xl border p-3.5 text-left transition ${
              isLight
                ? 'border-slate-200 bg-gradient-to-br from-teal-50/80 to-indigo-50/70 hover:border-teal-400'
                : 'border-slate-800 bg-gradient-to-br from-[#0A182B] to-[#081220] hover:border-teal-400/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-400">
                <Building2 className="h-3.5 w-3.5" />
                Department Pro
              </span>
              <span className="font-mono text-[10px] text-slate-400">LIVE</span>
            </div>
            <div className="mt-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Sessions Analyzed</span>
                <span className="font-mono font-semibold text-white">
                  {processedSessionsCount} / ∞
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-500"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              <div className="flex justify-between pt-0.5 font-mono text-[10px] text-slate-400">
                <span>{actionItems.length} Follow-Ups</span>
                <span className="text-teal-400">{kpis.completion_rate || 0}% Done</span>
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openSettingsTab('billing')}
            title="Department Pro — View Quotas & Billing"
            className="mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-teal-400/35 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <ClickSpark sparkColor={isLight ? '#0D9488' : '#14B8A6'}>
      <AnimatePresence>
        {booting && <BootPreloader onComplete={() => setBooting(false)} />}
      </AnimatePresence>

      {/* Multi-Toast Notification Stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Ctrl+K Spotlight Command Palette */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        sessions={sessions}
        onNavigate={navigateTab}
        onInspectSession={(id) => {
          setActiveTab('archive');
          setInspectedSessionId(id);
        }}
        onOpenSettingsTab={openSettingsTab}
        onExportSessionsCsv={handleExportSessionsCsv}
        onExportActionsCsv={handleExportActionsCsv}
        onExportJson={handleExportJson}
        onPingHealth={() => pingBackendHealth(true)}
        onGoSplash={() => {
          fetchPublicStats();
          setView('splash');
        }}
      />

      {/* Academic Intelligence Notifications Drawer */}
      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        alerts={alerts}
        readIds={readAlertIds}
        onMarkRead={handleMarkAlertRead}
        onMarkAllRead={handleMarkAllRead}
        onSelectAlert={handleSelectAlert}
      />

      {view === 'splash' && (
        <SplashPage
          stats={publicStats}
          user={user}
          onOpenDashboard={() => enterWorkspace('overview')}
          onOpenCapture={() => enterWorkspace('capture')}
          onOpenAuth={() => {
            setPendingTab('overview');
            setView('auth');
          }}
        />
      )}

      {view === 'auth' && (
        <AuthModal
          onAuthenticated={handleAuthenticated}
          onBackToSplash={() => setView('splash')}
        />
      )}

      {view === 'workspace' && (
        <div className="relative flex min-h-screen bg-[#060D16] text-slate-100">
          {/* Subtle Ambient DotGrid */}
          <div className="no-print pointer-events-none fixed inset-0 z-0 opacity-65">
            <DotGrid gap={36} proximity={110} />
          </div>

          {/* Desktop Collapsible SaaS Left Sidebar */}
          <aside
            className={`no-print sticky top-0 z-30 hidden h-screen shrink-0 border-r backdrop-blur-xl transition-all duration-300 lg:block ${
              sidebarCollapsed ? 'w-[76px]' : 'w-64'
            } ${
              isLight
                ? 'border-slate-200/90 bg-white/92 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)]'
                : 'border-slate-800/80 bg-[#060E1B]/92'
            }`}
          >
            {renderSidebarBody(false)}
          </aside>

          {/* Mobile Slide-Over Sidebar Drawer */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="no-print fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-xs lg:hidden"
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className={`no-print fixed left-0 top-0 z-[100] h-full w-72 border-r lg:hidden ${
                    isLight
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-800 bg-[#07101E]'
                  }`}
                >
                  {renderSidebarBody(true)}
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Right Workspace Shell (Command Bar + Main Canvas) */}
          <div className={`relative z-10 flex min-w-0 flex-1 flex-col ${showDock ? 'pb-28' : 'pb-10'}`}>
            {/* Enterprise Top Command Bar */}
            <header
              className={`no-print sticky top-0 z-30 border-b backdrop-blur-xl transition-colors ${
                isLight
                  ? 'border-slate-200/90 bg-white/88'
                  : 'border-slate-800/80 bg-[#060D16]/85'
              }`}
            >
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
                {/* Left: Mobile Drawer Button + Ctrl+K Search Trigger */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 p-2 text-slate-300 lg:hidden"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommandOpen(true)}
                    className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs transition sm:min-w-[240px] md:min-w-[290px] ${
                      isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-teal-500/50 hover:bg-white hover:text-slate-800'
                        : 'border-slate-800 bg-[#0B1626]/90 text-slate-400 hover:border-teal-400/50 hover:text-slate-200'
                    }`}
                  >
                    <Command className="h-3.5 w-3.5 text-teal-500" />
                    <span className="hidden flex-1 text-left sm:inline">
                      Search sessions, exports, theme...
                    </span>
                    <span className="sm:hidden">Search</span>
                    <kbd
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                        isLight
                          ? 'border-slate-200 bg-white text-slate-500'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      Ctrl K
                    </kbd>
                  </button>

                  {/* Live Django NLP Engine Latency & Security Pill */}
                  <button
                    type="button"
                    onClick={() => pingBackendHealth(true)}
                    title="Click to re-ping Django /api/health/"
                    className={`hidden cursor-pointer items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] transition xl:inline-flex ${
                      healthStatus.ok
                        ? isLight
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60'
                        : isLight
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        healthStatus.ok
                          ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_#34D399]'
                          : 'bg-amber-400'
                      }`}
                    />
                    <Activity className="h-3 w-3" />
                    <span>
                      NLP {healthStatus.latencyMs != null ? `${healthStatus.latencyMs}ms` : '...'}
                    </span>
                    <span className="opacity-50">|</span>
                    <ShieldCheck className="h-3 w-3" />
                    <span>HS256</span>
                  </button>
                </div>

                {/* Right: ThemeToggle, Notifications, Refresh, Splash, User, Logout */}
                <div className="flex items-center gap-2">
                  <ThemeToggle compact />

                  {/* Notifications Center Trigger */}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(true)}
                    title="Academic Intelligence Notifications"
                    className={`relative cursor-pointer rounded-lg border p-2 transition ${
                      isLight
                        ? 'border-slate-200 bg-white text-slate-600 hover:border-teal-500/50 hover:text-teal-600'
                        : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-teal-400/50 hover:text-teal-200'
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {unreadAlertCount > 0 && (
                      <span className="preserve-white absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 font-mono text-[9px] font-bold text-white shadow">
                        {unreadAlertCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={loadWorkspaceData}
                    title="Refresh live Django data"
                    className="cursor-pointer rounded-lg border border-slate-700/80 bg-slate-900/70 p-2 text-slate-400 transition hover:border-teal-400/50 hover:text-teal-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingWorkspace ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fetchPublicStats();
                      setView('splash');
                    }}
                    title="View Marketing Splash Page"
                    className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-teal-400/50 hover:text-teal-200 sm:inline-flex"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Splash</span>
                  </button>

                  {user && (
                    <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-[#0B1626]/90 px-2.5 py-1.5 md:flex">
                      <div className="text-right leading-tight">
                        <div className="text-xs font-semibold text-white">{user.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {user.academic_id || user.email}
                        </div>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          ROLE_COLORS[user.role] || ROLE_COLORS.MENTEE
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign out"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Workspace Canvas */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
              {inspectedSessionId ? (
                <SessionInspector
                  sessionId={inspectedSessionId}
                  onBack={() => setInspectedSessionId(null)}
                  onSessionUpdated={loadWorkspaceData}
                  onNotify={notify}
                />
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <OverviewDashboard
                      dashboard={dashboard}
                      user={user}
                      workspace={activeWorkspace}
                      onOpenSession={(id) => setInspectedSessionId(id)}
                      onGoCapture={() => setActiveTab('capture')}
                      onGoFollowups={() => setActiveTab('followups')}
                      onToggleActionStatus={handleToggleQuickAction}
                    />
                  )}

                  {activeTab === 'capture' && (
                    <CaptureStudio
                      user={user}
                      directory={directory}
                      defaultConfidential={orgSettings.defaultConfidential}
                      onSessionCreated={(created) => {
                        loadWorkspaceData();
                        fetchPublicStats();
                        logAudit(
                          'NLP_PIPELINE',
                          `Analyzed "${created?.title || 'Mentoring Session'}" (${created?.session_code || 'NEW'})`
                        );
                        notify(
                          'Transcript analyzed! Executive summary, insights & follow-ups persisted.',
                          'success'
                        );
                      }}
                      onInspectSession={(id) => {
                        setActiveTab('archive');
                        setInspectedSessionId(id);
                      }}
                    />
                  )}

                  {activeTab === 'archive' && (
                    <SessionsArchive
                      sessions={sessions}
                      onInspectSession={(id) => setInspectedSessionId(id)}
                      onDeleteSession={handleDeleteSession}
                      onGoCapture={() => setActiveTab('capture')}
                    />
                  )}

                  {activeTab === 'followups' && (
                    <FollowUpsBoard
                      actionItems={actionItems}
                      milestones={milestones}
                      sessions={sessions}
                      onRefreshAll={loadWorkspaceData}
                      onNotify={notify}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SaaSSettingsView
                      initialSubTab={settingsSubTab}
                      user={user}
                      workspace={activeWorkspace}
                      orgSettings={orgSettings}
                      onUpdateOrgSettings={setOrgSettings}
                      showDock={showDock}
                      onToggleDock={() => setShowDock((v) => !v)}
                      dashboard={dashboard}
                      sessions={sessions}
                      actionItems={actionItems}
                      milestones={milestones}
                      healthStatus={healthStatus}
                      onPingHealth={() => pingBackendHealth(true)}
                      onExportSessionsCsv={handleExportSessionsCsv}
                      onExportActionsCsv={handleExportActionsCsv}
                      onExportJson={handleExportJson}
                      auditEvents={auditEvents}
                      onLogAudit={logAudit}
                      onNotify={notify}
                    />
                  )}
                </>
              )}
            </main>
          </div>

          {/* Toggleable Signature Floating ReactBits Dock */}
          {showDock && (
            <Dock
              items={dockItems}
              activeId={inspectedSessionId ? 'archive' : activeTab}
              onSelect={(id) => {
                if (id === 'settings') {
                  openSettingsTab('appearance');
                } else {
                  navigateTab(id);
                }
              }}
            />
          )}
        </div>
      )}
    </ClickSpark>
  );
}
