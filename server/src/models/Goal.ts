import mongoose, { Document, Schema, Types } from 'mongoose';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  habitId?: Types.ObjectId;
  trackerIds: Types.ObjectId[];
  startDate: Date;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: Date;
  status: GoalStatus;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
    trackerIds: [{ type: Schema.Types.ObjectId, ref: 'Habit', default: [] }],
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'abandoned'],
      default: 'active',
    },
    category: { type: String },
  },
  { timestamps: true }
);

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
