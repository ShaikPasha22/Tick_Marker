"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFinanceData = exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPaymentMethodsList = exports.deleteTag = exports.createTag = exports.getTags = exports.archiveCategory = exports.updateExpenseCategory = exports.createExpenseCategory = exports.getExpenseCategories = exports.upsertBudget = exports.getBudget = exports.deleteIncome = exports.updateIncome = exports.createIncome = exports.getIncomes = exports.createRefund = exports.deleteExpense = exports.updateExpense = exports.getExpense = exports.createExpense = exports.getExpenses = exports.getCalendar = exports.getVelocity = exports.getInsights = exports.getPaymentMethods = exports.getMonthly = exports.getDaily = exports.getCategories = exports.getSummary = exports.getDashboard = exports.updateSettings = exports.getSettings = void 0;
const mongoose_1 = require("mongoose");
const date_fns_1 = require("date-fns");
const Expense_1 = require("../models/Expense");
const Income_1 = require("../models/Income");
const errorHandler_1 = require("../middleware/errorHandler");
const financialAnalytics_service_1 = require("../services/financialAnalytics.service");
const Budget_1 = require("../models/Budget");
const ExpenseCategory_1 = require("../models/ExpenseCategory");
const ExpenseTag_1 = require("../models/ExpenseTag");
const PaymentMethod_1 = require("../models/PaymentMethod");
const FinancialSettings_1 = require("../models/FinancialSettings");
function parseDate(str, fallback) {
    if (!str)
        return fallback;
    const d = new Date(str);
    return isNaN(d.getTime()) ? fallback : d;
}
// ─── Financial Settings ───────────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        let settings = await FinancialSettings_1.FinancialSettings.findOne({ userId });
        if (!settings) {
            settings = await FinancialSettings_1.FinancialSettings.create({ userId });
        }
        res.json({ settings });
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { openingBalance, currency, currencySymbol, lowBalanceThreshold, budgetAlertThresholds, setupCompleted } = req.body;
        const settings = await FinancialSettings_1.FinancialSettings.findOneAndUpdate({ userId }, { $set: { openingBalance, currency, currencySymbol, lowBalanceThreshold, budgetAlertThresholds, setupCompleted } }, { new: true, upsert: true, runValidators: true });
        res.json({ settings });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
// ─── Dashboard ────────────────────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const from = parseDate(req.query.from, (0, date_fns_1.startOfMonth)(now));
        const to = parseDate(req.query.to, now);
        const dashboard = await (0, financialAnalytics_service_1.getFinancialDashboard)(userId, from, to);
        res.json(dashboard);
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
// ─── Analytics ────────────────────────────────────────────────────────────────
const getSummary = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const from = parseDate(req.query.from, (0, date_fns_1.startOfMonth)(now));
        const to = parseDate(req.query.to, now);
        const [summary, balance] = await Promise.all([
            (0, financialAnalytics_service_1.getFinancialSummary)(userId, from, to),
            (0, financialAnalytics_service_1.getAvailableBalance)(userId),
        ]);
        res.json({ summary, balance, from, to });
    }
    catch (error) {
        next(error);
    }
};
exports.getSummary = getSummary;
const getCategories = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const from = parseDate(req.query.from, (0, date_fns_1.startOfMonth)(now));
        const to = parseDate(req.query.to, now);
        const breakdown = await (0, financialAnalytics_service_1.getCategoryBreakdown)(userId, from, to);
        res.json({ breakdown, from, to });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getDaily = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const from = parseDate(req.query.from, (0, date_fns_1.subDays)(now, 30));
        const to = parseDate(req.query.to, now);
        const daily = await (0, financialAnalytics_service_1.getDailySpending)(userId, from, to);
        res.json({ daily, from, to });
    }
    catch (error) {
        next(error);
    }
};
exports.getDaily = getDaily;
const getMonthly = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const months = parseInt(req.query.months) || 12;
        const monthly = await (0, financialAnalytics_service_1.getMonthlyData)(userId, months);
        res.json({ monthly });
    }
    catch (error) {
        next(error);
    }
};
exports.getMonthly = getMonthly;
const getPaymentMethods = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const from = parseDate(req.query.from, (0, date_fns_1.startOfMonth)(now));
        const to = parseDate(req.query.to, now);
        const breakdown = await (0, financialAnalytics_service_1.getPaymentMethodBreakdown)(userId, from, to);
        res.json({ breakdown });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentMethods = getPaymentMethods;
