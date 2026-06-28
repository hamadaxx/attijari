import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ── Profiles ─────────────────────────────────────────────────────────────
export const profileApi = {
  create: (data) => api.post('/profiles', data),
  updateMe: (data) => api.put('/profiles/me', data),
  getMe: () => api.get('/profiles/me'),
  getScoreHistory: () => api.get('/profiles/me/score-history'),

  // CM
  getPending: () => api.get('/profiles/pending'),
  getApproved: () => api.get('/profiles/approved'),
  getInactive: () => api.get('/profiles/inactive'),
  getById: (id) => api.get(`/profiles/${id}`),
  validate: (id, data) => api.patch(`/profiles/${id}/validate`, data),
};

// ── Events ────────────────────────────────────────────────────────────────
export const eventApi = {
  getUpcoming: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  register: (id) => api.post(`/events/${id}/register`),
  cancelRegistration: (id) => api.delete(`/events/${id}/register`),
  getMyRegistrations: () => api.get('/events/my-registrations'),

  // CM / Mentor
  validate: (id) => api.patch(`/events/${id}/validate`),
  processAttendance: (id, userIds) => api.post(`/events/${id}/attendance`, userIds),
};

// ── Publications ──────────────────────────────────────────────────────────
export const publicationApi = {
  getAll: () => api.get('/publications'),
  getById: (id) => api.get(`/publications/${id}`),
  submit: (data) => api.post('/publications', data),
  getMine: () => api.get('/publications/mine'),
  react: (id) => api.post(`/publications/${id}/react`),
  reportPlagiarism: (id) => api.post(`/publications/${id}/report-plagiarism`),

  // CM
  getPending: () => api.get('/publications/pending'),
  approve: (id) => api.patch(`/publications/${id}/approve`),
  archive: (id, reason) => api.patch(`/publications/${id}/archive`, { reason }),
};

// ── Scoring Config (US 2.2a) ──────────────────────────────────────────────
export const scoringConfigApi = {
  getActive: () => api.get('/scoring-config/active'),
  getAll: () => api.get('/scoring-config'),
  getPending: () => api.get('/scoring-config/pending'),
  propose: (data) => api.post('/scoring-config', data),
  submitForApproval: (id) => api.patch(`/scoring-config/${id}/submit`),
  approve: (id, data) => api.patch(`/scoring-config/${id}/approve`, data),
  reject: (id, data) => api.patch(`/scoring-config/${id}/reject`, data),
};

// ── Fund Manager (US 2.1a) ────────────────────────────────────────────────
export const fundApi = {
  getPrequalifiedStartups: (params) => api.get('/fund/startups', { params }),
  getStartupDetail: (profileId) => api.get(`/fund/startups/${profileId}`),
  getStartupScoreHistory: (profileId) => api.get(`/fund/startups/${profileId}/score-history`),
  updateSectorInterests: (sectors) => api.patch('/fund/preferences/sectors', sectors),
};

// ── Notifications (US 2.2b) ───────────────────────────────────────────────
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ── Mentor (US 1.2b) ──────────────────────────────────────────────────────
export const mentorApi = {
  proposeWebinar: (data) => api.post('/mentor/events', data),
  getMyEvents: () => api.get('/mentor/events'),
  rateEvent: (eventId, data) => api.post(`/mentor/events/${eventId}/rate`, data),
  getMentorProfile: (mentorId) => api.get(`/mentor/${mentorId}/profile`),
};

// ── KYB (US-KYC-01 / US-KYC-02) ──────────────────────────────────────────
export const kybApi = {
  submit: (data) => api.post('/kyb', data),
  getMyDossier: () => api.get('/kyb/me'),
  getPending: () => api.get('/kyb/pending'),
  getAll: () => api.get('/kyb'),
  getById: (id) => api.get(`/kyb/${id}`),
  review: (id, data) => api.patch(`/kyb/${id}/review`, data),
  uploadDocument: (formData) => api.post('/kyb/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDocument: (fileId) => api.get(`/kyb/documents/${fileId}`, { responseType: 'blob' }),
};

export default api;
