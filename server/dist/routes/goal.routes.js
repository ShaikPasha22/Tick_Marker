"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goal_controller_1 = require("../controllers/goal.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', goal_controller_1.getGoals);
router.post('/', goal_controller_1.createGoal);
router.patch('/:id', goal_controller_1.updateGoal);
router.delete('/:id', goal_controller_1.deleteGoal);
exports.default = router;
//# sourceMappingURL=goal.routes.js.map