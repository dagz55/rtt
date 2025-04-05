import {
    AttachMoney,
    LocationOn,
    Receipt,
    Schedule,
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Typography
} from '@mui/material';
import React from 'react';
import { STEP_LABELS, Transaction } from '../types/transaction';

interface TransactionDashboardProps {
  transaction: Transaction;
}

const formatCurrency = (amount: number, currency: 'PHP' | 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const TransactionDashboard: React.FC<TransactionDashboardProps> = ({
  transaction,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {/* Transaction Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Transaction Overview
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                ID: {transaction.transactionId}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Peso Amount</Typography>
                    <Typography variant="h6">
                      {formatCurrency(transaction.amount.peso, 'PHP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dollar Amount</Typography>
                    <Typography variant="h6">
                      {formatCurrency(transaction.amount.dollar, 'USD')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Handling Fee */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Handling Fee
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="h4">
                  {formatCurrency(transaction.handlingFee, 'PHP')}
                </Typography>
              </Box>
              <Typography color="textSecondary">
                15% of peso amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={STEP_LABELS[transaction.currentStep]}
                  color="primary"
                  sx={{ fontSize: '1.1rem', py: 1 }}
                />
                <Typography color="textSecondary" sx={{ mt: 2 }}>
                  Last Updated: {new Date(transaction.updatedAt).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Delivery Details
              </Typography>
              {transaction.dollarDelivery.scheduledDate ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule color="action" sx={{ mr: 1 }} />
                    <Typography>
                      {new Date(transaction.dollarDelivery.scheduledDate).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    <Typography>
                      {transaction.dollarDelivery.location || 'Location TBD'}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography color="textSecondary">
                  Delivery not yet scheduled
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Documents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Documents
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Receipt color="action" sx={{ mr: 1 }} />
                    <div>
                      <Typography variant="subtitle1">
                        Validation Document
                      </Typography>
                      <Typography color="textSecondary">
                        {transaction.documents.validationDoc
                          ? 'Signed'
                          : 'Pending'}
                      </Typography>
                    </div>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Receipt color="action" sx={{ mr: 1 }} />
                    <div>
                      <Typography variant="subtitle1">
                        Receipt Document
                      </Typography>
                      <Typography color="textSecondary">
                        {transaction.documents.receiptDoc
                          ? 'Signed'
                          : 'Pending'}
                      </Typography>
                    </div>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransactionDashboard; 