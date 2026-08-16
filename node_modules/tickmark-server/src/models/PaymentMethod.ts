import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentMethod extends Document {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '💳' },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PaymentMethodSchema.index({ userId: 1, isActive: 1 });

export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);

export const DEFAULT_PAYMENT_METHODS = [
  { name: 'Cash', icon: '💵', isDefault: false },
  { name: 'UPI', icon: '📲', isDefault: true },
  { name: 'Credit Card', icon: '💳', isDefault: false },
  { name: 'Debit Card', icon: '🏧', isDefault: false },
  { name: 'Bank Transfer', icon: '🏦', isDefault: false },
  { name: 'Wallet', icon: '👛', isDefault: false },
];
