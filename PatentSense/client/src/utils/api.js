const API_URL = ''; // Handled via Vite proxy in development

// Common headers
const getHeaders = () => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Common response handler
const handleResponse = async (response) => {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.code = data.code;
    error.status = response.status;
    error.minimumSimilarity = data.minimumSimilarity;
    throw error;
  }

  return data;
};

// ==================== AUTH API ====================

export const authAPI = {
  requestPasswordReset: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  confirmPasswordReset: async (token, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(res);
  },

  // Login
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await handleResponse(res);

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  // Register
  register: async (email, password, fullName) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
      }),
    });

    const data = await handleResponse(res);

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  // Get current user
  getMe: async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },

  updateProfile: async (profile) => {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(profile),
    });
    return handleResponse(res);
  },

  updatePreferences: async (preferences) => {
    const res = await fetch(`${API_URL}/api/auth/preferences`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(preferences),
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },

  // Check authentication
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// ==================== ANALYSIS API ====================

export const analysisAPI = {
  // Search similar patents
  searchSimilar: async (query) => {
    const res = await fetch(`${API_URL}/api/analysis/similarity`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query,
      }),
    });

    return handleResponse(res);
  },

  // Submit a new analysis
  submit: async (
    title,
    abstract,
    description,
    technologyDomain,
    keywords,
    claims = '',
    sourceDocument = null,
  ) => {
    const res = await fetch(`${API_URL}/api/analysis/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        abstract,
        claims,
        description,
        technologyDomain,
        keywords,
        sourceFilename: sourceDocument?.filename || null,
        sourceFileType: sourceDocument?.fileType || null,
        sourceText: sourceDocument?.text || '',
      }),
    });

    return handleResponse(res);
  },

  extractDocument: async (file) => {
    const headers = { 'Content-Type': 'application/octet-stream' };
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/analysis/extract`, {
      method: 'POST',
      headers: { ...headers, 'X-Filename': encodeURIComponent(file.name) },
      body: file,
    });
    return handleResponse(res);
  },

  // Get analysis history
  getHistory: async () => {
    const res = await fetch(`${API_URL}/api/analysis/history`, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },

  // Get one analysis record
  getRecord: async (id) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}`, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },

  deleteRecord: async (id) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Get analysis statistics
  getStats: async () => {
    const res = await fetch(`${API_URL}/api/analysis/stats`, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },

  // Get patents with optional search/category filters
  getPatents: async (search = '', category = '') => {
    let url = `${API_URL}/api/analysis/patents`;

    const params = new URLSearchParams();

    if (search) {
      params.append('search', search);
    }

    if (category) {
      params.append('category', category);
    }

    const queryString = params.toString();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await fetch(url, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },
};

// ==================== SAVED PATENTS API ====================

export const savedPatentsAPI = {
  // Get all saved patents
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/saved-patents`, {
      headers: getHeaders(),
    });

    return handleResponse(res);
  },

  save: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/${patentId}`, {
      method: 'POST', headers: getHeaders(),
    });
    return handleResponse(res);
  },

  check: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/check/${patentId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Delete saved patent
  delete: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/${patentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return handleResponse(res);
  },
};

export const adminAPI = {
  getStats: async () => handleResponse(await fetch(`${API_URL}/api/admin/stats`, { headers: getHeaders() })),
  getUsers: async () => handleResponse(await fetch(`${API_URL}/api/admin/users`, { headers: getHeaders() })),
  getLogs: async () => handleResponse(await fetch(`${API_URL}/api/admin/logs`, { headers: getHeaders() })),
  getFeedback: async () => handleResponse(await fetch(`${API_URL}/api/admin/feedback`, { headers: getHeaders() })),
  updateRole: async (userId, role) => handleResponse(await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }),
  })),
  deleteUser: async (userId) => handleResponse(await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'DELETE', headers: getHeaders(),
  })),
};
