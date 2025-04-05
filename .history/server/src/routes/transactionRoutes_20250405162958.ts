import express from 'express';
import {
    createTransaction,
    getCurrentExchangeRate,
    getHistoricalRates,
    getTransaction,
    listTransactions,
    updateTransactionStep
} from '../controllers/transactionController';

const router = express.Router();

// Create a new transaction
router.post('/', createTransaction);

// Get a specific transaction
router.get('/:transactionId', getTransaction);

// Update transaction step
router.put('/:transactionId/step', updateTransactionStep);

// List all transactions with pagination
router.get('/', listTransactions);

// Exchange rate endpoints
router.get('/exchange-rate/current', getCurrentExchangeRate);
router.get('/exchange-rate/history', getHistoricalRates);

export default router; 