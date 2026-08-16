"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_registry_1 = require("../registry/command.registry");
const command_types_1 = require("../command.types");
const habit_service_1 = require("../../services/habit.service");
const Habit_1 = require("../../models/Habit");
class CompleteHabitHandler {
    async execute(userId, intentData, context) {
        const { habitName, date } = intentData.entities;
        if (!habitName) {
            return { success: false, message: 'Which habit did you complete?', actionRequired: 'CLARIFICATION_NEEDED', missingFields: ['habitName'] };
        }
        const habits = await Habit_1.Habit.find({ userId: userId.toString(), status: { $ne: 'archived' } });
        const matched = habits.find(h => h.name.toLowerCase().includes(habitName.toLowerCase()));
        if (!matched) {
            return { success: false, message: `I couldn't find a habit matching "${habitName}".` };
        }
        const completionDate = date ? new Date(date) : new Date();
        const result = await habit_service_1.HabitService.logCompletion(userId, {
            habitId: matched._id,
            date: completionDate,
            status: 'completed',
        });
        return {
            success: true,
            message: `Marked "${matched.name}" as completed.`,
            data: result
        };
    }
}
command_registry_1.CommandRegistry.register(command_types_1.Intent.COMPLETE_HABIT, new CompleteHabitHandler());
//# sourceMappingURL=habit.handlers.js.map