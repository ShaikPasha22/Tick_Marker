"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitService = void 0;
const HabitCompletion_1 = require("../models/HabitCompletion");
const Habit_1 = require("../models/Habit");
const errorHandler_1 = require("../middleware/errorHandler");
const scheduling_service_1 = require("./scheduling.service");
class HabitService {
    /**
     * Logs a completion for a habit programmatically.
     * Useful for both standard HTTP controllers and AI Command engines.
     */
    static async logCompletion(userId, data) {
        const { habitId, date, status, value, note } = data;
        // Verify habit belongs to user
        const habit = await Habit_1.Habit.findOne({ _id: habitId, userId });
        if (!habit) {
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        }
        const utcDate = (0, scheduling_service_1.toUTCMidnight)(new Date(date));
        // Check if already exists — upsert
        const completion = await HabitCompletion_1.HabitCompletion.findOneAndUpdate({ habitId, userId, date: utcDate }, {
            status,
            value,
            note,
            completedAt: status === 'completed' ? new Date() : undefined,
        }, { new: true, upsert: true, runValidators: true });
        return { completion, habit };
    }
}
exports.HabitService = HabitService;
//# sourceMappingURL=habit.service.js.map