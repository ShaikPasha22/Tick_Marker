"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const completion_controller_1 = require("../controllers/completion.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', completion_controller_1.getCompletions);
router.get('/day', completion_controller_1.getDayView);
router.post('/', completion_controller_1.logCompletion);
router.patch('/:id', completion_controller_1.updateCompletion);
router.delete('/:id', completion_controller_1.deleteCompletion);
exports.default = router;
//# sourceMappingURL=completion.routes.js.map