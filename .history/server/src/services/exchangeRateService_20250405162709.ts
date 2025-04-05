import axios from 'axios';
import { config } from '../config/config';

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private readonly baseUrl = 'https://v6.exchangerate-api.com/v6';
  private readonly apiKey: string;
  private cachedRate: number | null = null;
  private lastFetchTime: number = 0;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {
    this.apiKey = config.exchangeRateApiKey;
  }

  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  public async getPhpToUsdRate(): Promise<number> {
    try {
      // Check if we have a cached rate that's still valid
      if (this.cachedRate && Date.now() - this.lastFetchTime < this.cacheDuration) {
        return this.cachedRate;
      }

      const response = await axios.get<ExchangeRateResponse>(
        `${this.baseUrl}/${this.apiKey}/pair/PHP/USD`
      );

      this.cachedRate = response.data.conversion_rate;
      this.lastFetchTime = Date.now();

      return this.cachedRate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return the last known rate if available, otherwise throw error
      if (this.cachedRate) {
        return this.cachedRate;
      }
      throw new Error('Failed to fetch exchange rate');
    }
  }

  public async convertPhpToUsd(phpAmount: number): Promise<{
    usdAmount: number;
    rate: number;
  }> {
    const rate = await this.getPhpToUsdRate();
    const usdAmount = phpAmount * rate;
    return {
      usdAmount: Number(usdAmount.toFixed(2)),
      rate: Number(rate.toFixed(4))
    };
  }
}

export const exchangeRateService = ExchangeRateService.getInstance(); 