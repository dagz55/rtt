import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { CreateTransactionData, transactionApi } from '../services/api';

interface TransactionFormProps {
  onSuccess?: (data: any) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateTransactionData>({
    peso: 0,
    dollar: 0,
    exchangeRate: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => transactionApi.create(data),
    onSuccess: (data) => {
      onSuccess?.(data);
      setFormData({ peso: 0, dollar: 0, exchangeRate: 0 });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: numValue };
      
      // Auto-calculate dollar amount when peso and exchange rate are set
      if (name === 'peso' || name === 'exchangeRate') {
        if (newData.exchangeRate > 0) {
          newData.dollar = Number((newData.peso / newData.exchangeRate).toFixed(2));
        }
      }
      
      // Auto-calculate peso amount when dollar and exchange rate are set
      if (name === 'dollar' || name === 'exchangeRate') {
        if (newData.exchangeRate > 0) {
          newData.peso = Number((newData.dollar * newData.exchangeRate).toFixed(2));
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.peso > 0 && formData.dollar > 0 && formData.exchangeRate > 0) {
      createMutation.mutate(formData);
    }
  };

  const handlingFee = formData.peso * 0.15;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Create New Transaction
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Peso Amount"
                name="peso"
                type="number"
                value={formData.peso || ''}
                onChange={handleChange}
                InputProps={{
                  startAdornment: '₱',
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Exchange Rate"
                name="exchangeRate"
                type="number"
                value={formData.exchangeRate || ''}
                onChange={handleChange}
                InputProps={{
                  startAdornment: '₱/$',
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Dollar Amount"
                name="dollar"
                type="number"
                value={formData.dollar || ''}
                onChange={handleChange}
                InputProps={{
                  startAdornment: '$',
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary">
                Handling Fee (15%): ₱{handlingFee.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={createMutation.isPending}
                fullWidth
              >
                {createMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Transaction'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
        {createMutation.isError && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error creating transaction. Please try again.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionForm; 