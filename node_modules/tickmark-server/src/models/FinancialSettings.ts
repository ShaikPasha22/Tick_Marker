import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFinancialSettings extends Document {
  userId: Types.ObjectId;
  openingBalance: number;
  currency: string; // e.g. 'INR'
  currencySymbol: string; // e.g. '₹'
  lowBalanceThreshold: number;
  budgetAlertThresholds: number[]; // e.g. [50, 75, 90, 100]
  setupCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialSettingsSchema = new Schema<IFinancialSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    openingBalance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    lowBalanceThreshold: { type: Number, default: 10000, min: 0 },
    budgetAlertThresholds: { type: [Number], default: [75, 90, 100] },
    setupCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FinancialSettings = mongoose.model<IFinancialSettings>(
  'FinancialSettings',
  FinancialSettingsSchema
);
