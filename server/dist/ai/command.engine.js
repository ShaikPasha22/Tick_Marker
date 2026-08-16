"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandEngine = void 0;
const openrouter_provider_1 = require("./providers/openrouter.provider");
const action_executor_1 = require("../commands/action.executor");
const command_types_1 = require("../commands/command.types");
class CommandEngine {
    constructor() {
        this.provider = new openrouter_provider_1.OpenRouterProvider();
    }
    async processCommand(userId, text, context, history) {
        try {
            // 1. Extract Intent
            const structuredIntent = await this.provider.extractIntent(text, context, history);
            // 2. Confidence Check
            if (structuredIntent.confidence === command_types_1.ConfidenceLevel.LOW) {
                return {
                    success: false,
                    message: structuredIntent.reasoning || "I'm not sure what you mean. Could you rephrase?",
                    actionRequired: 'CLARIFICATION_NEEDED'
                };
            }
            // 3. Execution
            const result = await action_executor_1.ActionExecutor.execute(userId, structuredIntent, context);
            return result;
        }
        catch (error) {
            console.error('Command Engine Error:', error);
            return {
                success: false,
                message: 'Sorry, I encountered an error processing that command.'
            };
        }
    }
}
exports.CommandEngine = CommandEngine;
//# sourceMappingURL=command.engine.js.map