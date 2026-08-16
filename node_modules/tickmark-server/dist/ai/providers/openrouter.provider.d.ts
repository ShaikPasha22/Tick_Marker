import { AIProvider } from './ai.provider.interface';
import { StructuredIntent } from '../../commands/command.types';
export declare class OpenRouterProvider implements AIProvider {
    private apiKey;
    private model;
    constructor();
    extractIntent(text: string, context?: any, history?: {
        role: string;
        content: string;
    }[]): Promise<StructuredIntent>;
}
//# sourceMappingURL=openrouter.provider.d.ts.map