"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoal = exports.createGoal = exports.getGoals = void 0;
const Goal_1 = require("../models/Goal");
const errorHandler_1 = require("../middleware/errorHandler");
// GET /api/goals
const getGoals = async (req, res, next) => {
    try {
        const goals = await Goal_1.Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ goals });
    }
    catch (error) {
        next(error);
    }
};
exports.getGoals = getGoals;
// POST /api/goals
const createGoal = async (req, res, next) => {
    try {
        const goal = new Goal_1.Goal({ ...req.body, userId: req.userId });
        await goal.save();
        res.status(201).json({ goal });
    }
    catch (error) {
        next(error);
    }
};
exports.createGoal = createGoal;
// PATCH /api/goals/:id
const updateGoal = async (req, res, next) => {
    try {
        const { userId, ...updateData } = req.body;
        const goal = await Goal_1.Goal.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updateData, { new: true, runValidators: true });
        if (!goal)
            throw (0, errorHandler_1.createError)('Goal not found', 404);
        res.json({ goal });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoal = updateGoal;
// DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
    try {
        const result = await Goal_1.Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!result)
            throw (0, errorHandler_1.createError)('Goal not found', 404);
        res.json({ message: 'Goal deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
//# sourceMappingURL=goal.controller.js.map