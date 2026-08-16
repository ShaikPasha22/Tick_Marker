"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const mongoose_1 = require("mongoose");
const Expense_1 = require("../models/Expense");
const ExpenseCategory_1 = require("../models/ExpenseCategory");
const financialAnalytics_service_1 = require("./financialAnalytics.service");
const errorHandler_1 = require("../middleware/errorHandler");
class ExpenseService {
    /**
     * Creates an expense programmatically.
     * Useful for both standard HTTP controllers and AI Command engines.
     */
    static async createExpense(userId, data) {
        if (data.categoryId) {
            const cat = await ExpenseCategory_1.ExpenseCategory.findOne({ _id: data.categoryId, userId });
            if (!cat) {
                throw (0, errorHandler_1.createError)('Category not found or not owned by user', 403);
            }
        }
        const expense = new Expense_1.Expense({
            ...data,
            userId,
            categoryId: data.categoryId ? new mongoose_1.Types.ObjectId(data.categoryId) : undefined,
            tagIds: (data.tagIds ?? []).map((id) => new mongoose_1.Types.ObjectId(id)),
            paymentMethodId: data.paymentMethodId ? new mongoose_1.Types.ObjectId(data.paymentMethodId) : undefined,
        });
        await expense.save();
        let unusualWarning = null;
        if (data.categoryId && expense.amount) {
            unusualWarning = await (0, financialAnalytics_service_1.detectUnusualSpending)(userId, new mongoose_1.Types.ObjectId(data.categoryId), expense.amount);
        }
        const populated = await Expense_1.Expense.findById(expense._id)
            .populate('categoryId', 'name icon color')
            .populate('tagIds', 'name color')
            .populate('paymentMethodId', 'name icon')
            .lean();
        return { expense: populated, unusualWarning };
    }
}
exports.ExpenseService = ExpenseService;
//# sourceMappingURL=expense.service.js.map