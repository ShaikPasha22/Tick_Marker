import { StructuredIntent, CommandExecutionResult, CommandContext } from './command.types';
import './handlers/trip.handlers';
import './handlers/finance.handlers';
import './handlers/habit.handlers';
import './handlers/navigation.handlers';
export declare class ActionExecutor {
    static execute(userId: string, intentData: StructuredIntent, context?: CommandContext): Promise<CommandExecutionResult>;
}
//# sourceMappingURL=action.executor.d.ts.map