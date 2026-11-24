import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Lock,
  MessageSquare,
  Printer,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { BorderBeam, CountUp, PillNav, SpotlightCard } from './reactbits';

const STATUS_CYCLE = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'PENDING',
};

const STATUS_STYLES = {
  PENDING: 'border-orange-400/40 bg-orange-500/15 text-orange-300',
  IN_PROGRESS: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300',
  COMPLETED: 'border-teal-400/40 bg-teal-500/15 text-teal-300',
};

const PRIORITY_STYLES = {
  HIGH: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
  MEDIUM: 'border-orange-400/40 bg-orange-500/15 text-orange-300',
  LOW: 'border-slate-600 bg-slate-800 text-slate-300',
};

export default function SessionInspector({
  sessionId,
  onBack,
  onSessionUpdated,
  onNotify,
}) {
  const { isLight } = useTheme();
  const [session, setSession] = useState(null);
  const [docPayload, setDocPayload] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rawView, setRawView] = useState(false);

  const loadSession = async () => {
    setLoading(true);
    try {
      const [detail, doc] = await Promise.all([
        api.getSession(sessionId),
        api.getDocument(sessionId),
      ]);
      setSession(detail);
      setDocPayload(doc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const updated = await api.analyzeSession(sessionId);
      const doc = await api.getDocument(sessionId);
      setSession(updated);
      setDocPayload(doc);
      onSessionUpdated();
      onNotify?.('NLP summarization re-executed & minutes refreshed.', 'success');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleCycleAction = async (item) => {
    const nextStatus = STATUS_CYCLE[item.status] || 'COMPLETED';
    await api.updateActionItem(item.id, { status: nextStatus });
    await loadSession();
    onSessionUpdated();
    onNotify?.(`Follow-up transitioned to ${nextStatus.replace('_', ' ')} & minutes synced.`, 'success');
  };

  const handleCopyMarkdown = async () => {
    const md = docPayload?.markdown || session?.generated_markdown_doc || '';
    if (!md) return;
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotify?.('Academic minutes Markdown copied to clipboard.', 'info');
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadMarkdown = () => {
    const md = docPayload?.markdown || session?.generated_markdown_doc || '';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.session_code || 'mentorsync'}-academic-minutes.md`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.(`Downloaded ${session?.session_code || 'mentorsync'}-academic-minutes.md`, 'success');
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-mono text-teal-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading Session Intelligence...
        </div>
      </div>
    );
  }

  const speakers = session.speaker_metrics?.speakers || [];
  const parsedTurns = session.speaker_metrics?.parsed_turns || [];
  const tabs = [
    { id: 'summary', label: 'Summary & Insights', icon: BrainCircuit },
    { id: 'actions', label: 'Action Items', icon: CheckCircle2, count: (session.action_items || []).length },
    { id: 'transcript', label: 'Transcript & Speaker Analytics', icon: Users },
    { id: 'minutes', label: 'Automated Academic Minutes', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-teal-400/50 hover:text-teal-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Archive
        </button>

        <button
          type="button"
          disabled={reanalyzing}
          onClick={handleReanalyze}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
          {reanalyzing ? 'Re-Running NLP...' : 'Re-Run NLP Summarization'}
        </button>
      </div>

      {/* Session Hero Header */}
      <div className="no-print glass-panel relative overflow-hidden rounded-2xl p-6">
        <BorderBeam colorFrom="#14B8A6" colorTo="#6366F1" />
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-500/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-teal-300">
                {session.session_code}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-0.5 text-xs text-slate-300">
                {session.course_or_track}
              </span>
              {session.is_confidential && (
                <span className="inline-flex items-center gap-1 rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-xs font-mono text-orange-300">
                  <Lock className="h-3 w-3" />
                  Confidential
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              {session.title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Mentor: <strong className="text-slate-200">{session.mentor_name}</strong> · Mentee:{' '}
              <strong className="text-slate-200">{session.mentee_name}</strong> ·{' '}
              {new Date(session.scheduled_at).toLocaleString()} ({session.duration_minutes} min)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[300px]">
            <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
              <div className="text-[11px] text-slate-400">Engagement</div>
              <div className="mt-0.5 font-display text-2xl font-bold text-teal-300">
                <CountUp to={session.engagement_score} decimals={1} suffix="%" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
              <div className="text-[11px] text-slate-400">Sentiment</div>
              <div className="mt-0.5 font-display text-2xl font-bold text-indigo-300">
                <CountUp to={session.sentiment_score} decimals={1} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-center">
              <div className="text-[11px] text-slate-400">Words</div>
              <div className="mt-0.5 font-display text-2xl font-bold text-orange-300">
                <CountUp to={session.speaker_metrics?.total_words || 0} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Morphing PillNav Tabs */}
      <div className="no-print">
        <PillNav
          items={tabs}
          activeId={activeTab}
          onChange={setActiveTab}
          layoutId="inspector-pill-nav"
        />
      </div>

      {/* TAB 1: Summary & Insights */}
      {activeTab === 'summary' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <SpotlightCard className="p-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-300">
                <Sparkles className="h-4 w-4" />
                Executive Summary (TextRank + TF-IDF + MMR)
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-100">
                {session.executive_summary}
              </p>

              {/* Topic Badges */}
              {(session.topics || []).length > 0 && (
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <div className="mb-2.5 text-xs font-mono uppercase tracking-wider text-slate-400">
                    Academic Topic Weights
                  </div>
                  <div className="space-y-2.5">
                    {session.topics.map((t) => (
                      <div key={t.name}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{t.name}</span>
                          <span className="font-mono text-slate-300">{t.share_pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${t.share_pct}%`,
                              backgroundColor: t.color || '#14B8A6',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SpotlightCard>

            {/* Recorded Decisions */}
            <SpotlightCard className="p-6" spotlightColor="rgba(99, 102, 241, 0.16)">
              <h2 className="font-display text-base font-semibold text-white">
                Recorded Decisions & Agreements ({(session.decisions || []).length})
              </h2>
              <div className="mt-4 space-y-3">
                {(session.decisions || []).length > 0 ? (
                  session.decisions.map((d, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4"
                    >
                      <p className="text-sm leading-relaxed text-slate-100">{d.decision}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Proposed by {d.proposed_by}</span>
                        <span className="text-indigo-300">Confidence: {d.confidence}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No explicit policy decisions detected; exploratory mentoring session.
                  </p>
                )}
              </div>
            </SpotlightCard>
          </div>

          {/* Discussion Insights Column */}
          <SpotlightCard className="p-6 lg:col-span-5" spotlightColor="rgba(251, 146, 60, 0.14)">
            <h2 className="font-display text-base font-semibold text-white">
              Discussion Insights ({(session.key_insights || []).length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              High-centrality thematic takeaways grounded in transcript evidence
            </p>
            <div className="mt-4 space-y-3.5">
              {(session.key_insights || []).map((ins, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/90 bg-[#07111F]/90 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${ins.color || '#14B8A6'}22`,
                        color: ins.color || '#5EEAD4',
                      }}
                    >
                      {ins.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {ins.sentiment}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-200">
                    “{ins.detail}”
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>— {ins.evidence_speaker}</span>
                    {ins.timestamp && <span>[{ins.timestamp}]</span>}
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 2: Action Items */}
      {activeTab === 'actions' && (
        <SpotlightCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Extracted Actionable Follow-Ups
              </h2>
              <p className="text-xs text-slate-400">
                Click any status badge to cycle Pending → In Progress → Completed (auto-updates Markdown minutes)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(session.action_items || []).map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-[#07111F]/90 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      item.status === 'COMPLETED'
                        ? 'text-slate-500 line-through'
                        : 'text-slate-100'
                    }`}
                  >
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                        PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {item.assignee_name} ({item.assignee_role})
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-300">
                      <Clock className="h-3 w-3" />
                      {item.due_label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCycleAction(item)}
                  className={`shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition hover:brightness-110 ${
                    STATUS_STYLES[item.status] || STATUS_STYLES.PENDING
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </button>
              </div>
            ))}
          </div>
        </SpotlightCard>
      )}

      {/* TAB 3: Transcript & Speaker Analytics */}
      {activeTab === 'transcript' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <SpotlightCard className="p-6 lg:col-span-5">
            <h2 className="font-display text-base font-semibold text-white">
              Speaker Participation Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Dialogue balance: {session.speaker_metrics?.balance_score || 0}% ·{' '}
              {session.speaker_metrics?.sentiment_label || 'Constructive'}
            </p>

            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speakers} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? 'rgba(15,23,42,0.08)' : 'rgba(148,163,184,0.12)'}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: isLight ? '#475569' : '#94A3B8', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: isLight ? '#475569' : '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={
                      isLight
                        ? {
                            backgroundColor: '#FFFFFF',
                            borderColor: 'rgba(15,23,42,0.12)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: '#0F172A',
                            boxShadow: '0 8px 24px -8px rgba(15,23,42,0.16)',
                          }
                        : {
                            backgroundColor: '#0A1525',
                            borderColor: 'rgba(20,184,166,0.35)',
                            borderRadius: '10px',
                            fontSize: '12px',
                          }
                    }
                  />
                  <Bar dataKey="word_count" name="Words Spoken" radius={[6, 6, 0, 0]}>
                    {speakers.map((sp, i) => (
                      <Cell
                        key={sp.name}
                        fill={
                          i === 0
                            ? isLight
                              ? '#0D9488'
                              : '#14B8A6'
                            : isLight
                            ? '#4F46E5'
                            : '#6366F1'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2.5">
              {speakers.map((sp) => (
                <div
                  key={sp.name}
                  className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{sp.name}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                      {sp.role} · {sp.talk_ratio_pct}%
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
                    <span>Turns: {sp.turns}</span>
                    <span>Questions: {sp.questions_asked}</span>
                    <span>Sentiment: {sp.sentiment_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-teal-400" />
                Diarized Conversation Transcript
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {parsedTurns.length} dialogue turns
              </span>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {parsedTurns.map((turn) => {
                const isMentor = turn.role === 'MENTOR';
                return (
                  <div
                    key={turn.index}
                    className={`rounded-xl border p-3.5 ${
                      isMentor
                        ? 'border-indigo-500/25 bg-indigo-500/8'
                        : 'border-teal-500/25 bg-teal-500/8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold ${
                          isMentor ? 'text-indigo-300' : 'text-teal-300'
                        }`}
                      >
                        {turn.speaker}{' '}
                        <span className="font-mono text-[10px] opacity-75">({turn.role})</span>
                      </span>
                      {turn.timestamp && (
                        <span className="font-mono text-[11px] text-slate-500">
                          [{turn.timestamp}]
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{turn.text}</p>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 4: Automated Academic Minutes */}
      {activeTab === 'minutes' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#081322]/90 p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawView(false)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  !rawView ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:text-white'
                }`}
              >
                Formatted Minutes Preview
              </button>
              <button
                type="button"
                onClick={() => setRawView(true)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  rawView ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw Markdown Source
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-teal-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied Markdown!' : 'Copy Markdown'}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
              >
                <Download className="h-3.5 w-3.5" />
                Download .md
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>

          {rawView ? (
            <SpotlightCard className="p-6">
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-teal-100">
                {docPayload?.markdown || session.generated_markdown_doc}
              </pre>
            </SpotlightCard>
          ) : (
            <div className="print-minutes-sheet glass-panel rounded-2xl p-6 sm:p-8">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-teal-300">
                  <span>MENTORSYNC AI · AUTOMATED ACADEMIC MINUTES</span>
                  <span>SESSION CODE: {session.session_code}</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  {session.title}
                </h2>
                <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-slate-500">Faculty Mentor:</span>{' '}
                    <strong>{session.mentor_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Student Mentee:</span>{' '}
                    <strong>{session.mentee_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Engagement:</span>{' '}
                    <strong className="text-teal-300">{session.engagement_score}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sentiment:</span>{' '}
                    <strong className="text-indigo-300">{session.sentiment_score}/100</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal-300">
                    1. Executive Summary
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {session.executive_summary}
                  </p>
                </section>

                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal-300">
                    2. Key Discussion Insights
                  </h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
                    {(session.key_insights || []).map((ins, i) => (
                      <li key={i}>
                        <strong className="text-white">{ins.category}:</strong> {ins.detail}{' '}
                        <span className="font-mono text-xs text-slate-400">
                          ({ins.evidence_speaker})
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal-300">
                    3. Recorded Decisions
                  </h3>
                  <ul className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
                    {(session.decisions || []).map((d, i) => (
                      <li key={i}>
                        {d.decision}{' '}
                        <span className="font-mono text-xs text-slate-400">
                          — {d.proposed_by}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal-300">
                    4. Actionable Follow-Up Ledger
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="py-2 pr-3">Task</th>
                          <th className="py-2 pr-3">Assignee</th>
                          <th className="py-2 pr-3">Priority</th>
                          <th className="py-2 pr-3">Target Due</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-200">
                        {(session.action_items || []).map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 pr-3">{item.description}</td>
                            <td className="py-2.5 pr-3 whitespace-nowrap">{item.assignee_name}</td>
                            <td className="py-2.5 pr-3 font-mono">{item.priority}</td>
                            <td className="py-2.5 pr-3 whitespace-nowrap font-mono">{item.due_label}</td>
                            <td className="py-2.5 font-mono">{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
