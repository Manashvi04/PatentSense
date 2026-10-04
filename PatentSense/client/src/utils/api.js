const API_URL = ''; // Handed via Vite proxy in development

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
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
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: getHeaders() });
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
  isAuthenticated: () => !!localStorage.getItem('token')
};

export const analysisAPI = {
  searchSimilar: async (query) => {
    const res = await fetch(`${API_URL}/api/analysis/similarity`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query })
    });
    return handleResponse(res);
  },
  submit: async (title, abstract, description, technologyDomain, keywords) => {
    const res = await fetch(`${API_URL}/api/analysis/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, abstract, description, technologyDomain, keywords })
    });
    return handleResponse(res);
  },
  getHistory: async () => {
    const res = await fetch(`${API_URL}/api/analysis/history`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getRecord: async (id) => {
    const res = await fetch(`${API_URL}/api/analysis/history/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getStats: async () => {
    const res = await fetch(`${API_URL}/api/analysis/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getPatents: async (search = '', category = '') => {
    let url = `${API_URL}/api/analysis/patents`;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  }
};

export const savedPatentsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/saved-patents`, { headers: getHeaders() });
    return handleResponse(res);
  },
  delete: async (patentId) => {
    const res = await fetch(`${API_URL}/api/saved-patents/${patentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
