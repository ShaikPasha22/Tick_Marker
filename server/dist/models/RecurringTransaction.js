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
exports.RecurringTransaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RecurringTransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    paymentMethodId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PaymentMethod' },
    description: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
RecurringTransactionSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 });
exports.RecurringTransaction = mongoose_1.default.model('RecurringTransaction', RecurringTransactionSchema);
//# sourceMappingURL=RecurringTransaction.js.map