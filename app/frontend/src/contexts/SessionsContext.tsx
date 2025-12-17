import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

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

interface SessionsContextType {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getSession: (sessionId: string) => Session | undefined;
  updateSessionLocally: (
    sessionId: string,
    updates: Partial<Session>
  ) => void;
}

const SessionsContext = createContext<SessionsContextType | undefined>(
  undefined
);

interface SessionsProviderProps {
  children: ReactNode;
}

export function SessionsProvider({ children }: SessionsProviderProps) {
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

  const getSession = useCallback(
    (sessionId: string) => {
      return sessions.find((s) => s.id === sessionId);
    },
    [sessions]
  );

  const updateSessionLocally = useCallback(
    (sessionId: string, updates: Partial<Session>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        isLoading,
        error,
        refetch: fetchSessions,
        getSession,
        updateSessionLocally,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessions() {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
}
