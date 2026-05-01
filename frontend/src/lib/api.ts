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

// Error interceptor to provide better error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401 && !error.config.url?.includes('/token')) {
        localStorage.removeItem('token');
        // We can't use useNavigate here as it's not a component
        // but we can use window.location
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || error.response.statusText;
      console.error(`API Error [${error.response.status}]:`, message);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getUserProfile = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

export const updateUserProfile = async (data: { full_name?: string; email?: string; phone_number?: string; avatar_url?: string }) => {
  const response = await api.put('/users/me/', data);
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/transactions/');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

export const getBudgets = async () => {
  const response = await api.get('/budgets/');
  return response.data;
};

export const createBudget = async (data: { name: string; amount: number; category_ids: number[] }) => {
  const response = await api.post('/budgets/', data);
  return response.data;
};

export const updateBudget = async (
  budgetId: number,
  data: { name?: string; amount?: number; category_ids?: number[] }
) => {
  const response = await api.put(`/budgets/${budgetId}`, data);
  return response.data;
};

export const deleteBudget = async (budgetId: number) => {
  const response = await api.delete(`/budgets/${budgetId}`);
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

export const updateTransaction = async (id: number, data: { category_id?: number, amount?: number, transaction_date?: string, description?: string }) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: number) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

// --- Groups ---
export const createGroup = async (data: { name: string }) => {
  const response = await api.post('/groups/', data);
  return response.data;
};

export const joinGroup = async (inviteCode: string) => {
  const response = await api.post(`/groups/join?invite_code=${inviteCode}`);
  return response.data;
};

export const getGroups = async () => {
  const response = await api.get('/groups/');
  return response.data;
};

export const getGroupDetails = async (groupId: number) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
};

export const addGroupExpense = async (groupId: number, data: { amount: number; description: string; is_settlement?: boolean }) => {
  const response = await api.post(`/groups/${groupId}/expenses`, data);
  return response.data;
};

export const getGroupExpenses = async (groupId: number) => {
  const response = await api.get(`/groups/${groupId}/expenses`);
  return response.data;
};

export const getGroupBalances = async (groupId: number) => {
  const response = await api.get(`/groups/${groupId}/balances`);
  return response.data;
};

// --- Subscriptions ---
export const getSubscriptions = async () => {
  const response = await api.get('/subscriptions/');
  return response.data;
};

export const createSubscription = async (data: { name: string; amount: number; billing_cycle: string; next_billing_date: string }) => {
  const response = await api.post('/subscriptions/', data);
  return response.data;
};

export const deleteSubscription = async (subId: number) => {
  const response = await api.delete(`/subscriptions/${subId}`);
  return response.data;
};

export const paySubscription = async (subId: number) => {
  const response = await api.post(`/subscriptions/${subId}/pay`);
  return response.data;
};

export default api;
