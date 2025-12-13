// ============================================
// WebSocket Message Types
// ============================================

// Client -> Server messages
export interface WSInitMessage {
  type: 'init';
}

export interface WSResumeMessage {
  type: 'resume';
  sessionId: string;
}

export interface WSUserMessage {
  type: 'user_message';
  content: string;
  model?: string;
  sessionId?: string;
}

export type IncomingWSMessage = WSInitMessage | WSResumeMessage | WSUserMessage;

// Server -> Client messages
export interface WSReadyResponse {
  type: 'ready';
}

export interface WSSessionCreatedResponse {
  type: 'session.created';
  sessionId: string;
}

export interface WSHistoryResponse {
  type: 'history';
  messages: any[];
}

export interface WSAssistantMessage {
  type: 'assistant_message';
  content: string;
}

export interface WSToolUseMessage {
  type: 'tool_use';
  toolName: string;
  toolId?: string;
  toolInput?: any;
}

export interface WSResultMessage {
  type: 'result';
  success: boolean;
}

export interface WSErrorMessage {
  type: 'error';
  error: string;
}

export type OutgoingWSMessage =
  | WSReadyResponse
  | WSSessionCreatedResponse
  | WSHistoryResponse
  | WSAssistantMessage
  | WSToolUseMessage
  | WSResultMessage
  | WSErrorMessage;

// Agent message type (used internally by backend)
export type AgentMessage =
  | WSSessionCreatedResponse
  | WSAssistantMessage
  | WSToolUseMessage
  | WSResultMessage
  | WSErrorMessage;
