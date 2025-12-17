import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Avatar, MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import SettingsModal from './SettingsModal';
import { useUser } from '../contexts/UserContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export default function AccountMenu() {
  const { t, i18n } = useTranslation();
  const { userInfo } = useUser();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false);
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
      />
    </>
  );
}
