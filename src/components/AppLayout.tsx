import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckSquareOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ReadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { useEffect, useRef, type ReactNode } from 'react'
import { useAppStore } from '../store/AppStore'
import { monthLabel, today, weekdayLabel } from '../utils/date'

const { Sider, Header, Content } = Layout

export type PageKey =
  | 'dashboard'
  | 'news'
  | 'tasks'
  | 'issues'
  | 'documents'
  | 'report'
  | 'knowledge'
  | 'settings'
  | 'extensions'
  | 'toefl'

const PAGE_META: Record<PageKey, { title: string; subtitle: string; icon: ReactNode }> = {
  dashboard: {
    title: '工作驾驶舱',
    subtitle: '今天要做什么，哪些事项有风险',
    icon: <DashboardOutlined />,
  },
  news: {
    title: '储能资讯',
    subtitle: '每天 9:00 自动汇总昨日储能行业动态',
    icon: <ThunderboltOutlined />,
  },
  tasks: {
    title: '待办事项',
    subtitle: '把临时事项和跟催动作落到日期',
    icon: <CheckSquareOutlined />,
  },
  issues: {
    title: '现场问题闭环',
    subtitle: '从上报、分责到关闭，全程可追',
    icon: <AlertOutlined />,
  },
  documents: {
    title: '工艺文件台账',
    subtitle: '版本、状态与复审到期一目了然',
    icon: <FileTextOutlined />,
  },
  report: {
    title: '周报与复盘',
    subtitle: '自动汇总本周进展，减少手工整理',
    icon: <BarChartOutlined />,
  },
  knowledge: {
    title: '个人知识库',
    subtitle: '案例、标准、模板和经验沉淀',
    icon: <BookOutlined />,
  },
  settings: {
    title: '设置',
    subtitle: '数据备份、恢复与个人偏好',
    icon: <SettingOutlined />,
  },
  extensions: {
    title: '扩展功能',
    subtitle: '按需加载的轻量工具与学习应用',
    icon: <AppstoreOutlined />,
  },
  toefl: {
    title: '托福英语学习',
    subtitle: '每日 10 道选择题，做完一题看一题解析',
    icon: <ReadOutlined />,
  },
}

const MENU_ITEMS = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '工作驾驶舱' },
  { key: 'news', icon: <ThunderboltOutlined />, label: '储能资讯' },
  { key: 'tasks', icon: <CheckSquareOutlined />, label: '待办事项' },
  { key: 'issues', icon: <AlertOutlined />, label: '现场问题闭环' },
  { key: 'documents', icon: <FileTextOutlined />, label: '工艺文件台账' },
  { key: 'report', icon: <BarChartOutlined />, label: '周报与复盘' },
  { key: 'knowledge', icon: <BookOutlined />, label: '个人知识库' },
  {
    key: 'extensions',
    icon: <AppstoreOutlined />,
    label: '扩展功能',
    children: [{ key: 'toefl', icon: <ReadOutlined />, label: '托福英语学习' }],
  },
  { key: 'settings', icon: <SettingOutlined />, label: '设置' },
]

export function AppLayout({
  active,
  onNavigate,
  children,
}: {
  active: PageKey
  onNavigate: (key: PageKey) => void
  children: ReactNode
}) {
  const { data } = useAppStore()
  const owner = data.settings.ownerName?.trim() || '工艺'
  const meta = PAGE_META[active]
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [active])

  return (
    <Layout className="app-shell">
      <Sider width={236} className="app-sider" theme="dark">
        <div className="brand">
          <img className="brand-mark" src="./icon.png" alt="工艺工作台" />
          <div>
            <div className="brand-title">工艺工作台</div>
            <div className="brand-sub">Process Workbench</div>
          </div>
        </div>
        <Menu
          className="app-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[active]}
          defaultOpenKeys={['extensions']}
          items={MENU_ITEMS}
          onClick={({ key }) => onNavigate(key as PageKey)}
        />
        <div className="sider-footer">
          <CloudSyncOutlined />
          <span>本地数据 · 自动保存</span>
        </div>
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-left">
            <div className="page-icon">{meta.icon}</div>
            <div className="page-heading">
              <div className="page-eyebrow">Process Workbench</div>
              <div className="page-title">{meta.title}</div>
              <div className="page-subtitle">{meta.subtitle}</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-date">
              <span>{monthLabel()} · 今日</span>
              <strong>
                {today()} {weekdayLabel()}
              </strong>
            </div>
            <div className="header-divider" />
            <div className="header-avatar" title={owner}>
              {owner.slice(0, 1)}
            </div>
          </div>
        </Header>
        <Content className="app-content" ref={contentRef}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
