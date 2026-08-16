import { AIProvider } from './ai.provider.interface';
import { StructuredIntent } from '../../commands/command.types';
export declare class GeminiProvider implements AIProvider {
    private ai;
    constructor();
    extractIntent(text: string): Promise<StructuredIntent>;
}
//# sourceMappingURL=gemini.provider.d.ts.map