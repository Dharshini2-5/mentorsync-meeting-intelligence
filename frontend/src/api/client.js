const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8003/api';
const TOKEN_KEY = 'mentorsync_jwt_token';
const USER_KEY = 'mentorsync_user_profile';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.error ||
      data?.detail ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Public
  health: () => request('/health/'),
  publicStats: () => request('/public/stats/'),

  // Auth
  login: (email, password) =>
    request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request('/auth/me/'),

  // Dashboard
  dashboard: () => request('/dashboard/'),

  // Sessions & NLP
  listSessions: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/sessions/${qs ? `?${qs}` : ''}`);
  },
  getSession: (id) => request(`/sessions/${id}/`),
  createSession: (payload) =>
    request('/sessions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSession: (id, payload) =>
    request(`/sessions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteSession: (id) =>
    request(`/sessions/${id}/`, { method: 'DELETE' }),
  analyzeSession: (id, raw_transcript) =>
    request(`/sessions/${id}/analyze/`, {
      method: 'POST',
      body: JSON.stringify(raw_transcript ? { raw_transcript } : {}),
    }),
  quickAnalyze: (payload) => {
    if (payload instanceof FormData) {
      return request('/sessions/quick-analyze/', {
        method: 'POST',
        body: payload,
      });
    }
    return request('/sessions/quick-analyze/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getDocument: (id) => request(`/sessions/${id}/document/`),

  // Action Items
  listActionItems: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/action-items/${qs ? `?${qs}` : ''}`);
  },
  createActionItem: (payload) =>
    request('/action-items/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateActionItem: (id, payload) =>
    request(`/action-items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteActionItem: (id) =>
    request(`/action-items/${id}/`, { method: 'DELETE' }),

  // Milestones
  listMilestones: () => request('/milestones/'),
  createMilestone: (payload) =>
    request('/milestones/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMilestone: (id, payload) =>
    request(`/milestones/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteMilestone: (id) =>
    request(`/milestones/${id}/`, { method: 'DELETE' }),
};
