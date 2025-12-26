/**
 * Draft storage utilities for persisting chat input across page reloads.
 *
 * Keys:
 * - Sidebar: 'LSS-cc-new'
 * - Session: 'LSS-cc-session-{session_id}'
 */

export interface DraftData {
  value: string;
  tabId: string;
  timestamp: number;
}

const TAB_ID_KEY = 'LSS-tab-id';

/**
 * Get or create a unique tab ID stored in sessionStorage.
 * Each browser tab gets its own ID.
 */
export function getTabId(): string {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

/**
 * Save draft to localStorage with tab ID and timestamp.
 */
export function saveDraft(key: string, value: string): void {
  const data: DraftData = {
    value,
    tabId: getTabId(),
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load draft from localStorage.
 * Returns the value regardless of which tab saved it (most recent wins).
 */
export function loadDraft(key: string): string | null {
  const data = loadDraftRaw(key);
  return data?.value ?? null;
}

/**
 * Load raw draft data from localStorage.
 * Returns the full DraftData object including tabId and timestamp.
 */
export function loadDraftRaw(key: string): DraftData | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as DraftData;
  } catch {
    return null;
  }
}

/**
 * Clear draft from localStorage.
 */
export function clearDraft(key: string): void {
  localStorage.removeItem(key);
}

/** Key for sidebar draft */
export const SIDEBAR_DRAFT_KEY = 'LSS-cc-new';

/** Generate key for session draft */
export function getSessionDraftKey(sessionId: string): string {
  return `LSS-cc-session-${sessionId}`;
}
