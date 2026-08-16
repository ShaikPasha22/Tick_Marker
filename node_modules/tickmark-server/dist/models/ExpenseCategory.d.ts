import mongoose, { Document, Types } from 'mongoose';
export type CategoryType = 'expense' | 'income';
export type CategoryStatus = 'active' | 'archived';
export interface IExpenseCategory extends Document {
    userId: Types.ObjectId;
    name: string;
    icon: string;
    color: string;
    description?: string;
    type: CategoryType;
    isDefault: boolean;
    status: CategoryStatus;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ExpenseCategory: mongoose.Model<IExpenseCategory, {}, {}, {}, mongoose.Document<unknown, {}, IExpenseCategory, {}, {}> & IExpenseCategory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const DEFAULT_EXPENSE_CATEGORIES: {
    name: string;
    icon: string;
    color: string;
    order: number;
}[];
export declare const DEFAULT_INCOME_CATEGORIES: {
    name: string;
    icon: string;
    color: string;
    order: number;
}[];
//# sourceMappingURL=ExpenseCategory.d.ts.map