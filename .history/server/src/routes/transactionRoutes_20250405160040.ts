import express from 'express';
import {
  createTransaction,
  getTransaction,
  updateTransactionStep,
  listTransactions
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

export default router; 