"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const seed_1 = require("../seed");
const User_1 = require("../models/User");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.log('⚠️  MongoDB connection failed. Starting fallback in-memory MongoDB...');
        try {
            const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
            const mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            const conn = await mongoose_1.default.connect(mongoUri);
            console.log(`✅ In-memory MongoDB connected: ${conn.connection.host}`);
            const userCount = await User_1.User.countDocuments();
            if (userCount === 0) {
                console.log('🌱 In-memory database is empty. Auto-seeding demo data...');
                await (0, seed_1.seedDatabase)();
            }
        }
        catch (fallbackError) {
            console.error('❌ In-memory MongoDB connection failed:', fallbackError);
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});
mongoose_1.default.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});
//# sourceMappingURL=db.js.map