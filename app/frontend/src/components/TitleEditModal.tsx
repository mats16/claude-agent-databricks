import { useState, useEffect, useRef } from 'react';

interface TitleEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  onSave: (newTitle: string) => void;
  onClose: () => void;
}

export default function TitleEditModal({
  isOpen,
  currentTitle,
  onSave,
  onClose,
}: TitleEditModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(title.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2>Edit Session Title</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session title..."
              className="modal-input"
              disabled={isSaving}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-button modal-button-cancel"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="modal-button modal-button-save"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
