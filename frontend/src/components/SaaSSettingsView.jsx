import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BorderBeam, GradientText, PillNav, SpotlightCard } from './reactbits';

const API_KEYS_STORAGE = 'mentorsync_api_keys_v1';
const WEBHOOKS_STORAGE = 'mentorsync_webhooks_v1';

const DEFAULT_KEYS = [
  {
    id: 'key-default-1',
    label: 'LMS Moodle / Canvas Sync Key',
    prefix: 'ms_live_9f4c...e82a',
    secret: 'ms_live_9f4c7b2019d84b11a5c3e0814f72e82a',
    created: '2026-09-14',
    lastUsed: '2 mins ago',
    scopes: 'sessions:read, minutes:export',
  },
];

const DEFAULT_WEBHOOKS = {
  endpointUrl: 'https://lms.annauniv.edu/hooks/mentorsync-ai',
  events: {
    'session.summarized': true,
    'action_item.overdue': true,
    'minutes.exported': true,
    'milestone.completed': false,
    'confidential.flagged': true,
  },
};

const INVOICES = [
  { id: 'INV-2026-104', date: 'Nov 01, 2026', plan: 'Department Pro (Monthly)', amount: '$39.00', status: 'PAID' },
  { id: 'INV-2026-091', date: 'Oct 01, 2026', plan: 'Department Pro (Monthly)', amount: '$39.00', status: 'PAID' },
  { id: 'INV-2026-078', date: 'Sep 01, 2026', plan: 'Department Pro (Monthly)', amount: '$39.00', status: 'PAID' },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Faculty Starter',
    priceMonthly: '$0',
    priceAnnual: '$0',
    desc: 'Individual faculty advisors getting started with NLP minutes.',
    features: ['15 mentoring sessions / month', 'TextRank extractive summaries', 'Markdown minutes export'],
  },
  {
    id: 'pro',
    name: 'Department Pro',
    priceMonthly: '$39',
    priceAnnual: '$31',
    recommended: true,
    desc: 'Full academic departments managing multi-cohort mentorship.',
    features: [
      'Unlimited NLP summaries & minutes',
      'Multi-speaker diarization & engagement index',
      'Cross-session follow-up board & milestones',
      'LMS & Slack webhooks + API keys',
    ],
  },
  {
    id: 'enterprise',
    name: 'University Enterprise',
    priceMonthly: 'Custom',
    priceAnnual: 'Custom',
    desc: 'Campus-wide deployment with SSO, RBAC & NAAC/FERPA audit vaults.',
    features: [
      'Multi-department RBAC & SSO (SAML 2.0)',
      'Dedicated Python NLP compute cluster',
      'Custom accreditation report templates',
      '99.9% Uptime SLA & priority engineering',
    ],
  },
];

function generateLiveKey() {
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 32; i += 1) {
    hex += chars[Math.floor(Math.random() * chars.length)];
  }
  const secret = `ms_live_${hex}`;
  return {
    secret,
    prefix: `${secret.slice(0, 12)}...${secret.slice(-4)}`,
  };
}

