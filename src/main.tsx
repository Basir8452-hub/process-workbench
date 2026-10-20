import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { App } from './App'
import { AppStoreProvider } from './store/AppStore'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorBgLayout: '#f4f6fb',
          colorBorder: '#e5eaf3',
          borderRadius: 10,
          fontFamily:
            "'Microsoft YaHei', 'PingFang SC', 'Segoe UI', system-ui, -apple-system, sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#0f172a',
            bodyBg: '#f4f6fb',
          },
          Menu: {
            darkItemBg: '#0f172a',
            darkSubMenuItemBg: '#0f172a',
            darkItemSelectedBg: 'rgba(37, 99, 235, 0.24)',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
            itemBorderRadius: 8,
          },
          Card: {
            paddingLG: 20,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            borderColor: '#eef2f7',
            headerSplitColor: 'transparent',
          },
          Button: {
            controlHeight: 34,
          },
        },
      }}
    >
      <AntApp>
        <AppStoreProvider>
          <App />
        </AppStoreProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
)