const getInsights = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const insights = await (0, financialAnalytics_service_1.generateFinancialInsights)(userId);
        res.json({ insights });
    }
    catch (error) {
        next(error);
    }
};
exports.getInsights = getInsights;
const getVelocity = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const velocity = await (0, financialAnalytics_service_1.getSpendingVelocity)(userId, year, month);
        res.json({ velocity });
    }
    catch (error) {
        next(error);
    }
};
exports.getVelocity = getVelocity;
const getCalendar = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const data = await (0, financialAnalytics_service_1.getCalendarData)(userId, year, month);
        res.json({ calendar: data, year, month });
    }
    catch (error) {
        next(error);
    }
};
exports.getCalendar = getCalendar;
// ─── Expenses ─────────────────────────────────────────────────────────────────
const getExpenses = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { from, to, categoryId, tagIds, paymentMethodId, status, search, page = '1', limit = '50', } = req.query;
        const filter = {
            userId,
            deletedAt: { $exists: false },
        };
        if (from || to) {
            const now = new Date();
            filter.date = {
                ...(from ? { $gte: new Date(from) } : {}),
                ...(to ? { $lte: new Date(to) } : {}),
            };
        }
        if (categoryId)
            filter.categoryId = new mongoose_1.Types.ObjectId(categoryId);
        if (status)
            filter.status = status;
        if (paymentMethodId)
            filter.paymentMethodId = new mongoose_1.Types.ObjectId(paymentMethodId);
        if (tagIds) {
            const ids = tagIds.split(',').map((id) => new mongoose_1.Types.ObjectId(id));
            filter.tagIds = { $in: ids };
        }
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        const [expenses, total] = await Promise.all([
            Expense_1.Expense.find(filter)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('categoryId', 'name icon color')
                .populate('tagIds', 'name color')
                .populate('paymentMethodId', 'name icon')
                .lean(),
            Expense_1.Expense.countDocuments(filter),
        ]);
        res.json({ expenses, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenses = getExpenses;
const expense_service_1 = require("../services/expense.service");
const createExpense = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const result = await expense_service_1.ExpenseService.createExpense(userId, req.body);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.createExpense = createExpense;
const getExpense = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const expense = await Expense_1.Expense.findOne({ _id: req.params.id, userId, deletedAt: { $exists: false } })
            .populate('categoryId', 'name icon color')
            .populate('tagIds', 'name color')
            .populate('paymentMethodId', 'name icon');
        if (!expense)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        res.json({ expense });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpense = getExpense;
const updateExpense = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { userId: _u, ...updateData } = req.body;
        if (updateData.categoryId) {
            const cat = await ExpenseCategory_1.ExpenseCategory.findOne({ _id: updateData.categoryId, userId });
            if (!cat)
                throw (0, errorHandler_1.createError)('Category not found', 403);
        }
        const expense = await Expense_1.Expense.findOneAndUpdate({ _id: req.params.id, userId, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
            .populate('categoryId', 'name icon color')
            .populate('tagIds', 'name color')
            .populate('paymentMethodId', 'name icon');
        if (!expense)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        res.json({ expense });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const expense = await Expense_1.Expense.findOneAndUpdate({ _id: req.params.id, userId, deletedAt: { $exists: false } }, { deletedAt: new Date() }, { new: true });
        if (!expense)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        res.json({ message: 'Expense deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExpense = deleteExpense;
const createRefund = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const original = await Expense_1.Expense.findOne({ _id: req.params.id, userId, deletedAt: { $exists: false } });
        if (!original)
            throw (0, errorHandler_1.createError)('Expense not found', 404);
        const { amount, date, description } = req.body;
        const refundAmount = amount ?? original.amount;
        const refund = new Expense_1.Expense({
            userId,
            amount: refundAmount,
            date: date ? new Date(date) : new Date(),
            categoryId: original.categoryId,
            paymentMethodId: original.paymentMethodId,
            description: description ?? `Refund: ${original.description ?? 'expense'}`,
            status: 'confirmed',
            isRefund: true,
            refundForExpenseId: original._id,
        });
        await refund.save();
        res.status(201).json({ refund });
    }
    catch (error) {
        next(error);
    }
};
exports.createRefund = createRefund;
// ─── Income ───────────────────────────────────────────────────────────────────
const getIncomes = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { from, to, categoryId, status, page = '1', limit = '50' } = req.query;
        const filter = { userId, deletedAt: { $exists: false } };
        if (from || to) {
            filter.date = {
                ...(from ? { $gte: new Date(from) } : {}),
                ...(to ? { $lte: new Date(to) } : {}),
            };
        }
        if (categoryId)
            filter.categoryId = new mongoose_1.Types.ObjectId(categoryId);
        if (status)
            filter.status = status;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;
        const [incomes, total] = await Promise.all([
            Income_1.Income.find(filter)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('categoryId', 'name icon color')
                .lean(),
            Income_1.Income.countDocuments(filter),
        ]);
        res.json({ incomes, total, page: pageNum, limit: limitNum });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncomes = getIncomes;
const createIncome = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { categoryId, ...rest } = req.body;
        const income = new Income_1.Income({
            ...rest,
            userId,
            categoryId: categoryId ? new mongoose_1.Types.ObjectId(categoryId) : undefined,
        });
        await income.save();
        const populated = await Income_1.Income.findById(income._id).populate('categoryId', 'name icon color').lean();
        res.status(201).json({ income: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createIncome = createIncome;
const updateIncome = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { userId: _u, ...updateData } = req.body;
        const income = await Income_1.Income.findOneAndUpdate({ _id: req.params.id, userId, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true }).populate('categoryId', 'name icon color');
        if (!income)
            throw (0, errorHandler_1.createError)('Income not found', 404);
        res.json({ income });
    }
    catch (error) {
        next(error);
    }
};
exports.updateIncome = updateIncome;
const deleteIncome = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const income = await Income_1.Income.findOneAndUpdate({ _id: req.params.id, userId, deletedAt: { $exists: false } }, { deletedAt: new Date() }, { new: true });
        if (!income)
            throw (0, errorHandler_1.createError)('Income not found', 404);
        res.json({ message: 'Income deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteIncome = deleteIncome;
// ─── Budget ───────────────────────────────────────────────────────────────────
const getBudget = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);
        const budget = await Budget_1.Budget.findOne({ userId, year, month });
        const status = await (0, financialAnalytics_service_1.getBudgetStatus)(userId, year, month);
        res.json({ budget, status });
    }
    catch (error) {
        next(error);
    }
};
exports.getBudget = getBudget;
const upsertBudget = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { year, month, overall, categoryBudgets } = req.body;
        const budget = await Budget_1.Budget.findOneAndUpdate({ userId, year, month }, { $set: { overall, categoryBudgets } }, { new: true, upsert: true, runValidators: true });
        const status = await (0, financialAnalytics_service_1.getBudgetStatus)(userId, year, month);
        res.json({ budget, status });
    }
    catch (error) {
        next(error);
    }
};
exports.upsertBudget = upsertBudget;
// ─── Categories ───────────────────────────────────────────────────────────────
const getExpenseCategories = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { type, status } = req.query;
        const filter = { userId };
        if (type)
            filter.type = type;
        if (status)
            filter.status = status;
        else
            filter.status = 'active';
        const categories = await ExpenseCategory_1.ExpenseCategory.find(filter).sort({ order: 1, name: 1 });
        res.json({ categories });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenseCategories = getExpenseCategories;
const createExpenseCategory = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const category = new ExpenseCategory_1.ExpenseCategory({ ...req.body, userId });
        await category.save();
        res.status(201).json({ category });
    }
    catch (error) {
        next(error);
    }
};
exports.createExpenseCategory = createExpenseCategory;
const updateExpenseCategory = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { userId: _u, ...updateData } = req.body;
        const category = await ExpenseCategory_1.ExpenseCategory.findOneAndUpdate({ _id: req.params.id, userId }, updateData, { new: true, runValidators: true });
        if (!category)
            throw (0, errorHandler_1.createError)('Category not found', 404);
        res.json({ category });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExpenseCategory = updateExpenseCategory;
