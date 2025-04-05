import mongoose from 'mongoose';

export enum TransactionStep {
  INITIATED = 'INITIATED',
  PESO_DROPPED = 'PESO_DROPPED',
  PESO_VALIDATED = 'PESO_VALIDATED',
  DOCUMENTS_SIGNED = 'DOCUMENTS_SIGNED',
  DOLLAR_DELIVERY_SCHEDULED = 'DOLLAR_DELIVERY_SCHEDULED',
  DOLLAR_SERIAL_VERIFIED = 'DOLLAR_SERIAL_VERIFIED',
  RECEIPT_SIGNED = 'RECEIPT_SIGNED',
  COMPLETED = 'COMPLETED'
}

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    peso: {
      type: Number,
      required: true,
    },
    dollar: {
      type: Number,
      required: true,
    }
  },
  exchangeRate: {
    type: Number,
    required: true,
  },
  handlingFee: {
    type: Number,
    required: true,
  },
  currentStep: {
    type: String,
    enum: Object.values(TransactionStep),
    default: TransactionStep.INITIATED,
  },
  stepTimestamps: {
    type: Map,
    of: Date,
    default: new Map(),
  },
  documents: {
    validationDoc: String,
    receiptDoc: String,
  },
  dollarDelivery: {
    scheduledDate: Date,
    location: String,
    serialNumbers: [String],
  },
  notifications: [{
    step: String,
    timestamp: Date,
    message: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ currentStep: 1 });
transactionSchema.index({ createdAt: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction; 