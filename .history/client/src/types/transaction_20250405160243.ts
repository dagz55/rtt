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

export interface Transaction {
  transactionId: string;
  amount: {
    peso: number;
    dollar: number;
  };
  exchangeRate: number;
  handlingFee: number;
  currentStep: TransactionStep;
  stepTimestamps: Map<TransactionStep, Date>;
  documents: {
    validationDoc?: string;
    receiptDoc?: string;
  };
  dollarDelivery: {
    scheduledDate?: Date;
    location?: string;
    serialNumbers?: string[];
  };
  notifications: Array<{
    step: TransactionStep;
    timestamp: Date;
    message: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  pages: number;
  currentPage: number;
}

export const STEP_LABELS: Record<TransactionStep, string> = {
  [TransactionStep.INITIATED]: 'Transaction Initiated',
  [TransactionStep.PESO_DROPPED]: 'Peso Dropped Off',
  [TransactionStep.PESO_VALIDATED]: 'Peso Validated',
  [TransactionStep.DOCUMENTS_SIGNED]: 'Documents Signed',
  [TransactionStep.DOLLAR_DELIVERY_SCHEDULED]: 'Dollar Delivery Scheduled',
  [TransactionStep.DOLLAR_SERIAL_VERIFIED]: 'Dollar Serial Numbers Verified',
  [TransactionStep.RECEIPT_SIGNED]: 'Receipt Signed',
  [TransactionStep.COMPLETED]: 'Transaction Completed'
}; 