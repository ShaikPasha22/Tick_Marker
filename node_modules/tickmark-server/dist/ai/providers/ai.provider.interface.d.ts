import { StructuredIntent } from '../../commands/command.types';
export interface AIProvider {
    extractIntent(text: string, context?: any, history?: {
        role: string;
        content: string;
    }[]): Promise<StructuredIntent>;
}
//# sourceMappingURL=ai.provider.interface.d.ts.map