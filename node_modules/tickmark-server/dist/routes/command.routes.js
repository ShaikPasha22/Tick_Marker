"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const command_controller_1 = require("../controllers/command.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all command routes
router.use(auth_1.authenticate);
router.post('/', command_controller_1.processCommand);
exports.default = router;
//# sourceMappingURL=command.routes.js.map