import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('messenger_token');
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
  deleteMessageForMe: (messageId) => api.delete(`/chat/messages/${messageId}`)
};

export const privacyApi = {
  blockUser: (targetUserId) => api.post('/privacy/block', { targetUserId }),
  unblockUser: (targetUserId) => api.post('/privacy/unblock', { targetUserId }),
  getBlockedUsers: () => api.get('/privacy/blocked'),
  reportUser: (data) => api.post('/privacy/report', data)
};

export default api;
