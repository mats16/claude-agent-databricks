import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Avatar, MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
  LogoutOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import SettingsModal from './SettingsModal';
import { useUser } from '../contexts/UserContext';

interface AccountMenuProps {
  userEmail?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export default function AccountMenu({ userEmail }: AccountMenuProps) {
  const { t, i18n } = useTranslation();
  const { userSettings, isLoading } = useUser();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const hasCheckedSettings = useRef(false);

  // Check settings when userSettings is loaded
  useEffect(() => {
    if (!isLoading && userSettings && !hasCheckedSettings.current) {
      hasCheckedSettings.current = true;
      // Show initial setup modal if no token configured
      if (!userSettings.hasAccessToken) {
        setIsInitialSetup(true);
        setIsSettingsModalOpen(true);
      }
    }
  }, [isLoading, userSettings]);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleOpenSettings = () => {
    setIsInitialSetup(false);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
    setIsInitialSetup(false);
  };

  const displayName = userEmail || 'User';
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
        <div style={{ padding: '4px 0', fontWeight: 500 }}>{displayName}</div>
      ),
      disabled: true,
      style: { cursor: 'default' },
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('accountMenu.settings'),
      onClick: handleOpenSettings,
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
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('accountMenu.logout'),
      danger: true,
      onClick: handleLogout,
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
        isInitialSetup={isInitialSetup}
      />
    </>
  );
}
