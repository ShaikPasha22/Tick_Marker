"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_registry_1 = require("../registry/command.registry");
const command_types_1 = require("../command.types");
class NavigateHandler {
    async execute(userId, intentData, context) {
        const { pageTarget, targetId } = intentData.entities;
        if (!pageTarget) {
            return { success: false, message: 'Where would you like to go?', actionRequired: 'CLARIFICATION_NEEDED', missingFields: ['pageTarget'] };
        }
        let url = `/${pageTarget}`;
        // If it's a specific trip
        if (pageTarget === 'trip' && targetId) {
            url = `/trips/${targetId}`;
        }
        else if (pageTarget === 'trips') {
            url = '/trips';
        }
        return {
            success: true,
            message: `Navigating to ${pageTarget}...`,
            data: {
                action: 'NAVIGATE',
                url
            }
        };
    }
}
command_registry_1.CommandRegistry.register(command_types_1.Intent.NAVIGATE, new NavigateHandler());
//# sourceMappingURL=navigation.handlers.js.map