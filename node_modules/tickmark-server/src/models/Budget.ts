import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategoryBudget {
  categoryId: Types.ObjectId;
  amount: number;
}

export interface IBudget extends Document {
  userId: Types.ObjectId;
  year: number;
  month: number; // 1-12
  overall: number; // total monthly budget
  categoryBudgets: ICategoryBudget[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryBudgetSchema = new Schema<ICategoryBudget>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    overall: { type: Number, default: 0, min: 0 },
    categoryBudgets: { type: [CategoryBudgetSchema], default: [] },
  },
  { timestamps: true }
);

// One budget doc per user per year+month
BudgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
