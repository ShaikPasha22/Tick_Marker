"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const finance_controller_1 = require("../controllers/finance.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', finance_controller_1.getSettings);
router.patch('/settings', finance_controller_1.updateSettings);
// ─── Dashboard & Analytics ───────────────────────────────────────────────────
router.get('/dashboard', finance_controller_1.getDashboard);
router.get('/analytics/summary', finance_controller_1.getSummary);
router.get('/analytics/categories', finance_controller_1.getCategories);
router.get('/analytics/daily', finance_controller_1.getDaily);
router.get('/analytics/monthly', finance_controller_1.getMonthly);
router.get('/analytics/payment-methods', finance_controller_1.getPaymentMethods);
router.get('/analytics/insights', finance_controller_1.getInsights);
router.get('/analytics/velocity', finance_controller_1.getVelocity);
router.get('/calendar', finance_controller_1.getCalendar);
// ─── Expenses ────────────────────────────────────────────────────────────────
router.get('/expenses', finance_controller_1.getExpenses);
router.post('/expenses', finance_controller_1.createExpense);
router.get('/expenses/:id', finance_controller_1.getExpense);
router.patch('/expenses/:id', finance_controller_1.updateExpense);
router.delete('/expenses/:id', finance_controller_1.deleteExpense);
router.post('/expenses/:id/refund', finance_controller_1.createRefund);
// ─── Income ──────────────────────────────────────────────────────────────────
router.get('/income', finance_controller_1.getIncomes);
router.post('/income', finance_controller_1.createIncome);
router.patch('/income/:id', finance_controller_1.updateIncome);
router.delete('/income/:id', finance_controller_1.deleteIncome);
// ─── Budget ──────────────────────────────────────────────────────────────────
router.get('/budget', finance_controller_1.getBudget);
router.put('/budget', finance_controller_1.upsertBudget);
// ─── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', finance_controller_1.getExpenseCategories);
router.post('/categories', finance_controller_1.createExpenseCategory);
router.patch('/categories/:id', finance_controller_1.updateExpenseCategory);
router.delete('/categories/:id', finance_controller_1.archiveCategory);
// ─── Tags ────────────────────────────────────────────────────────────────────
router.get('/tags', finance_controller_1.getTags);
router.post('/tags', finance_controller_1.createTag);
router.delete('/tags/:id', finance_controller_1.deleteTag);
// ─── Payment Methods ─────────────────────────────────────────────────────────
router.get('/payment-methods', finance_controller_1.getPaymentMethodsList);
router.post('/payment-methods', finance_controller_1.createPaymentMethod);
router.patch('/payment-methods/:id', finance_controller_1.updatePaymentMethod);
router.delete('/payment-methods/:id', finance_controller_1.deletePaymentMethod);
// ─── Export ──────────────────────────────────────────────────────────────────
router.get('/export', finance_controller_1.exportFinanceData);
exports.default = router;
//# sourceMappingURL=finance.routes.js.map