import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveDraft,
  loadDraft,
  loadDraftRaw,
  clearDraft,
  getTabId,
  type DraftData,
} from '../utils/draftStorage';

/**
 * Custom hook for managing draft input with localStorage persistence
 * and real-time sync across browser tabs.
 *
 * Features:
 * - Self-echo prevention: Ignores storage events from the same tab
 * - Last-Write-Wins: Compares timestamps and only accepts newer values
 *
 * @param key - The localStorage key to use for this draft
 * @returns [value, setValue, clearValue] - Current value, setter, and clear function
 */
export function useDraft(
  key: string
): [string, (value: string) => void, () => void] {
  // Track current timestamp to implement Last-Write-Wins
  const lastTimestampRef = useRef<number>(0);

  // Initialize state from localStorage
  const [value, setValueState] = useState<string>(() => {
    const data = loadDraftRaw(key);
    if (data) {
      lastTimestampRef.current = data.timestamp;
      return data.value;
    }
    return '';
  });

  // Re-load draft when key changes
  useEffect(() => {
    const data = loadDraftRaw(key);
    if (data) {
      lastTimestampRef.current = data.timestamp;
      setValueState(data.value);
    } else {
      lastTimestampRef.current = 0;
      setValueState('');
    }
  }, [key]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const myTabId = getTabId();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;

      if (event.newValue === null) {
        // Key was removed - only accept if from another tab
        const oldData = event.oldValue ? parseDraftData(event.oldValue) : null;
        if (oldData && oldData.tabId !== myTabId) {
          lastTimestampRef.current = 0;
          setValueState('');
        }
        return;
      }

      const newData = parseDraftData(event.newValue);
      if (!newData) return;

      // Self-echo prevention: ignore changes from our own tab
      if (newData.tabId === myTabId) {
        return;
      }

      // Last-Write-Wins: only accept if newer than current
      if (newData.timestamp > lastTimestampRef.current) {
        lastTimestampRef.current = newData.timestamp;
        setValueState(newData.value);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  // Setter that updates both state and localStorage
  const setValue = useCallback(
    (newValue: string) => {
      setValueState(newValue);
      if (newValue) {
        saveDraft(key, newValue);
        // Update our timestamp reference
        const data = loadDraftRaw(key);
        if (data) {
          lastTimestampRef.current = data.timestamp;
        }
      } else {
        clearDraft(key);
        lastTimestampRef.current = 0;
      }
    },
    [key]
  );

  // Clear function
  const clear = useCallback(() => {
    setValueState('');
    clearDraft(key);
    lastTimestampRef.current = 0;
  }, [key]);

  return [value, setValue, clear];
}

/**
 * Parse JSON string to DraftData, returning null on failure
 */
function parseDraftData(json: string): DraftData | null {
  try {
    return JSON.parse(json) as DraftData;
  } catch {
    return null;
  }
}
