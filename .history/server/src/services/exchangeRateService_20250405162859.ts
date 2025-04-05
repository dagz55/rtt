import axios from 'axios';
import { config } from '../config/config';
import { EventEmitter } from 'events';

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

interface HistoricalRate {
  rate: number;
  timestamp: Date;
}

interface RateAlert {
  type: 'increase' | 'decrease';
  previousRate: number;
  newRate: number;
  percentage: number;
  timestamp: Date;
}

class ExchangeRateService extends EventEmitter {
  private static instance: ExchangeRateService;
  private readonly baseUrl = 'https://v6.exchangerate-api.com/v6';
  private readonly fallbackBaseUrl = 'https://api.exchangerate.host';
  private readonly apiKey: string;
  private cachedRate: number | null = null;
  private lastFetchTime: number = 0;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes
  private readonly alertThreshold = 0.5; // 0.5% change
  private historicalRates: HistoricalRate[] = [];
  private readonly maxHistoryLength = 1000; // Store last 1000 rates
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.apiKey = config.exchangeRateApiKey;
    this.startRateMonitoring();
  }

  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  private startRateMonitoring(): void {
    // Monitor rates every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndUpdateRate();
      } catch (error) {
        console.error('Rate monitoring error:', error);
      }
    }, this.cacheDuration);
  }

  private async checkAndUpdateRate(): Promise<void> {
    const newRate = await this.fetchCurrentRate();
    if (this.cachedRate !== null) {
      const percentageChange = Math.abs((newRate - this.cachedRate) / this.cachedRate * 100);
      
      if (percentageChange >= this.alertThreshold) {
        const alert: RateAlert = {
          type: newRate > this.cachedRate ? 'increase' : 'decrease',
          previousRate: this.cachedRate,
          newRate: newRate,
          percentage: percentageChange,
          timestamp: new Date()
        };
        this.emit('rateAlert', alert);
      }
    }

    this.updateHistoricalRates(newRate);
    this.cachedRate = newRate;
    this.lastFetchTime = Date.now();
  }

  private updateHistoricalRates(rate: number): void {
    this.historicalRates.push({
      rate,
      timestamp: new Date()
    });

    // Keep only the last maxHistoryLength rates
    if (this.historicalRates.length > this.maxHistoryLength) {
      this.historicalRates = this.historicalRates.slice(-this.maxHistoryLength);
    }
  }

  private async fetchCurrentRate(): Promise<number> {
    try {
      // Try primary API
      const response = await axios.get<ExchangeRateResponse>(
        `${this.baseUrl}/${this.apiKey}/pair/PHP/USD`
      );
      return response.data.conversion_rate;
    } catch (error) {
      console.error('Primary API error, trying fallback:', error);
      try {
        // Try fallback API
        const response = await axios.get(
          `${this.fallbackBaseUrl}/convert?from=PHP&to=USD&amount=1`
        );
        return response.data.result;
      } catch (fallbackError) {
        console.error('Fallback API error:', fallbackError);
        throw new Error('All exchange rate APIs failed');
      }
    }
  }

  public async getPhpToUsdRate(): Promise<number> {
    try {
      // Check if we have a cached rate that's still valid
      if (this.cachedRate && Date.now() - this.lastFetchTime < this.cacheDuration) {
        return this.cachedRate;
      }

      const rate = await this.fetchCurrentRate();
      this.updateHistoricalRates(rate);
      this.cachedRate = rate;
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

  public getHistoricalRates(limit: number = 100): HistoricalRate[] {
    return this.historicalRates.slice(-limit);
  }

  public getStatistics(): {
    average24h: number;
    min24h: number;
    max24h: number;
    trend24h: 'up' | 'down' | 'stable';
  } {
    const last24h = this.historicalRates.filter(
      rate => rate.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (last24h.length === 0) {
      return {
        average24h: this.cachedRate || 0,
        min24h: this.cachedRate || 0,
        max24h: this.cachedRate || 0,
        trend24h: 'stable'
      };
    }

    const rates = last24h.map(r => r.rate);
    const average = rates.reduce((a, b) => a + b, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    
    // Calculate trend based on first and last rate
    const trend = last24h[last24h.length - 1].rate > last24h[0].rate ? 'up' : 
                 last24h[last24h.length - 1].rate < last24h[0].rate ? 'down' : 'stable';

    return {
      average24h: Number(average.toFixed(4)),
      min24h: Number(min.toFixed(4)),
      max24h: Number(max.toFixed(4)),
      trend24h: trend
    };
  }

  public cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const exchangeRateService = ExchangeRateService.getInstance(); 