import axios from 'axios';

// Dynamically resolve backend API base URL from Vite environment variable (defaults to localhost:5000 in dev)
const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
export const BACKEND_SERVER_URL = rawBaseUrl.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor ensuring Authorization header is attached from sessionStorage or localStorage
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('messenger_token') || localStorage.getItem('messenger_token') || localStorage.getItem('messenger_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const userApi = {
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query || '')}`),
  getAllUsers: () => api.get('/users')
};

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (recipientId) => api.post('/chat/conversations', { recipientId }),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (data) => api.post('/chat/messages', data),
  uploadFile: (formData, onProgress) => api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  }),
  getSignedMediaUrl: (params) => api.get('/chat/media/signed-url', { params }),
  deleteMessageForMe: (messageId) => api.delete(`/chat/messages/${messageId}`),
  deleteMessageForEveryone: (messageId) => api.delete(`/chat/messages/${messageId}/everyone`),
  clearChat: (conversationId) => api.post(`/chat/conversations/${conversationId}/clear`)
};

export const privacyApi = {
  blockUser: (targetUserId) => api.post('/privacy/block', { targetUserId }),
  unblockUser: (targetUserId) => api.post('/privacy/unblock', { targetUserId }),
  getBlockedUsers: () => api.get('/privacy/blocked'),
  reportUser: (data) => api.post('/privacy/report', data)
};

export default api;
