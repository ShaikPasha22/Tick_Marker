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
exports.Habit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HabitScheduleSchema = new mongoose_1.Schema({
    frequency: {
        type: String,
        enum: ['daily', 'specific_days', 'x_per_week', 'x_per_month', 'every_x_days', 'monthly'],
        required: true,
    },
    days: [{ type: Number, min: 0, max: 6 }],
    timesPerWeek: { type: Number, min: 1, max: 7 },
    timesPerMonth: { type: Number, min: 1, max: 31 },
    everyXDays: { type: Number, min: 1 },
}, { _id: false });
const PausePeriodSchema = new mongoose_1.Schema({
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String },
}, { _id: false });
const ReminderSchema = new mongoose_1.Schema({
    enabled: { type: Boolean, default: false },
    times: [{ type: String }],
    snoozeMins: { type: Number, default: 10 },
}, { _id: false });
const HabitSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'Other' },
    icon: { type: String, default: '✅' },
    color: { type: String, default: '#6366f1' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    type: {
        type: String,
        enum: ['binary', 'quantity', 'count', 'duration', 'avoidance'],
        required: true,
    },
    target: { type: Number, default: 1 },
    unit: { type: String, default: 'times' },
    schedule: { type: HabitScheduleSchema, required: true },
    reminder: { type: ReminderSchema, default: () => ({ enabled: false, times: [], snoozeMins: 10 }) },
    status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
    pausePeriods: { type: [PausePeriodSchema], default: [] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    goalId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Goal' },
    order: { type: Number, default: 0 },
}, { timestamps: true });
HabitSchema.index({ userId: 1, status: 1 });
HabitSchema.index({ userId: 1, category: 1 });
exports.Habit = mongoose_1.default.model('Habit', HabitSchema);
//# sourceMappingURL=Habit.js.map