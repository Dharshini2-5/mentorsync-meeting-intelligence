import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flame,
  Mic,
  Sparkles,
  Target,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  AnimatedList,
  BorderBeam,
  CountUp,
  GradientText,
  SpotlightCard,
} from './reactbits';

const PRIORITY_BADGES = {
  HIGH: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
  MEDIUM: 'border-orange-400/40 bg-orange-500/15 text-orange-300',
  LOW: 'border-slate-600 bg-slate-800/80 text-slate-300',
};

export default function OverviewDashboard({
  dashboard,
  user,
  workspace,
  onOpenSession,
  onGoCapture,
  onGoFollowups,
  onToggleActionStatus,
}) {
  const { isLight } = useTheme();
  const kpis = dashboard?.kpis || {};
  const trend = dashboard?.engagement_trend || [];
  const topics = dashboard?.topic_distribution || [];
  const followups = dashboard?.priority_followups || [];
  const milestones = dashboard?.milestones || [];
  const recentSessions = dashboard?.recent_sessions || [];

  const gridStroke = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(148,163,184,0.12)';
  const tickColor = isLight ? '#475569' : '#94A3B8';
  const engColor = isLight ? '#0D9488' : '#14B8A6';
  const sentColor = isLight ? '#4F46E5' : '#6366F1';
  const tooltipStyle = isLight
    ? {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(15,23,42,0.12)',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#0F172A',
        boxShadow: '0 10px 28px -8px rgba(15,23,42,0.16)',
      }
    : {
        backgroundColor: '#0A1525',
        borderColor: 'rgba(20,184,166,0.35)',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#F1F5F9',
      };

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Launch Banner */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
        <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-teal-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{workspace?.name || user?.department || 'Academic Mentoring Intelligence'}</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl">
              Welcome back, <GradientText>{user?.full_name || user?.username}</GradientText>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Tracking {kpis.total_sessions || 0} mentoring sessions · {kpis.total_words_analyzed || 0} words
              processed via TextRank + TF-IDF NLP · {kpis.total_decisions || 0} recorded decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoCapture}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-teal-400/40 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-teal-100 shadow-[0_0_24px_rgba(20,184,166,0.2)] transition hover:from-teal-500/30 hover:to-indigo-500/30"
          >
            <Mic className="h-4 w-4 text-teal-300" />
            Analyze New Session
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">NLP Processed Sessions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">
            <CountUp to={kpis.processed_sessions || 0} />
            <span className="ml-1.5 text-sm font-normal text-slate-500">
              / {kpis.total_sessions || 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-teal-300">
            Automated minutes ready
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5" spotlightColor="rgba(99, 102, 241, 0.2)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Engagement Index</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">
            <CountUp to={kpis.avg_engagement || 0} decimals={1} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-indigo-300">
            Sentiment climate: {kpis.avg_sentiment || 0}/100
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5" spotlightColor="rgba(251, 146, 60, 0.2)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Action Item Resolution</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">
            <CountUp to={kpis.completion_rate || 0} decimals={1} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-orange-300">
            {kpis.open_action_items || 0} open · {kpis.completed_action_items || 0} completed
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5" spotlightColor="rgba(56, 189, 248, 0.2)">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Academic Milestones</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-bold text-white">
            <CountUp to={kpis.avg_milestone_progress || 0} decimals={0} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-sky-300">
            Across {milestones.length} tracked goals
          </div>
        </SpotlightCard>
      </div>

      {/* Charts Row: Longitudinal Engagement + Academic Topic Clusters */}
      <div className="grid gap-6 lg:grid-cols-12">
        <SpotlightCard className="p-6 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Engagement & Sentiment Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Longitudinal mentor–mentee dialogue quality across recorded sessions
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                Engagement
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Sentiment
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={engColor} stopOpacity={isLight ? 0.28 : 0.42} />
                      <stop offset="95%" stopColor={engColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sentColor} stopOpacity={isLight ? 0.22 : 0.35} />
                      <stop offset="95%" stopColor={sentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.full_title || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement_score"
                    name="Engagement"
                    stroke={engColor}
                    strokeWidth={2.5}
                    fill="url(#engGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sentiment_score"
                    name="Sentiment"
                    stroke={sentColor}
                    strokeWidth={2.2}
                    fill="url(#sentGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Analyze your first session to visualize engagement trends.
              </div>
            )}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 lg:col-span-5" spotlightColor="rgba(99, 102, 241, 0.16)">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-white">
              Academic Discussion Topics
            </h2>
            <p className="text-xs text-slate-400">
              NLP-clustered themes across mentoring transcripts
            </p>
          </div>

          {topics.length > 0 ? (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topics}
                      dataKey="share_pct"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {topics.map((t) => (
                        <Cell key={t.name} fill={t.color || '#14B8A6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val) => [`${val}%`, 'Theme Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {topics.slice(0, 5).map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: t.color || '#14B8A6' }}
                      />
                      <span className="truncate text-slate-300">{t.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-200">{t.share_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-slate-500">
              No clustered topics yet.
            </div>
          )}
        </SpotlightCard>
      </div>

      {/* Follow-Ups AnimatedList + Academic Milestones */}
      <div className="grid gap-6 lg:grid-cols-12">
        <SpotlightCard className="p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                <Flame className="h-4 w-4 text-orange-400" />
                Priority Actionable Follow-Ups
              </h2>
              <p className="text-xs text-slate-400">
                Click any checkmark to mark completed and auto-sync academic minutes
              </p>
            </div>
            <button
              type="button"
              onClick={onGoFollowups}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200"
            >
              Manage Board
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <AnimatedList
            items={followups}
            keyExtractor={(item) => item.id}
            maxHeight="340px"
            emptyMessage="All follow-up items are completed!"
            renderItem={(item) => (
              <div className="flex items-start gap-3 rounded-xl border border-slate-800/90 bg-[#081322]/85 p-3.5 transition hover:border-teal-500/35">
                <button
                  type="button"
                  title="Mark completed"
                  onClick={() => onToggleActionStatus(item)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-teal-400/50 text-teal-400 transition hover:bg-teal-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-slate-100">{item.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono font-semibold ${
                        PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.MEDIUM
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="rounded-md bg-slate-800/90 px-2 py-0.5 font-medium text-slate-300">
                      {item.assignee_name} ({item.assignee_role})
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-teal-300">
                      <Clock className="h-3 w-3" />
                      {item.due_label}
                    </span>
                    <span className="font-mono text-slate-500">{item.session_code}</span>
                  </div>
                </div>
              </div>
            )}
          />
        </SpotlightCard>

        <SpotlightCard className="p-6 lg:col-span-5" spotlightColor="rgba(251, 146, 60, 0.14)">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Academic Milestones
              </h2>
              <p className="text-xs text-slate-400">
                Semester deliverables & career readiness goals
              </p>
            </div>
            <button
              type="button"
              onClick={onGoFollowups}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 cursor-pointer"
            >
              Update Progress →
            </button>
          </div>

          <div className="space-y-3.5">
            {milestones.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-800/80 bg-[#081322]/80 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{m.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{m.category}</span>
                      {m.target_date && (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {m.target_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-teal-300">
                    {m.progress_pct}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 via-indigo-400 to-orange-400 transition-all duration-500"
                    style={{ width: `${m.progress_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      {/* Recent Processed Sessions Strip */}
      <SpotlightCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Recent Intelligence Sessions
            </h2>
            <p className="text-xs text-slate-400">
              Click any session to inspect executive summary, speaker analytics & automated Markdown minutes
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recentSessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenSession(s.id)}
              className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-800/90 bg-[#081322]/85 p-4 text-left transition hover:border-teal-400/50 hover:bg-[#0D1C31]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-teal-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-300">
                    {s.session_code}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Eng: <strong className="text-teal-300">{s.engagement_score}%</strong>
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-sm font-semibold text-white group-hover:text-teal-200">
                  {s.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {s.executive_summary}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
                <span>{s.mentee_name}</span>
                <span className="font-mono text-indigo-300">
                  {s.action_item_count} tasks · {s.decision_count} decisions
                </span>
              </div>
            </button>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}
