import { ArrowBack } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressTimeline from '../components/ProgressTimeline';
import TransactionDashboard from '../components/TransactionDashboard';
import { transactionApi } from '../services/api';
import { socketService } from '../services/socket';

const TransactionDetailPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading, isError } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionApi.get(transactionId!),
    enabled: !!transactionId,
  });

  useEffect(() => {
    if (transactionId) {
      // Connect to socket and join transaction room
      const socket = socketService.connect();
      socketService.joinTransaction(transactionId);

      // Listen for transaction updates
      const handleTransactionUpdate = (data: any) => {
        if (data.transactionId === transactionId) {
          // Invalidate and refetch transaction data
          queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
        }
      };

      socketService.addListener('transactionUpdate', handleTransactionUpdate);

      return () => {
        // Cleanup: leave transaction room and remove listener
        socketService.leaveTransaction(transactionId);
        socketService.removeListener('transactionUpdate', handleTransactionUpdate);
      };
    }
  }, [transactionId, queryClient]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !transaction) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          Error loading transaction. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            variant="outlined"
          >
            Back to Transactions
          </Button>
        </Box>

        <TransactionDashboard transaction={transaction} />
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Transaction Progress
          </Typography>
          <ProgressTimeline transaction={transaction} />
        </Box>
      </Box>
    </Container>
  );
};

export default TransactionDetailPage; 