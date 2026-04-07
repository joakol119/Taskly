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
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Boards
  getBoards: () => request('/boards'),
  createBoard: (data) => request('/boards', { method: 'POST', body: JSON.stringify(data) }),
  getBoard: (id) => request(`/boards/${id}`),
  deleteBoard: (id) => request(`/boards/${id}`, { method: 'DELETE' }),

  // Columns
  createColumn: (data) => request('/columns', { method: 'POST', body: JSON.stringify(data) }),
  deleteColumn: (id) => request(`/columns/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveTask: (id, data) => request(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
