"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }
        const user = await User_1.User.findById(decoded.userId).select('_id timezone').lean();
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        req.userId = decoded.userId;
        req.userTimezone = user.timezone;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map