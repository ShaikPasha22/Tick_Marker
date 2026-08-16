import mongoose, { Document, Types } from 'mongoose';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringType = 'expense' | 'income';
export interface IRecurringTransaction extends Document {
    userId: Types.ObjectId;
    type: RecurringType;
    amount: number;
    categoryId: Types.ObjectId;
    paymentMethodId?: Types.ObjectId;
    description: string;
    notes?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    nextDueDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RecurringTransaction: mongoose.Model<IRecurringTransaction, {}, {}, {}, mongoose.Document<unknown, {}, IRecurringTransaction, {}, {}> & IRecurringTransaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RecurringTransaction.d.ts.map