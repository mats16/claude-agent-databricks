// ============================================
// Session Response Types
// ============================================

/**
 * Session item in list response (minimal data)
 */
export interface SessionListItem {
  id: string;
  title: string | null;
  workspacePath: string | null;
  workspaceAutoPush: boolean;
  appAutoDeploy: boolean;
  updatedAt: string;
  isArchived: boolean;
}

/**
 * GET /api/v1/sessions response
 */
export interface SessionListResponse {
  sessions: SessionListItem[];
}

/**
 * GET /api/v1/sessions/:id response (detailed session data)
 */
export interface SessionResponse {
  id: string;
  title: string | null;
  summary: string | null;
  workspace_path: string | null;
  workspace_url: string | null;
  workspace_auto_push: boolean;
  local_path: string;
  is_archived: boolean;
  last_used_model: string | null;
  created_at: string;
  updated_at: string;
}
