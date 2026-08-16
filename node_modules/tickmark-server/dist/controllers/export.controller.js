"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importData = exports.exportData = void 0;
const mongoose_1 = require("mongoose");
const Habit_1 = require("../models/Habit");
const HabitCompletion_1 = require("../models/HabitCompletion");
const Goal_1 = require("../models/Goal");
// GET /api/export?format=json|csv
const exportData = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const format = req.query.format || 'json';
        const [habits, completions, goals] = await Promise.all([
            Habit_1.Habit.find({ userId }).lean(),
            HabitCompletion_1.HabitCompletion.find({ userId }).sort({ date: -1 }).lean(),
            Goal_1.Goal.find({ userId }).lean(),
        ]);
        if (format === 'csv') {
            // Export completions as CSV
            const headers = ['date', 'habitId', 'habitName', 'status', 'value', 'note'];
            const habitMap = new Map(habits.map((h) => [h._id.toString(), h.name]));
            const rows = completions.map((c) => [
                c.date.toISOString().slice(0, 10),
                c.habitId.toString(),
                habitMap.get(c.habitId.toString()) || '',
                c.status,
                c.value ?? '',
                (c.note || '').replace(/,/g, ';'),
            ]);
            const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="tickmark-export.csv"');
            res.send(csv);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="tickmark-export.json"');
            res.json({
                exportedAt: new Date().toISOString(),
                version: '1.0',
                habits,
                completions,
                goals,
            });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.exportData = exportData;
// POST /api/import
const importData = async (req, res, next) => {
    try {
        // Basic import validation — in production this would be more thorough
        const { habits, completions, goals } = req.body;
        if (!Array.isArray(habits)) {
            res.status(400).json({ message: 'Invalid import format: habits must be an array' });
            return;
        }
        let importedHabits = 0, importedCompletions = 0;
        for (const h of habits) {
            try {
                delete h._id; // Let MongoDB assign new IDs
                h.userId = req.userId;
                await new Habit_1.Habit(h).save();
                importedHabits++;
            }
            catch {
                // Skip invalid habits
            }
        }
        res.json({
            message: 'Import completed',
            imported: { habits: importedHabits },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.importData = importData;
//# sourceMappingURL=export.controller.js.map