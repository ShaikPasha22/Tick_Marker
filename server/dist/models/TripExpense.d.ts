import mongoose, { Document } from 'mongoose';
export interface ITripExpense extends Document {
    tripId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    date: Date;
    time?: string;
    description?: string;
    paidBy: mongoose.Types.ObjectId;
    paidByType: 'CURRENT_USER' | 'TRIP_PARTICIPANT';
    paymentMethod?: string;
    tags?: string[];
    notes?: string;
    receipt?: string;
    status: 'confirmed' | 'planned';
    includeInMainFinance: boolean;
    mainFinanceTransactionId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TripExpense: mongoose.Model<ITripExpense, {}, {}, {}, mongoose.Document<unknown, {}, ITripExpense, {}, {}> & ITripExpense & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TripExpense.d.ts.map