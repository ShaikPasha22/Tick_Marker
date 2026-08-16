import mongoose, { Schema, Document } from 'mongoose';

export interface ITripExpense extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  date: Date;
  time?: string;
  description?: string;
  paidBy: mongoose.Types.ObjectId; // Ref to TripParticipant
  paidByType: 'CURRENT_USER' | 'TRIP_PARTICIPANT';
  paymentMethod?: string;
  tags?: string[];
  notes?: string;
  receipt?: string;
  status: 'confirmed' | 'planned';
  includeInMainFinance: boolean;
  mainFinanceTransactionId?: mongoose.Types.ObjectId; // Ref to main Expense model if included
  createdAt: Date;
  updatedAt: Date;
}

const tripExpenseSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'TripCategory', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    description: { type: String, trim: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'TripParticipant', required: true },
    paidByType: { type: String, enum: ['CURRENT_USER', 'TRIP_PARTICIPANT'], required: true },
    paymentMethod: { type: String },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    receipt: { type: String },
    status: { type: String, enum: ['confirmed', 'planned'], default: 'confirmed' },
    includeInMainFinance: { type: Boolean, default: false, index: true },
    mainFinanceTransactionId: { type: Schema.Types.ObjectId, ref: 'Expense' },
  },
  { timestamps: true }
);

export const TripExpense = mongoose.model<ITripExpense>('TripExpense', tripExpenseSchema);
