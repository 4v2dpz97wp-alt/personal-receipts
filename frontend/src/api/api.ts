import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH =====
export const checkAuthStatus = async () => {
  const { data } = await api.get('/auth/status');
  return data;
};

export const setupPassword = async (password: string) => {
  const { data } = await api.post('/auth/setup', { password });
  return data;
};

export const login = async (password: string) => {
  const { data } = await api.post('/auth/login', { password });
  return data;
};

export const changePassword = async (cur: string, np: string) => {
  const { data } = await api.post('/auth/change-password', {
    currentPassword: cur,
    newPassword: np,
  });
  return data;
};

export const verifyToken = async () => {
  const { data } = await api.get('/auth/verify');
  return data;
};

export const emergencyResetPassword = async (newPassword: string) => {
  const { data } = await api.post('/auth/emergency-reset', { newPassword });
  if (data.token) localStorage.setItem('pr_token', data.token);
  return data;
};

// ===== CONTACTS =====
export const getContacts = async (search?: string, favorites?: boolean) => {
  const params: any = {};
  if (search) params.search = search;
  if (favorites) params.favorites = 'true';
  const { data } = await api.get('/contacts', { params });
  return data;
};

export const getContact = async (id: number) => {
  const { data } = await api.get(`/contacts/${id}`);
  return data;
};

export const getContactLookups = async () => {
  const { data } = await api.get('/contacts/lookup/all');
  return data;
};

export const createContact = async (d: any) => {
  const { data } = await api.post('/contacts', d);
  return data;
};

export const updateContact = async (id: number, d: any) => {
  const { data } = await api.put(`/contacts/${id}`, d);
  return data;
};

export const deleteContact = async (id: number) => {
  await api.delete(`/contacts/${id}`);
};

export const archivePrimaryUsername = async (id: number, new_username: string) => {
  const { data } = await api.post(`/contacts/${id}/archive-username`, { new_username });
  return data;
};

