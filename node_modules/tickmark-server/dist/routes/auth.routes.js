"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.get('/me', auth_1.authenticate, auth_controller_1.getMe);
router.patch('/me', auth_1.authenticate, auth_controller_1.updateMe);
router.delete('/account', auth_1.authenticate, auth_controller_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map