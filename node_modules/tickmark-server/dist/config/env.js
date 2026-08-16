"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    PORT: zod_1.z.string().default('5000'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    EMAIL_HOST: zod_1.z.string().default('smtp.gmail.com'),
    EMAIL_PORT: zod_1.z.string().default('587'),
    EMAIL_USER: zod_1.z.string().default(''),
    EMAIL_PASS: zod_1.z.string().default(''),
    EMAIL_FROM: zod_1.z.string().default('TickMark <noreply@tickmark.app>'),
    RESET_TOKEN_EXPIRY_MINS: zod_1.z.string().default('60'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map