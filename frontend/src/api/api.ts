import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== AUTH =====
export const checkAuthStatus = async () => { const { data } = await api.get('/auth/status'); return data; };
export const setupPassword = async (password: string) => { const { data } = await api.post('/auth/setup', { password }); return data; };
export const login = async (password: string) => { const { data } = await api.post('/auth/login', { password }); return data; };
export const changePassword = async (cur: string, np: string) => { const { data } = await api.post('/auth/change-password', { currentPassword: cur, newPassword: np }); return data; };
export const verifyToken = async () => { const { data } = await api.get('/auth/verify'); return data; };

// ===== CONTACTS =====
export const getContacts = async (search?: string, favorites?: boolean) => {
  const params: any = {};
  if (search) params.search = search;
  if (favorites) params.favorites = 'true';
  const { data } = await api.get('/contacts', { params });
  return data;
};
export const getContact = async (id: number) => { const { data } = await api.get(`/contacts/${id}`); return data; };
export const getContactLookups = async () => { const { data } = await api.get('/contacts/lookup/all'); return data; };
export const createContact = async (d: any) => { const { data } = await api.post('/contacts', d); return data; };
export const updateContact = async (id: number, d: any) => { const { data } = await api.put(`/contacts/${id}`, d); return data; };
export const deleteContact = async (id: number) => { await api.delete(`/contacts/${id}`); };
export const uploadProfilePicture = async (id: number, file: File) => {
  const fd = new FormData(); fd.append('profile_picture', file);
  const { data } = await api.post(`/contacts/${id}/profile-picture`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.profile_picture;
};
export const uploadAdditionalPhotos = async (id: number, files: File[]) => {
  const fd = new FormData(); files.forEach(f => fd.append('photos', f));
  const { data } = await api.post(`/contacts/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.photos;
};
export const deletePhoto = async (cid: number, pid: number) => { await api.delete(`/contacts/${cid}/photos/${pid}`); };

// ===== CONVERSATIONS =====
export const getConversations = async (search?: string) => {
  const params: any = {};
  if (search) params.search = search;
  const { data } = await api.get('/conversations', { params });
  return data;
};
export const getRecentConversations = async () => { const { data } = await api.get('/conversations/recent'); return data; };
export const getConversation = async (id: number) => { const { data } = await api.get(`/conversations/${id}`); return data; };
export const createConversation = async (d: any) => { const { data } = await api.post('/conversations', d); return data; };
export const updateConversation = async (id: number, d: any) => { const { data } = await api.put(`/conversations/${id}`, d); return data; };
export const deleteConversation = async (id: number) => { await api.delete(`/conversations/${id}`); };

// ===== CONVERSATION DOCUMENTS =====
export const uploadConversationDocuments = async (convId: number, files: File[]) => {
  const fd = new FormData();
  files.forEach(f => fd.append('documents', f));
  const { data } = await api.post(`/conversations/${convId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.documents;
};
export const deleteConversationDocument = async (convId: number, docId: number) => {
  await api.delete(`/conversations/${convId}/documents/${docId}`);
};

// ===== TAGS =====
export const getTags = async () => { const { data } = await api.get('/tags'); return data; };
export const createTag = async (name: string, color: string) => { const { data } = await api.post('/tags', { name, color }); return data; };
export const updateTag = async (id: number, name: string, color: string) => { const { data } = await api.put(`/tags/${id}`, { name, color }); return data; };
export const deleteTag = async (id: number) => { await api.delete(`/tags/${id}`); };
export const getContactTags = async (cid: number) => { const { data } = await api.get(`/tags/contact/${cid}`); return data; };
export const setContactTags = async (cid: number, tag_ids: number[]) => { const { data } = await api.post(`/tags/contact/${cid}`, { tag_ids }); return data; };

// ===== BIRTHDAYS =====
export const getUpcomingBirthdays = async () => { const { data } = await api.get('/birthdays/upcoming'); return data; };
