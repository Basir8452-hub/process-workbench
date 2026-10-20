import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Spin } from 'antd'
import { AppLayout, type PageKey } from './components/AppLayout'
import { useNewsScheduler } from './hooks/useNewsScheduler'
import { useAppStore } from './store/AppStore'
import { DashboardPage } from './pages/Dashboard'

// 路由级拆包：非首屏页面按需加载，减少首屏体积
const DocumentsPage = lazy(() => import('./pages/Documents').then((m) => ({ default: m.DocumentsPage })))
const ExtensionsPage = lazy(() => import('./pages/Extensions').then((m) => ({ default: m.ExtensionsPage })))
const IssuesPage = lazy(() => import('./pages/Issues').then((m) => ({ default: m.IssuesPage })))
const KnowledgePage = lazy(() => import('./pages/Knowledge').then((m) => ({ default: m.KnowledgePage })))
const NewsPage = lazy(() => import('./pages/News').then((m) => ({ default: m.NewsPage })))
const ReportPage = lazy(() => import('./pages/Report').then((m) => ({ default: m.ReportPage })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
const TasksPage = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.TasksPage })))
const ToeflPage = lazy(() => import('./pages/Toefl').then((m) => ({ default: m.ToeflPage })))

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="app-loading" style={{ minHeight: 240 }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export function App() {
  const { loading } = useAppStore()
  const [active, setActive] = useState<PageKey>('dashboard')
  const [createTarget, setCreateTarget] = useState<PageKey | null>(null)
  const [createSignal, setCreateSignal] = useState(0)

  useNewsScheduler()

  const navigate = (key: PageKey, create = false) => {
    setActive(key)
    if (create) {
      setCreateTarget(key)
      setCreateSignal((value) => value + 1)
    }
  }

  useEffect(() => {
    if (!createTarget) return
    const timer = window.setTimeout(() => setCreateTarget(null), 500)
    return () => window.clearTimeout(timer)
  }, [createTarget, createSignal])

  if (loading) {
    return (
      <div className="app-loading">
        <Spin size="large" />
        <div>正在加载本地数据...</div>
      </div>
    )
  }

  const signalFor = (page: PageKey) => (createTarget === page ? createSignal : 0)

  return (
    <AppLayout active={active} onNavigate={navigate}>
      {active === 'dashboard' ? <DashboardPage onNavigate={navigate} /> : null}
      {active === 'news' ? (
        <PageSuspense>
          <NewsPage onNavigate={navigate} />
        </PageSuspense>
      ) : null}
      {active === 'tasks' ? (
        <PageSuspense>
          <TasksPage createSignal={signalFor('tasks')} />
        </PageSuspense>
      ) : null}
      {active === 'issues' ? (
        <PageSuspense>
          <IssuesPage createSignal={signalFor('issues')} />
        </PageSuspense>
      ) : null}
      {active === 'documents' ? (
        <PageSuspense>
          <DocumentsPage createSignal={signalFor('documents')} />
        </PageSuspense>
      ) : null}
      {active === 'report' ? (
        <PageSuspense>
          <ReportPage />
        </PageSuspense>
      ) : null}
      {active === 'knowledge' ? (
        <PageSuspense>
          <KnowledgePage createSignal={signalFor('knowledge')} />
        </PageSuspense>
      ) : null}
      {active === 'extensions' ? (
        <PageSuspense>
          <ExtensionsPage onNavigate={navigate} />
        </PageSuspense>
      ) : null}
      {active === 'toefl' ? (
        <PageSuspense>
          <ToeflPage onNavigate={navigate} />
        </PageSuspense>
      ) : null}
      {active === 'settings' ? (
        <PageSuspense>
          <SettingsPage />
        </PageSuspense>
      ) : null}
    </AppLayout>
  )
}
