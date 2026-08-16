"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const habit_controller_1 = require("../controllers/habit.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', habit_controller_1.getHabits);
router.post('/', habit_controller_1.createHabit);
router.patch('/reorder', habit_controller_1.reorderHabits);
router.get('/:id', habit_controller_1.getHabit);
router.patch('/:id', habit_controller_1.updateHabit);
router.delete('/:id', habit_controller_1.deleteHabit);
router.post('/:id/pause', habit_controller_1.pauseHabit);
router.post('/:id/resume', habit_controller_1.resumeHabit);
exports.default = router;
//# sourceMappingURL=habit.routes.js.map