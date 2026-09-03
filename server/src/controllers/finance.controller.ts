import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  getFinancialDashboard,
  getFinancialSummary,
  getCategoryBreakdown,
  getDailySpending,
  getMonthlyData,
  getBudgetStatus,
  getPaymentMethodBreakdown,
  getSpendingVelocity,
  generateFinancialInsights,
  getAvailableBalance,
  getCalendarData,
  detectUnusualSpending,
} from '../services/financialAnalytics.service';
import { Budget } from '../models/Budget';
import { ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../models/ExpenseCategory';
import { ExpenseTag } from '../models/ExpenseTag';
import { PaymentMethod } from '../models/PaymentMethod';
import { FinancialSettings } from '../models/FinancialSettings';

function parseDate(str: string | undefined, fallback: Date): Date {
  if (!str) return fallback;
  const d = new Date(str);
  return isNaN(d.getTime()) ? fallback : d;
}

// ─── Financial Settings ───────────────────────────────────────────────────────

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    let settings = await FinancialSettings.findOne({ userId });
    if (!settings) {
      settings = await FinancialSettings.create({ userId });
    }
    res.json({ settings });
  } catch (error) { next(error); }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { openingBalance, currency, currencySymbol, lowBalanceThreshold, budgetAlertThresholds, setupCompleted } = req.body;

    const settings = await FinancialSettings.findOneAndUpdate(
      { userId },
      { $set: { openingBalance, currency, currencySymbol, lowBalanceThreshold, budgetAlertThresholds, setupCompleted } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ settings });
  } catch (error) { next(error); }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const from = parseDate(req.query.from as string, startOfMonth(now));
    const to = parseDate(req.query.to as string, now);

    const dashboard = await getFinancialDashboard(userId, from, to);
    res.json(dashboard);
  } catch (error) { next(error); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const from = parseDate(req.query.from as string, startOfMonth(now));
    const to = parseDate(req.query.to as string, now);

    const [summary, balance] = await Promise.all([
      getFinancialSummary(userId, from, to),
      getAvailableBalance(userId),
    ]);
    res.json({ summary, balance, from, to });
  } catch (error) { next(error); }
};

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const from = parseDate(req.query.from as string, startOfMonth(now));
    const to = parseDate(req.query.to as string, now);

    const breakdown = await getCategoryBreakdown(userId, from, to);
    res.json({ breakdown, from, to });
  } catch (error) { next(error); }
};

export const getDaily = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const from = parseDate(req.query.from as string, subDays(now, 30));
    const to = parseDate(req.query.to as string, now);

    const daily = await getDailySpending(userId, from, to);
    res.json({ daily, from, to });
  } catch (error) { next(error); }
};

export const getMonthly = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const months = parseInt(req.query.months as string) || 12;
    const monthly = await getMonthlyData(userId, months);
    res.json({ monthly });
  } catch (error) { next(error); }
};

export const getPaymentMethods = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const from = parseDate(req.query.from as string, startOfMonth(now));
    const to = parseDate(req.query.to as string, now);

    const breakdown = await getPaymentMethodBreakdown(userId, from, to);
    res.json({ breakdown });
  } catch (error) { next(error); }
};

export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const insights = await generateFinancialInsights(userId);
    res.json({ insights });
  } catch (error) { next(error); }
};

export const getVelocity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

    const velocity = await getSpendingVelocity(userId, year, month);
    res.json({ velocity });
  } catch (error) { next(error); }
};