export default function SaaSSettingsView({
  initialSubTab = 'appearance',
  user,
  workspace,
  orgSettings,
  onUpdateOrgSettings,
  showDock,
  onToggleDock,
  dashboard,
  sessions = [],
  actionItems = [],
  milestones = [],
  healthStatus,
  onPingHealth,
  onExportSessionsCsv,
  onExportActionsCsv,
  onExportJson,
  auditEvents = [],
  onLogAudit,
  onNotify,
}) {
  const { theme, isLight, setTheme } = useTheme();
  const [subTab, setSubTab] = useState(initialSubTab || 'appearance');

  // Plan modal
  const [currentPlan, setCurrentPlan] = useState('pro');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);

  // API Keys state
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(API_KEYS_STORAGE);
      return saved ? JSON.parse(saved) : DEFAULT_KEYS;
    } catch {
      return DEFAULT_KEYS;
    }
  });
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedId, setCopiedId] = useState('');

  // Webhooks state
  const [webhookCfg, setWebhookCfg] = useState(() => {
    try {
      const saved = localStorage.getItem(WEBHOOKS_STORAGE);
      return saved ? JSON.parse(saved) : DEFAULT_WEBHOOKS;
    } catch {
      return DEFAULT_WEBHOOKS;
    }
  });
  const [webhookPreview, setWebhookPreview] = useState(null);

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('ALL');

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    try {
      localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(apiKeys));
    } catch {
      // ignore
    }
  }, [apiKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(WEBHOOKS_STORAGE, JSON.stringify(webhookCfg));
    } catch {
      // ignore
    }
  }, [webhookCfg]);

  const kpis = dashboard?.kpis || {};
  const processedCount = kpis.processed_sessions ?? sessions.length;
  const actionsTotal = actionItems.length;
  const openActions = actionItems.filter((a) => a.status !== 'COMPLETED').length;
  const wordsAnalyzed = kpis.total_words_analyzed ?? 0;

  const handleCreateApiKey = (e) => {
    e.preventDefault();
    const label = newKeyLabel.trim() || `Academic Integration Key #${apiKeys.length + 1}`;
    const { secret, prefix } = generateLiveKey();
    const item = {
      id: `key-${Date.now()}`,
      label,
      prefix,
      secret,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Just created',
      scopes: 'sessions:read, sessions:analyze, minutes:export',
    };
    setApiKeys((prev) => [item, ...prev]);
    setRevealedKeys((prev) => ({ ...prev, [item.id]: true }));
    setNewKeyLabel('');
    onLogAudit?.('SECURITY', `Generated API key "${label}" (${prefix})`);
    onNotify?.(`API key "${label}" created! Copy and store it securely.`, 'success');
  };

  const handleCopyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key.secret);
      setCopiedId(key.id);
      setTimeout(() => setCopiedId(''), 1800);
      onNotify?.(`Copied ${key.prefix} to clipboard.`, 'info');
    } catch {
      onNotify?.('Clipboard unavailable in this browser context.', 'info');
    }
  };

  const handleRevokeKey = (key) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
    onLogAudit?.('SECURITY', `Revoked API key "${key.label}" (${key.prefix})`);
    onNotify?.(`Revoked API key "${key.label}".`, 'info');
  };

  const handleToggleWebhookEvent = (eventName) => {
    setWebhookCfg((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventName]: !prev.events[eventName],
      },
    }));
    onNotify?.(`Webhook subscription "${eventName}" updated.`, 'info');
  };

  const handleSendTestWebhook = () => {
    const samplePayload = {
      event: 'session.summarized',
      delivery_id: `wh_del_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
      workspace: workspace?.name || orgSettings.departmentName,
      target_url: webhookCfg.endpointUrl,
      data: {
        session_code: sessions[0]?.session_code || 'MS-2026-001',
        title: sessions[0]?.title || 'Final Year Capstone Architecture Review',
        engagement_score: sessions[0]?.engagement_score ?? 91.4,
        extracted_action_items: sessions[0]?.action_item_count ?? 4,
        minutes_ready: true,
      },
    };
    setWebhookPreview(samplePayload);
    onLogAudit?.('WEBHOOK', `Dispatched test webhook to ${webhookCfg.endpointUrl}`);
    onNotify?.('Test webhook payload simulated (200 OK · 24ms).', 'accent');
  };

  const handleDownloadInvoice = (inv) => {
    const content = [
      'MENTORSYNC AI — INSTITUTIONAL SAAS INVOICE',
      '==========================================',
      `Invoice Number : ${inv.id}`,
      `Billing Date   : ${inv.date}`,
      `Organization   : ${orgSettings.institutionName} — ${orgSettings.departmentName}`,
      `Subscription   : ${inv.plan}`,
      `Amount Paid    : ${inv.amount} USD`,
      `Status         : ${inv.status}`,
      '==========================================',
      'Thank you for powering structured academic mentoring with MentorSync AI.',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}-mentorsync-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(`Downloaded invoice receipt ${inv.id}.`, 'info');
  };

  const mergedAuditTrail = useMemo(() => {
    const derived = [
      ...auditEvents,
      ...sessions.slice(0, 6).map((s) => ({
        id: `aud-sess-${s.id}`,
        timestamp: s.scheduled_at || new Date().toISOString(),
        category: 'NLP_PIPELINE',
        actor: s.mentor_name || user?.full_name || 'Faculty Mentor',
        detail: `Processed ${s.session_code} "${s.title}" · Eng ${s.engagement_score}% · ${s.action_item_count} follow-ups`,
      })),
      ...actionItems
        .filter((a) => a.status === 'COMPLETED')
        .slice(0, 4)
        .map((a) => ({
          id: `aud-act-${a.id}`,
          timestamp: a.created_at || new Date().toISOString(),
          category: 'FOLLOWUP',
          actor: a.assignee_name || 'Participant',
          detail: `Resolved follow-up in ${a.session_code || 'Session'}: ${a.description.slice(0, 72)}`,
        })),
    ];
    return derived
      .filter((e) => auditFilter === 'ALL' || e.category === auditFilter)
      .slice(0, 20);
  }, [auditEvents, sessions, actionItems, user, auditFilter]);

  const subTabs = [
    { id: 'appearance', label: 'Appearance & Org', icon: Palette },
    { id: 'billing', label: 'Plan & Quotas', icon: CreditCard },
    { id: 'api', label: 'API Keys & Webhooks', icon: KeyRound },
    { id: 'compliance', label: 'Exports & Audit Log', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-indigo-400">
            <Building2 className="h-3.5 w-3.5" />
            Institutional SaaS Control Plane
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            Workspace, <GradientText>Billing & API Settings</GradientText>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure theme studio, academic branding, Department Pro quotas, developer webhooks, and compliance exports.
          </p>
        </div>

        <PillNav
          items={subTabs}
          activeId={subTab}
          onChange={setSubTab}
          layoutId="saas-settings-pill-nav"
        />
      </div>

      {/* TAB 1: APPEARANCE & ACADEMIC ORG */}
      {subTab === 'appearance' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Theme Studio Cards */}
          <SpotlightCard className="p-6 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  Visual Theme Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Instant theme switch across every dashboard chart, minutes preview, modal, and ReactBits surface
                </p>
              </div>
              <span className="rounded-full border border-teal-400/35 bg-teal-500/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase text-teal-300">
                Active: {theme}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Dark Mode Preview Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  onNotify?.('Switched to Obsidian Dark Mode.', 'info');
                }}
                className={`group cursor-pointer rounded-2xl border p-4 text-left transition ${
                  theme === 'dark'
                    ? 'border-teal-400 ring-2 ring-teal-400/30'
                    : 'border-slate-700/70 hover:border-teal-400/50'
                }`}
              >
                {/* Mini Dark UI Mockup */}
                <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#060D16] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                    </div>
                    <Moon className="h-3.5 w-3.5 text-teal-300" />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded bg-slate-700/90" />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div className="h-7 rounded-md border border-teal-500/30 bg-[#0B1626]" />
                      <div className="h-7 rounded-md border border-indigo-500/30 bg-[#0B1626]" />
                      <div className="h-7 rounded-md border border-orange-500/30 bg-[#0B1626]" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Obsidian Slate Dark</div>
                    <div className="text-[11px] text-slate-400">Bioluminescent navy night studio</div>
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="h-5 w-5 text-teal-400" />}
                </div>
              </button>

              {/* Light Mode Preview Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  onNotify?.('Switched to Editorial Frost Light Mode.', 'info');
                }}
                className={`group cursor-pointer rounded-2xl border p-4 text-left transition ${
                  theme === 'light'
                    ? 'border-teal-500 ring-2 ring-teal-500/30'
                    : 'border-slate-700/70 hover:border-teal-400/50'
                }`}
              >
                {/* Mini Light UI Mockup */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#F4F8FA] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                    </div>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded bg-slate-300" />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div className="h-7 rounded-md border border-slate-200 bg-white shadow-xs" />
                      <div className="h-7 rounded-md border border-slate-200 bg-white shadow-xs" />
                      <div className="h-7 rounded-md border border-slate-200 bg-white shadow-xs" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Editorial Frost Light</div>
                    <div className="text-[11px] text-slate-400">Crisp Notion/Linear daylight clarity</div>
                  </div>
                  {theme === 'light' && <CheckCircle2 className="h-5 w-5 text-teal-500" />}
                </div>
              </button>
            </div>

            {/* Interface Controls */}
            <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#07111F]/80 p-3.5">
                <div>
                  <div className="text-sm font-semibold text-white">Floating ReactBits Navigation Dock</div>
                  <div className="text-xs text-slate-400">
                    Show the magnifying bottom dock alongside the collapsible SaaS left sidebar
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showDock}
                  onClick={() => {
                    onToggleDock();
                    onNotify?.(
                      showDock ? 'Floating ReactBits Dock hidden.' : 'Floating ReactBits Dock enabled.',
                      'info'
                    );
                  }}
                  className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    showDock ? 'bg-teal-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      showDock ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#07111F]/80 p-3.5">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Lock className="h-3.5 w-3.5 text-orange-400" />
                    Default New Sessions to Confidential Counseling
                  </div>
                  <div className="text-xs text-slate-400">
                    Automatically enable confidentiality scoping in Capture & NLP Studio
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={orgSettings.defaultConfidential}
                  onClick={() => {
                    onUpdateOrgSettings({
                      ...orgSettings,
                      defaultConfidential: !orgSettings.defaultConfidential,
                    });
                    onNotify?.('Default confidentiality policy updated.', 'success');
                  }}
                  className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    orgSettings.defaultConfidential ? 'bg-orange-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      orgSettings.defaultConfidential ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </SpotlightCard>

          {/* Academic Organization Branding */}
          <SpotlightCard className="p-6 lg:col-span-5" spotlightColor="rgba(99, 102, 241, 0.16)">
            <h2 className="font-display text-base font-semibold text-white">
              Academic Organization Profile
            </h2>
            <p className="text-xs text-slate-400">
              Embedded into automated academic minutes headers & compliance bundles
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={orgSettings.institutionName}
                  onChange={(e) =>
                    onUpdateOrgSettings({ ...orgSettings, institutionName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Department / Mentoring Cell
                </label>
                <input
                  type="text"
                  value={orgSettings.departmentName}
                  onChange={(e) =>
                    onUpdateOrgSettings({ ...orgSettings, departmentName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Accreditation & Audit Code
                </label>
                <input
                  type="text"
                  value={orgSettings.accreditationCode}
                  onChange={(e) =>
                    onUpdateOrgSettings({ ...orgSettings, accreditationCode: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-3.5 text-xs">
                <div className="font-semibold text-teal-300">Active Workspace Context</div>
                <div className="mt-1 text-slate-300">
                  {workspace?.name} · Signed in as <strong>{user?.full_name}</strong> ({user?.role})
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogAudit?.('SETTINGS', `Updated branding for ${orgSettings.departmentName}`);
                  onNotify?.('Organization branding saved to workspace profile.', 'success');
                }}
                className="preserve-white w-full cursor-pointer rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              >
                Save Organization Settings
              </button>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 2: PLAN & USAGE QUOTAS */}
      {subTab === 'billing' && (
        <div className="space-y-6">
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
            <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="preserve-white rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 px-3 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
                    {PLANS.find((p) => p.id === currentPlan)?.name || 'Department Pro'}
                  </span>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] text-emerald-500 dark:text-emerald-300">
                    Active Subscription
                  </span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  $39<span className="text-sm font-normal text-slate-400"> / month · Unlimited NLP Pipelines</span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Next institutional renewal on Dec 01, 2026 · Includes FERPA-aligned confidential scoping & unlimited Markdown minutes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(true)}
                  className="preserve-white inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Compare / Upgrade Plan
                </button>
              </div>
            </div>

            {/* Live Metered Quota Bars */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Sessions Analyzed',
                  value: processedCount,
                  capLabel: 'Unlimited (Pro)',
                  pct: Math.min(100, Math.max(12, processedCount * 9)),
                  color: 'from-teal-400 to-emerald-400',
                  sub: `${sessions.length} stored in vault`,
                },
                {
                  label: 'Action Items Tracked',
                  value: actionsTotal,
                  capLabel: `${openActions} open`,
                  pct: Math.min(100, Math.max(15, actionsTotal * 3)),
                  color: 'from-indigo-400 to-violet-500',
                  sub: `${kpis.completion_rate || 0}% resolution rate`,
                },
                {
                  label: 'Active Milestones',
                  value: milestones.length,
                  capLabel: `${kpis.avg_milestone_progress || 0}% avg`,
                  pct: Math.min(100, Math.max(18, kpis.avg_milestone_progress || 55)),
                  color: 'from-orange-400 to-amber-500',
                  sub: 'Live Django DB goals',
                },
                {
                  label: 'Automated Minutes',
                  value: processedCount,
                  capLabel: `${wordsAnalyzed.toLocaleString()} words`,
                  pct: Math.min(100, Math.max(20, Math.round((wordsAnalyzed / 4000) * 100))),
                  color: 'from-sky-400 to-teal-400',
                  sub: 'Markdown + Print PDF synced',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{m.label}</span>
                    <span className="font-mono text-[10px] text-teal-300">{m.capLabel}</span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-white">
                    {m.value}
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] font-mono text-slate-500">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice History */}
          <SpotlightCard className="p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Institutional Billing & Invoice History
            </h3>
            <p className="text-xs text-slate-400">
              Download receipts for university department reimbursement & procurement records
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 font-mono text-[11px] text-slate-400">
                    <th className="py-2.5 pr-4">Invoice ID</th>
                    <th className="py-2.5 pr-4">Date</th>
                    <th className="py-2.5 pr-4">Plan</th>
                    <th className="py-2.5 pr-4">Amount</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {INVOICES.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-mono font-semibold text-teal-300">{inv.id}</td>
                      <td className="py-3 pr-4">{inv.date}</td>
                      <td className="py-3 pr-4">{inv.plan}</td>
                      <td className="py-3 pr-4 font-mono font-semibold">{inv.amount}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-md border border-teal-400/35 bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-300">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-200"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 3: API KEYS & LMS WEBHOOKS */}
      {subTab === 'api' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* API Keys Manager */}
          <div className="space-y-6 lg:col-span-7">
            <SpotlightCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Developer API Keys (`ms_live_*`)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Authenticate automated LMS pipelines, Moodle cron syncs, or custom analytics dashboards
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateApiKey} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Key label, e.g., Canvas LMS Nightly Minutes Exporter"
                  className="flex-1 rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2 text-sm text-white outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  className="preserve-white inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Generate Key
                </button>
              </form>

              <div className="mt-5 space-y-3">
                {apiKeys.map((k) => {
                  const revealed = Boolean(revealedKeys[k.id]);
                  return (
                    <div
                      key={k.id}
                      className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-white">{k.label}</div>
                          <div className="mt-1 font-mono text-xs text-teal-300">
                            {revealed ? k.secret : k.prefix}
                          </div>
                          <div className="mt-1.5 text-[11px] font-mono text-slate-500">
                            Created {k.created} · Last used: {k.lastUsed} · Scopes: {k.scopes}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedKeys((prev) => ({ ...prev, [k.id]: !prev[k.id] }))
                            }
                            title={revealed ? 'Hide secret' : 'Reveal secret'}
                            className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 hover:border-teal-400/50"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(k)}
                            title="Copy API key"
                            className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 hover:border-teal-400/50"
                          >
                            {copiedId === k.id ? (
                              <Check className="h-3.5 w-3.5 text-teal-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(k)}
                            title="Revoke key"
                            className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>

            {/* Webhooks Configuration */}
            <SpotlightCard className="p-6" spotlightColor="rgba(99, 102, 241, 0.16)">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                    <Webhook className="h-4 w-4 text-indigo-400" />
                    LMS & Slack Event Webhooks
                  </h2>
                  <p className="text-xs text-slate-400">
                    Push signed JSON events when transcripts finish NLP summarization or follow-ups change
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestWebhook}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
                >
                  <Send className="h-3.5 w-3.5" />
                  Test Event
                </button>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Target Webhook Endpoint URL
                </label>
                <input
                  type="url"
                  value={webhookCfg.endpointUrl}
                  onChange={(e) =>
                    setWebhookCfg((prev) => ({ ...prev, endpointUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] px-3.5 py-2 font-mono text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="mt-4 space-y-2">
                {Object.entries(webhookCfg.events).map(([evName, enabled]) => (
                  <div
                    key={evName}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#07111F]/80 px-3.5 py-2.5"
                  >
                    <span className="font-mono text-xs text-slate-200">{evName}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => handleToggleWebhookEvent(evName)}
                      className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${
                        enabled ? 'bg-teal-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          enabled ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {webhookPreview && (
                <div className="mt-4 rounded-xl border border-teal-500/30 bg-[#07111F] p-3.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono text-teal-300">
                    <span>SIMULATED DELIVERY · HTTP 200 OK</span>
                    <button
                      type="button"
                      onClick={() => setWebhookPreview(null)}
                      className="cursor-pointer text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                  <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
                    {JSON.stringify(webhookPreview, null, 2)}
                  </pre>
                </div>
              )}
            </SpotlightCard>
          </div>

          {/* Live Django Health & NLP Diagnostics */}
          <div className="lg:col-span-5">
            <SpotlightCard className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                  <Activity className="h-4 w-4 text-teal-400" />
                  Live Django NLP Diagnostic
                </h2>
                <button
                  type="button"
                  onClick={onPingHealth}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${healthStatus?.pinging ? 'animate-spin' : ''}`} />
                  Re-Ping
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Real-time telemetry against `GET /api/health/` on port 8003
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3.5">
                  <div className="text-[11px] font-mono text-slate-500">STATUS & LATENCY</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-display text-lg font-bold text-white">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          healthStatus?.ok
                            ? 'bg-emerald-400 shadow-[0_0_10px_#34D399]'
                            : 'bg-amber-400'
                        }`}
                      />
                      {healthStatus?.ok ? 'Operational' : 'Connecting...'}
                    </span>
                    <span className="font-mono text-sm font-bold text-teal-300">
                      {healthStatus?.latencyMs != null ? `${healthStatus.latencyMs} ms` : '-- ms'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3.5">
                    <div className="text-[11px] font-mono text-slate-500">SESSIONS INDEXED</div>
                    <div className="mt-1 font-display text-2xl font-bold text-teal-300">
                      {healthStatus?.payload?.sessions_indexed ?? sessions.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3.5">
                    <div className="text-[11px] font-mono text-slate-500">ACTIONS TRACKED</div>
                    <div className="mt-1 font-display text-2xl font-bold text-indigo-300">
                      {healthStatus?.payload?.action_items_tracked ?? actionItems.length}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3.5 font-mono text-[11px] space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Backend Host</span>
                    <span className="text-slate-200">127.0.0.1:8003</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Protocol</span>
                    <span className="text-teal-300">PyJWT HS256 Bearer</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NLP Pipeline</span>
                    <span className="text-indigo-300">TextRank + TF-IDF + MMR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Verified</span>
                    <span className="text-slate-200">
                      {healthStatus?.checkedAt
                        ? new Date(healthStatus.checkedAt).toLocaleTimeString()
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLIANCE EXPORTS & AUDIT LOG */}
      {subTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SpotlightCard className="flex flex-col justify-between p-5">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/35 bg-teal-500/15 text-teal-300">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-white">
                  Export Mentoring Sessions CSV
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  RFC-4180 spreadsheet containing all {sessions.length} live sessions, engagement indices, sentiment scores, and executive summaries.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportSessionsCsv}
                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-500/15 px-3.5 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sessions .CSV
              </button>
            </SpotlightCard>

            <SpotlightCard className="flex flex-col justify-between p-5" spotlightColor="rgba(99, 102, 241, 0.16)">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/35 bg-indigo-500/15 text-indigo-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-white">
                  Export Action Items CSV
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Complete follow-up accountability ledger ({actionItems.length} tasks) with assignees, roles, priority levels, and completion statuses.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportActionsCsv}
                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
              >
                <Download className="h-3.5 w-3.5" />
                Download Follow-Ups .CSV
              </button>
            </SpotlightCard>

            <SpotlightCard className="flex flex-col justify-between p-5" spotlightColor="rgba(251, 146, 60, 0.16)">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-400/35 bg-orange-500/15 text-orange-300">
                  <FileJson className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-white">
                  Full Academic Intelligence JSON
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Complete NAAC / accreditation archive combining live KPIs, longitudinal trends, sessions, tasks, and {milestones.length} milestones.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportJson}
                className="preserve-white mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                <Download className="h-3.5 w-3.5" />
                Download Full .JSON Bundle
              </button>
            </SpotlightCard>
          </div>

          {/* Audit Log */}
          <SpotlightCard className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-white">
                  Timestamped Session & Security Audit Trail
                </h3>
                <p className="text-xs text-slate-400">
                  Live ledger of NLP summarizations, follow-up resolutions, API key operations, and exports
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'NLP_PIPELINE', 'FOLLOWUP', 'EXPORT', 'SECURITY'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditFilter(cat)}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold transition ${
                      auditFilter === cat
                        ? 'border-teal-400/50 bg-teal-500/20 text-teal-200'
                        : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {mergedAuditTrail.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-[#07111F]/90 px-4 py-3 text-xs sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 rounded-md border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
                      {ev.category}
                    </span>
                    <div>
                      <div className="text-slate-100">{ev.detail}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">Actor: {ev.actor}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPlanModal(false)}
            className="no-print fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl rounded-3xl border p-6 shadow-2xl sm:p-8 ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-900'
                  : 'border-slate-700/80 bg-[#081220] text-slate-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold">
                    Institutional SaaS Subscription Tiers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scale MentorSync AI from individual faculty advising to university-wide mentorship
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAnnualBilling((v) => !v)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${
                      annualBilling
                        ? 'border-teal-500/40 bg-teal-500/15 text-teal-600 dark:text-teal-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {annualBilling ? 'Annual Billing (Save 20%)' : 'Monthly Billing'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {PLANS.map((plan) => {
                  const selected = currentPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 ${
                        plan.recommended
                          ? isLight
                            ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500/30'
                            : 'border-teal-400/60 bg-[#0C1B2E]'
                          : isLight
                          ? 'border-slate-200 bg-slate-50/60'
                          : 'border-slate-800 bg-[#0A1525]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-bold">{plan.name}</span>
                          {plan.recommended && (
                            <span className="preserve-white rounded-full bg-teal-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div className="mt-3 font-display text-3xl font-extrabold">
                          {annualBilling ? plan.priceAnnual : plan.priceMonthly}
                          {plan.priceMonthly !== 'Custom' && (
                            <span className="text-xs font-normal text-slate-500"> / mo</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">{plan.desc}</p>
                        <ul className="mt-4 space-y-2 text-xs">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPlan(plan.id);
                          setShowPlanModal(false);
                          onLogAudit?.('BILLING', `Switched institutional tier preview to ${plan.name}`);
                          onNotify?.(`Workspace tier updated to ${plan.name}.`, 'success');
                        }}
                        className={`mt-5 w-full cursor-pointer rounded-xl py-2 text-xs font-semibold transition ${
                          selected
                            ? 'border border-teal-500/40 bg-teal-500/15 text-teal-600 dark:text-teal-300'
                            : 'preserve-white bg-gradient-to-r from-teal-600 to-indigo-600 text-white hover:brightness-110'
                        }`}
                      >
                        {selected ? 'Current Active Plan' : `Select ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
