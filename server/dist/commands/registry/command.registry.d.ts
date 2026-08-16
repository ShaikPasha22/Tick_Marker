import { Types } from 'mongoose';
import { Intent, StructuredIntent, CommandExecutionResult, CommandContext } from '../command.types';
export interface CommandHandler {
    execute(userId: Types.ObjectId, intentData: StructuredIntent, context?: CommandContext): Promise<CommandExecutionResult>;
}
export declare class CommandRegistry {
    private static handlers;
    static register(intent: Intent, handler: CommandHandler): void;
    static getHandler(intent: Intent): CommandHandler | undefined;
}
//# sourceMappingURL=command.registry.d.ts.map