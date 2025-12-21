/**
 * Unified Claude Code Settings Modal
 * Combines Skills, Subagents, MCP, and Backup/Restore settings into one modal
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Flex } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import SettingsSidebar, { type SettingsSection } from './SettingsSidebar';
import SkillsSection from './sections/SkillsSection';
import SubagentsSection from './sections/SubagentsSection';
import McpSection from './sections/McpSection';
import BackupRestoreSection from './sections/BackupRestoreSection';
import { colors, spacing } from '../../styles/theme';

interface ClaudeCodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaudeCodeSettingsModal({
  isOpen,
  onClose,
}: ClaudeCodeSettingsModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('skills');

  const renderSection = () => {
    switch (activeSection) {
      case 'skills':
        return (
          <SkillsSection isVisible={isOpen && activeSection === 'skills'} />
        );
      case 'subagents':
        return (
          <SubagentsSection
            isVisible={isOpen && activeSection === 'subagents'}
          />
        );
      case 'mcp':
        return <McpSection />;
      case 'backup':
        return (
          <BackupRestoreSection
            isVisible={isOpen && activeSection === 'backup'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={spacing.sm}>
          <RobotOutlined style={{ color: colors.brand }} />
          {t('claudeCodeSettings.title')}
        </Flex>
      }
      open={isOpen}
      onCancel={onClose}
      width={1200}
      footer={null}
      rootClassName="claude-code-settings-modal"
      styles={{
        header: {
          backgroundColor: colors.backgroundSecondary,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 0,
        },
        body: {
          padding: 0,
          height: 700,
          backgroundColor: colors.backgroundSecondary,
        },
      }}
    >
      <Flex style={{ height: '100%' }}>
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            backgroundColor: colors.background,
          }}
        >
          {renderSection()}
        </div>
      </Flex>
    </Modal>
  );
}
