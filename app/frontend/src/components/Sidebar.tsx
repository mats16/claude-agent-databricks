import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionList from './SessionList';

interface SidebarProps {
  width?: number;
  onSessionCreated?: (sessionId: string) => void;
}

export default function Sidebar({ width, onSessionCreated }: SidebarProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('databricks-claude-sonnet-4-5');
  const [workspacePath, setWorkspacePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: [
            {
              uuid: crypto.randomUUID(),
              session_id: '',
              type: 'user',
              message: { role: 'user', content: input.trim() },
            },
          ],
          session_context: {
            model: selectedModel,
            workspacePath: workspacePath.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const sessionId = data.session_id;

      setInput('');
      onSessionCreated?.(sessionId);

      navigate(`/sessions/${sessionId}`, {
        state: {
          initialMessage: input.trim(),
        },
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="sidebar" style={width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}>
      <div className="sidebar-header">
        <h1 className="sidebar-title">Claude Code</h1>
        <span className="sidebar-subtitle">on Databricks</span>
      </div>

      <form className="sidebar-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Start a new chat..."
          className="sidebar-input"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="sidebar-submit"
        >
          {isSubmitting ? '...' : '+'}
        </button>
      </form>

      <div className="sidebar-controls">
        <div className="sidebar-control-group">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="sidebar-select"
            disabled={isSubmitting}
          >
            <option value="databricks-claude-sonnet-4-5">Sonnet 4.5</option>
            <option value="databricks-claude-opus-4-5">Opus 4.5</option>
          </select>
        </div>

        <div className="sidebar-control-group">
          <input
            type="text"
            value={workspacePath}
            onChange={(e) => setWorkspacePath(e.target.value)}
            placeholder="/Workspace/Users/..."
            className="sidebar-workspace-input"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>Sessions</span>
        </div>
        <SessionList />
      </div>
    </aside>
  );
}
