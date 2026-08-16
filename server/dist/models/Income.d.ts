import mongoose, { Document, Types } from 'mongoose';
export type IncomeStatus = 'confirmed' | 'pending' | 'cancelled';
export interface IIncome extends Document {
    userId: Types.ObjectId;
    amount: number;
    date: Date;
    time?: string;
    categoryId: Types.ObjectId;
    description?: string;
    notes?: string;
    status: IncomeStatus;
    recurringId?: Types.ObjectId;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Income: mongoose.Model<IIncome, {}, {}, {}, mongoose.Document<unknown, {}, IIncome, {}, {}> & IIncome & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Income.d.ts.map