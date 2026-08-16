import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExpenseTag extends Document {
  userId: Types.ObjectId;
  name: string;
  color: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseTagSchema = new Schema<IExpenseTag>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6366f1' },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ExpenseTagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const ExpenseTag = mongoose.model<IExpenseTag>('ExpenseTag', ExpenseTagSchema);
