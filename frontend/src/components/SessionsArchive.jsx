import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Lock,
  Mic,
  Search,
  Trash2,
} from 'lucide-react';
import { GradientText, SpotlightCard } from './reactbits';

export default function SessionsArchive({
  sessions = [],
  onInspectSession,
  onDeleteSession,
  onGoCapture,
}) {
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('ALL');

  const availableTopics = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => {
      if (s.top_topic) set.add(s.top_topic);
    });
    return ['ALL', ...Array.from(set)];
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchesTopic = topicFilter === 'ALL' || s.top_topic === topicFilter;
      if (!matchesTopic) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.session_code.toLowerCase().includes(q) ||
        s.course_or_track.toLowerCase().includes(q) ||
        (s.executive_summary || '').toLowerCase().includes(q) ||
        (s.mentee_name || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, search, topicFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-indigo-300">
            <FileText className="h-3.5 w-3.5" />
            Academic Session Vault & Automated Documentation
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            Mentoring <GradientText>Sessions Archive</GradientText>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search processed conversations, inspect speaker analytics, and export automated academic minutes.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoCapture}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-teal-400/40 bg-teal-500/15 px-4 py-2.5 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/25"
        >
          <Mic className="h-4 w-4" />
          New Session Analysis
        </button>
      </div>

      {/* Search & Topic Filters */}
      <SpotlightCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by session code, title, track, mentee, or summary keywords..."
              className="w-full rounded-xl border border-slate-700/80 bg-[#07111F] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setTopicFilter(topic)}
                className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  topicFilter === topic
                    ? 'border-teal-400/50 bg-teal-500/20 text-teal-200'
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                {topic === 'ALL' ? 'All Themes' : topic}
              </button>
            ))}
          </div>
        </div>
      </SpotlightCard>

      {/* Session Cards */}
      {filtered.length === 0 ? (
        <SpotlightCard className="p-12 text-center">
          <p className="text-sm text-slate-400">
            No matching mentoring sessions found. Try clearing filters or analyze a new transcript.
          </p>
        </SpotlightCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <SpotlightCard key={s.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-teal-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-300">
                      {s.session_code}
                    </span>
                    <span className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
                      {s.top_topic}
                    </span>
                    {s.is_confidential && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-mono text-orange-300">
                        <Lock className="h-3 w-3" />
                        Confidential
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    title="Delete session"
                    onClick={() => onDeleteSession(s.id, s.title)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {s.mentor_name} ↔ <span className="text-slate-200">{s.mentee_name}</span> · {s.course_or_track}
                </p>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300">
                  {s.executive_summary || 'Transcript stored — click Inspect to run NLP summarization.'}
                </p>

                {/* Metrics Bar */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800/80 bg-[#07111F]/80 p-2.5 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">Engagement</div>
                    <div className="font-mono font-bold text-teal-300">{s.engagement_score}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Sentiment</div>
                    <div className="font-mono font-bold text-indigo-300">{s.sentiment_score}/100</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Follow-Ups</div>
                    <div className="font-mono font-bold text-orange-300">
                      {s.action_item_count} ({s.open_action_count} open)
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(s.scheduled_at).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {s.duration_minutes}m
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectSession(s.id)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
                >
                  Inspect Intelligence
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}
