import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  // Settings
  getSettings, updateSettings,
  // Dashboard & Analytics
  getDashboard, getSummary, getCategories, getDaily, getMonthly,
  getPaymentMethods, getInsights, getVelocity, getCalendar,
  // Expenses
  getExpenses, createExpense, getExpense, updateExpense, deleteExpense, createRefund,
  // Income
  getIncomes, createIncome, updateIncome, deleteIncome,
  // Budget
  getBudget, upsertBudget,
  // Categories
  getExpenseCategories, createExpenseCategory, updateExpenseCategory, archiveCategory,
  // Tags
  getTags, createTag, deleteTag,
  // Payment Methods
  getPaymentMethodsList, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  // Export
  exportFinanceData,
} from '../controllers/finance.controller';

const router = Router();
router.use(authenticate);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// ─── Dashboard & Analytics ───────────────────────────────────────────────────
router.get('/dashboard', getDashboard);
router.get('/analytics/summary', getSummary);
router.get('/analytics/categories', getCategories);
router.get('/analytics/daily', getDaily);
router.get('/analytics/monthly', getMonthly);
router.get('/analytics/payment-methods', getPaymentMethods);
router.get('/analytics/insights', getInsights);
router.get('/analytics/velocity', getVelocity);
router.get('/calendar', getCalendar);

// ─── Expenses ────────────────────────────────────────────────────────────────
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.get('/expenses/:id', getExpense);
router.patch('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);
router.post('/expenses/:id/refund', createRefund);

// ─── Income ──────────────────────────────────────────────────────────────────
router.get('/income', getIncomes);
router.post('/income', createIncome);
router.patch('/income/:id', updateIncome);
router.delete('/income/:id', deleteIncome);

// ─── Budget ──────────────────────────────────────────────────────────────────
router.get('/budget', getBudget);
router.put('/budget', upsertBudget);

// ─── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', getExpenseCategories);
router.post('/categories', createExpenseCategory);
router.patch('/categories/:id', updateExpenseCategory);
router.delete('/categories/:id', archiveCategory);

// ─── Tags ────────────────────────────────────────────────────────────────────
router.get('/tags', getTags);
router.post('/tags', createTag);
router.delete('/tags/:id', deleteTag);

// ─── Payment Methods ─────────────────────────────────────────────────────────
router.get('/payment-methods', getPaymentMethodsList);
router.post('/payment-methods', createPaymentMethod);
router.patch('/payment-methods/:id', updatePaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

// ─── Export ──────────────────────────────────────────────────────────────────
router.get('/export', exportFinanceData);

export default router;
