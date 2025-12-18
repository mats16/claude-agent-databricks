import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Tooltip, Typography, Flex } from 'antd';
import { SendOutlined, RocketOutlined } from '@ant-design/icons';
import SessionList from './SessionList';
import AccountMenu from './AccountMenu';
import WorkspaceSelectModal from './WorkspaceSelectModal';
import WorkspacePathSelector from './WorkspacePathSelector';
import SettingsModal from './SettingsModal';
import ImageUpload from './ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import { useUser } from '../contexts/UserContext';
import type { MessageContent } from '@app/shared';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import {
  inputContainerStyle,
  getDropZoneStyle,
  dropZoneOverlayStyle,
  footerStyle,
} from '../styles/common';

const { TextArea } = Input;
const { Text } = Typography;

interface SidebarProps {
  width?: number;
  onSessionCreated?: (sessionId: string) => void;
}

export default function Sidebar({ onSessionCreated }: SidebarProps) {
  const { t } = useTranslation();
  const { userInfo, isLoading } = useUser();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(
    'databricks-claude-sonnet-4-5'
  );
  const [workspacePath, setWorkspacePath] = useState('');
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoWorkspacePush, setAutoWorkspacePush] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const navigate = useNavigate();

  const maxImages = 5;

  // Image upload handling via custom hook
  const {
    attachedImages,
    setAttachedImages,
    isConverting,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    convertImages,
    clearImages,
  } = useImageUpload({
    maxImages,
    isDisabled: () => isSubmitting || isConverting,
  });

  const hasPermission = userInfo?.hasWorkspacePermission ?? null;

  // Show permission modal if no permission after loading, hide if permission granted
  useEffect(() => {
    if (!isLoading) {
      if (hasPermission === false) {
        setShowPermissionModal(true);
      } else if (hasPermission === true) {
        setShowPermissionModal(false);
      }
    }
  }, [isLoading, hasPermission]);

  const handleSubmit = async () => {
    if (
      (!input.trim() && attachedImages.length === 0) ||
      isSubmitting ||
      isConverting
    )
      return;

    setIsSubmitting(true);

    try {
      // Convert attached images to WebP format using hook
      const imageContents = await convertImages();

      // Build message content array
      const messageContent: MessageContent[] = [];
      if (input.trim()) {
        messageContent.push({ type: 'text', text: input.trim() });
      }
      messageContent.push(...imageContents);

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
              message: { role: 'user', content: messageContent },
            },
          ],
          session_context: {
            model: selectedModel,
            workspacePath: workspacePath.trim() || undefined,
            autoWorkspacePush,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const sessionId = data.session_id;

      setInput('');
      clearImages();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePermissionGranted = () => {
    setShowPermissionModal(false);
  };

  // Handle workspace path change: enable auto sync when path is set, disable when cleared
  const handleWorkspacePathChange = (path: string) => {
    setWorkspacePath(path);
    setAutoWorkspacePush(path.trim().length > 0);
  };

  return (
    <Flex
      vertical
      style={{
        height: '100%',
        background: colors.sidebarBg,
      }}
    >
      {/* Header */}
      <div style={{ padding: `${spacing.lg}px ${spacing.xl}px` }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Typography.Title
            level={5}
            style={{
              margin: 0,
              color: colors.textPrimary,
              fontWeight: typography.fontWeightBold,
            }}
          >
            {t('sidebar.title')}
          </Typography.Title>
        </Link>
      </div>

      {/* Input Section - Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: `${spacing.lg}px ${spacing.xl}px`,
          borderBottom: `1px solid ${colors.border}`,
          position: 'relative',
          background: isDragging ? colors.brandLight : 'transparent',
          ...getDropZoneStyle(isDragging),
        }}
      >
        {isDragging && (
          <div style={dropZoneOverlayStyle}>
            <span
              style={{
                color: colors.brand,
                fontWeight: typography.fontWeightMedium,
              }}
            >
              {t('imageUpload.dropHere')}
            </span>
          </div>
        )}
        <div style={inputContainerStyle}>
          {/* Image previews */}
          <ImageUpload
            images={attachedImages}
            onImagesChange={setAttachedImages}
            disabled={isSubmitting || isConverting}
            showButtonOnly={false}
          />
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('sidebar.placeholder')}
            disabled={isSubmitting || isConverting}
            autoSize={{ minRows: 3, maxRows: 19 }}
            variant="borderless"
            style={{ padding: 0, marginBottom: spacing.sm }}
          />
          <Flex justify="flex-end" align="center" gap={spacing.sm}>
            <ImageUpload
              images={attachedImages}
              onImagesChange={setAttachedImages}
              disabled={isSubmitting || isConverting}
              showButtonOnly={true}
            />
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isSubmitting || isConverting}
              style={{ width: 120 }}
              size="small"
              options={[
                { value: 'databricks-claude-opus-4-5', label: 'Opus 4.5' },
                { value: 'databricks-claude-sonnet-4-5', label: 'Sonnet 4.5' },
              ]}
            />
            <Tooltip
              title={!hasPermission ? t('sidebar.permissionRequired') : ''}
            >
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                loading={isSubmitting || isConverting}
                disabled={
                  (!input.trim() && attachedImages.length === 0) ||
                  !hasPermission
                }
                onClick={handleSubmit}
              />
            </Tooltip>
          </Flex>
        </div>

        <div style={{ marginTop: spacing.sm }}>
          <WorkspacePathSelector
            workspacePath={workspacePath}
            onPathChange={handleWorkspacePathChange}
            autoWorkspacePush={autoWorkspacePush}
            onAutoWorkspacePushChange={setAutoWorkspacePush}
            onOpenModal={() => setIsWorkspaceModalOpen(true)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Sessions Section */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SessionList />
      </div>

      {/* Footer */}
      <Flex justify="space-between" align="center" style={footerStyle}>
        <AccountMenu />
        {userInfo?.databricksAppUrl && (
          <Tooltip title="Databricks Apps">
            <Button
              type="text"
              icon={<RocketOutlined />}
              onClick={() => window.open(userInfo.databricksAppUrl!, '_blank')}
              style={{ color: colors.textSecondary }}
            />
          </Tooltip>
        )}
      </Flex>

      <WorkspaceSelectModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onSelect={handleWorkspacePathChange}
        initialPath={workspacePath || userInfo?.workspaceHome}
      />

      <SettingsModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        isInitialSetup={!hasPermission}
        onPermissionGranted={handlePermissionGranted}
      />
    </Flex>
  );
}
