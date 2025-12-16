import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions, Session } from '../hooks/useSessions';

interface SessionListProps {
  onSessionSelect?: () => void;
}

export default function SessionList({ onSessionSelect }: SessionListProps) {
  const { t, i18n } = useTranslation();
  const { sessions, isLoading, error } = useSessions();
  const navigate = useNavigate();
  const { sessionId: currentSessionId } = useParams<{ sessionId: string }>();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('sessionList.justNow');
    if (diffMins < 60) return t('sessionList.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('sessionList.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('sessionList.daysAgo', { count: diffDays });

    return date.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSessionClick = (session: Session) => {
    navigate(`/sessions/${session.id}`);
    onSessionSelect?.();
  };

  if (isLoading) {
    return (
      <div className="session-list-loading">
        {t('sessionList.loadingSessions')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-list-error">
        {t('common.error')}: {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="session-list-empty">{t('sessionList.noSessions')}</div>
    );
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
            {session.title || t('sessionList.untitledSession')}
          </div>
          <div className="session-item-meta">
            {session.workspacePath && (
              <div className="session-item-path">{session.workspacePath}</div>
            )}
            <div className="session-item-date">
              {formatDate(session.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
