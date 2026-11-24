import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Info,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Generates contextual academic notifications from live Django backend data.
 */
export function buildIntelligenceAlerts({ sessions = [], actionItems = [], milestones = [], user }) {
  const alerts = [];

  // High-priority pending follow-ups
  actionItems
    .filter((a) => a.status !== 'COMPLETED' && a.priority === 'HIGH')
    .slice(0, 4)
    .forEach((a) => {
      alerts.push({
        id: `action-${a.id}`,
        category: 'followup',
        severity: 'high',
        title: `High-Priority Follow-Up (${a.session_code || 'Action'})`,
        body: a.description,
        meta: `${a.assignee_name || a.assignee_role} · Due: ${a.due_label || 'Soon'}`,
        actionType: 'followups',
      });
    });

  // Recently analyzed NLP sessions
  sessions.slice(0, 3).forEach((s) => {
    alerts.push({
      id: `session-${s.id}`,
      category: 'session',
      severity: 'info',
      title: `Academic Minutes Ready · ${s.session_code}`,
      body: `${s.title} processed (${s.engagement_score}% engagement, ${s.action_item_count} follow-ups).`,
      meta: `${s.mentee_name} · ${s.top_topic || 'Mentoring'}`,
      actionType: 'session',
      sessionId: s.id,
    });
  });

  // Milestones progress insights
  milestones
    .filter((m) => m.progress_pct < 100)
    .slice(0, 2)
    .forEach((m) => {
      alerts.push({
        id: `milestone-${m.id}`,
        category: 'milestone',
        severity: 'accent',
        title: `Milestone Progress: ${m.progress_pct}%`,
        body: `${m.title} (${m.category})`,
        meta: m.target_date ? `Target: ${m.target_date}` : 'Active Semester Deliverable',
        actionType: 'followups',
      });
    });

  if (user) {
    alerts.push({
      id: 'sec-jwt-active',
      category: 'system',
      severity: 'success',
      title: 'HS256 JWT Session Protected',
      body: `Role-scoped workspace active for ${user.full_name} (${user.role}). Confidential record isolation enabled.`,
      meta: 'Django REST Framework · Zero-Trust Scope',
      actionType: 'settings',
    });
  }

  return alerts;
}

/**
 * Slide-over Academic Intelligence Notifications Center Drawer.
 */
export function NotificationsDrawer({
  open,
  onClose,
  alerts = [],
  readIds = [],
  onMarkRead,
  onMarkAllRead,
  onSelectAlert,
}) {
  const { isLight } = useTheme();
  const [filter, setFilter] = useState('all');

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === 'unread') return !readSet.has(a.id);
      if (filter === 'followup') return a.category === 'followup';
      if (filter === 'session') return a.category === 'session';
      return true;
    });
  }, [alerts, filter, readSet]);

  const unreadCount = alerts.filter((a) => !readSet.has(a.id)).length;

  const getIcon = (alert) => {
    if (alert.category === 'followup') return Flame;
    if (alert.category === 'session') return FileText;
    if (alert.category === 'milestone') return Target;
    return ShieldCheck;
  };

  const getAccentClasses = (severity) => {
    if (severity === 'high') {
      return isLight
        ? 'border-rose-200 bg-rose-50 text-rose-600'
        : 'border-rose-400/40 bg-rose-500/15 text-rose-300';
    }
    if (severity === 'accent') {
      return isLight
        ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
        : 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300';
    }
    if (severity === 'success') {
      return isLight
        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
        : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300';
    }
    return isLight
      ? 'border-teal-200 bg-teal-50 text-teal-600'
      : 'border-teal-400/40 bg-teal-500/15 text-teal-300';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="no-print fixed inset-0 z-[110] bg-slate-950/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className={`no-print fixed right-0 top-0 z-[115] flex h-full w-full max-w-md flex-col border-l shadow-2xl ${
              isLight
                ? 'border-slate-200 bg-white text-slate-900'
                : 'border-slate-800 bg-[#081220] text-slate-100'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    isLight
                      ? 'border-teal-200 bg-teal-50 text-teal-600'
                      : 'border-teal-400/40 bg-teal-500/15 text-teal-300'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold">Intelligence Alerts</h2>
                  <p className="text-[11px] font-mono text-slate-500">
                    {unreadCount} unread · Live Django sync
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      isLight
                        ? 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                        : 'border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                    }`}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark All Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`cursor-pointer rounded-lg p-1.5 transition ${
                    isLight
                      ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div
              className={`flex items-center gap-1.5 border-b px-5 py-2.5 ${
                isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/80 bg-[#060D16]/60'
              }`}
            >
              {[
                { id: 'all', label: `All (${alerts.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'followup', label: 'Follow-Ups' },
                { id: 'session', label: 'Sessions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    filter === tab.id
                      ? isLight
                        ? 'preserve-white bg-teal-600 text-white shadow-sm'
                        : 'bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/40'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Alerts List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="h-7 w-7 text-teal-500/70" />
                  <p className="mt-2.5 text-sm font-semibold">All caught up!</p>
                  <p className="mt-1 text-xs text-slate-500">
                    No notifications match this filter right now.
                  </p>
                </div>
              ) : (
                filtered.map((alert) => {
                  const Icon = getIcon(alert);
                  const isUnread = !readSet.has(alert.id);
                  return (
                    <div
                      key={alert.id}
                      onClick={() => {
                        onMarkRead(alert.id);
                        onSelectAlert(alert);
                        onClose();
                      }}
                      className={`group relative cursor-pointer rounded-xl border p-3.5 transition ${
                        isUnread
                          ? isLight
                            ? 'border-teal-200 bg-teal-50/40 hover:border-teal-400 hover:bg-teal-50/70'
                            : 'border-teal-500/30 bg-[#0D1A2D] hover:border-teal-400/60'
                          : isLight
                          ? 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50'
                          : 'border-slate-800/90 bg-[#0A1525]/70 hover:border-slate-700'
                      }`}
                    >
                      {isUnread && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]" />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${getAccentClasses(
                            alert.severity
                          )}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="text-xs font-bold leading-snug">{alert.title}</div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                            {alert.body}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{alert.meta}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Crisp multi-toast stack for live workspace feedback.
 */
export function ToastStack({ toasts = [], onDismiss }) {
  const { isLight } = useTheme();

  return (
    <div className="no-print pointer-events-none fixed right-5 top-5 z-[130] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon =
            t.type === 'info' ? Info : t.type === 'accent' ? Sparkles : CheckCircle2;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium shadow-xl backdrop-blur-xl ${
                isLight
                  ? 'border-teal-500/30 bg-white/96 text-slate-800 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.16)]'
                  : 'border-teal-400/35 bg-[#0A1626]/95 text-teal-100 shadow-[0_14px_36px_rgba(0,0,0,0.6)]'
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  t.type === 'accent'
                    ? 'text-indigo-500 dark:text-indigo-400'
                    : t.type === 'info'
                    ? 'text-sky-500 dark:text-sky-400'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default NotificationsDrawer;
