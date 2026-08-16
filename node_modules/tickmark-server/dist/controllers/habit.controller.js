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
exports.reorderHabits = exports.resumeHabit = exports.pauseHabit = exports.deleteHabit = exports.updateHabit = exports.getHabit = exports.createHabit = exports.getHabits = void 0;
const mongoose_1 = require("mongoose");
const Habit_1 = require("../models/Habit");
const errorHandler_1 = require("../middleware/errorHandler");
// GET /api/habits
const getHabits = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        const filter = { userId: req.userId };
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        const habits = await Habit_1.Habit.find(filter).sort({ order: 1, createdAt: 1 });
        res.json({ habits });
    }
    catch (error) {
        next(error);
    }
};
exports.getHabits = getHabits;
// POST /api/habits
const createHabit = async (req, res, next) => {
    try {
        const habit = new Habit_1.Habit({ ...req.body, userId: req.userId });
        await habit.save();
        res.status(201).json({ habit });
    }
    catch (error) {
        next(error);
    }
};
exports.createHabit = createHabit;
// GET /api/habits/:id
const getHabit = async (req, res, next) => {
    try {
        const habit = await Habit_1.Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit)
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        res.json({ habit });
    }
    catch (error) {
        next(error);
    }
};
exports.getHabit = getHabit;
// PATCH /api/habits/:id
const updateHabit = async (req, res, next) => {
    try {
        // Do not allow userId to be changed
        const { userId, ...updateData } = req.body;
        const habit = await Habit_1.Habit.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updateData, { new: true, runValidators: true });
        if (!habit)
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        res.json({ habit });
    }
    catch (error) {
        next(error);
    }
};
exports.updateHabit = updateHabit;
// DELETE /api/habits/:id — soft delete (archive)
const deleteHabit = async (req, res, next) => {
    try {
        const { permanent } = req.query;
        if (permanent === 'true') {
            const { HabitCompletion } = await Promise.resolve().then(() => __importStar(require('../models/HabitCompletion')));
            await Promise.all([
                Habit_1.Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId }),
                HabitCompletion.deleteMany({ habitId: req.params.id, userId: req.userId }),
            ]);
        }
        else {
            await Habit_1.Habit.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { status: 'archived' }, { new: true });
        }
        res.json({ message: 'Habit removed successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHabit = deleteHabit;
// POST /api/habits/:id/pause
const pauseHabit = async (req, res, next) => {
    try {
        const { from, to, reason } = req.body;
        const habit = await Habit_1.Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit)
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        habit.status = 'paused';
        habit.pausePeriods.push({ from: new Date(from), to: new Date(to), reason });
        await habit.save();
        res.json({ habit });
    }
    catch (error) {
        next(error);
    }
};
exports.pauseHabit = pauseHabit;
// POST /api/habits/:id/resume
const resumeHabit = async (req, res, next) => {
    try {
        const habit = await Habit_1.Habit.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { status: 'active' }, { new: true });
        if (!habit)
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        res.json({ habit });
    }
    catch (error) {
        next(error);
    }
};
exports.resumeHabit = resumeHabit;
// PATCH /api/habits/reorder
const reorderHabits = async (req, res, next) => {
    try {
        const { order } = req.body; // [{ id, order }]
        const bulkOps = order.map(({ id, order: o }) => ({
            updateOne: {
                filter: { _id: new mongoose_1.Types.ObjectId(id), userId: req.userId },
                update: { order: o },
            },
        }));
        await Habit_1.Habit.bulkWrite(bulkOps);
        res.json({ message: 'Reordered' });
    }
    catch (error) {
        next(error);
    }
};
exports.reorderHabits = reorderHabits;
//# sourceMappingURL=habit.controller.js.map