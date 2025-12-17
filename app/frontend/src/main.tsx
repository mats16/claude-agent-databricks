import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/700.css';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import './i18n';
import './index.css';

const theme = {
  token: {
    colorPrimary: '#f5a623',
    colorSuccess: '#4caf50',
    colorError: '#f44336',
    colorWarning: '#ff9800',
    borderRadius: 8,
    fontFamily:
      "'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif",
  },
  components: {
    Button: {
      primaryShadow: 'none',
    },
    Input: {
      activeBorderColor: '#f5a623',
      hoverBorderColor: '#f5a623',
    },
    Modal: {
      borderRadiusLG: 12,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <UserProvider>
          <App />
        </UserProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
