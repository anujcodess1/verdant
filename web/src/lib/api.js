export class ApiRequestError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const apiBase = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
const crossSite = /^https?:\/\//i.test(apiBase);

async function request(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${apiBase}/api${path}`, {
    method,
    credentials: crossSite ? 'include' : 'same-origin',
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiRequestError(response.status, payload?.error?.message ?? 'Request failed', payload?.error?.details);
  }
  return payload;
}

function dashboardPath(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const suffix = params.toString();
  return `/dashboard${suffix ? `?${suffix}` : ''}`;
}

export const api = {
  me: () => request('/auth/me'),
  googleLogin: (idToken, timezone) => request('/auth/google', { method: 'POST', body: { idToken, timezone } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (input) => request('/auth/me', { method: 'PATCH', body: input }),
  dashboard: (query) => request(dashboardPath(query)),
  createHabit: (draft) => request('/habits', { method: 'POST', body: draft }),
  updateHabit: (id, patch) => request(`/habits/${id}`, { method: 'PATCH', body: patch }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  reorderHabits: (ids) => request('/habits/reorder', { method: 'POST', body: { ids } }),
  checkIn: (id, input) => request(`/habits/${id}/check-in`, { method: 'POST', body: input }),
  markNotificationsRead: (ids) => request('/notifications/read', { method: 'POST', body: ids ? { ids } : {} }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  runRollover: () => request('/rollover', { method: 'POST' }),
};
