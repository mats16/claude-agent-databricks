import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TitleEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  currentAutoSync: boolean;
  onSave: (newTitle: string, autoSync: boolean) => void;
  onClose: () => void;
}

export default function TitleEditModal({
  isOpen,
  currentTitle,
  currentAutoSync,
  onSave,
  onClose,
}: TitleEditModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(currentTitle);
  const [autoSync, setAutoSync] = useState(currentAutoSync);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setAutoSync(currentAutoSync);
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, currentTitle, currentAutoSync]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(title.trim(), autoSync);
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
          <h2>{t('titleEditModal.title')}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label className="modal-label">
                {t('titleEditModal.sessionTitle')}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titleEditModal.titlePlaceholder')}
                className="modal-input"
                disabled={isSaving}
              />
            </div>
            <div className="modal-field">
              <label className="modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  disabled={isSaving}
                  className="modal-checkbox"
                />
                <span>{t('sidebar.autoSync')}</span>
              </label>
              <p className="modal-hint">{t('titleEditModal.autoSyncHint')}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-button modal-button-cancel"
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="modal-button modal-button-save"
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
