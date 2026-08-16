"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionExecutor = void 0;
const mongoose_1 = require("mongoose");
const command_registry_1 = require("./registry/command.registry");
// We will import handlers here and register them
require("./handlers/trip.handlers");
require("./handlers/finance.handlers");
require("./handlers/habit.handlers");
require("./handlers/navigation.handlers");
class ActionExecutor {
    static async execute(userId, intentData, context) {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        try {
            const handler = command_registry_1.CommandRegistry.getHandler(intentData.intent);
            if (!handler) {
                return { success: false, message: 'I understand what you want, but I do not know how to do that yet.' };
            }
            return await handler.execute(userObjectId, intentData, context);
        }
        catch (error) {
            console.error('Execution Error:', error);
            return { success: false, message: error.message || 'An error occurred while executing the command.' };
        }
    }
}
exports.ActionExecutor = ActionExecutor;
//# sourceMappingURL=action.executor.js.map