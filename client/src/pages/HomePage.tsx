import { Box, Container, Grid } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

const HomePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const handleTransactionCreated = () => {
    // Invalidate and refetch transactions
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <TransactionForm onSuccess={handleTransactionCreated} />
          </Grid>
          <Grid item xs={12} md={8}>
            <TransactionList
              page={page}
              onPageChange={setPage}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage; 