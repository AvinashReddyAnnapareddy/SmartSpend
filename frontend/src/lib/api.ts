import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getTransactions = async () => {
  const response = await api.get('/transactions/');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

export const getMonthlyOverview = async () => {
  const response = await api.get('/analytics/monthly-overview');
  return response.data;
};

export const getSpendingByCategory = async () => {
  const response = await api.get('/analytics/spending-by-category');
  return response.data;
};

export const scanReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/scan-receipt/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get('/alerts/');
  return response.data;
};

export const createCategory = async (data: { name: string, transaction_type: 'INCOME' | 'EXPENSE', monthly_budget_limit?: number }) => {
  const response = await api.post('/categories/', data);
  return response.data;
};

export const createTransaction = async (data: { category_id: number, amount: number, transaction_date: string, description?: string }) => {
  const response = await api.post('/transactions/', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

export default api;
