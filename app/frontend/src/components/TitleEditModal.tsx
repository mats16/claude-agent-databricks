import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Checkbox, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TitleEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  currentAutoWorkspacePush: boolean;
  onSave: (newTitle: string, autoWorkspacePush: boolean) => void;
  onClose: () => void;
}

export default function TitleEditModal({
  isOpen,
  currentTitle,
  currentAutoWorkspacePush,
  onSave,
  onClose,
}: TitleEditModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(currentTitle);
  const [autoWorkspacePush, setAutoWorkspacePush] = useState(
    currentAutoWorkspacePush
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setAutoWorkspacePush(currentAutoWorkspacePush);
    }
  }, [isOpen, currentTitle, currentAutoWorkspacePush]);

  const handleOk = async () => {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(title.trim(), autoWorkspacePush);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={t('titleEditModal.title')}
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      okText={isSaving ? t('common.saving') : t('common.save')}
      cancelText={t('common.cancel')}
      okButtonProps={{
        disabled: !title.trim(),
        loading: isSaving,
      }}
      cancelButtonProps={{
        disabled: isSaving,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('titleEditModal.sessionTitle')}
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titleEditModal.titlePlaceholder')}
          disabled={isSaving}
          autoFocus
          onPressEnter={handleOk}
        />
      </div>
      <div>
        <Checkbox
          checked={autoWorkspacePush}
          onChange={(e) => setAutoWorkspacePush(e.target.checked)}
          disabled={isSaving}
        >
          <SyncOutlined style={{ marginRight: 4 }} />
          {t('sidebar.autoSync')}
        </Checkbox>
        <Text
          type="secondary"
          style={{
            display: 'block',
            marginTop: 4,
            marginLeft: 24,
            fontSize: 12,
          }}
        >
          {t('titleEditModal.autoSyncHint')}
        </Text>
      </div>
    </Modal>
  );
}
