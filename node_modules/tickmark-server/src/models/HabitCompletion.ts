import mongoose, { Document, Schema, Types } from 'mongoose';

export type CompletionStatus = 'completed' | 'partial' | 'missed' | 'skipped';

export interface IHabitCompletion extends Document {
  habitId: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date; // UTC midnight of user's local date
  status: CompletionStatus;
  value?: number; // Progress value (for quantity/duration/count)
  note?: string;
  completedAt?: Date; // Actual timestamp of completion
  createdAt: Date;
  updatedAt: Date;
}

const HabitCompletionSchema = new Schema<IHabitCompletion>(
  {
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['completed', 'partial', 'missed', 'skipped'],
      required: true,
    },
    value: { type: Number },
    note: { type: String, trim: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique constraint: one record per habit per date
HabitCompletionSchema.index({ habitId: 1, date: 1 }, { unique: true });
HabitCompletionSchema.index({ userId: 1, date: 1 });
HabitCompletionSchema.index({ userId: 1, habitId: 1, date: -1 });

export const HabitCompletion = mongoose.model<IHabitCompletion>(
  'HabitCompletion',
  HabitCompletionSchema
);
