import {
  BarChartOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { IssueStatusTag, PriorityTag } from '../components/Tags'
import { useAppStore } from '../store/AppStore'
import type { WeeklyReport } from '../types'
import { formatDate, isInRange, isOverdue } from '../utils/date'
import { exportWeeklyReport } from '../utils/excel'
import { uid } from '../utils/id'

const { RangePicker } = DatePicker

function weekStart(): Dayjs {
  return dayjs().startOf('isoWeek')
}

export function ReportPage() {
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
    () =>
      data.tasks.filter(
        (task) => task.done && isInRange(task.completedAt, startDate, endDate),
      ),
    [data.tasks, startDate, endDate],
  )
  const overdueIssues = useMemo(
    () => data.issues.filter((issue) => issue.status !== 'closed' && isOverdue(issue.dueDate)),
    [data.issues],
  )
  const expiringDocs = useMemo(
    () =>
      data.documents.filter(
        (doc) =>
          doc.status !== 'obsolete' &&
          (isOverdue(doc.reviewDate) || isInRange(doc.reviewDate, startDate, endDate)),
      ),
    [data.documents, startDate, endDate],
  )
  const nextWeekTasks = useMemo(() => {
    const nextStart = range[1].add(1, 'day')
    const nextEnd = range[1].add(7, 'day')
    return data.tasks.filter(
      (task) => !task.done && isInRange(task.dueDate, nextStart.format('YYYY-MM-DD'), nextEnd.format('YYYY-MM-DD')),
    )
  }, [data.tasks, range])

  const autoSummary = `统计周期内新增问题 ${newIssues.length} 个，关闭 ${closedIssues.length} 个；完成待办 ${completedTasks.length} 项；截至期末超期未关闭问题 ${overdueIssues.length} 个；文件复审到期 ${expiringDocs.length} 份。`

  const handleExport = async () => {
    try {
      const result = await exportWeeklyReport({
        startDate,
        endDate,
        newIssues,
        closedIssues,
        completedTasks,
        overdueIssues,
        expiringDocs,
        highlights: highlights || autoSummary,
        nextPlan,
      })
      if (!result.canceled) message.success('周报已导出')
    } catch (error) {
      console.error(error)
      message.error('周报导出失败')
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
          report.id === existing.id
            ? { ...report, highlights, nextPlan, updatedAt: now }
            : report,
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
      render: (value: string) => (
        <span className="table-subtext clamp-1">{value || '未填写'}</span>
      ),
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
          <Space>
            <Button icon={<SaveOutlined />} onClick={handleSave}>
              保存周报
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
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
                        <div className="recent-issue-meta">
                          完成于 {formatDate(task.completedAt)}
                        </div>
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
