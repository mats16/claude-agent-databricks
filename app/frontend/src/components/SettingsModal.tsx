import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Alert,
  Typography,
  Flex,
  Switch,
  Divider,
  Steps,
  Spin,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

const { Text, Title, Link } = Typography;

export interface UserSettings {
  userId: string;
  hasAccessToken: boolean;
  claudeConfigSync: boolean;
}

interface ServicePrincipalInfo {
  displayName: string;
  applicationId: string | null;
  databricksHost: string | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
  onPermissionGranted?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isInitialSetup = false,
  onPermissionGranted,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [spInfo, setSpInfo] = useState<ServicePrincipalInfo | null>(null);
  const [claudeConfigSync, setClaudeConfigSync] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const checkPermission = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      // Get user info (includes permission check)
      const userRes = await fetch('/api/v1/users/me');
      if (userRes.ok) {
        const userData = await userRes.json();

        if (userData.hasWorkspacePermission) {
          setHasPermission(true);
          onPermissionGranted?.();
        } else {
          setHasPermission(false);
          // Fetch SP info for instructions
          const spRes = await fetch('/api/v1/service-principal');
          if (spRes.ok) {
            const spData = await spRes.json();
            setSpInfo(spData);
          }
        }
      } else {
        setHasPermission(false);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/v1/users/me/settings');
      if (settingsRes.ok) {
        const settingsData: UserSettings = await settingsRes.json();
        setClaudeConfigSync(settingsData.claudeConfigSync);
      }
    } catch (error) {
      console.error('Failed to check permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, [onPermissionGranted]);

  useEffect(() => {
    if (isOpen) {
      checkPermission();
    }
  }, [isOpen, checkPermission]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/users/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claudeConfigSync }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: t('settingsModal.saved') });
      window.dispatchEvent(new Event('settings-changed'));

      if (isInitialSetup && hasPermission) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch {
      setMessage({ type: 'error', text: t('settingsModal.saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPermissionInstructions = () => (
    <div>
      <Alert
        type="warning"
        icon={<ExclamationCircleOutlined />}
        message={t('settingsModal.noPermission')}
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Steps
        direction="vertical"
        size="small"
        current={-1}
        items={[
          {
            title: (
              <Link
                href={`https://${spInfo?.databricksHost}/browse`}
                target="_blank"
              >
                {t('settingsModal.step1')}
              </Link>
            ),
          },
          {
            title: (
              <>
                {t('settingsModal.step2Prefix')}{' '}
                <Text strong>{spInfo?.displayName || 'Service Principal'}</Text>{' '}
                {t('settingsModal.step2Suffix')} <Text code>Can Edit</Text>{' '}
                {t('settingsModal.step2Permission')}
              </>
            ),
          },
        ]}
      />

      <Flex justify="center" style={{ marginTop: 24 }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={checkPermission}
          loading={isLoading}
        >
          {t('settingsModal.checkAgain')}
        </Button>
      </Flex>
    </div>
  );

  const renderSettings = () => (
    <div>
      {isInitialSetup && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          message={t('settingsModal.permissionGranted')}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Claude Config Sync Section */}
      <div style={{ marginBottom: 16 }}>
        <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
          <SyncOutlined style={{ color: '#f5a623' }} />
          <Title level={5} style={{ margin: 0 }}>
            {t('settingsModal.claudeConfigSyncTitle')}
          </Title>
        </Flex>

        <Flex justify="space-between" align="center">
          <div style={{ flex: 1, marginRight: 16 }}>
            <Text type="secondary">
              {t('settingsModal.claudeConfigSyncDescription')}
            </Text>
          </div>
          <Switch
            checked={claudeConfigSync}
            onChange={setClaudeConfigSync}
            disabled={isSaving || isLoading}
          />
        </Flex>
      </div>

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );

  const canClose = !isInitialSetup || hasPermission === true;

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <FolderOpenOutlined style={{ color: '#f5a623' }} />
          {isInitialSetup
            ? t('settingsModal.initialTitle')
            : t('settingsModal.title')}
        </Flex>
      }
      open={isOpen}
      onOk={hasPermission ? handleSave : undefined}
      onCancel={canClose ? onClose : undefined}
      okText={isSaving ? t('common.saving') : t('common.save')}
      cancelText={t('common.close')}
      okButtonProps={{
        disabled: !hasPermission,
        loading: isSaving,
        style: hasPermission ? undefined : { display: 'none' },
      }}
      cancelButtonProps={{
        disabled: isSaving,
        style: canClose ? undefined : { display: 'none' },
      }}
      closable={canClose}
      maskClosable={canClose}
      keyboard={canClose}
      width={440}
    >
      {isLoading && hasPermission === null ? (
        <Flex justify="center" align="center" style={{ minHeight: 200 }}>
          <Spin size="large" />
        </Flex>
      ) : hasPermission ? (
        renderSettings()
      ) : (
        renderPermissionInstructions()
      )}

      {!isLoading && hasPermission && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Flex justify="center">
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={checkPermission}
              size="small"
            >
              {t('settingsModal.recheckPermission')}
            </Button>
          </Flex>
        </>
      )}
    </Modal>
  );
}
