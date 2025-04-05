import axios from 'axios';
import { TransactionStep } from '../types/transaction';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateTransactionData {
  peso: number;
  dollar: number;
  exchangeRate: number;
}

export interface UpdateTransactionStepData {
  step: TransactionStep;
  additionalData?: {
    validationDoc?: string;
    scheduledDate?: string;
    location?: string;
    serialNumbers?: string[];
    receiptDoc?: string;
  };
}

export const transactionApi = {
  create: async (data: CreateTransactionData) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  get: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  list: async (page = 1, limit = 10, status?: string) => {
    const response = await api.get('/transactions', {
      params: { page, limit, status },
    });
    return response.data;
  },

  updateStep: async (transactionId: string, data: UpdateTransactionStepData) => {
    const response = await api.put(`/transactions/${transactionId}/step`, data);
    return response.data;
  },
};

export default api; 