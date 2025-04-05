import axios from 'axios';
import { Transaction, TransactionStep } from '../types/transaction';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  pages: number;
  currentPage: number;
}

interface CreateTransactionData {
  peso: number;
}

interface UpdateTransactionStepData {
  step: TransactionStep;
  additionalData?: {
    validationDoc?: string;
    receiptDoc?: string;
    scheduledDate?: string;
    location?: string;
    serialNumbers?: string[];
  };
}

interface ExchangeRateResponse {
  rate: number;
  lastUpdated: string;
  statistics: {
    average24h: number;
    min24h: number;
    max24h: number;
    trend24h: 'up' | 'down' | 'stable';
  };
}

interface HistoricalRatesResponse {
  rates: Array<{
    rate: number;
    timestamp: Date;
  }>;
  total: number;
}

class TransactionApi {
  private static instance: TransactionApi;

  private constructor() {}

  public static getInstance(): TransactionApi {
    if (!TransactionApi.instance) {
      TransactionApi.instance = new TransactionApi();
    }
    return TransactionApi.instance;
  }

  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await axios.post(`${API_URL}/transactions`, data);
    return response.data;
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await axios.get(`${API_URL}/transactions/${transactionId}`);
    return response.data;
  }

  async updateTransactionStep(
    transactionId: string,
    data: UpdateTransactionStepData
  ): Promise<Transaction> {
    const response = await axios.put(
      `${API_URL}/transactions/${transactionId}/step`,
      data
    );
    return response.data;
  }

  async listTransactions(
    page: number = 1,
    limit: number = 10,
    status?: TransactionStep
  ): Promise<TransactionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });

    const response = await axios.get(`${API_URL}/transactions?${params}`);
    return response.data;
  }

  async getCurrentRate(): Promise<ExchangeRateResponse> {
    const response = await axios.get(`${API_URL}/transactions/exchange-rate/current`);
    return response.data;
  }

  async getHistoricalRates(limit: number = 100): Promise<HistoricalRatesResponse> {
    const response = await axios.get(
      `${API_URL}/transactions/exchange-rate/history?limit=${limit}`
    );
    return response.data;
  }
}

export const transactionApi = TransactionApi.getInstance(); 