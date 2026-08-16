import mongoose, { Schema, Document } from 'mongoose';

export interface ITripCategory extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  budget?: number;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tripCategorySchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    budget: { type: Number, min: 0 },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TripCategory = mongoose.model<ITripCategory>('TripCategory', tripCategorySchema);
