const API_URL = ''; // Handled via Vite proxy in development

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (email, password, fullName) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateProfile: async (fullName, organization, researchInterests) => {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ fullName, organization, researchInterests })
    });
    const data = await handleResponse(res);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  updatePreferences: async (theme, notifications, language) => {
    const res = await fetch(`${API_URL}/api/auth/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ theme, notifications, language })
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// ─── Analysis API ─────────────────────────────────────────────────────────────
export const analysisAPI = {
  submit: async (title, abstract, description, technologyDomain, keywords) => {
    const res = await fetch(`${API_URL}/api/analysis/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, abstract, description, technologyDomain, keywords })
    });
    return handleResponse(res);
  },

  getHistory: async () => {
    const res = await fetch(`${API_URL}/api/analysis/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getRecord: async (id) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  deleteRecord: async (id) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  toggleFavorite: async (id, isFavorite) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}/favorite`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isFavorite })
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${API_URL}/api/analysis/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getPatents: async (search = '', category = '') => {
    let url = `${API_URL}/api/analysis/patents`;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

// ─── Saved Patents API ────────────────────────────────────────────────────────
export const savedPatentsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/saved-patents`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  save: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/${patentId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  remove: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/${patentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  checkSaved: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/check/${patentId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateUserRole: async (userId, role) => {
    const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLogs: async () => {
    const res = await fetch(`${API_URL}/api/admin/logs`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getFeedback: async () => {
    const res = await fetch(`${API_URL}/api/admin/feedback`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitFeedback: async (message) => {
    const res = await fetch(`${API_URL}/api/admin/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    return handleResponse(res);
  }
};
