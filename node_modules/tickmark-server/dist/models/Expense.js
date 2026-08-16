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
exports.Expense = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExpenseSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    tagIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'ExpenseTag' }],
    paymentMethodId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PaymentMethod' },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    isRefund: { type: Boolean, default: false },
    refundForExpenseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Expense' },
    recurringId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'RecurringTransaction' },
    receiptUrl: { type: String },
    deletedAt: { type: Date, index: true },
}, { timestamps: true });
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, categoryId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, status: 1, date: -1 });
ExpenseSchema.index({ userId: 1, deletedAt: 1 });
exports.Expense = mongoose_1.default.model('Expense', ExpenseSchema);
//# sourceMappingURL=Expense.js.map