const archiveCategory = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const category = await ExpenseCategory_1.ExpenseCategory.findOneAndUpdate({ _id: req.params.id, userId }, { status: 'archived' }, { new: true });
        if (!category)
            throw (0, errorHandler_1.createError)('Category not found', 404);
        res.json({ category });
    }
    catch (error) {
        next(error);
    }
};
exports.archiveCategory = archiveCategory;
// ─── Tags ─────────────────────────────────────────────────────────────────────
const getTags = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const tags = await ExpenseTag_1.ExpenseTag.find({ userId }).sort({ usageCount: -1, name: 1 });
        res.json({ tags });
    }
    catch (error) {
        next(error);
    }
};
exports.getTags = getTags;
const createTag = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const tag = new ExpenseTag_1.ExpenseTag({ ...req.body, userId });
        await tag.save();
        res.status(201).json({ tag });
    }
    catch (error) {
        next(error);
    }
};
exports.createTag = createTag;
const deleteTag = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        await ExpenseTag_1.ExpenseTag.findOneAndDelete({ _id: req.params.id, userId });
        res.json({ message: 'Tag deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTag = deleteTag;
// ─── Payment Methods ──────────────────────────────────────────────────────────
const getPaymentMethodsList = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const methods = await PaymentMethod_1.PaymentMethod.find({ userId, isActive: true }).sort({ isDefault: -1, name: 1 });
        res.json({ methods });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentMethodsList = getPaymentMethodsList;
const createPaymentMethod = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const method = new PaymentMethod_1.PaymentMethod({ ...req.body, userId });
        await method.save();
        res.status(201).json({ method });
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { userId: _u, ...updateData } = req.body;
        const method = await PaymentMethod_1.PaymentMethod.findOneAndUpdate({ _id: req.params.id, userId }, updateData, { new: true });
        if (!method)
            throw (0, errorHandler_1.createError)('Payment method not found', 404);
        res.json({ method });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        await PaymentMethod_1.PaymentMethod.findOneAndUpdate({ _id: req.params.id, userId }, { isActive: false });
        res.json({ message: 'Payment method removed' });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
// ─── Export ───────────────────────────────────────────────────────────────────
const exportFinanceData = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const { format = 'json', from, to } = req.query;
        const now = new Date();
        const dateFilter = {};
        if (from)
            dateFilter.$gte = new Date(from);
        if (to)
            dateFilter.$lte = new Date(to);
        const expenseFilter = { userId, deletedAt: { $exists: false } };
        const incomeFilter = { userId, deletedAt: { $exists: false } };
        if (from || to) {
            expenseFilter.date = dateFilter;
            incomeFilter.date = dateFilter;
        }
        const [expenses, incomes] = await Promise.all([
            Expense_1.Expense.find(expenseFilter)
                .sort({ date: -1 })
                .populate('categoryId', 'name')
                .populate('paymentMethodId', 'name')
                .lean(),
            Income_1.Income.find(incomeFilter)
                .sort({ date: -1 })
                .populate('categoryId', 'name')
                .lean(),
        ]);
        if (format === 'csv') {
            const expenseRows = expenses.map((e) => [
                e.date.toISOString().slice(0, 10),
                'expense',
                e.amount,
                e.categoryId?.name ?? '',
                e.description ?? '',
                e.paymentMethodId?.name ?? '',
                e.status,
            ]);
            const incomeRows = incomes.map((i) => [
                i.date.toISOString().slice(0, 10),
                'income',
                i.amount,
                i.categoryId?.name ?? '',
                i.description ?? '',
                '',
                i.status,
            ]);
            const header = 'Date,Type,Amount,Category,Description,PaymentMethod,Status\n';
            const csv = header + [...expenseRows, ...incomeRows]
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map((r) => r.join(','))
                .join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="tickmark-finance-${now.toISOString().slice(0, 10)}.csv"`);
            res.send(csv);
        }
        else {
            res.json({ expenses, incomes, exportedAt: now.toISOString() });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.exportFinanceData = exportFinanceData;
//# sourceMappingURL=finance.controller.js.map