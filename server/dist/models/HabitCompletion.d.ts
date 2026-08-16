import mongoose, { Document, Types } from 'mongoose';
export type CompletionStatus = 'completed' | 'partial' | 'missed' | 'skipped';
export interface IHabitCompletion extends Document {
    habitId: Types.ObjectId;
    userId: Types.ObjectId;
    date: Date;
    status: CompletionStatus;
    value?: number;
    note?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HabitCompletion: mongoose.Model<IHabitCompletion, {}, {}, {}, mongoose.Document<unknown, {}, IHabitCompletion, {}, {}> & IHabitCompletion & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=HabitCompletion.d.ts.map