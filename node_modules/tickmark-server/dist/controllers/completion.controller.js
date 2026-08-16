"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDayView = exports.deleteCompletion = exports.updateCompletion = exports.logCompletion = exports.getCompletions = void 0;
const mongoose_1 = require("mongoose");
const HabitCompletion_1 = require("../models/HabitCompletion");
const Habit_1 = require("../models/Habit");
const errorHandler_1 = require("../middleware/errorHandler");
const scheduling_service_1 = require("../services/scheduling.service");
const scheduling_service_2 = require("../services/scheduling.service");
// GET /api/completions
const getCompletions = async (req, res, next) => {
    try {
        const { date, habitId, from, to } = req.query;
        const filter = { userId: req.userId };
        if (habitId)
            filter.habitId = new mongoose_1.Types.ObjectId(habitId);
        if (date) {
            filter.date = (0, scheduling_service_1.toUTCMidnight)(new Date(date));
        }
        else if (from || to) {
            filter.date = {};
            if (from)
                filter.date['$gte'] = (0, scheduling_service_1.toUTCMidnight)(new Date(from));
            if (to)
                filter.date['$lte'] = (0, scheduling_service_1.toUTCMidnight)(new Date(to));
        }
        const completions = await HabitCompletion_1.HabitCompletion.find(filter).sort({ date: -1 });
        res.json({ completions });
    }
    catch (error) {
        next(error);
    }
};
exports.getCompletions = getCompletions;
const habit_service_1 = require("../services/habit.service");
const logCompletion = async (req, res, next) => {
    try {
        const result = await habit_service_1.HabitService.logCompletion(req.userId, req.body);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.logCompletion = logCompletion;
// PATCH /api/completions/:id
const updateCompletion = async (req, res, next) => {
    try {
        const { status, value, note } = req.body;
        const completion = await HabitCompletion_1.HabitCompletion.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, {
            status,
            value,
            note,
            ...(status === 'completed' ? { completedAt: new Date() } : {}),
        }, { new: true, runValidators: true });
        if (!completion)
            throw (0, errorHandler_1.createError)('Completion record not found', 404);
        res.json({ completion });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCompletion = updateCompletion;
// DELETE /api/completions/:id
const deleteCompletion = async (req, res, next) => {
    try {
        const result = await HabitCompletion_1.HabitCompletion.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });
        if (!result)
            throw (0, errorHandler_1.createError)('Completion record not found', 404);
        res.json({ message: 'Completion removed' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCompletion = deleteCompletion;
// GET /api/completions/day — get all scheduled habits + completions for a day
const getDayView = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date)
            throw (0, errorHandler_1.createError)('date query parameter required', 400);
        const utcDate = (0, scheduling_service_1.toUTCMidnight)(new Date(date));
        const habits = await Habit_1.Habit.find({ userId: req.userId, status: { $ne: 'archived' } });
        const scheduledHabits = habits.filter((h) => (0, scheduling_service_2.isHabitScheduledOn)(h, utcDate));
        const completions = await HabitCompletion_1.HabitCompletion.find({
            userId: req.userId,
            date: utcDate,
        }).lean();
        const completionMap = new Map(completions.map((c) => [c.habitId.toString(), c]));
        const dayData = scheduledHabits.map((h) => ({
            habit: h,
            completion: completionMap.get(h._id.toString()) || null,
        }));
        res.json({ date: date, habits: dayData, totalScheduled: scheduledHabits.length });
    }
    catch (error) {
        next(error);
    }
};
exports.getDayView = getDayView;
//# sourceMappingURL=completion.controller.js.map