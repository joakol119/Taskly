const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getBoards: () => request('/boards'),
  createBoard: (data) => request('/boards', { method: 'POST', body: JSON.stringify(data) }),
  getBoard: (id) => request(`/boards/${id}`),
  renameBoard: (id, name) => request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  updateBoardColor: (id, color) => request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ color }) }),
  reorderBoards: (orderedIds) => request('/boards/reorder', { method: 'PATCH', body: JSON.stringify({ orderedIds }) }),
  duplicateBoard: (id) => request(`/boards/${id}/duplicate`, { method: 'POST' }),
  deleteBoard: (id) => request(`/boards/${id}`, { method: 'DELETE' }),
  inviteMember: (boardId, email) => request(`/boards/${boardId}/members`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeMember: (boardId, userId) => request(`/boards/${boardId}/members/${userId}`, { method: 'DELETE' }),
  createColumn: (data) => request('/columns', { method: 'POST', body: JSON.stringify(data) }),
  renameColumn: (id, name) => request(`/columns/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteColumn: (id) => request(`/columns/${id}`, { method: 'DELETE' }),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveTask: (id, data) => request(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  breakdownTask: (id) => request(`/tasks/${id}/breakdown`, { method: 'POST' }),
  getGithubIssues: (owner, repo) =>
    request(`/github/issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`),
  importGithubIssues: (columnId, issues) =>
    request('/github/import', { method: 'POST', body: JSON.stringify({ columnId, issues }) }),
};
