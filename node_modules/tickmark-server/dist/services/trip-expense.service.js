"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripExpenseService = void 0;
const mongoose_1 = require("mongoose");
const TripExpense_1 = require("../models/TripExpense");
const Expense_1 = require("../models/Expense");
const TripCategory_1 = require("../models/TripCategory");
const ExpenseCategory_1 = require("../models/ExpenseCategory");
const errorHandler_1 = require("../middleware/errorHandler");
class TripExpenseService {
    /**
     * Syncs a TripExpense with Main Finance.
     * If included, creates/updates the Main Expense.
     * If not included, deletes the Main Expense (if it exists).
     */
    static async syncWithMainFinance(tripExpense, userId) {
        if (tripExpense.includeInMainFinance) {
            // Find the corresponding Main Finance category
            const tripCategory = await TripCategory_1.TripCategory.findById(tripExpense.categoryId);
            let mainCategoryId = null;
            if (tripCategory) {
                // Try to match by name
                const match = await ExpenseCategory_1.ExpenseCategory.findOne({ userId, name: tripCategory.name, type: 'expense' });
                if (match) {
                    mainCategoryId = match._id;
                }
            }
            if (!mainCategoryId) {
                // Fallback to "Travel" or "Other"
                const fallback = await ExpenseCategory_1.ExpenseCategory.findOne({ userId, name: { $in: ['Travel', 'Other'] }, type: 'expense' });
                mainCategoryId = fallback ? fallback._id : new mongoose_1.Types.ObjectId(); // Fallback handles if seed didn't run, though unlikely
            }
            const mainExpenseData = {
                userId: tripExpense.userId,
                amount: tripExpense.amount,
                date: tripExpense.date,
                time: tripExpense.time,
                categoryId: mainCategoryId,
                description: `[Trip] ${tripExpense.description || 'Trip Expense'}`,
                notes: tripExpense.notes,
                status: tripExpense.status === 'planned' ? 'pending' : 'confirmed',
            };
            if (tripExpense.mainFinanceTransactionId) {
                // Update existing
                await Expense_1.Expense.findByIdAndUpdate(tripExpense.mainFinanceTransactionId, { $set: mainExpenseData });
            }
            else {
                // Create new
                const newMainExpense = new Expense_1.Expense(mainExpenseData);
                await newMainExpense.save();
                tripExpense.mainFinanceTransactionId = newMainExpense._id;
                await tripExpense.save(); // Save the ref back
            }
        }
        else {
            // If it was previously included, delete it
            if (tripExpense.mainFinanceTransactionId) {
                await Expense_1.Expense.findByIdAndDelete(tripExpense.mainFinanceTransactionId);
                tripExpense.mainFinanceTransactionId = undefined;
                await tripExpense.save();
            }
        }
    }
    static async createExpense(userId, tripId, expenseData) {
        const expense = new TripExpense_1.TripExpense({
            ...expenseData,
            userId,
            tripId,
        });
        await expense.save();
        // Sync to main finance if needed
        if (expense.includeInMainFinance) {
            await this.syncWithMainFinance(expense, userId);
        }
        return expense;
    }
    static async updateExpense(userId, tripId, expenseId, updateData) {
        const expense = await TripExpense_1.TripExpense.findOne({ _id: expenseId, tripId, userId });
        if (!expense)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        // Apply updates
        Object.assign(expense, updateData);
        await expense.save();
        // Sync to main finance
        await this.syncWithMainFinance(expense, userId);
        return expense;
    }
    static async deleteExpense(userId, tripId, expenseId) {
        const expense = await TripExpense_1.TripExpense.findOne({ _id: expenseId, tripId, userId });
        if (!expense)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        if (expense.mainFinanceTransactionId) {
            await Expense_1.Expense.findByIdAndDelete(expense.mainFinanceTransactionId);
        }
        await expense.deleteOne();
        return { message: 'Expense deleted successfully' };
    }
    static async listExpenses(userId, tripId, filters) {
        const query = { tripId, userId };
        if (filters?.categoryId)
            query.categoryId = filters.categoryId;
        if (filters?.paidBy)
            query.paidBy = filters.paidBy;
        if (filters?.includeInMainFinance !== undefined)
            query.includeInMainFinance = filters.includeInMainFinance;
        return await TripExpense_1.TripExpense.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('categoryId', 'name icon color')
            .populate('paidBy', 'name avatar isMe');
    }
}
exports.TripExpenseService = TripExpenseService;
//# sourceMappingURL=trip-expense.service.js.map