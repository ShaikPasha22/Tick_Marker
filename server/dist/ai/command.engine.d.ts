import { CommandExecutionResult } from '../commands/command.types';
export declare class CommandEngine {
    private provider;
    constructor();
    processCommand(userId: string, text: string, context?: any, history?: {
        role: string;
        content: string;
    }[]): Promise<CommandExecutionResult>;
}
//# sourceMappingURL=command.engine.d.ts.map