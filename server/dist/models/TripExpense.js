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
exports.TripExpense = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tripExpenseSchema = new mongoose_1.Schema({
    tripId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TripCategory', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    description: { type: String, trim: true },
    paidBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TripParticipant', required: true },
    paidByType: { type: String, enum: ['CURRENT_USER', 'TRIP_PARTICIPANT'], required: true },
    paymentMethod: { type: String },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    receipt: { type: String },
    status: { type: String, enum: ['confirmed', 'planned'], default: 'confirmed' },
    includeInMainFinance: { type: Boolean, default: false, index: true },
    mainFinanceTransactionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Expense' },
}, { timestamps: true });
exports.TripExpense = mongoose_1.default.model('TripExpense', tripExpenseSchema);
//# sourceMappingURL=TripExpense.js.map