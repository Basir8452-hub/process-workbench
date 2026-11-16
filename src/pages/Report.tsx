import {
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  MailOutlined,
  SaveOutlined,
  SendOutlined,
  SolutionOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  message,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { IssueStatusTag, PriorityTag } from '../components/Tags'
import { DAILY_REPORT_TABLE_TOKEN, ISSUE_STATUS_LABELS } from '../constants'
import { summarizeDailyDraft } from '../services/reportAuto'
import { copyText, saveTextFile } from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { DailyReport, StoreData, WeeklyReport } from '../types'
import { formatDate, isInRange, isOverdue } from '../utils/date'
import { exportWeeklyReport } from '../utils/excel'
import { uid } from '../utils/id'
import {
  buildDailyCopyText,
  buildDailyText,
  buildWeeklyCopyText,
  buildWeeklyEml,
  buildWeeklyMail,
  identityLabel,
  isoWeekNumber,
  type ReportIdentity,
} from '../utils/report'

const { RangePicker } = DatePicker

function weekStart(): Dayjs {
  return dayjs().startOf('isoWeek')
}

function identityOf(data: StoreData): ReportIdentity {
  return { ownerName: data.settings.ownerName, department: data.settings.department }
}

/** 身份绑定提示条：登录后确认一次，后续默认沿用 */
function IdentityBar() {
  const { data, mutate } = useAppStore()
  const identity = identityOf(data)
  const confirmed = Boolean(data.settings.identityConfirmedAt)

  const confirmIdentity = () => {
    const now = new Date().toISOString()
    mutate((draft) => ({
      ...draft,
      settings: { ...draft.settings, identityConfirmedAt: now },
    }))
    message.success('身份已确认，后续日报与周报默认按此身份生成')
  }

  return (
    <Card variant="borderless" className="panel-card">
      <div className="toolbar">
        <Space wrap size={12}>
          <Tag icon={<SolutionOutlined />} color={confirmed ? 'blue' : 'orange'}>
            当前身份：{identityLabel(identity)}
          </Tag>
          <span className="text-muted">
            日报表 sheet：{data.settings.dailySheetName?.trim() || '未填写'}
          </span>
          <span className="text-muted">日报表 token：{DAILY_REPORT_TABLE_TOKEN}</span>
        </Space>
        {confirmed ? (
          <span className="text-muted">
            身份已确认（{formatDate(data.settings.identityConfirmedAt)}），可在「设置」中修改
          </span>
        ) : (
          <Button size="small" type="primary" ghost onClick={confirmIdentity}>
            确认身份
          </Button>
        )}
      </div>
    </Card>
  )
}

function DailyReportPanel({ identity }: { identity: ReportIdentity }) {
  const { data, mutate } = useAppStore()
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [highlights, setHighlights] = useState('')
  const [nextPlan, setNextPlan] = useState('')
  const [support, setSupport] = useState('')

  const dateKey = date.format('YYYY-MM-DD')

  const stats = useMemo(() => {
    const sameDay = (value?: string) =>
      !!value && dayjs(value).isValid() && dayjs(value).format('YYYY-MM-DD') === dateKey
    return {
      completed: data.tasks.filter((task) => task.done && sameDay(task.completedAt)).length,
      newIssues: data.issues.filter((issue) => sameDay(issue.foundDate)).length,
      closedIssues: data.issues.filter((issue) => sameDay(issue.closedDate)).length,
    }
  }, [data, dateKey])

  const draft = useMemo(() => summarizeDailyDraft(data, dateKey), [data, dateKey])

  const currentReport = (): DailyReport => ({
    id: 'draft',
    date: dateKey,
    highlights,
    nextPlan,
    support,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const handleAutoFill = () => {
    setHighlights(draft.highlights)
    setNextPlan(draft.nextPlan)
    message.success('已按当日记录填入初稿，可在此基础上修改')
  }

  const handleSave = () => {
    if (!highlights.trim() && !nextPlan.trim() && !support.trim()) {
      message.warning('请先填写日报内容')
      return
    }
    const now = new Date().toISOString()
    const existing = data.dailyReports.find((report) => report.date === dateKey)
    if (existing) {
      mutate((store) => ({
        ...store,
        dailyReports: store.dailyReports.map((report) =>
          report.id === existing.id
            ? { ...report, highlights, nextPlan, support, updatedAt: now }
            : report,
        ),
      }))
      message.success('当日日报已更新')
    } else {
      const report: DailyReport = {
        id: uid('daily'),
        date: dateKey,
        highlights,
        nextPlan,
        support,
        createdAt: now,
        updatedAt: now,
      }
      mutate((store) => ({ ...store, dailyReports: [report, ...store.dailyReports] }))
      message.success('日报已保存')
    }
  }

  const handleCopy = async (report: DailyReport) => {
    const ok = await copyText(buildDailyCopyText(report))
    if (ok) message.success('日报行已复制，直接粘贴进日报表即可分列')
    else message.error('复制失败，请手动复制')
  }

  const handleExport = async (report: DailyReport) => {
    try {
      const result = await saveTextFile({
        content: buildDailyText(report, identity),
        defaultName: `日报-${report.date.replace(/-/g, '')}.md`,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: '文本文件', extensions: ['txt'] },
        ],
      })
      if (!result.canceled) message.success('日报已导出')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const loadReport = (report: DailyReport) => {
    setDate(dayjs(report.date))
    setHighlights(report.highlights)
    setNextPlan(report.nextPlan)
    setSupport(report.support ?? '')
  }

  const deleteReport = (report: DailyReport) => {
    mutate((store) => ({
      ...store,
      dailyReports: store.dailyReports.filter((item) => item.id !== report.id),
    }))
    message.success('已删除这天的日报')
  }

  const columns: ColumnsType<DailyReport> = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '今日工作重点',
      dataIndex: 'highlights',
      render: (value: string) => <span className="table-subtext clamp-1">{value || '未填写'}</span>,
    },
    {
      title: '明日工作计划',
      dataIndex: 'nextPlan',
      render: (value: string) => <span className="table-subtext clamp-1">{value || '未填写'}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      width: 150,
      render: (_, report) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            title="复制日报行"
            onClick={() => void handleCopy(report)}
          />
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            title="导出日报"
            onClick={() => void handleExport(report)}
          />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => loadReport(report)} />
          <Popconfirm title="删除这天的日报？" onConfirm={() => deleteReport(report)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <Alert
        type="info"
        showIcon
        message="日报走半自动流程：工作台负责汇总与格式对齐，复制后粘贴进飞书日报表即可，无需再手工整理。"
      />

      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <span className="toolbar-label">日报日期</span>
            <DatePicker
              value={date}
              allowClear={false}
              onChange={(value) => {
                if (value) setDate(value)
              }}
            />
            <Button onClick={() => setDate(dayjs())}>回到今天</Button>
          </Space>
          <Space wrap>
            <Button icon={<BarChartOutlined />} onClick={handleAutoFill}>
              从当日记录汇总
            </Button>
            <Button icon={<SaveOutlined />} onClick={handleSave}>
              保存日报
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={() => void handleCopy(currentReport())}
              disabled={!highlights.trim() && !nextPlan.trim() && !support.trim()}
            >
              复制日报行
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => void handleExport(currentReport())}
              disabled={!highlights.trim() && !nextPlan.trim() && !support.trim()}
            >
              导出日报
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={16}>
        <Col xs={12} md={8}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="当日完成待办" value={stats.completed} suffix="项" />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="当日新增问题" value={stats.newIssues} suffix="个" />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="当日关闭问题" value={stats.closedIssues} suffix="个" />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="panel-card"
        title={
          <span className="card-title">
            <FileTextOutlined /> 日报内容
          </span>
        }
        extra={<span className="text-muted">列顺序：日期 / 今日工作重点 / 明日工作计划 / 需要支持</span>}
      >
        <Form layout="vertical">
          <Form.Item label="今日工作重点">
            <Input.TextArea
              rows={4}
              value={highlights}
              onChange={(event) => setHighlights(event.target.value)}
              placeholder="例如：完成 XX 工序参数验证；关闭 XX 问题；推进 XX 文件换版"
            />
          </Form.Item>
          <Form.Item label="明日工作计划">
            <Input.TextArea
              rows={4}
              value={nextPlan}
              onChange={(event) => setNextPlan(event.target.value)}
              placeholder="例如：跟进 XX 问题永久措施；准备 XX 验证数据；与 XX 部门确认 XX 事项"
            />
          </Form.Item>
          <Form.Item label="需要支持">
            <Input.TextArea
              rows={2}
              value={support}
              onChange={(event) => setSupport(event.target.value)}
              placeholder="例如：需要 XX 部门提供 XX 资料"
            />
          </Form.Item>
        </Form>
      </Card>

      <Card variant="borderless" className="panel-card" title="历史日报">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={[...data.dailyReports].sort((a, b) => b.date.localeCompare(a.date))}
          pagination={{ pageSize: 5, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: '还没有保存过日报' }}
        />
      </Card>
    </div>
  )
}

function WeeklyReportPanel({ identity }: { identity: ReportIdentity }) {
  const { data, mutate } = useAppStore()
  const [range, setRange] = useState<[Dayjs, Dayjs]>([weekStart(), weekStart().endOf('isoWeek')])
  const [highlights, setHighlights] = useState('')
  const [nextPlan, setNextPlan] = useState('')

  const startDate = range[0].format('YYYY-MM-DD')
  const endDate = range[1].format('YYYY-MM-DD')

  const newIssues = useMemo(
    () => data.issues.filter((issue) => isInRange(issue.foundDate, startDate, endDate)),
    [data.issues, startDate, endDate],
  )
  const closedIssues = useMemo(
    () =>
      data.issues.filter(
        (issue) => issue.status === 'closed' && isInRange(issue.closedDate, startDate, endDate),
      ),
    [data.issues, startDate, endDate],
  )
  const completedTasks = useMemo(
    () => data.tasks.filter((task) => task.done && isInRange(task.completedAt, startDate, endDate)),
    [data.tasks, startDate, endDate],
  )
  const overdueIssues = useMemo(
    () => data.issues.filter((issue) => issue.status !== 'closed' && isOverdue(issue.dueDate)),
    [data.issues],
  )
  const nextWeekTasks = useMemo(() => {
    const nextStart = range[1].add(1, 'day')
    const nextEnd = range[1].add(7, 'day')
    return data.tasks.filter(
      (task) =>
        !task.done &&
        isInRange(task.dueDate, nextStart.format('YYYY-MM-DD'), nextEnd.format('YYYY-MM-DD')),
    )
  }, [data.tasks, range])

  const autoSummary = [
    `统计周期内新增问题 ${newIssues.length} 个，关闭 ${closedIssues.length} 个；完成待办 ${completedTasks.length} 项；超期未关闭问题 ${overdueIssues.length} 个。`,
    completedTasks.length > 0
      ? `\n本周完成事项：\n${completedTasks.map((task) => `- ${task.title}`).join('\n')}`
      : '',
    closedIssues.length > 0
      ? `\n本周关闭问题：\n${closedIssues.map((issue) => `- ${issue.code} ${issue.title}`).join('\n')}`
      : '',
    newIssues.length > 0
      ? `\n本周新增问题：\n${newIssues.map((issue) => `- ${issue.code} ${issue.title}（${ISSUE_STATUS_LABELS[issue.status]}）`).join('\n')}`
      : '',
    nextWeekTasks.length > 0
      ? `\n下周待办：\n${nextWeekTasks.map((task) => `- ${task.title}（${formatDate(task.dueDate)}）`).join('\n')}`
      : '',
  ].join('')

  const currentReport = (): WeeklyReport => ({
    id: 'draft',
    startDate,
    endDate,
    highlights: highlights || autoSummary,
    nextPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const mail = buildWeeklyMail(currentReport(), identity)

  const handleExport = async () => {
    try {
      const result = await exportWeeklyReport({
        startDate,
        endDate,
        newIssues,
        closedIssues,
        completedTasks,
        overdueIssues,
        highlights: highlights || autoSummary,
        nextPlan,
      })
      if (!result.canceled) message.success('周报已导出')
    } catch (error) {
      console.error(error)
      message.error('周报导出失败')
    }
  }

  const handleCopyMail = async () => {
    const ok = await copyText(buildWeeklyCopyText(mail))
    if (ok) message.success('邮件正文已复制（含主题与 To/CC）')
    else message.error('复制失败，请手动复制')
  }

  const handleExportMail = async () => {
    try {
      const result = await saveTextFile({
        content: buildWeeklyEml(mail),
        defaultName: `周报邮件-WK${isoWeekNumber(endDate)}.eml`,
        filters: [{ name: '邮件文件', extensions: ['eml'] }],
      })
      if (!result.canceled) message.success('邮件已导出，可双击用 Outlook 打开')
    } catch (error) {
      console.error(error)
      message.error('导出邮件失败')
    }
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    const existing = data.reports.find(
      (report) => report.startDate === startDate && report.endDate === endDate,
    )
    if (existing) {
      mutate((draft) => ({
        ...draft,
        reports: draft.reports.map((report) =>
          report.id === existing.id ? { ...report, highlights, nextPlan, updatedAt: now } : report,
        ),
      }))
      message.success('本周周报已更新')
    } else {
      const report: WeeklyReport = {
        id: uid('report'),
        startDate,
        endDate,
        highlights,
        nextPlan,
        createdAt: now,
        updatedAt: now,
      }
      mutate((draft) => ({ ...draft, reports: [report, ...draft.reports] }))
      message.success('周报已保存')
    }
  }

  const loadReport = (report: WeeklyReport) => {
    setRange([dayjs(report.startDate), dayjs(report.endDate)])
    setHighlights(report.highlights)
    setNextPlan(report.nextPlan)
  }

  const deleteReport = (report: WeeklyReport) => {
    mutate((draft) => ({
      ...draft,
      reports: draft.reports.filter((item) => item.id !== report.id),
    }))
    message.success('已删除保存的周报')
  }

  const reportColumns: ColumnsType<WeeklyReport> = [
    {
      title: '统计周期',
      render: (_, report) => `${report.startDate} 至 ${report.endDate}`,
    },
    {
      title: '本周重点',
      dataIndex: 'highlights',
      render: (value: string) => <span className="table-subtext clamp-1">{value || '未填写'}</span>,
    },
    {
      title: '保存时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      width: 100,
      render: (_, report) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => loadReport(report)} />
          <Popconfirm title="删除这份周报？" onConfirm={() => deleteReport(report)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <span className="toolbar-label">统计周期</span>
            <RangePicker
              value={range}
              allowClear={false}
              onChange={(values) => {
                if (values && values[0] && values[1]) setRange([values[0], values[1]])
              }}
            />
            <Button onClick={() => setRange([weekStart(), weekStart().endOf('isoWeek')])}>
              恢复本周
            </Button>
          </Space>
          <Space wrap>
            <Button icon={<SaveOutlined />} onClick={handleSave}>
              保存周报
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => void handleCopyMail()}>
              复制邮件正文
            </Button>
            <Button type="primary" icon={<MailOutlined />} onClick={() => void handleExportMail()}>
              导出邮件 .eml
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void handleExport()}>
              导出 Excel
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="本周新增问题" value={newIssues.length} suffix="个" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="本周关闭问题" value={closedIssues.length} suffix="个" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="本周完成待办" value={completedTasks.length} suffix="项" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="超期未关闭"
              value={overdueIssues.length}
              suffix="个"
              styles={{ content: { color: overdueIssues.length > 0 ? '#dc2626' : undefined } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="panel-card auto-summary-card"
        title={
          <span className="card-title">
            <BarChartOutlined /> 自动汇总
          </span>
        }
      >
        <p className="auto-summary">{autoSummary}</p>
      </Card>

      <Card
        variant="borderless"
        className="panel-card"
        title={
          <span className="card-title">
            <MailOutlined /> 邮件预览
          </span>
        }
        extra={<span className="text-muted">收件人与主题已按固定口径生成</span>}
      >
        <div className="mail-preview">
          <div className="mail-preview-row">
            <span className="mail-preview-label">收件人</span>
            <span>{mail.to.join('; ')}</span>
          </div>
          <div className="mail-preview-row">
            <span className="mail-preview-label">抄送</span>
            <span>{mail.cc.join('; ')}</span>
          </div>
          <div className="mail-preview-row">
            <span className="mail-preview-label">主题</span>
            <span>{mail.subject}</span>
          </div>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            variant="borderless"
            className="panel-card"
            title="本周完成待办"
            extra={<span className="text-muted">{completedTasks.length} 项</span>}
          >
            {completedTasks.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="本周还没有完成的待办" />
            ) : (
              <List
                dataSource={completedTasks}
                renderItem={(task) => (
                  <List.Item>
                    <div className="recent-issue">
                      <div className="recent-issue-main">
                        <div className="recent-issue-title">{task.title}</div>
                        <div className="recent-issue-meta">完成于 {formatDate(task.completedAt)}</div>
                      </div>
                      <PriorityTag value={task.priority} />
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            variant="borderless"
            className="panel-card"
            title="本周关闭问题"
            extra={<span className="text-muted">{closedIssues.length} 个</span>}
          >
            {closedIssues.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="本周还没有关闭的问题" />
            ) : (
              <List
                dataSource={closedIssues}
                renderItem={(issue) => (
                  <List.Item>
                    <div className="recent-issue">
                      <div className="recent-issue-main">
                        <div className="recent-issue-title">{issue.title}</div>
                        <div className="recent-issue-meta">
                          {issue.code} · {formatDate(issue.closedDate)}
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

      <Card
        variant="borderless"
        className="panel-card"
        title={
          <span className="card-title">
            <SendOutlined /> 周报内容
          </span>
        }
        extra={
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => {
              setHighlights(autoSummary)
              message.success('已填入自动汇总，可在此基础上修改')
            }}
          >
            填入自动汇总
          </Button>
        }
      >
        <Form layout="vertical">
          <Form.Item label="本周重点与进展">
            <Input.TextArea
              rows={4}
              value={highlights}
              onChange={(event) => setHighlights(event.target.value)}
              placeholder={`可以直接使用自动汇总，也可以补充自己的重点：\n${autoSummary}`}
            />
          </Form.Item>
          <Form.Item label="下周计划与需要协调的事项">
            <Input.TextArea
              rows={4}
              value={nextPlan}
              onChange={(event) => setNextPlan(event.target.value)}
              placeholder="例如：推动 XX 问题永久措施落地；完成 XX 文件换版培训；跟进下周到期事项"
            />
          </Form.Item>
        </Form>
        {nextWeekTasks.length > 0 ? (
          <div className="next-week">
            <div className="detail-section-title">下周即将到期</div>
            <List
              size="small"
              dataSource={nextWeekTasks}
              renderItem={(task) => (
                <List.Item>
                  <span>{task.title}</span>
                  <span className="table-subtext">{formatDate(task.dueDate)}</span>
                </List.Item>
              )}
            />
          </div>
        ) : null}
      </Card>

      <Card variant="borderless" className="panel-card" title="历史周报">
        <Table
          rowKey="id"
          columns={reportColumns}
          dataSource={[...data.reports].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
          pagination={{ pageSize: 5, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: '还没有保存过周报' }}
        />
      </Card>
    </div>
  )
}

export function ReportPage() {
  const { data } = useAppStore()
  const [activeKey, setActiveKey] = useState<'daily' | 'weekly'>('daily')
  const identity = identityOf(data)

  return (
    <div className="page-stack">
      <IdentityBar />
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as 'daily' | 'weekly')}
        items={[
          { key: 'daily', label: '日报', children: <DailyReportPanel identity={identity} /> },
          { key: 'weekly', label: '周报', children: <WeeklyReportPanel identity={identity} /> },
        ]}
      />
    </div>
  )
}
