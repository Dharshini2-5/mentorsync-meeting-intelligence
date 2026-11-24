/**
 * Real 1-click compliance export utilities operating directly on live Django API datasets.
 */

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function exportSessionsCsv(sessions = []) {
  const headers = [
    'Session Code',
    'Title',
    'Course / Track',
    'Faculty Mentor',
    'Student Mentee',
    'Scheduled At',
    'Duration (min)',
    'Status',
    'Confidential',
    'Top Topic',
    'Engagement Score',
    'Sentiment Score',
    'Action Items',
    'Open Actions',
    'Decisions',
    'Executive Summary',
  ];

  const rows = sessions.map((s) => [
    s.session_code,
    s.title,
    s.course_or_track,
    s.mentor_name,
    s.mentee_name,
    s.scheduled_at,
    s.duration_minutes,
    s.status,
    s.is_confidential ? 'YES' : 'NO',
    s.top_topic || '',
    s.engagement_score,
    s.sentiment_score,
    s.action_item_count ?? 0,
    s.open_action_count ?? 0,
    s.decision_count ?? 0,
    s.executive_summary || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  const filename = `mentorsync-sessions-${dateStamp()}.csv`;
  triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
  return { filename, count: sessions.length };
}

export function exportActionItemsCsv(actionItems = []) {
  const headers = [
    'ID',
    'Session Code',
    'Description',
    'Assignee Name',
    'Assignee Role',
    'Priority',
    'Status',
    'Target Due',
    'Created At',
  ];

  const rows = actionItems.map((item) => [
    item.id,
    item.session_code || '',
    item.description,
    item.assignee_name || '',
    item.assignee_role || '',
    item.priority,
    item.status,
    item.due_label || '',
    item.created_at || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  const filename = `mentorsync-action-items-${dateStamp()}.csv`;
  triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
  return { filename, count: actionItems.length };
}

export function exportIntelligenceJson({
  user,
  workspace,
  dashboard,
  sessions = [],
  actionItems = [],
  milestones = [],
}) {
  const payload = {
    schema: 'mentorsync.academic-intelligence.v2',
    exported_at: new Date().toISOString(),
    workspace: workspace || { name: 'Anna Univ — ECE Mentoring', plan: 'Department Pro' },
    exported_by: user
      ? {
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department,
        }
      : null,
    summary_kpis: dashboard?.kpis || {},
    topic_distribution: dashboard?.topic_distribution || [],
    engagement_trend: dashboard?.engagement_trend || [],
    sessions,
    action_items: actionItems,
    milestones,
  };

  const filename = `mentorsync-intelligence-bundle-${dateStamp()}.json`;
  triggerDownload(
    JSON.stringify(payload, null, 2),
    filename,
    'application/json;charset=utf-8;'
  );
  return {
    filename,
    sessionsCount: sessions.length,
    actionsCount: actionItems.length,
    milestonesCount: milestones.length,
  };
}