export const uploadProfilePicture = async (id: number, file: File) => {
  const fd = new FormData();
  fd.append('profile_picture', file);

  const { data } = await api.post(`/contacts/${id}/profile-picture`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.profile_picture;
};

export const uploadAdditionalPhotos = async (id: number, files: File[]) => {
  const fd = new FormData();
  files.forEach(f => fd.append('photos', f));

  const { data } = await api.post(`/contacts/${id}/photos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.photos;
};

export const deletePhoto = async (cid: number, pid: number) => {
  await api.delete(`/contacts/${cid}/photos/${pid}`);
};

export const getAllUsernameHistories = async (): Promise<Record<number, string[]>> => {
  const { data } = await api.get('/contacts/username-histories/all');
  return data;
};

// ===== CONVERSATIONS =====
export const getConversations = async (search?: string) => {
  const params: any = {};
  if (search) params.search = search;
  const { data } = await api.get('/conversations', { params });
  return data;
};

export const getRecentConversations = async () => {
  const { data } = await api.get('/conversations/recent');
  return data;
};

export const getConversation = async (id: number) => {
  const { data } = await api.get(`/conversations/${id}`);
  return data;
};

export const createConversation = async (d: any) => {
  const { data } = await api.post('/conversations', d);
  return data;
};

export const updateConversation = async (id: number, d: any) => {
  const { data } = await api.put(`/conversations/${id}`, d);
  return data;
};

export const deleteConversation = async (id: number) => {
  await api.delete(`/conversations/${id}`);
};

// ===== CONVERSATION DOCUMENTS =====
export const uploadConversationDocuments = async (convId: number, files: File[]) => {
  const fd = new FormData();
  files.forEach(f => fd.append('documents', f));

  const { data } = await api.post(`/conversations/${convId}/documents`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.documents;
};

export const deleteConversationDocument = async (convId: number, docId: number) => {
  await api.delete(`/conversations/${convId}/documents/${docId}`);
};

// ===== TAGS =====
export const getTags = async () => {
  const { data } = await api.get('/tags');
  return data;
};

export const createTag = async (name: string, color: string) => {
  const { data } = await api.post('/tags', { name, color });
  return data;
};

export const updateTag = async (id: number, name: string, color: string) => {
  const { data } = await api.put(`/tags/${id}`, { name, color });
  return data;
};

export const deleteTag = async (id: number) => {
  await api.delete(`/tags/${id}`);
};

export const getContactTags = async (cid: number) => {
  const { data } = await api.get(`/tags/contact/${cid}`);
  return data;
};

export const setContactTags = async (cid: number, tag_ids: number[]) => {
  const { data } = await api.post(`/tags/contact/${cid}`, { tag_ids });
  return data;
};

// ===== CONVERSATION TAGS =====
export const getConversationTags = async (convId: number) => {
  const { data } = await api.get(`/conversation-tags/${convId}`);
  return data;
};

export const setConversationTags = async (convId: number, tag_ids: number[]) => {
  const { data } = await api.post(`/conversation-tags/${convId}`, { tag_ids });
  return data;
};

// ===== BIRTHDAYS =====
export const getUpcomingBirthdays = async () => {
  const { data } = await api.get('/birthdays/upcoming');
  return data;
};

// ===== BACKUP & RESTORE =====
export const downloadBackup = async () => {
  const { data } = await api.get('/backup');
  return data;
};

export const restoreBackup = async (backupData: any) => {
  const { data } = await api.post('/restore', backupData);
  return data;
};

// ===== REMINDERS =====
export const getReminders = async () => {
  const { data } = await api.get('/reminders');
  return data;
};

export const getDueReminders = async () => {
  const { data } = await api.get('/reminders/due');
  return data;
};

export const createReminder = async (payload: any) => {
  const { data } = await api.post('/reminders', payload);
  return data;
};

export const updateReminder = async (id: number, payload: any) => {
  const { data } = await api.put(`/reminders/${id}`, payload);
  return data;
};

export const setReminderComplete = async (id: number, complete: boolean) => {
  const { data } = await api.post(`/reminders/${id}/complete`, { complete });
  return data;
};

export const deleteReminder = async (id: number) => {
  const { data } = await api.delete(`/reminders/${id}`);
  return data;
};
// ===== ACCOUNT EMAILS =====
export const getActiveEmail = async () => {
  const { data } = await api.get('/account-emails/active');
  return data;
};

export const getAllAccountEmails = async () => {
  const { data } = await api.get('/account-emails');
  return data;
};

export const resetAccountEmail = async (email_address: string) => {
  const { data } = await api.post('/account-emails/reset', { email_address });
  return data;
};

export const checkEmailReminderDue = async () => {
  const { data } = await api.get('/account-emails/reminder-due');
  return data;
};
// ===== COMMON RESPONSES =====
export const getCommonResponses = async (params?: {
  search?: string;
  category?: string;
  favorites?: boolean;
}) => {
  const query: any = {};
  if (params?.search) query.search = params.search;
  if (params?.category) query.category = params.category;
  if (params?.favorites) query.favorites = 'true';
  const { data } = await api.get('/common-responses', { params: query });
  return data;
};

export const getCommonResponseCategories = async () => {
  const { data } = await api.get('/common-responses/categories');
  return data;
};

export const getFavoriteResponses = async () => {
  const { data } = await api.get('/common-responses/favorites');
  return data;
};

export const getCommonResponse = async (id: number) => {
  const { data } = await api.get(`/common-responses/${id}`);
  return data;
};

export const createCommonResponse = async (payload: {
  title: string;
  category: string;
  body: string;
  is_favorite: boolean;
}) => {
  const { data } = await api.post('/common-responses', payload);
  return data;
};

export const updateCommonResponse = async (
  id: number,
  payload: {
    title: string;
    category: string;
    body: string;
    is_favorite: boolean;
  }
) => {
  const { data } = await api.put(`/common-responses/${id}`, payload);
  return data;
};

export const toggleFavoriteResponse = async (id: number) => {
  const { data } = await api.post(`/common-responses/${id}/toggle-favorite`);
  return data;
};

export const incrementResponseUsage = async (id: number) => {
  const { data } = await api.post(`/common-responses/${id}/increment-usage`);
  return data;
};

export const deleteCommonResponse = async (id: number) => {
  const { data } = await api.delete(`/common-responses/${id}`);
  return data;
};