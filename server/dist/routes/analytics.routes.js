"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/dashboard', analytics_controller_1.getDashboard);
router.get('/habits', analytics_controller_1.getHabitAnalyticsEndpoint);
router.get('/streaks/:habitId', analytics_controller_1.getHabitStreak);
router.get('/heatmap', analytics_controller_1.getHeatmap);
router.get('/insights', analytics_controller_1.getInsights);
router.get('/weekly-review', analytics_controller_1.getWeeklyReview);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map