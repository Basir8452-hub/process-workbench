import {
  AlertOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Progress,
  Row,
  Statistic,
  Tag,
} from 'antd'
import { useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { AiChat } from '../components/AiChat'
import { Chart } from '../components/Chart'
import { IssueStatusTag, PriorityTag } from '../components/Tags'
import type { PageKey } from '../components/AppLayout'
import { ISSUE_STATUS_COLORS, ISSUE_STATUS_FLOW, ISSUE_STATUS_LABELS } from '../constants'
import { useAppStore } from '../store/AppStore'
import type { Task } from '../types'
import {
  daysUntil,
  dueLabel,
  formatDate,
  isDueToday,
  isOverdue,
  isWithinDays,
  today,
  weekdayLabel,
} from '../utils/date'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 }

interface ProfileFormValues {
  ownerName: string
  department?: string
}

export function DashboardPage({
  onNavigate,
}: {
  onNavigate: (key: PageKey, create?: boolean) => void
}) {
  const { data, mutate } = useAppStore()
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [profileOpen, setProfileOpen] = useState(false)
  const ownerName = data.settings.ownerName?.trim()
  const department = data.settings.department?.trim()

  const openIssues = data.issues.filter((issue) => issue.status !== 'closed')
  const overdueIssues = openIssues.filter((issue) => isOverdue(issue.dueDate))
  const expiringDocs = data.documents.filter(
    (doc) =>
      doc.status !== 'obsolete' &&
      isWithinDays(doc.reviewDate, data.settings.expiryWarningDays ?? 30),
  )
  const todayTasks = data.tasks
    .filter((task) => !task.done && (isDueToday(task.dueDate) || isOverdue(task.dueDate)))
    .sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    })

  const closedCount = data.issues.filter((issue) => issue.status === 'closed').length
  const closureRate = data.issues.length
    ? Math.round((closedCount / data.issues.length) * 100)
    : 0

  const statusChartOption = useMemo<EChartsOption>(() => {
    const statuses = [...ISSUE_STATUS_FLOW, 'onhold' as const]
    const counts = statuses.map(
      (status) => data.issues.filter((issue) => issue.status === status).length,
    )
    return {
      grid: { left: 8, right: 32, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#eef2f7' } },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'category',
        data: statuses.map((status) => ISSUE_STATUS_LABELS[status]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontWeight: 500 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          data: counts.map((value, index) => ({
            value,
            itemStyle: {
              color: ISSUE_STATUS_COLORS[statuses[index]],
              borderRadius: [0, 7, 7, 0],
            },
          })),
          label: { show: true, position: 'right', color: '#64748b' },
        },
      ],
    }
  }, [data.issues])

  const toggleTask = (task: Task, done: boolean) => {
    mutate((draft) => ({
      ...draft,
      tasks: draft.tasks.map((item) =>
        item.id === task.id
          ? { ...item, done, completedAt: done ? new Date().toISOString() : undefined }
          : item,
      ),
    }))
  }

  const openProfile = () => {
    profileForm.setFieldsValue({
      ownerName: data.settings.ownerName,
      department: data.settings.department,
    })
    setProfileOpen(true)
  }

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields()
    mutate((draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        ownerName: values.ownerName.trim(),
        department: values.department?.trim(),
      },
    }))
    setProfileOpen(false)
    message.success('个人信息已更新')
  }

  const recentIssues = [...openIssues]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  return (
    <div className="page-stack">
      <div className="hero-card">
        <div className="hero-main">
          <div className="hero-eyebrow">
            {today()} {weekdayLabel()} · {department || '工艺开发与现场管理'}
          </div>
          <h1 className="hero-title">
            {greeting()}
            {ownerName ? `，${ownerName}` : ''}，今天有 <span>{todayTasks.length}</span> 项待办需要跟进
          </h1>
          <p className="hero-desc">
            {overdueIssues.length > 0
              ? `有 ${overdueIssues.length} 个问题已超期，建议优先处理。`
              : '目前没有超期问题，保持节奏。'}
            {expiringDocs.length > 0
              ? ` 另有 ${expiringDocs.length} 份工艺文件临近复审。`
              : ' 工艺文件复审状态正常。'}
          </p>
          <div className="hero-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onNavigate('issues', true)}
            >
              新建问题
            </Button>
            <Button icon={<CheckSquareOutlined />} onClick={() => onNavigate('tasks', true)}>
              新建待办
            </Button>
            <Button icon={<BarChartOutlined />} onClick={() => onNavigate('report')}>
              生成周报
            </Button>
            <Button icon={<BookOutlined />} onClick={() => onNavigate('knowledge', true)}>
              记录知识
            </Button>
            <Button icon={<UserOutlined />} onClick={openProfile}>
              {ownerName ? '个人信息' : '填写个人信息'}
            </Button>
          </div>
        </div>
        <div className="hero-progress">
          <Progress
            type="circle"
            percent={closureRate}
            size={112}
            strokeColor={{ '0%': '#38bdf8', '100%': '#22c55e' }}
            railColor="rgba(255,255,255,0.16)"
            format={(percent) => (
              <span className="hero-progress-label">
                <strong>{percent}%</strong>
                <small>问题关闭率</small>
              </span>
            )}
          />
          <div className="hero-progress-note">
            已关闭 {closedCount} / {data.issues.length} 个问题
          </div>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card className="stat-card" variant="borderless">
            <Statistic
              title="今日待办"
              value={todayTasks.length}
              prefix={<CheckSquareOutlined style={{ color: '#2563eb' }} />}
              suffix="项"
            />
            <div className="stat-foot">含今天到期和已逾期事项</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card" variant="borderless">
            <Statistic
              title="超期问题"
              value={overdueIssues.length}
              prefix={<WarningOutlined style={{ color: '#dc2626' }} />}
              suffix="个"
              styles={{ content: { color: overdueIssues.length > 0 ? '#dc2626' : undefined } }}
            />
            <div className="stat-foot">需要优先推动责任部门</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card" variant="borderless">
            <Statistic
              title="未关闭问题"
              value={openIssues.length}
              prefix={<AlertOutlined style={{ color: '#d97706' }} />}
              suffix="个"
            />
            <div className="stat-foot">分析、措施、验证中的问题</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card" variant="borderless">
            <Statistic
              title="临近复审文件"
              value={expiringDocs.length}
              prefix={<FileTextOutlined style={{ color: '#0f766e' }} />}
              suffix="份"
            />
            <div className="stat-foot">
              {data.settings.expiryWarningDays ?? 30} 天内到期
            </div>
          </Card>
        </Col>
      </Row>

      <AiChat onNavigate={onNavigate} />

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title={
              <span className="card-title">
                <ClockCircleOutlined /> 今日待办
              </span>
            }
            extra={
              <Button type="link" onClick={() => onNavigate('tasks')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
            variant="borderless"
            className="panel-card"
          >
            {todayTasks.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="今天没有到期事项，可以去处理长期改善"
              />
            ) : (
              <List
                dataSource={todayTasks.slice(0, 6)}
                renderItem={(task) => (
                  <List.Item className="task-list-item">
                    <div className="task-line">
                      <Checkbox
                        checked={task.done}
                        onChange={(event) => toggleTask(task, event.target.checked)}
                      />
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <PriorityTag value={task.priority} />
                          <span className={isOverdue(task.dueDate) ? 'text-danger' : ''}>
                            {dueLabel(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title={
              <span className="card-title">
                <WarningOutlined /> 风险提醒
              </span>
            }
            variant="borderless"
            className="panel-card risk-card"
          >
            {overdueIssues.length === 0 && expiringDocs.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无超期问题或到期文件"
              />
            ) : (
              <div className="risk-list">
                {overdueIssues.slice(0, 4).map((issue) => (
                  <button
                    className="risk-item"
                    key={issue.id}
                    onClick={() => onNavigate('issues')}
                  >
                    <span className="risk-dot danger" />
                    <span className="risk-text">
                      <strong>{issue.title}</strong>
                      <small>
                        {issue.code} · {dueLabel(issue.dueDate)}
                      </small>
                    </span>
                    <IssueStatusTag value={issue.status} />
                  </button>
                ))}
                {expiringDocs.slice(0, 4).map((doc) => (
                  <button
                    className="risk-item"
                    key={doc.id}
                    onClick={() => onNavigate('documents')}
                  >
                    <span className="risk-dot warning" />
                    <span className="risk-text">
                      <strong>{doc.name}</strong>
                      <small>
                        {doc.code} · 复审日 {formatDate(doc.reviewDate)}
                      </small>
                    </span>
                    <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                      {daysUntil(doc.reviewDate)} 天
                    </Tag>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <span className="card-title">
                <BarChartOutlined /> 问题状态分布
              </span>
            }
            variant="borderless"
            className="panel-card"
          >
            {data.issues.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无问题数据，创建问题后会自动统计"
                style={{ padding: '48px 0' }}
              />
            ) : (
              <Chart option={statusChartOption} height={250} />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <span className="card-title">
                <CheckCircleOutlined /> 最近更新的问题
              </span>
            }
            extra={
              <Button type="link" onClick={() => onNavigate('issues')}>
                全部问题 <ArrowRightOutlined />
              </Button>
            }
            variant="borderless"
            className="panel-card"
          >
            {recentIssues.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有问题记录" />
            ) : (
              <List
                dataSource={recentIssues}
                renderItem={(issue) => (
                  <List.Item>
                    <div className="recent-issue">
                      <div className="recent-issue-main">
                        <div className="recent-issue-title">{issue.title}</div>
                        <div className="recent-issue-meta">
                          {issue.code}
                          {issue.line ? ` · ${issue.line}` : ''}
                          {issue.process ? ` · ${issue.process}` : ''}
                        </div>
                      </div>
                      <IssueStatusTag value={issue.status} />
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="个人信息"
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        onOk={handleSaveProfile}
        okText="保存"
        cancelText="取消"
        centered
        keyboard={false}
        mask={{ closable: false }}
        forceRender
      >
        <Form form={profileForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="ownerName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="例如：张三" maxLength={20} />
          </Form.Item>
          <Form.Item name="department" label="部门/岗位">
            <Input placeholder="例如：工艺开发部 · 工艺开发工程师" maxLength={60} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
