import mongoose, { Document, Types } from 'mongoose';
export type ExpenseStatus = 'confirmed' | 'pending' | 'cancelled';
export interface IExpense extends Document {
    userId: Types.ObjectId;
    amount: number;
    date: Date;
    time?: string;
    categoryId: Types.ObjectId;
    tagIds: Types.ObjectId[];
    paymentMethodId?: Types.ObjectId;
    description?: string;
    notes?: string;
    status: ExpenseStatus;
    isRefund: boolean;
    refundForExpenseId?: Types.ObjectId;
    recurringId?: Types.ObjectId;
    receiptUrl?: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Expense: mongoose.Model<IExpense, {}, {}, {}, mongoose.Document<unknown, {}, IExpense, {}, {}> & IExpense & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Expense.d.ts.map