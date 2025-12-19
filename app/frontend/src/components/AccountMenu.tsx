import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Avatar, MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  SaveOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import AppSettingsModal from './AppSettingsModal';
import SettingsModal from './SettingsModal';
import SkillsModal from './SkillsModal';
import SubagentModal from './SubagentModal';
import { useUser } from '../contexts/UserContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export default function AccountMenu() {
  const { t, i18n } = useTranslation();
  const { userInfo } = useUser();
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isSubagentModalOpen, setIsSubagentModalOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleOpenAppSettings = () => {
    setIsAppSettingsModalOpen(true);
  };

  const handleCloseAppSettings = () => {
    setIsAppSettingsModalOpen(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
  };

  const handleOpenSkills = () => {
    setIsSkillsModalOpen(true);
  };

  const handleCloseSkills = () => {
    setIsSkillsModalOpen(false);
  };

  const handleOpenSubagents = () => {
    setIsSubagentModalOpen(true);
  };

  const handleCloseSubagents = () => {
    setIsSubagentModalOpen(false);
  };

  const displayEmail = userInfo?.email || 'User';
  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const languageItems: MenuProps['items'] = LANGUAGES.map((lang) => ({
    key: lang.code,
    label: (
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: 100,
        }}
      >
        {lang.label}
        {lang.code === i18n.language && (
          <CheckOutlined style={{ color: '#f5a623' }} />
        )}
      </span>
    ),
    onClick: () => handleLanguageChange(lang.code),
  }));

  const items: MenuProps['items'] = [
    {
      key: 'header',
      label: (
        <div style={{ padding: '4px 0', fontWeight: 500 }}>{displayEmail}</div>
      ),
      disabled: true,
      style: { cursor: 'default' },
    },
    { type: 'divider' },
    {
      key: 'app-settings',
      icon: <SettingOutlined />,
      label: t('accountMenu.appSettings'),
      onClick: handleOpenAppSettings,
    },
    {
      key: 'claude-code-settings',
      icon: <RobotOutlined />,
      label: t('accountMenu.claudeCodeSettings'),
      children: [
        {
          key: 'skills',
          icon: <ThunderboltOutlined />,
          label: t('accountMenu.skills'),
          onClick: handleOpenSkills,
        },
        {
          key: 'subagents',
          icon: <TeamOutlined />,
          label: t('accountMenu.subagents'),
          onClick: handleOpenSubagents,
        },
        {
          key: 'auto-backup',
          icon: <SaveOutlined />,
          label: t('accountMenu.autoBackup'),
          onClick: handleOpenSettings,
        },
      ],
    },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: (
        <span
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {t('accountMenu.language')}
          <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
            {currentLang.label}
          </span>
        </span>
      ),
      children: languageItems,
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']} placement="topLeft">
        <Avatar
          icon={<UserOutlined />}
          style={{
            backgroundColor: '#f5a623',
            cursor: 'pointer',
          }}
        />
      </Dropdown>

      <AppSettingsModal
        isOpen={isAppSettingsModalOpen}
        onClose={handleCloseAppSettings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
      />

      <SkillsModal isOpen={isSkillsModalOpen} onClose={handleCloseSkills} />

      <SubagentModal
        isOpen={isSubagentModalOpen}
        onClose={handleCloseSubagents}
      />
    </>
  );
}
