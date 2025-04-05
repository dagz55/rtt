import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { Paper, Typography } from '@mui/material';
import { Transaction, TransactionStep, STEP_LABELS } from '../types/transaction';

interface ProgressTimelineProps {
  transaction: Transaction;
}

const getStepColor = (
  step: TransactionStep,
  currentStep: TransactionStep
): 'grey' | 'primary' | 'success' => {
  const steps = Object.values(TransactionStep);
  const stepIndex = steps.indexOf(step);
  const currentIndex = steps.indexOf(currentStep);

  if (stepIndex < currentIndex) return 'success';
  if (stepIndex === currentIndex) return 'primary';
  return 'grey';
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ transaction }) => {
  const steps = Object.values(TransactionStep);

  return (
    <Timeline position="alternate">
      {steps.map((step, index) => {
        const timestamp = transaction.stepTimestamps.get(step);
        const isCompleted = steps.indexOf(step) <= steps.indexOf(transaction.currentStep);
        const color = getStepColor(step, transaction.currentStep);

        return (
          <TimelineItem key={step}>
            <TimelineSeparator>
              <TimelineDot color={color} />
              {index < steps.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={3} sx={{ p: 2, bgcolor: isCompleted ? 'background.paper' : 'action.hover' }}>
                <Typography variant="h6" component="h3">
                  {STEP_LABELS[step]}
                </Typography>
                {timestamp && (
                  <Typography color="textSecondary">
                    {formatDate(timestamp)}
                  </Typography>
                )}
                {step === TransactionStep.DOLLAR_DELIVERY_SCHEDULED && transaction.dollarDelivery.location && (
                  <Typography>
                    Location: {transaction.dollarDelivery.location}
                  </Typography>
                )}
                {step === TransactionStep.DOLLAR_SERIAL_VERIFIED && transaction.dollarDelivery.serialNumbers && (
                  <Typography>
                    Serial Numbers: {transaction.dollarDelivery.serialNumbers.join(', ')}
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};

export default ProgressTimeline; 