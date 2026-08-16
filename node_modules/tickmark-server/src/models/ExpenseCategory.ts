import mongoose, { Document, Schema, Types } from 'mongoose';

export type CategoryType = 'expense' | 'income';
export type CategoryStatus = 'active' | 'archived';

export interface IExpenseCategory extends Document {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  description?: string;
  type: CategoryType;
  isDefault: boolean;
  status: CategoryStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '💰' },
    color: { type: String, default: '#6366f1' },
    description: { type: String, trim: true },
    type: { type: String, enum: ['expense', 'income'], required: true, index: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ExpenseCategorySchema.index({ userId: 1, type: 1, status: 1 });

export const ExpenseCategory = mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316', order: 0 },
  { name: 'Groceries', icon: '🛒', color: '#10b981', order: 1 },
  { name: 'Petrol / Fuel', icon: '⛽', color: '#ef4444', order: 2 },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', order: 3 },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', order: 4 },
  { name: 'Clothes', icon: '👕', color: '#8b5cf6', order: 5 },
  { name: 'Bills', icon: '📋', color: '#f59e0b', order: 6 },
  { name: 'Rent', icon: '🏠', color: '#6366f1', order: 7 },
  { name: 'Entertainment', icon: '🎬', color: '#06b6d4', order: 8 },
  { name: 'Health', icon: '🏥', color: '#10b981', order: 9 },
  { name: 'Education', icon: '📚', color: '#3b82f6', order: 10 },
  { name: 'Subscriptions', icon: '📱', color: '#8b5cf6', order: 11 },
  { name: 'Travel', icon: '✈️', color: '#f59e0b', order: 12 },
  { name: 'Personal', icon: '👤', color: '#84cc16', order: 13 },
  { name: 'Other', icon: '📦', color: '#71717a', order: 14 },
];

// Default income categories
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💼', color: '#10b981', order: 0 },
  { name: 'Freelance', icon: '💻', color: '#6366f1', order: 1 },
  { name: 'Business', icon: '🏢', color: '#3b82f6', order: 2 },
  { name: 'Bonus', icon: '🎁', color: '#f59e0b', order: 3 },
  { name: 'Interest', icon: '📈', color: '#10b981', order: 4 },
  { name: 'Gift', icon: '🎀', color: '#ec4899', order: 5 },
  { name: 'Refund', icon: '↩️', color: '#06b6d4', order: 6 },
  { name: 'Other Income', icon: '💰', color: '#71717a', order: 7 },
];
