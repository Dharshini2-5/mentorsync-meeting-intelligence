import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListChecks,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { AnimatedList, GradientText, PillNav, SpotlightCard } from './reactbits';

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

export default function FollowUpsBoard({
  actionItems = [],
  milestones = [],
  sessions = [],
  onRefreshAll,
  onNotify,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // New Action Item Form
  const [showNewAction, setShowNewAction] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newSessionId, setNewSessionId] = useState(sessions[0]?.id ? String(sessions[0].id) : '');
  const [newRole, setNewRole] = useState('MENTEE');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newDue, setNewDue] = useState('By Friday');

  // New Milestone Form
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msCategory, setMsCategory] = useState('Project Architecture');
  const [msTarget, setMsTarget] = useState('');

  const filteredItems = useMemo(() => {
    return actionItems.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (roleFilter !== 'ALL' && item.assignee_role !== roleFilter) return false;
      return true;
    });
  }, [actionItems, statusFilter, priorityFilter, roleFilter]);

  const counts = useMemo(
    () => ({
      ALL: actionItems.length,
      PENDING: actionItems.filter((i) => i.status === 'PENDING').length,
      IN_PROGRESS: actionItems.filter((i) => i.status === 'IN_PROGRESS').length,
      COMPLETED: actionItems.filter((i) => i.status === 'COMPLETED').length,
    }),
    [actionItems]
  );

  const handleCycleStatus = async (item) => {
    const next = STATUS_CYCLE[item.status] || 'COMPLETED';
    await api.updateActionItem(item.id, { status: next });
    onRefreshAll();
    onNotify?.(`Action item moved to ${next.replace('_', ' ')} & minutes updated.`, 'success');
  };

  const handleDeleteAction = async (id) => {
    await api.deleteActionItem(id);
    onRefreshAll();
    onNotify?.('Follow-up item removed.', 'info');
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    const sid = newSessionId || sessions[0]?.id;
    if (!sid || !newDesc.trim()) return;
    await api.createActionItem({
      session: Number(sid),
      description: newDesc.trim(),
      assignee_role: newRole,
      priority: newPriority,
      due_label: newDue || 'Next Check-in',
    });
    setNewDesc('');
    setShowNewAction(false);
    onRefreshAll();
    onNotify?.('Custom follow-up created & synced to session minutes.', 'success');
  };

  const handleMilestoneChange = async (m, progressPct) => {
    await api.updateMilestone(m.id, { progress_pct: Number(progressPct) });
    onRefreshAll();
    onNotify?.(`Milestone "${m.title}" calibrated to ${progressPct}%.`, 'accent');
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    await api.createMilestone({
      title: msTitle.trim(),
      category: msCategory,
      progress_pct: 20,
      target_date: msTarget || null,
    });
    setMsTitle('');
    setMsTarget('');
    setShowNewMilestone(false);
    onRefreshAll();
    onNotify?.('New academic milestone saved to Django DB.', 'success');
  };

  const handleDeleteMilestone = async (id) => {
    await api.deleteMilestone(id);
    onRefreshAll();
    onNotify?.('Academic milestone deleted.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-orange-300">
            <ListChecks className="h-3.5 w-3.5" />
            Accountability & Longitudinal Academic Tracking
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            Follow-Ups & <GradientText>Academic Milestones</GradientText>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Transition action items across sessions, add manual mentoring tasks, and calibrate milestone readiness.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewAction((v) => !v)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-500/15 px-4 py-2.5 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/25"
        >
          <Plus className="h-4 w-4" />
          Add Custom Follow-Up
        </button>
      </div>

      {/* Add Action Item Drawer */}
      {showNewAction && (
        <SpotlightCard className="p-5">
          <form onSubmit={handleAddAction} className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-1 block text-xs text-slate-400">Action Item Description</label>
              <input
                type="text"
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g., Prepare IEEE conference ablation results table"
                className="w-full rounded-xl border border-slate-700 bg-[#07111F] px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs text-slate-400">Session</label>
              <select
                value={newSessionId || sessions[0]?.id || ''}
                onChange={(e) => setNewSessionId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#07111F] px-3 py-2 text-sm text-white outline-none"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_code} — {s.title.slice(0, 26)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs text-slate-400">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#07111F] px-2 py-2 text-xs text-white"
              >
                <option value="MENTEE">Mentee</option>
                <option value="MENTOR">Mentor</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs text-slate-400">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#07111F] px-2 py-2 text-xs text-white"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Med</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Target Due</label>
                <input
                  type="text"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#07111F] px-2.5 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
              >
                Save
              </button>
            </div>
          </form>
        </SpotlightCard>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Action Items Ledger */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillNav
              layoutId="followup-status-filter"
              activeId={statusFilter}
              onChange={setStatusFilter}
              items={[
                { id: 'ALL', label: 'All', count: counts.ALL },
                { id: 'PENDING', label: 'Pending', count: counts.PENDING },
                { id: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
                { id: 'COMPLETED', label: 'Completed', count: counts.COMPLETED },
              ]}
            />

            <div className="flex items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#081322] px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#081322] px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Roles</option>
                <option value="MENTEE">Mentee Tasks</option>
                <option value="MENTOR">Mentor Tasks</option>
              </select>
            </div>
          </div>

          <SpotlightCard className="p-5">
            <AnimatedList
              items={filteredItems}
              keyExtractor={(item) => item.id}
              maxHeight="580px"
              emptyMessage="No follow-up items match the selected filter."
              renderItem={(item) => (
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-[#07111F]/90 p-4 transition hover:border-teal-500/35 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          item.status === 'COMPLETED' ? 'text-teal-400' : 'text-slate-600'
                        }`}
                      />
                      <p
                        className={`text-sm leading-snug ${
                          item.status === 'COMPLETED'
                            ? 'text-slate-500 line-through'
                            : 'text-slate-100'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-6 text-[11px]">
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono font-semibold ${
                          PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                        {item.assignee_name} ({item.assignee_role})
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-teal-300">
                        <Clock className="h-3 w-3" />
                        {item.due_label}
                      </span>
                      <span className="font-mono text-slate-500">{item.session_code}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(item)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition hover:brightness-110 ${
                        STATUS_STYLES[item.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAction(item.id)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            />
          </SpotlightCard>
        </div>

        {/* Right: Academic Milestones Sliders */}
        <div className="space-y-4 lg:col-span-5">
          <SpotlightCard className="p-6" spotlightColor="rgba(99, 102, 241, 0.16)">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                  <Target className="h-4 w-4 text-teal-400" />
                  Academic Milestone Tracker
                </h2>
                <p className="text-xs text-slate-400">
                  Drag sliders to persist live progress to Django DB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewMilestone((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {showNewMilestone && (
              <form
                onSubmit={handleAddMilestone}
                className="mb-4 space-y-2.5 rounded-xl border border-indigo-500/30 bg-[#07111F] p-3.5"
              >
                <input
                  type="text"
                  required
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  placeholder="Milestone title..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={msCategory}
                    onChange={(e) => setMsCategory(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option>Project Architecture</option>
                    <option>DSA & Coding Prep</option>
                    <option>Research & Paper Writing</option>
                    <option>Academics & Coursework</option>
                    <option>Career & Placement</option>
                  </select>
                  <input
                    type="date"
                    value={msTarget}
                    onChange={(e) => setMsTarget(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-indigo-500 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"
                >
                  Create Academic Milestone
                </button>
              </form>
            )}

            <div className="space-y-4">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-800 bg-[#07111F]/90 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{m.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-teal-300">
                          {m.category}
                        </span>
                        <span>{m.mentee_name}</span>
                        {m.target_date && (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {m.target_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="cursor-pointer rounded p-1 text-slate-600 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={2}
                      defaultValue={m.progress_pct}
                      onMouseUp={(e) => handleMilestoneChange(m, e.target.value)}
                      onTouchEnd={(e) => handleMilestoneChange(m, e.target.value)}
                      onKeyUp={(e) => handleMilestoneChange(m, e.target.value)}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-teal-400"
                    />
                    <span className="w-11 text-right font-mono text-sm font-bold text-teal-300">
                      {m.progress_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
