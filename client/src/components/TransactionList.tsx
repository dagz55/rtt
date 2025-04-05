import { Visibility } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    IconButton,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '../services/api';
import { STEP_LABELS, TransactionStep } from '../types/transaction';

interface TransactionListProps {
  page: number;
  onPageChange: (page: number) => void;
}

const formatCurrency = (amount: number, currency: 'PHP' | 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStepColor = (step: TransactionStep): 'default' | 'primary' | 'success' => {
  switch (step) {
    case TransactionStep.COMPLETED:
      return 'success';
    case TransactionStep.INITIATED:
      return 'default';
    default:
      return 'primary';
  }
};

const TransactionList: React.FC<TransactionListProps> = ({ page, onPageChange }) => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => transactionApi.list(page),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          Error loading transactions. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Transactions
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Peso Amount</TableCell>
                <TableCell>Dollar Amount</TableCell>
                <TableCell>Handling Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.transactions.map((transaction) => (
                <TableRow key={transaction.transactionId}>
                  <TableCell>{transaction.transactionId}</TableCell>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.amount.peso, 'PHP')}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.amount.dollar, 'USD')}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.handlingFee, 'PHP')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STEP_LABELS[transaction.currentStep]}
                      color={getStepColor(transaction.currentStep)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => navigate(`/transactions/${transaction.transactionId}`)}
                      color="primary"
                      size="small"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={data.pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionList; 