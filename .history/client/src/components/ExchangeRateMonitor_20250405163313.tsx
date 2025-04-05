import {
    Notifications,
    Timeline,
    TrendingDown,
    TrendingFlat,
    TrendingUp
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Snackbar,
    Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { socketService } from '../services/socket';
import { transactionApi } from '../services/transactionApi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  statistics: {
    average24h: number;
    min24h: number;
    max24h: number;
    trend24h: 'up' | 'down' | 'stable';
  };
}

interface RateAlert {
  type: 'increase' | 'decrease';
  previousRate: number;
  newRate: number;
  percentage: number;
  timestamp: Date;
}

interface HistoricalRate {
  rate: number;
  timestamp: Date;
}

const ExchangeRateMonitor: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<RateAlert | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalRate[]>([]);

  const { data: currentRate, isLoading, error } = useQuery<ExchangeRate>({
    queryKey: ['exchangeRate'],
    queryFn: () => transactionApi.getCurrentRate(),
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const data = await transactionApi.getHistoricalRates();
        setHistoricalData(data.rates);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
    const intervalId = setInterval(fetchHistoricalData, 300000); // Update every 5 minutes

    // Setup WebSocket listener for rate alerts
    const handleRateAlert = (alert: RateAlert) => {
      setCurrentAlert(alert);
      setShowAlert(true);
      // Update historical data when we receive an alert
      fetchHistoricalData();
    };

    socketService.on('exchangeRateAlert', handleRateAlert);

    return () => {
      clearInterval(intervalId);
      socketService.off('exchangeRateAlert', handleRateAlert);
    };
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const chartData = {
    labels: historicalData.map(rate => 
      new Date(rate.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'PHP to USD Rate',
        data: historicalData.map(rate => rate.rate),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Exchange Rate History'
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => `Rate: ${context.parsed.y.toFixed(4)} USD`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: number) => value.toFixed(4)
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading exchange rate data</Alert>;
  if (!currentRate) return null;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Exchange Rate
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4">
                  1 PHP = {currentRate.rate.toFixed(4)} USD
                </Typography>
                {getTrendIcon(currentRate.statistics.trend24h)}
              </Box>
              <Typography color="textSecondary" variant="body2">
                Last updated: {new Date(currentRate.lastUpdated).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                24h Statistics
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<Timeline />}
                  label={`Avg: ${currentRate.statistics.average24h}`}
                  color="primary"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`High: ${currentRate.statistics.max24h}`}
                  color="success"
                />
                <Chip
                  icon={<TrendingDown />}
                  label={`Low: ${currentRate.statistics.min24h}`}
                  color="error"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={currentAlert?.type === 'increase' ? 'warning' : 'info'}
          icon={<Notifications />}
          onClose={() => setShowAlert(false)}
        >
          {currentAlert && (
            <>
              Rate {currentAlert.type === 'increase' ? 'increased' : 'decreased'} by{' '}
              {currentAlert.percentage.toFixed(2)}%
              (from {currentAlert.previousRate.toFixed(4)} to {currentAlert.newRate.toFixed(4)})
            </>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExchangeRateMonitor; 