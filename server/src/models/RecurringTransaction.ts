import mongoose, { Document, Schema, Types } from 'mongoose';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringType = 'expense' | 'income';

export interface IRecurringTransaction extends Document {
  userId: Types.ObjectId;
  type: RecurringType;
  amount: number;
  categoryId: Types.ObjectId;
  paymentMethodId?: Types.ObjectId;
  description: string;
  notes?: string;
  frequency: RecurringFrequency;
  startDate: Date;
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    description: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecurringTransactionSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 });

export const RecurringTransaction = mongoose.model<IRecurringTransaction>(
  'RecurringTransaction',
  RecurringTransactionSchema
);
