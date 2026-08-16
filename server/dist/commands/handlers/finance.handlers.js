"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_registry_1 = require("../registry/command.registry");
const command_types_1 = require("../command.types");
const expense_service_1 = require("../../services/expense.service");
const ExpenseCategory_1 = require("../../models/ExpenseCategory");
class CreateExpenseHandler {
    async execute(userId, intentData, context) {
        const { amount, category, date, description, currency } = intentData.entities;
        if (!amount) {
            return { success: false, message: 'I need to know the amount.', actionRequired: 'CLARIFICATION_NEEDED', missingFields: ['amount'] };
        }
        let categoryId;
        if (category) {
            const categories = await ExpenseCategory_1.ExpenseCategory.find({ userId: userId.toString() });
            const matched = categories.find(c => c.name.toLowerCase().includes(category.toLowerCase()));
            if (matched) {
                categoryId = matched._id;
            }
            else {
                const newCat = await ExpenseCategory_1.ExpenseCategory.create({
                    userId: userId.toString(),
                    name: category,
                    icon: '💰',
                    color: '#10B981',
                });
                categoryId = newCat._id;
            }
        }
        const result = await expense_service_1.ExpenseService.createExpense(userId, {
            amount,
            categoryId,
            date: date ? new Date(date) : new Date(),
            description: description || 'Added via Voice',
            currency: currency,
            status: 'confirmed'
        });
        return {
            success: true,
            message: `Added ${currency || '₹'}${amount} expense${category ? ` under ${category}` : ''}.`,
            data: result
        };
    }
}
command_registry_1.CommandRegistry.register(command_types_1.Intent.CREATE_EXPENSE, new CreateExpenseHandler());
//# sourceMappingURL=finance.handlers.js.map