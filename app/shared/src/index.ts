// ============================================
// WebSocket Message Types (Client -> Server)
// ============================================

export interface WSConnectMessage {
  type: 'connect';
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

export type IncomingWSMessage =
  | WSConnectMessage
  | WSResumeMessage
  | WSUserMessage;

// ============================================
// WebSocket Message Types (Server -> Client)
// Server sends SDKMessage from @anthropic-ai/claude-agent-sdk directly
// Plus these control messages:
// ============================================

export interface WSConnectedResponse {
  type: 'connected';
}

export interface WSErrorResponse {
  type: 'error';
  error: string;
}

// ============================================
// REST API Types
// ============================================

// POST /api/v1/sessions
export interface CreateSessionRequest {
  events: Array<{
    uuid: string;
    session_id: string;
    type: string;
    message: { role: string; content: string };
  }>;
  session_context: {
    model: string;
    workspacePath?: string;
  };
}

export interface CreateSessionResponse {
  session_id: string;
}

// GET /api/v1/sessions/:sessionId/events
// Returns SDKMessage[] from the database
// The SDKMessage type is defined in @anthropic-ai/claude-agent-sdk
