import mongoose, { Document, Schema, Types } from 'mongoose';

export type TargetTimeframe = 'none' | 'weekly' | 'monthly' | 'yearly';
export type TargetPriority = 'low' | 'medium' | 'high' | 'critical';
export type TargetStatus = 'not_started' | 'in_progress' | 'completed' | 'deferred' | 'cancelled';
export type TargetProgressType = 'percentage' | 'numeric' | 'binary';

export interface ITarget extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  notes?: string;
  category?: string;
  priority: TargetPriority;
  status: TargetStatus;
  progress: number;
  progressMax: number;
  progressType: TargetProgressType;
  isDumpItem: boolean;
  assignedType: TargetTimeframe;
  weekStart?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  year?: number; // YYYY
  targetDate?: string; // YYYY-MM-DD
  position: number;
  linkedTaskIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TargetSchema = new Schema<ITarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    category: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'deferred', 'cancelled'], default: 'not_started', index: true },
    progress: { type: Number, default: 0 },
    progressMax: { type: Number, default: 100 },
    progressType: { type: String, enum: ['percentage', 'numeric', 'binary'], default: 'percentage' },
    isDumpItem: { type: Boolean, default: false, index: true },
    assignedType: { type: String, enum: ['none', 'weekly', 'monthly', 'yearly'], default: 'none', index: true },
    weekStart: { type: String, trim: true, index: true },
    month: { type: String, trim: true, index: true },
    year: { type: Number, index: true },
    targetDate: { type: String, trim: true, index: true },
    position: { type: Number, default: 0 },
    linkedTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  },
  { timestamps: true }
);

export const Target = mongoose.model<ITarget>('Target', TargetSchema);
