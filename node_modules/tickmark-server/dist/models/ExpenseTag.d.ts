import mongoose, { Document, Types } from 'mongoose';
export interface IExpenseTag extends Document {
    userId: Types.ObjectId;
    name: string;
    color: string;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ExpenseTag: mongoose.Model<IExpenseTag, {}, {}, {}, mongoose.Document<unknown, {}, IExpenseTag, {}, {}> & IExpenseTag & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ExpenseTag.d.ts.map