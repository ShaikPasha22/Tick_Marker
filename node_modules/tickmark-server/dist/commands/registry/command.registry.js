"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
class CommandRegistry {
    static register(intent, handler) {
        this.handlers.set(intent, handler);
    }
    static getHandler(intent) {
        return this.handlers.get(intent);
    }
}
exports.CommandRegistry = CommandRegistry;
CommandRegistry.handlers = new Map();
//# sourceMappingURL=command.registry.js.map