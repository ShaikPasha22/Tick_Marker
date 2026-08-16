import mongoose, { Document, Types } from 'mongoose';
export type HabitType = 'binary' | 'quantity' | 'count' | 'duration' | 'avoidance';
export type HabitFrequency = 'daily' | 'specific_days' | 'x_per_week' | 'x_per_month' | 'every_x_days' | 'monthly';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitPriority = 'low' | 'medium' | 'high';
export interface IHabitSchedule {
    frequency: HabitFrequency;
    days?: number[];
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
    times: string[];
    snoozeMins: number;
}
export interface IHabit extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    category: string;
    icon: string;
    color: string;
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
export declare const Habit: mongoose.Model<IHabit, {}, {}, {}, mongoose.Document<unknown, {}, IHabit, {}, {}> & IHabit & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Habit.d.ts.map