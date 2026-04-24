export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  merchant?: string;
  icon?: string;
}

export interface Budget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  icon: string;
}

export interface Subscription {
  id: string;
  service: string;
  plan: string;
  nextBilling: string;
  amount: number;
  icon: string;
  status: 'active' | 'cancelled' | 'expired';
}

export interface Alert {
  id: string;
  type: 'critical' | 'dual' | 'informative';
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
  memberSince: string;
  phone: string;
  location: string;
}
