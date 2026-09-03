import mongoose, { Document, Schema, Types } from 'mongoose';

export type SwotQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats' | 'unclassified';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ItemStatus = 'not_started' | 'in_progress' | 'completed';

export interface ISwotItemHistory {
  previousQuadrant: string;
  newQuadrant: string;
  previousPriority: string;
  newPriority: string;
  changedAt: Date;
}

export interface ISwotItem extends Document {
  userId: Types.ObjectId;
  swotId: Types.ObjectId;
  title: string;
  description?: string;
  notes?: string;
  quadrant: SwotQuadrant;
  impact: PriorityLevel;
  urgency: PriorityLevel;
  severity: PriorityLevel;
  priority: PriorityLevel;
  priorityScore: number;
  prioritySource: 'calculated' | 'manual';
  status: ItemStatus;
  deadline?: Date;
  position: number;
  taskId?: Types.ObjectId;
  history: ISwotItemHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const SwotItemHistorySchema = new Schema<ISwotItemHistory>(
  {
    previousQuadrant: { type: String, required: true },
    newQuadrant: { type: String, required: true },
    previousPriority: { type: String, required: true },
    newPriority: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SwotItemSchema = new Schema<ISwotItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    swotId: { type: Schema.Types.ObjectId, ref: 'SwotAnalysis', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    quadrant: {
      type: String,
      enum: ['strengths', 'weaknesses', 'opportunities', 'threats', 'unclassified'],
      default: 'unclassified',
      index: true,
    },
    impact: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    priorityScore: { type: Number, default: 0 },
    prioritySource: { type: String, enum: ['calculated', 'manual'], default: 'calculated' },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started', index: true },
    deadline: { type: Date },
    position: { type: Number, default: 0 },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    history: [SwotItemHistorySchema],
  },
  { timestamps: true }
);

export const SwotItem = mongoose.model<ISwotItem>('SwotItem', SwotItemSchema);
