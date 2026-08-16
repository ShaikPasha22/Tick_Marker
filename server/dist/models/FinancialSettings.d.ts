import mongoose, { Document, Types } from 'mongoose';
export interface IFinancialSettings extends Document {
    userId: Types.ObjectId;
    openingBalance: number;
    currency: string;
    currencySymbol: string;
    lowBalanceThreshold: number;
    budgetAlertThresholds: number[];
    setupCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FinancialSettings: mongoose.Model<IFinancialSettings, {}, {}, {}, mongoose.Document<unknown, {}, IFinancialSettings, {}, {}> & IFinancialSettings & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FinancialSettings.d.ts.map