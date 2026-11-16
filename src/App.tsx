import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Form, Input, message, Modal, Spin } from 'antd'
import { AppLayout, type PageKey } from './components/AppLayout'
import { useNewsScheduler } from './hooks/useNewsScheduler'
import { extractTaskCandidates, suggestCompletions } from './services/reportAuto'
import { setCloseToTray, showNotification } from './services/storage'
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
  const { data, loading, mutate } = useAppStore()
  const [active, setActive] = useState<PageKey>('dashboard')
  const [createTarget, setCreateTarget] = useState<PageKey | null>(null)
  const [createSignal, setCreateSignal] = useState(0)
  const [identityForm] = Form.useForm<{
    ownerName: string
    department?: string
    dailySheetName?: string
  }>()
  const [identityOpen, setIdentityOpen] = useState(false)
  const suggestionNotifiedRef = useRef(false)

  useNewsScheduler()

  // 启动时核验身份一次，之后默认沿用该身份生成日报与周报
  useEffect(() => {
    if (loading) return
    setIdentityOpen(!data.settings.identityConfirmedAt)
    identityForm.setFieldsValue({
      ownerName: data.settings.ownerName,
      department: data.settings.department,
      dailySheetName: data.settings.dailySheetName,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // 打开工作台时自动从日报/周报中提取待办建议，并提示到待办模块确认
  useEffect(() => {
    if (loading || suggestionNotifiedRef.current) return
    suggestionNotifiedRef.current = true
    const candidates = extractTaskCandidates(data)
    const completions = suggestCompletions(data)
    if (candidates.length === 0 && completions.length === 0) return
    void showNotification({
      title: '发现日报/周报中的待办建议',
      body: `${candidates.length} 条待确认待办，${completions.length} 条建议标记完成，可到待办模块确认`,
    })
  }, [loading, data])

  const confirmIdentity = async () => {
    const values = await identityForm.validateFields()
    mutate((draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        ownerName: values.ownerName.trim(),
        department: values.department?.trim(),
        dailySheetName: values.dailySheetName?.trim(),
        identityConfirmedAt: new Date().toISOString(),
      },
    }))
    setIdentityOpen(false)
    message.success('身份已确认，日报与周报将默认沿用该身份')
  }

  // 把「关闭窗口时最小化到托盘」的用户设置同步给主进程
  const closeToTray = data.settings.closeToTray ?? true
  useEffect(() => {
    if (loading) return
    void setCloseToTray(closeToTray)
  }, [loading, closeToTray])

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
    <>
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

      <Modal
        title="确认身份"
        open={identityOpen}
        onOk={() => void confirmIdentity()}
        onCancel={() => setIdentityOpen(false)}
        okText="确认"
        cancelText="稍后再说"
        centered
        width={520}
        mask={{ closable: false }}
        keyboard={false}
        destroyOnHidden
      >
        <p className="settings-note" style={{ marginTop: 0 }}>
          日报与周报会按这里的姓名、部门生成署名。确认一次即可，后续检索与生成默认沿用该身份。
        </p>
        <Form form={identityForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="ownerName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="例如：蔡晨潇" maxLength={20} />
          </Form.Item>
          <Form.Item name="department" label="部门/岗位">
            <Input placeholder="例如：工艺开发部 · 工艺开发工程师" maxLength={60} />
          </Form.Item>
          <Form.Item name="dailySheetName" label="日报表本人 sheet 名">
            <Input placeholder="例如：20蔡晨潇" maxLength={30} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
