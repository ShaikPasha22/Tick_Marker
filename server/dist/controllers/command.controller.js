"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCommand = void 0;
const command_engine_1 = require("../ai/command.engine");
const errorHandler_1 = require("../middleware/errorHandler");
const engine = new command_engine_1.CommandEngine();
const processCommand = async (req, res, next) => {
    try {
        const { text, context, history } = req.body;
        if (!text) {
            throw (0, errorHandler_1.createError)('Command text is required', 400);
        }
        const result = await engine.processCommand(req.userId, text, context, history);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.processCommand = processCommand;
//# sourceMappingURL=command.controller.js.map