import mongoose, { Document, Types } from 'mongoose';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export interface IGoal extends Document {
    userId: Types.ObjectId;
    habitId?: Types.ObjectId;
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
export declare const Goal: mongoose.Model<IGoal, {}, {}, {}, mongoose.Document<unknown, {}, IGoal, {}, {}> & IGoal & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Goal.d.ts.map