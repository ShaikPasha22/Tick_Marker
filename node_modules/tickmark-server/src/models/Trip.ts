import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  destination?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  currency: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  coverImage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    destination: { type: String, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'archived'],
      default: 'upcoming',
    },
    coverImage: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
