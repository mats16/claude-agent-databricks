import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Checkbox, Typography, Button } from 'antd';
import { SyncOutlined, FolderOutlined } from '@ant-design/icons';
import WorkspaceSelectModal from './WorkspaceSelectModal';
import { useUser } from '../contexts/UserContext';

const { Text } = Typography;

interface TitleEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  currentAutoWorkspacePush: boolean;
  currentWorkspacePath: string | null;
  onSave: (
    newTitle: string,
    autoWorkspacePush: boolean,
    workspacePath: string | null
  ) => void;
  onClose: () => void;
}

export default function TitleEditModal({
  isOpen,
  currentTitle,
  currentAutoWorkspacePush,
  currentWorkspacePath,
  onSave,
  onClose,
}: TitleEditModalProps) {
  const { t } = useTranslation();
  const { userInfo } = useUser();
  const [title, setTitle] = useState(currentTitle);
  const [autoWorkspacePush, setAutoWorkspacePush] = useState(
    currentAutoWorkspacePush
  );
  const [workspacePath, setWorkspacePath] = useState<string | null>(
    currentWorkspacePath
  );
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setAutoWorkspacePush(currentAutoWorkspacePush);
      setWorkspacePath(currentWorkspacePath);
    }
  }, [isOpen, currentTitle, currentAutoWorkspacePush, currentWorkspacePath]);

  const handleOk = async () => {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(title.trim(), autoWorkspacePush, workspacePath);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle workspace path change: enable auto sync when path is set, disable when cleared
  const handleWorkspacePathChange = (path: string) => {
    setWorkspacePath(path);
    setAutoWorkspacePush(path.trim().length > 0);
    setIsWorkspaceModalOpen(false);
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
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('titleEditModal.workspacePath')}
        </Text>
        <Button
          icon={<FolderOutlined />}
          onClick={() => setIsWorkspaceModalOpen(true)}
          disabled={isSaving}
          block
          style={{
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {workspacePath || t('titleEditModal.noWorkspacePath')}
          </span>
        </Button>
        <Text
          type="secondary"
          style={{ display: 'block', marginTop: 4, fontSize: 12 }}
        >
          {t('titleEditModal.workspacePathHint')}
        </Text>
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
      <WorkspaceSelectModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onSelect={handleWorkspacePathChange}
        initialPath={workspacePath || userInfo?.workspaceHome}
      />
    </Modal>
  );
}
