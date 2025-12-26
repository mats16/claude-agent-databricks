import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

/**
 * Custom hook for managing draft input with localStorage persistence
 * and real-time sync across browser tabs using use-local-storage-state.
 *
 * @param key - The localStorage key to use for this draft
 * @returns [value, setValue, clearValue] - Current value, setter, and clear function
 */
export function useDraft(
  key: string
): [string, (value: string) => void, () => void] {
  const [value, setValue, { removeItem }] = useLocalStorageState(key, {
    defaultValue: '',
  });

  // Clear function
  const clear = useCallback(() => {
    removeItem();
  }, [removeItem]);

  return [value, setValue, clear];
}

/** Key for sidebar draft */
export const SIDEBAR_DRAFT_KEY = 'LSS-cc-new';

/** Generate key for session draft */
export function getSessionDraftKey(sessionId: string): string {
  return `LSS-cc-session-${sessionId}`;
}
