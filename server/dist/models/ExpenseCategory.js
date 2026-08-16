"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INCOME_CATEGORIES = exports.DEFAULT_EXPENSE_CATEGORIES = exports.ExpenseCategory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExpenseCategorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '💰' },
    color: { type: String, default: '#6366f1' },
    description: { type: String, trim: true },
    type: { type: String, enum: ['expense', 'income'], required: true, index: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    order: { type: Number, default: 0 },
}, { timestamps: true });
ExpenseCategorySchema.index({ userId: 1, type: 1, status: 1 });
exports.ExpenseCategory = mongoose_1.default.model('ExpenseCategory', ExpenseCategorySchema);
// Default expense categories
exports.DEFAULT_EXPENSE_CATEGORIES = [
    { name: 'Food', icon: '🍔', color: '#f97316', order: 0 },
    { name: 'Groceries', icon: '🛒', color: '#10b981', order: 1 },
    { name: 'Petrol / Fuel', icon: '⛽', color: '#ef4444', order: 2 },
    { name: 'Transport', icon: '🚗', color: '#3b82f6', order: 3 },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899', order: 4 },
    { name: 'Clothes', icon: '👕', color: '#8b5cf6', order: 5 },
    { name: 'Bills', icon: '📋', color: '#f59e0b', order: 6 },
    { name: 'Rent', icon: '🏠', color: '#6366f1', order: 7 },
    { name: 'Entertainment', icon: '🎬', color: '#06b6d4', order: 8 },
    { name: 'Health', icon: '🏥', color: '#10b981', order: 9 },
    { name: 'Education', icon: '📚', color: '#3b82f6', order: 10 },
    { name: 'Subscriptions', icon: '📱', color: '#8b5cf6', order: 11 },
    { name: 'Travel', icon: '✈️', color: '#f59e0b', order: 12 },
    { name: 'Personal', icon: '👤', color: '#84cc16', order: 13 },
    { name: 'Other', icon: '📦', color: '#71717a', order: 14 },
];
// Default income categories
exports.DEFAULT_INCOME_CATEGORIES = [
    { name: 'Salary', icon: '💼', color: '#10b981', order: 0 },
    { name: 'Freelance', icon: '💻', color: '#6366f1', order: 1 },
    { name: 'Business', icon: '🏢', color: '#3b82f6', order: 2 },
    { name: 'Bonus', icon: '🎁', color: '#f59e0b', order: 3 },
    { name: 'Interest', icon: '📈', color: '#10b981', order: 4 },
    { name: 'Gift', icon: '🎀', color: '#ec4899', order: 5 },
    { name: 'Refund', icon: '↩️', color: '#06b6d4', order: 6 },
    { name: 'Other Income', icon: '💰', color: '#71717a', order: 7 },
];
//# sourceMappingURL=ExpenseCategory.js.map