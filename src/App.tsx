import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import { AppLayout, type PageKey } from './components/AppLayout'
import { useNewsScheduler } from './hooks/useNewsScheduler'
import { useAppStore } from './store/AppStore'
import { DashboardPage } from './pages/Dashboard'
import { DocumentsPage } from './pages/Documents'
import { ExtensionsPage } from './pages/Extensions'
import { IssuesPage } from './pages/Issues'
import { KnowledgePage } from './pages/Knowledge'
import { NewsPage } from './pages/News'
import { ReportPage } from './pages/Report'
import { SettingsPage } from './pages/Settings'
import { TasksPage } from './pages/Tasks'
import { ToeflPage } from './pages/Toefl'

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
      {active === 'news' ? <NewsPage onNavigate={navigate} /> : null}
      {active === 'tasks' ? <TasksPage createSignal={signalFor('tasks')} /> : null}
      {active === 'issues' ? <IssuesPage createSignal={signalFor('issues')} /> : null}
      {active === 'documents' ? <DocumentsPage createSignal={signalFor('documents')} /> : null}
      {active === 'report' ? <ReportPage /> : null}
      {active === 'knowledge' ? <KnowledgePage createSignal={signalFor('knowledge')} /> : null}
      {active === 'extensions' ? <ExtensionsPage onNavigate={navigate} /> : null}
      {active === 'toefl' ? <ToeflPage onNavigate={navigate} /> : null}
      {active === 'settings' ? <SettingsPage /> : null}
    </AppLayout>
  )
}
