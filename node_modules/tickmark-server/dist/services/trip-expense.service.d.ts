import { Types } from 'mongoose';
import { ITripExpense } from '../models/TripExpense';
export declare class TripExpenseService {
    /**
     * Syncs a TripExpense with Main Finance.
     * If included, creates/updates the Main Expense.
     * If not included, deletes the Main Expense (if it exists).
     */
    private static syncWithMainFinance;
    static createExpense(userId: string, tripId: string, expenseData: Partial<ITripExpense>): Promise<import("mongoose").Document<unknown, {}, ITripExpense, {}, {}> & ITripExpense & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static updateExpense(userId: string, tripId: string, expenseId: string, updateData: Partial<ITripExpense>): Promise<import("mongoose").Document<unknown, {}, ITripExpense, {}, {}> & ITripExpense & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static deleteExpense(userId: string, tripId: string, expenseId: string): Promise<{
        message: string;
    }>;
    static listExpenses(userId: string, tripId: string, filters?: any): Promise<(import("mongoose").Document<unknown, {}, ITripExpense, {}, {}> & ITripExpense & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=trip-expense.service.d.ts.map