export const getCalendar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

    const data = await getCalendarData(userId, year, month);
    res.json({ calendar: data, year, month });
  } catch (error) { next(error); }
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const {
      from, to, categoryId, tagIds, paymentMethodId, status,
      search, page = '1', limit = '50',
    } = req.query;

    const filter: Record<string, unknown> = {
      userId,
      deletedAt: { $exists: false },
    };

    if (from || to) {
      const now = new Date();
      filter.date = {
        ...(from ? { $gte: new Date(from as string) } : {}),
        ...(to ? { $lte: new Date(to as string) } : {}),
      };
    }
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId as string);
    if (status) filter.status = status;
    if (paymentMethodId) filter.paymentMethodId = new Types.ObjectId(paymentMethodId as string);
    if (tagIds) {
      const ids = (tagIds as string).split(',').map((id) => new Types.ObjectId(id));
      filter.tagIds = { $in: ids };
    }
    if (search) {
      filter.description = { $regex: search as string, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name icon color')
        .populate('tagIds', 'name color')
        .populate('paymentMethodId', 'name icon')
        .lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({ expenses, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  } catch (error) { next(error); }
};

import { ExpenseService } from '../services/expense.service';

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const result = await ExpenseService.createExpense(userId, req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const getExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const expense = await Expense.findOne({ _id: req.params.id, userId, deletedAt: { $exists: false } })
      .populate('categoryId', 'name icon color')
      .populate('tagIds', 'name color')
      .populate('paymentMethodId', 'name icon');
    if (!expense) throw createError('Expense not found', 404);
    res.json({ expense });
  } catch (error) { next(error); }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { userId: _u, ...updateData } = req.body;

    if (updateData.categoryId) {
      const cat = await ExpenseCategory.findOne({ _id: updateData.categoryId, userId });
      if (!cat) throw createError('Category not found', 403);
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId, deletedAt: { $exists: false } },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon color')
      .populate('tagIds', 'name color')
      .populate('paymentMethodId', 'name icon');
    if (!expense) throw createError('Expense not found', 404);

    res.json({ expense });
  } catch (error) { next(error); }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!expense) throw createError('Expense not found', 404);
    res.json({ message: 'Expense deleted' });
  } catch (error) { next(error); }
};

export const createRefund = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const original = await Expense.findOne({ _id: req.params.id, userId, deletedAt: { $exists: false } });
    if (!original) throw createError('Expense not found', 404);

    const { amount, date, description } = req.body;
    const refundAmount = amount ?? original.amount;

    const refund = new Expense({
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
  } catch (error) { next(error); }
};

// ─── Income ───────────────────────────────────────────────────────────────────

export const getIncomes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { from, to, categoryId, status, page = '1', limit = '50' } = req.query;

    const filter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: new Date(from as string) } : {}),
        ...(to ? { $lte: new Date(to as string) } : {}),
      };
    }
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId as string);
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const [incomes, total] = await Promise.all([
      Income.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name icon color')
        .lean(),
      Income.countDocuments(filter),
    ]);

    res.json({ incomes, total, page: pageNum, limit: limitNum });
  } catch (error) { next(error); }
};

export const createIncome = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { categoryId, ...rest } = req.body;

    const income = new Income({
      ...rest,
      userId,
      categoryId: categoryId ? new Types.ObjectId(categoryId) : undefined,
    });
    await income.save();

    const populated = await Income.findById(income._id).populate('categoryId', 'name icon color').lean();
    res.status(201).json({ income: populated });
  } catch (error) { next(error); }
};

export const updateIncome = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { userId: _u, ...updateData } = req.body;

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId, deletedAt: { $exists: false } },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color');
    if (!income) throw createError('Income not found', 404);

    res.json({ income });
  } catch (error) { next(error); }
};

export const deleteIncome = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!income) throw createError('Income not found', 404);
    res.json({ message: 'Income deleted' });
  } catch (error) { next(error); }
};

// ─── Budget ───────────────────────────────────────────────────────────────────

export const getBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

    const budget = await Budget.findOne({ userId, year, month });
    const status = await getBudgetStatus(userId, year, month);
    res.json({ budget, status });
  } catch (error) { next(error); }
};

