import mongoose, { Document, Schema, Types } from 'mongoose';

export type HabitType = 'binary' | 'quantity' | 'count' | 'duration' | 'avoidance';
export type HabitFrequency =
  | 'daily'
  | 'specific_days'
  | 'x_per_week'
  | 'x_per_month'
  | 'every_x_days'
  | 'monthly';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitPriority = 'low' | 'medium' | 'high';

export interface IHabitSchedule {
  frequency: HabitFrequency;
  days?: number[]; // 0=Sun,1=Mon,...,6=Sat
  timesPerWeek?: number;
  timesPerMonth?: number;
  everyXDays?: number;
}

export interface IPausePeriod {
  from: Date;
  to: Date;
  reason?: string;
}

export interface IReminder {
  enabled: boolean;
  times: string[]; // ["06:30", "18:00"]
  snoozeMins: number;
}

export interface IHabit extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  icon: string; // emoji or icon name
  color: string; // hex color
  priority: HabitPriority;
  type: HabitType;
  target: number;
  unit: string;
  schedule: IHabitSchedule;
  reminder: IReminder;
  status: HabitStatus;
  pausePeriods: IPausePeriod[];
  startDate: Date;
  endDate?: Date;
  goalId?: Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HabitScheduleSchema = new Schema<IHabitSchedule>(
  {
    frequency: {
      type: String,
      enum: ['daily', 'specific_days', 'x_per_week', 'x_per_month', 'every_x_days', 'monthly'],
      required: true,
    },
    days: [{ type: Number, min: 0, max: 6 }],
    timesPerWeek: { type: Number, min: 1, max: 7 },
    timesPerMonth: { type: Number, min: 1, max: 31 },
    everyXDays: { type: Number, min: 1 },
  },
  { _id: false }
);

const PausePeriodSchema = new Schema<IPausePeriod>(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminder>(
  {
    enabled: { type: Boolean, default: false },
    times: [{ type: String }],
    snoozeMins: { type: Number, default: 10 },
  },
  { _id: false }
);

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'Other' },
    icon: { type: String, default: '✅' },
    color: { type: String, default: '#6366f1' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    type: {
      type: String,
      enum: ['binary', 'quantity', 'count', 'duration', 'avoidance'],
      required: true,
    },
    target: { type: Number, default: 1 },
    unit: { type: String, default: 'times' },
    schedule: { type: HabitScheduleSchema, required: true },
    reminder: { type: ReminderSchema, default: () => ({ enabled: false, times: [], snoozeMins: 10 }) },
    status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
    pausePeriods: { type: [PausePeriodSchema], default: [] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1, status: 1 });
HabitSchema.index({ userId: 1, category: 1 });

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);
