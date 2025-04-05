import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { transactionApi } from '../services/transactionApi';

interface TransactionFormProps {
  onSuccess?: () => void;
}

interface FormData {
  peso: number;
  dollar: number;
  exchangeRate: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    peso: 0,
    dollar: 0,
    exchangeRate: 0
  });

  // Fetch current exchange rate
  const { data: exchangeRateData, isLoading: isLoadingRate } = useQuery({
    queryKey: ['exchangeRate'],
    queryFn: () => transactionApi.getCurrentRate(),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Update dollar amount when peso amount or exchange rate changes
  useEffect(() => {
    if (exchangeRateData && formData.peso) {
      const dollarAmount = formData.peso * exchangeRateData.rate;
      setFormData(prev => ({
        ...prev,
        dollar: Number(dollarAmount.toFixed(2)),
        exchangeRate: exchangeRateData.rate
      }));
    }
  }, [formData.peso, exchangeRateData]);

  const mutation = useMutation({
    mutationFn: (data: { peso: number }) => transactionApi.createTransaction(data),
    onSuccess: () => {
      setFormData({ peso: 0, dollar: 0, exchangeRate: 0 });
      onSuccess?.();
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    
    if (name === 'peso' && !isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        peso: numValue
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.peso > 0) {
      mutation.mutate({ peso: formData.peso });
    }
  };

  const handlingFee = (formData.peso * 0.5) / 100; // 0.5% handling fee

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Create New Transaction
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Amount (PHP)"
                name="peso"
                type="number"
                value={formData.peso || ''}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 0, step: 100 }
                }}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Amount (USD)"
                type="number"
                value={formData.dollar || ''}
                disabled
                InputProps={{
                  startAdornment: isLoadingRate && <CircularProgress size={20} />,
                }}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Exchange Rate"
                type="number"
                value={formData.exchangeRate || ''}
                disabled
                InputProps={{
                  startAdornment: isLoadingRate && <CircularProgress size={20} />,
                }}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Handling Fee (PHP)"
                type="number"
                value={handlingFee.toFixed(2)}
                disabled
              />
            </Grid>
            <Grid xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                disabled={mutation.isPending || formData.peso <= 0}
              >
                {mutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Create Transaction'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
        {mutation.isError && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error creating transaction: {mutation.error instanceof Error ? mutation.error.message : 'Unknown error'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionForm; 