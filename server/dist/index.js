"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const habit_routes_1 = __importDefault(require("./routes/habit.routes"));
const completion_routes_1 = __importDefault(require("./routes/completion.routes"));
const goal_routes_1 = __importDefault(require("./routes/goal.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const trip_routes_1 = __importDefault(require("./routes/trip.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const command_routes_1 = __importDefault(require("./routes/command.routes"));
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);
// Auth endpoints — stricter limit
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/', authLimiter);
// Logging
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/habits', habit_routes_1.default);
app.use('/api/completions', completion_routes_1.default);
app.use('/api/goals', goal_routes_1.default);
app.use('/api/finance', finance_routes_1.default);
app.use('/api/trips', trip_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/export', export_routes_1.default);
app.use('/api/commands', command_routes_1.default);
// 404
app.use(errorHandler_1.notFound);
// Error handler
app.use(errorHandler_1.errorHandler);
// Start
const PORT = parseInt(env_1.env.PORT);
const start = async () => {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`🚀 TickMark server running on http://localhost:${PORT}`);
        console.log(`📡 Environment: ${env_1.env.NODE_ENV}`);
    });
};
start();
exports.default = app;
//# sourceMappingURL=index.js.map