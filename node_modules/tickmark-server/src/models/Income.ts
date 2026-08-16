import mongoose, { Document, Schema, Types } from 'mongoose';

export type IncomeStatus = 'confirmed' | 'pending' | 'cancelled';

export interface IIncome extends Document {
  userId: Types.ObjectId;
  amount: number;
  date: Date;
  time?: string;
  categoryId: Types.ObjectId;
  description?: string;
  notes?: string;
  status: IncomeStatus;
  recurringId?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringTransaction' },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, status: 1, date: -1 });

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);
