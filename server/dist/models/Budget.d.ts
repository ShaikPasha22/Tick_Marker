import mongoose, { Document, Types } from 'mongoose';
export interface ICategoryBudget {
    categoryId: Types.ObjectId;
    amount: number;
}
export interface IBudget extends Document {
    userId: Types.ObjectId;
    year: number;
    month: number;
    overall: number;
    categoryBudgets: ICategoryBudget[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Budget: mongoose.Model<IBudget, {}, {}, {}, mongoose.Document<unknown, {}, IBudget, {}, {}> & IBudget & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Budget.d.ts.map