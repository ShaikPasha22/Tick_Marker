import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExpenseStatus = 'confirmed' | 'pending' | 'cancelled';

export interface IExpense extends Document {
  userId: Types.ObjectId;
  amount: number;
  date: Date;
  time?: string; // "HH:MM"
  categoryId: Types.ObjectId;
  tagIds: Types.ObjectId[];
  paymentMethodId?: Types.ObjectId;
  description?: string;
  notes?: string;
  status: ExpenseStatus;
  isRefund: boolean;
  refundForExpenseId?: Types.ObjectId;
  recurringId?: Types.ObjectId;
  receiptUrl?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'ExpenseTag' }],
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    isRefund: { type: Boolean, default: false },
    refundForExpenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
    recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringTransaction' },
    receiptUrl: { type: String },
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, categoryId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, status: 1, date: -1 });
ExpenseSchema.index({ userId: 1, deletedAt: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
