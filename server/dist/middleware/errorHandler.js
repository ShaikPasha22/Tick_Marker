"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.createError = exports.errorHandler = void 0;
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    if (env_1.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
        res.status(statusCode).json({
            message,
            stack: err.stack,
        });
        return;
    }
    res.status(statusCode).json({ message });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    return err;
};
exports.createError = createError;
const notFound = (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map