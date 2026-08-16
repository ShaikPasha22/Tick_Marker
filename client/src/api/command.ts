import api from './axios';

export interface CommandResponse {
  status: 'success' | 'needs_input' | 'needs_confirmation' | 'cancelled' | 'error';
  message: string;
  action?: string;
  requires_input: boolean;
  requires_confirmation: boolean;
  missing_fields: string[];
  data?: any;
}

export const commandApi = {
  processCommand: async (text: string, context?: any, history?: {role: string, content: string}[]): Promise<CommandResponse> => {
    // Generate a simple session ID if one doesn't exist for the current conversation
    let sessionId = sessionStorage.getItem('agent_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(7);
      sessionStorage.setItem('agent_session_id', sessionId);
    }

    const response = await api.post<CommandResponse>('http://localhost:8000/agent/command', { 
      text, 
      context, 
      history,
      session_id: sessionId
    });
    return response.data;
  },
};
