import { useState, useEffect, useCallback } from 'react';

export interface Session {
  id: string;
  title: string | null;
  model: string;
  workspacePath: string | null;
  userEmail: string | null;
  autoSync: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseSessionsResult {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v1/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
  };
}
