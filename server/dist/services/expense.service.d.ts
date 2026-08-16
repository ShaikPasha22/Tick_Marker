import { Types } from 'mongoose';
export declare class ExpenseService {
    /**
     * Creates an expense programmatically.
     * Useful for both standard HTTP controllers and AI Command engines.
     */
    static createExpense(userId: Types.ObjectId, data: {
        amount: number;
        categoryId?: string | Types.ObjectId;
        date?: Date | string;
        description?: string;
        currency?: string;
        paymentMethodId?: string | Types.ObjectId;
        tagIds?: (string | Types.ObjectId)[];
        status?: 'confirmed' | 'pending' | 'cancelled';
    }): Promise<{
        expense: (import("mongoose").FlattenMaps<import("../models/Expense").IExpense> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        unusualWarning: {
            isUnusual: boolean;
            averageAmount: number;
            message?: string;
        } | null;
    }>;
}
//# sourceMappingURL=expense.service.d.ts.map