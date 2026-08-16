"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const export_controller_1 = require("../controllers/export.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/export', export_controller_1.exportData);
router.post('/import', export_controller_1.importData);
exports.default = router;
//# sourceMappingURL=export.routes.js.map