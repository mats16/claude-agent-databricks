// Agent message types sent to frontend
export interface AgentMessage {
  type: 'session_init' | 'assistant_message' | 'tool_use' | 'result' | 'error';
  sessionId?: string;
  content?: string;
  toolName?: string;
  toolId?: string;
  toolInput?: any;
  success?: boolean;
  error?: string;
}

// WebSocket incoming messages from frontend
export interface WSInitMessage {
  type: 'init';
}

export interface WSChatMessage {
  type: 'message';
  content: string;
  model?: string;
  sessionId?: string;
}

export type IncomingWSMessage = WSInitMessage | WSChatMessage;

// WebSocket outgoing messages to frontend
export interface WSInitResponse {
  type: 'init';
  status: 'ready';
  workspacePath: string;
}

export interface WSErrorResponse {
  type: 'error';
  error: string;
}

export type OutgoingWSMessage = WSInitResponse | WSErrorResponse | AgentMessage;
