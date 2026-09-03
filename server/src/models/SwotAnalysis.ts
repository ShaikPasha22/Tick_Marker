import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISwotAnalysis extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  category?: string;
  startDate?: Date;
  targetDate?: Date;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const SwotAnalysisSchema = new Schema<ISwotAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, trim: true },
    startDate: { type: Date },
    targetDate: { type: Date },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const SwotAnalysis = mongoose.model<ISwotAnalysis>('SwotAnalysis', SwotAnalysisSchema);
