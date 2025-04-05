import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import Transaction, { TransactionStep } from '../models/Transaction';

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { peso, dollar, exchangeRate } = req.body;
    
    const handlingFee = (peso * config.handlingFeePercentage) / 100;
    
    const transaction = new Transaction({
      transactionId: uuidv4(),
      amount: { peso, dollar },
      exchangeRate,
      handlingFee,
      currentStep: TransactionStep.INITIATED,
      stepTimestamps: new Map([[TransactionStep.INITIATED, new Date()]]),
      notifications: [{
        step: TransactionStep.INITIATED,
        timestamp: new Date(),
        message: 'Transaction initiated successfully'
      }]
    });

    await transaction.save();
    
    // Emit socket event for real-time updates
    req.app.get('io').emit('transactionUpdate', {
      transactionId: transaction.transactionId,
      step: TransactionStep.INITIATED
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error creating transaction' });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findOne({ 
      transactionId: req.params.transactionId 
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transaction' });
  }
};

export const updateTransactionStep = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { step, additionalData } = req.body;
    
    if (!Object.values(TransactionStep).includes(step)) {
      return res.status(400).json({ error: 'Invalid transaction step' });
    }

    const transaction = await Transaction.findOne({ transactionId });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update step and timestamp
    transaction.currentStep = step;
    transaction.stepTimestamps.set(step, new Date());

    // Handle step-specific updates
    switch (step) {
      case TransactionStep.PESO_VALIDATED:
        if (additionalData?.validationDoc) {
          transaction.documents.validationDoc = additionalData.validationDoc;
        }
        break;
      
      case TransactionStep.DOLLAR_DELIVERY_SCHEDULED:
        if (additionalData?.scheduledDate && additionalData?.location) {
          transaction.dollarDelivery.scheduledDate = new Date(additionalData.scheduledDate);
          transaction.dollarDelivery.location = additionalData.location;
        }
        break;
      
      case TransactionStep.DOLLAR_SERIAL_VERIFIED:
        if (additionalData?.serialNumbers) {
          transaction.dollarDelivery.serialNumbers = additionalData.serialNumbers;
        }
        break;
      
      case TransactionStep.RECEIPT_SIGNED:
        if (additionalData?.receiptDoc) {
          transaction.documents.receiptDoc = additionalData.receiptDoc;
        }
        break;
    }

    // Add notification
    transaction.notifications.push({
      step,
      timestamp: new Date(),
      message: `Transaction progressed to ${step}`
    });

    await transaction.save();

    // Emit socket event for real-time updates
    req.app.get('io').emit('transactionUpdate', {
      transactionId,
      step,
      additionalData
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error updating transaction' });
  }
};

export const listTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { currentStep: status } : {};
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
}; 