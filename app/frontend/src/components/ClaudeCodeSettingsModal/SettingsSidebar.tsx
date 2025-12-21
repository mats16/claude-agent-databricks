/**
 * Settings sidebar navigation
 * Provides navigation between different settings sections
 */

import { useTranslation } from 'react-i18next';
import { Menu, ConfigProvider } from 'antd';
import {
  ThunderboltOutlined,
  TeamOutlined,
  ApiOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { colors } from '../../styles/theme';

export type SettingsSection = 'skills' | 'subagents' | 'mcp' | 'backup';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    {
      key: 'skills',
      icon: <ThunderboltOutlined />,
      label: t('claudeCodeSettings.skills'),
    },
    {
      key: 'subagents',
      icon: <TeamOutlined />,
      label: t('claudeCodeSettings.subagents'),
    },
    {
      key: 'mcp',
      icon: <ApiOutlined />,
      label: t('claudeCodeSettings.mcp'),
    },
    {
      key: 'backup',
      icon: <SaveOutlined />,
      label: t('claudeCodeSettings.backupRestore'),
    },
  ];

  return (
    <div
      style={{
        width: 200,
        height: '100%',
        backgroundColor: colors.sidebarBg,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemSelectedBg: colors.sessionActiveBg,
              itemSelectedColor: colors.textPrimary,
              itemHoverBg: colors.sessionActiveBg,
            },
          },
        }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={({ key }) => onSectionChange(key as SettingsSection)}
          style={{
            height: '100%',
            borderRight: 'none',
            backgroundColor: 'transparent',
          }}
        />
      </ConfigProvider>
    </div>
  );
}
