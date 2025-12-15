import { useNavigate, useParams } from 'react-router-dom';
import { useSessions, Session } from '../hooks/useSessions';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

interface SessionListProps {
  onSessionSelect?: () => void;
}

export default function SessionList({ onSessionSelect }: SessionListProps) {
  const { sessions, isLoading, error } = useSessions();
  const navigate = useNavigate();
  const { sessionId: currentSessionId } = useParams<{ sessionId: string }>();

  const handleSessionClick = (session: Session) => {
    navigate(`/sessions/${session.id}`);
    onSessionSelect?.();
  };

  if (isLoading) {
    return <div className="session-list-loading">Loading sessions...</div>;
  }

  if (error) {
    return <div className="session-list-error">Error: {error}</div>;
  }

  if (sessions.length === 0) {
    return <div className="session-list-empty">No sessions yet</div>;
  }

  return (
    <div className="session-list">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
          onClick={() => handleSessionClick(session)}
        >
          <div className="session-item-title">
            {session.title || 'Untitled session'}
          </div>
          <div className="session-item-meta">
            <span className="session-item-date">
              {formatDate(session.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