export const upsertBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { year, month, overall, categoryBudgets } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId, year, month },
      { $set: { overall, categoryBudgets } },
      { new: true, upsert: true, runValidators: true }
    );
    const status = await getBudgetStatus(userId, year, month);
    res.json({ budget, status });
  } catch (error) { next(error); }
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getExpenseCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { type, status } = req.query;
    const filter: Record<string, unknown> = { userId };
    if (type) filter.type = type;
    if (status) filter.status = status;
    else filter.status = 'active';

    let categories = await ExpenseCategory.find(filter).sort({ order: 1, name: 1 });

    // Auto-seed default categories for existing users who have none
    if (categories.length === 0) {
      const anyExist = await ExpenseCategory.countDocuments({ userId });
      if (anyExist === 0) {
        await Promise.all([
          ExpenseCategory.insertMany(
            DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, userId, type: 'expense', isDefault: true }))
          ),
          ExpenseCategory.insertMany(
            DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, userId, type: 'income', isDefault: true }))
          ),
        ]);
        categories = await ExpenseCategory.find(filter).sort({ order: 1, name: 1 });
      }
    }

    res.json({ categories });
  } catch (error) { next(error); }
};

export const createExpenseCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const category = new ExpenseCategory({ ...req.body, userId });
    await category.save();
    res.status(201).json({ category });
  } catch (error) { next(error); }
};

export const updateExpenseCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { userId: _u, ...updateData } = req.body;
    const category = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) throw createError('Category not found', 404);
    res.json({ category });
  } catch (error) { next(error); }
};

export const archiveCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const category = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, userId },
      { status: 'archived' },
      { new: true }
    );
    if (!category) throw createError('Category not found', 404);
    res.json({ category });
  } catch (error) { next(error); }
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const tags = await ExpenseTag.find({ userId }).sort({ usageCount: -1, name: 1 });
    res.json({ tags });
  } catch (error) { next(error); }
};

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const tag = new ExpenseTag({ ...req.body, userId });
    await tag.save();
    res.status(201).json({ tag });
  } catch (error) { next(error); }
};

export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    await ExpenseTag.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ message: 'Tag deleted' });
  } catch (error) { next(error); }
};

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const getPaymentMethodsList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const methods = await PaymentMethod.find({ userId, isActive: true }).sort({ isDefault: -1, name: 1 });
    res.json({ methods });
  } catch (error) { next(error); }
};

export const createPaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const method = new PaymentMethod({ ...req.body, userId });
    await method.save();
    res.status(201).json({ method });
  } catch (error) { next(error); }
};

export const updatePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { userId: _u, ...updateData } = req.body;
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true }
    );
    if (!method) throw createError('Payment method not found', 404);
    res.json({ method });
  } catch (error) { next(error); }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    await PaymentMethod.findOneAndUpdate({ _id: req.params.id, userId }, { isActive: false });
    res.json({ message: 'Payment method removed' });
  } catch (error) { next(error); }
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportFinanceData = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { format = 'json', from, to } = req.query;
    const now = new Date();

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.$gte = new Date(from as string);
    if (to) dateFilter.$lte = new Date(to as string);

    const expenseFilter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    const incomeFilter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    if (from || to) {
      expenseFilter.date = dateFilter;
      incomeFilter.date = dateFilter;
    }

    const [expenses, incomes] = await Promise.all([
      Expense.find(expenseFilter)
        .sort({ date: -1 })
        .populate('categoryId', 'name')
        .populate('paymentMethodId', 'name')
        .lean(),
      Income.find(incomeFilter)
        .sort({ date: -1 })
        .populate('categoryId', 'name')
        .lean(),
    ]);

    if (format === 'csv') {
      const expenseRows = expenses.map((e) => [
        e.date.toISOString().slice(0, 10),
        'expense',
        e.amount,
        (e.categoryId as any)?.name ?? '',
        e.description ?? '',
        (e.paymentMethodId as any)?.name ?? '',
        e.status,
      ]);
      const incomeRows = incomes.map((i) => [
        i.date.toISOString().slice(0, 10),
        'income',
        i.amount,
        (i.categoryId as any)?.name ?? '',
        i.description ?? '',
        '',
        i.status,
      ]);

      const header = 'Date,Type,Amount,Category,Description,PaymentMethod,Status\n';
      const csv = header + [...expenseRows, ...incomeRows]
        .sort((a, b) => (b[0] as string).localeCompare(a[0] as string))
        .map((r) => r.join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tickmark-finance-${now.toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } else {
      res.json({ expenses, incomes, exportedAt: now.toISOString() });
    }
  } catch (error) { next(error); }
};
