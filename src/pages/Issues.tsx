import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { Chart } from '../components/Chart'
import { IssueSeverityTag, IssueStatusTag } from '../components/Tags'
import {
  ISSUE_SEVERITY_OPTIONS,
  ISSUE_STATUS_FLOW,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_OPTIONS,
  ROOT_CAUSE_CATEGORY_LABELS,
  ROOT_CAUSE_CATEGORY_OPTIONS,
} from '../constants'
import { useAppStore } from '../store/AppStore'
import type { Issue, IssueLog, KnowledgeItem, Priority, RootCauseCategory, Task } from '../types'
import { dueLabel, formatDate, isOverdue, today } from '../utils/date'
import { blocksToText } from '../utils/knowledge'
import {
  downloadIssueTemplate,
  exportIssues,
  parseIssueExcel,
} from '../utils/excel'
import { nextIssueCode, uid } from '../utils/id'
import { openExcel } from '../services/storage'

interface IssueFormValues {
  title: string
  product?: string
  line?: string
  process?: string
  batchNo?: string
  severity: Issue['severity']
  status: Issue['status']
  owner?: string
  department?: string
  foundDate: Dayjs
  dueDate?: Dayjs
  closedDate?: Dayjs
  description?: string
  containment?: string
  rootCause?: string
  rootCauseCategory?: RootCauseCategory
  permanentAction?: string
  verification?: string
  isRepeat?: boolean
}

interface LogFormValues {
  date: Dayjs
  action: string
  owner?: string
  note?: string
}

const CHART_COLORS = ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#22c55e']

export function IssuesPage({ createSignal }: { createSignal: number }) {
  const { data, mutate } = useAppStore()
  const [issueForm] = Form.useForm<IssueFormValues>()
  const [logForm] = Form.useForm<LogFormValues>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Issue | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dimension, setDimension] = useState<'process' | 'department' | 'severity'>('process')
  const [relatedTitle, setRelatedTitle] = useState('')
  const [relatedItems, setRelatedItems] = useState<KnowledgeItem[]>([])

  const detailIssue = data.issues.find((issue) => issue.id === detailId) ?? null
  const statusValue = Form.useWatch('status', issueForm) as Issue['status'] | undefined

  const searchRelated = () => {
    const title = issueForm.getFieldValue('title') as string | undefined
    const keyword = title?.trim()
    if (!keyword) {
      message.info('请先填写问题标题，再检索同类失效')
      return
    }
    const tokens = keyword
      .toLowerCase()
      .split(/[\s，。、,.;；]+/)
      .filter((token) => token.length >= 2)
    const hits = data.knowledge.filter((item) => {
      const haystack = `${item.title} ${blocksToText(item.blocks)} ${item.tags.join(' ')}`.toLowerCase()
      return tokens.some((token) => haystack.includes(token))
    })
    setRelatedTitle(keyword)
    setRelatedItems(hits.slice(0, 8))
  }

  const openCreate = () => {
    setEditing(null)
    issueForm.resetFields()
    issueForm.setFieldsValue({
      severity: 'normal',
      status: 'new',
      foundDate: dayjs(),
      isRepeat: false,
    })
    setModalOpen(true)
  }

  useEffect(() => {
    if (createSignal > 0) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal])

  useEffect(() => {
    if (detailId) {
      logForm.resetFields()
      logForm.setFieldsValue({ date: dayjs() })
    }
  }, [detailId, logForm])

  const openEdit = (issue: Issue) => {
    setEditing(issue)
    issueForm.setFieldsValue({
      title: issue.title,
      product: issue.product,
      line: issue.line,
      process: issue.process,
      batchNo: issue.batchNo,
      severity: issue.severity,
      status: issue.status,
      owner: issue.owner,
      department: issue.department,
      foundDate: dayjs(issue.foundDate),
      dueDate: issue.dueDate ? dayjs(issue.dueDate) : undefined,
      closedDate: issue.closedDate ? dayjs(issue.closedDate) : undefined,
      description: issue.description,
      containment: issue.containment,
      rootCause: issue.rootCause,
      rootCauseCategory: issue.rootCauseCategory,
      permanentAction: issue.permanentAction,
      verification: issue.verification,
      isRepeat: issue.isRepeat,
    })
    setModalOpen(true)
  }

  const severityToPriority = (severity: Issue['severity']): Priority =>
    severity === 'stop' || severity === 'batch' ? 'high' : 'medium'

  /** 关闭问题前的校验：根因分析与根因类别必填 */
  const validateClose = (values: IssueFormValues, editingIssue: Issue | null): boolean => {
    if (values.status !== 'closed') return true
    const existingCategory = editingIssue?.rootCauseCategory ?? values.rootCauseCategory
    if (!values.rootCause?.trim() || !existingCategory) {
      message.warning('关闭问题前请先完成根因分析（5Why）并选择根因类别')
      return false
    }
    return true
  }

  /** 有永久措施且无未完成关联待办时，自动派生成纠正待办 */
  const ensureCorrectiveTask = (
    draft: typeof data,
    issue: Issue,
    permanentAction: string,
    now: string,
  ): typeof data => {
    const action = permanentAction.trim()
    if (!action) return draft
    const hasOpenTask = draft.tasks.some(
      (task) => task.linkedType === 'issue' && task.linkedId === issue.id && !task.done,
    )
    if (hasOpenTask) return draft
    const task: Task = {
      id: uid('task'),
      title: `【纠正】${issue.code} ${action.slice(0, 60)}`,
      priority: severityToPriority(issue.severity),
      dueDate: issue.dueDate,
      done: false,
      linkedType: 'issue',
      linkedId: issue.id,
      notes: '由问题永久措施自动生成',
      createdAt: now,
    }
    return { ...draft, tasks: [task, ...draft.tasks] }
  }

  const buildKnowledge = (issue: Issue): KnowledgeItem => {
    const now = new Date().toISOString()
    const tags = [
      issue.process,
      issue.line,
      issue.department,
      issue.product,
      issue.batchNo ? `批次:${issue.batchNo}` : '',
      issue.rootCauseCategory
        ? `根因:${ROOT_CAUSE_CATEGORY_LABELS[issue.rootCauseCategory]}`
        : '',
    ].filter((value): value is string => Boolean(value))
    const blocks: KnowledgeItem['blocks'] = [
      {
        type: 'text',
        text: [
          `问题编号：${issue.code}`,
          `问题现象：${issue.description || '未填写'}`,
          `临时措施：${issue.containment || '未填写'}`,
          `根因分析：${issue.rootCause || '未填写'}`,
          `根因类别：${issue.rootCauseCategory ? ROOT_CAUSE_CATEGORY_LABELS[issue.rootCauseCategory] : '未填写'}`,
          `永久措施：${issue.permanentAction || '未填写'}`,
          `验证结果：${issue.verification || '未填写'}`,
        ].join('\n\n'),
      },
    ]
    return {
      id: uid('knowledge'),
      title: `【案例】${issue.title}`,
      type: 'case',
      tags,
      blocks,
      sourceIssueId: issue.id,
      createdAt: now,
      updatedAt: now,
    }
  }

  const handleSubmit = async () => {
    const values = await issueForm.validateFields()
    const now = new Date().toISOString()
    const foundDate = values.foundDate.format('YYYY-MM-DD')
    const dueDate = values.dueDate?.format('YYYY-MM-DD')
    const closedDate = values.closedDate?.format('YYYY-MM-DD')

    if (!validateClose(values, editing)) return

    if (editing) {
      const updated: Issue = {
        ...editing,
        title: values.title.trim(),
        product: values.product?.trim(),
        line: values.line?.trim(),
        process: values.process?.trim(),
        batchNo: values.batchNo?.trim(),
        severity: values.severity,
        status: values.status,
        owner: values.owner?.trim(),
        department: values.department?.trim(),
        foundDate,
        dueDate,
        closedDate: values.status === 'closed' ? closedDate || today() : undefined,
        description: values.description?.trim(),
        containment: values.containment?.trim(),
        rootCause: values.rootCause?.trim(),
        rootCauseCategory: values.rootCauseCategory,
        permanentAction: values.permanentAction?.trim(),
        verification: values.verification?.trim(),
        isRepeat: values.isRepeat,
        updatedAt: now,
      }
      mutate((draft) => {
        let next: typeof draft = {
          ...draft,
          issues: draft.issues.map((issue) =>
            issue.id === editing.id ? updated : issue,
          ),
        }
        if (values.permanentAction?.trim() && values.status !== 'closed') {
          next = ensureCorrectiveTask(next, updated, values.permanentAction, now)
        }
        if (values.status === 'closed') {
          next = { ...next, knowledge: [buildKnowledge(updated), ...next.knowledge] }
        }
        return next
      })
      message.success('问题已更新')
    } else {
      const code = nextIssueCode(data.issues.map((issue) => issue.code))
      const issue: Issue = {
        id: uid('issue'),
        code,
        title: values.title.trim(),
        product: values.product?.trim(),
        line: values.line?.trim(),
        process: values.process?.trim(),
        batchNo: values.batchNo?.trim(),
        severity: values.severity,
        status: values.status,
        owner: values.owner?.trim(),
        department: values.department?.trim(),
        foundDate,
        dueDate,
        closedDate: values.status === 'closed' ? closedDate || today() : undefined,
        description: values.description?.trim(),
        containment: values.containment?.trim(),
        rootCause: values.rootCause?.trim(),
        rootCauseCategory: values.rootCauseCategory,
        permanentAction: values.permanentAction?.trim(),
        verification: values.verification?.trim(),
        isRepeat: values.isRepeat,
        createdAt: now,
        updatedAt: now,
      }
      const log: IssueLog = {
        id: uid('log'),
        issueId: issue.id,
        date: foundDate,
        action: '问题创建',
        owner: issue.owner,
        createdAt: now,
      }
      mutate((draft) => {
        let next: typeof draft = {
          ...draft,
          issues: [issue, ...draft.issues],
          issueLogs: [log, ...draft.issueLogs],
        }
        if (values.permanentAction?.trim() && values.status !== 'closed') {
          next = ensureCorrectiveTask(next, issue, values.permanentAction, now)
        }
        if (values.status === 'closed') {
          next = { ...next, knowledge: [buildKnowledge(issue), ...next.knowledge] }
        }
        return next
      })
      message.success(`问题 ${code} 已创建`)
    }
    setModalOpen(false)
  }

  const setStatus = (issue: Issue, status: Issue['status'], actionLabel: string) => {
    const now = new Date().toISOString()
    if (status === 'closed') {
      if (!issue.rootCause?.trim() || !issue.rootCauseCategory) {
        message.warning('关闭前请先完成根因分析（5Why）并选择根因类别')
        return
      }
    }
    const updated: Issue = {
      ...issue,
      status,
      closedDate: status === 'closed' ? today() : undefined,
      updatedAt: now,
    }
    mutate((draft) => {
      let next: typeof draft = {
        ...draft,
        issues: draft.issues.map((item) => (item.id === issue.id ? updated : item)),
        issueLogs: [
          {
            id: uid('log'),
            issueId: issue.id,
            date: today(),
            action: actionLabel,
            owner: issue.owner,
            createdAt: now,
          },
          ...draft.issueLogs,
        ],
      }
      if (status === 'closed') {
        const alreadyDeposited = draft.knowledge.some(
          (item) => item.sourceIssueId === issue.id,
        )
        if (!alreadyDeposited) {
          next = { ...next, knowledge: [buildKnowledge(updated), ...next.knowledge] }
        }
      }
      return next
    })
    message.success(actionLabel)
  }

  const removeIssue = (issue: Issue) => {
    mutate((draft) => ({
      ...draft,
      issues: draft.issues.filter((item) => item.id !== issue.id),
      issueLogs: draft.issueLogs.filter((log) => log.issueId !== issue.id),
      tasks: draft.tasks.map((task) =>
        task.linkedType === 'issue' && task.linkedId === issue.id
          ? { ...task, linkedType: undefined, linkedId: undefined }
          : task,
      ),
    }))
    if (detailId === issue.id) setDetailId(null)
    message.success('问题已删除')
  }

  const addLog = async () => {
    if (!detailIssue) return
    const values = await logForm.validateFields()
    const log: IssueLog = {
      id: uid('log'),
      issueId: detailIssue.id,
      date: values.date.format('YYYY-MM-DD'),
      action: values.action.trim(),
      owner: values.owner?.trim(),
      note: values.note?.trim(),
      createdAt: new Date().toISOString(),
    }
    mutate((draft) => ({
      ...draft,
      issueLogs: [log, ...draft.issueLogs],
      issues: draft.issues.map((issue) =>
        issue.id === detailIssue.id
          ? { ...issue, updatedAt: new Date().toISOString() }
          : issue,
      ),
    }))
    logForm.resetFields()
    logForm.setFieldsValue({ date: dayjs() })
    message.success('跟催记录已添加')
  }

  const createKnowledge = (issue: Issue) => {
    if (data.knowledge.some((item) => item.sourceIssueId === issue.id)) {
      message.warning('这个问题已经沉淀过案例了')
      return
    }
    const item = buildKnowledge(issue)
    mutate((draft) => ({ ...draft, knowledge: [item, ...draft.knowledge] }))
    message.success('已沉淀到个人知识库')
  }

  const handleImport = async () => {
    try {
      const result = await openExcel()
      if (result.canceled || !result.buffer) return
      const rows = await parseIssueExcel(result.buffer)
      if (rows.length === 0) {
        message.warning('没有识别到有效数据，请检查表头是否与模板一致')
        return
      }
      const now = new Date().toISOString()
      const usedCodes = new Set(data.issues.map((issue) => issue.code))
      const imported: Issue[] = rows.map((row) => {
        let code = row.code?.trim() ?? ''
        if (!code || usedCodes.has(code)) {
          code = nextIssueCode([...usedCodes])
        }
        usedCodes.add(code)
        return {
          id: uid('issue'),
          code,
          title: row.title ?? '未命名问题',
          product: row.product,
          line: row.line,
          process: row.process,
          batchNo: row.batchNo,
          severity: row.severity ?? 'normal',
          status: row.status ?? 'new',
          owner: row.owner,
          department: row.department,
          foundDate: row.foundDate || today(),
          dueDate: row.dueDate || undefined,
          closedDate: row.closedDate || undefined,
          description: row.description,
          containment: row.containment,
          rootCause: row.rootCause,
          rootCauseCategory: row.rootCauseCategory,
          permanentAction: row.permanentAction,
          verification: row.verification,
          isRepeat: row.isRepeat ?? false,
          createdAt: now,
          updatedAt: now,
        }
      })
      mutate((draft) => ({ ...draft, issues: [...imported, ...draft.issues] }))
      message.success(`已导入 ${imported.length} 条问题`)
    } catch (error) {
      console.error(error)
      message.error('导入失败，请检查 Excel 格式')
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportIssues(data.issues)
      if (!result.canceled) message.success('问题台账已导出')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const filtered = useMemo(() => {
    return data.issues
      .filter((issue) => {
        if (search.trim()) {
          const keyword = search.trim().toLowerCase()
          const text = [
            issue.code,
            issue.title,
            issue.product,
            issue.line,
            issue.process,
            issue.owner,
            issue.department,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!text.includes(keyword)) return false
        }
        if (statusFilter === 'open' && issue.status === 'closed') return false
        if (statusFilter === 'closed' && issue.status !== 'closed') return false
        if (statusFilter === 'overdue' && (issue.status === 'closed' || !isOverdue(issue.dueDate)))
          return false
        if (severityFilter !== 'all' && issue.severity !== severityFilter) return false
        return true
      })
      .sort((a, b) => {
        if (a.status === 'closed' && b.status !== 'closed') return 1
        if (a.status !== 'closed' && b.status === 'closed') return -1
        const overdueDiff = Number(isOverdue(b.dueDate)) - Number(isOverdue(a.dueDate))
        if (overdueDiff !== 0) return overdueDiff
        return b.updatedAt.localeCompare(a.updatedAt)
      })
  }, [data.issues, search, statusFilter, severityFilter])

  const openIssues = data.issues.filter((issue) => issue.status !== 'closed')
  const overdueCount = openIssues.filter((issue) => isOverdue(issue.dueDate)).length
  const stopCount = openIssues.filter((issue) => issue.severity === 'stop').length
  const monthPrefix = dayjs().format('YYYY-MM')
  const closedThisMonth = data.issues.filter(
    (issue) => issue.status === 'closed' && (issue.closedDate ?? '').startsWith(monthPrefix),
  ).length

  const chartOption = useMemo<EChartsOption>(() => {
    const map = new Map<string, number>()
    openIssues.forEach((issue) => {
      let key = '未填写'
      if (dimension === 'severity') {
        key = issue.severity === 'stop' ? '停线' : issue.severity === 'batch' ? '批量' : '一般'
      } else if (dimension === 'process') {
        key = issue.process?.trim() || '未填写'
      } else {
        key = issue.department?.trim() || '未填写'
      }
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).reverse()
    return {
      grid: { left: 8, right: 32, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#eef2f7' } },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'category',
        data: entries.map(([key]) => key),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontWeight: 500 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          data: entries.map(([, value], index) => ({
            value,
            itemStyle: {
              color: CHART_COLORS[index % CHART_COLORS.length],
              borderRadius: [0, 7, 7, 0],
            },
          })),
          label: { show: true, position: 'right', color: '#64748b' },
        },
      ],
    }
  }, [dimension, openIssues])

  const columns: ColumnsType<Issue> = [
    {
      title: '编号',
      dataIndex: 'code',
      width: 150,
      render: (value: string) => <span className="code-text">{value}</span>,
    },
    {
      title: '问题标题',
      dataIndex: 'title',
      render: (_, issue) => (
        <div>
          <div className="text-strong">{issue.title}</div>
          <div className="table-subtext">
            {[issue.product, issue.line, issue.process].filter(Boolean).join(' · ') || '未填写产线/工序'}
            {issue.batchNo ? ` · ${issue.batchNo}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: '根因类别',
      dataIndex: 'rootCauseCategory',
      width: 150,
      render: (_, issue) =>
        issue.rootCauseCategory ? (
          ROOT_CAUSE_CATEGORY_LABELS[issue.rootCauseCategory]
        ) : (
          <span className="text-muted">{issue.status === 'closed' ? '缺失' : '未填'}</span>
        ),
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      width: 86,
      render: (_, issue) => <IssueSeverityTag value={issue.severity} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (_, issue) => <IssueStatusTag value={issue.status} />,
    },
    {
      title: '责任人',
      dataIndex: 'owner',
      width: 100,
      render: (value?: string) => value || <span className="text-muted">未指定</span>,
    },
    {
      title: '要求关闭日',
      dataIndex: 'dueDate',
      width: 140,
      render: (_, issue) => {
        if (!issue.dueDate) return <span className="text-muted">未设置</span>
        const overdue = issue.status !== 'closed' && isOverdue(issue.dueDate)
        return (
          <div>
            <div className={overdue ? 'text-danger' : ''}>{formatDate(issue.dueDate)}</div>
            <div className={`table-subtext ${overdue ? 'text-danger' : ''}`}>
              {issue.status === 'closed' ? '已关闭' : dueLabel(issue.dueDate)}
            </div>
          </div>
        )
      },
    },
    {
      title: '操作',
      width: 110,
      render: (_, issue) => (
        <Space size={2} onClick={(event) => event.stopPropagation()}>
          <Button type="link" size="small" onClick={() => setDetailId(issue.id)}>
            查看
          </Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(issue)} />
          <Popconfirm title="删除这个问题？" onConfirm={() => removeIssue(issue)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const logs = detailIssue
    ? data.issueLogs
        .filter((log) => log.issueId === detailIssue.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="未关闭问题" value={openIssues.length} suffix="个" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="停线问题"
              value={stopCount}
              suffix="个"
              styles={{ content: { color: stopCount > 0 ? '#dc2626' : undefined } }}
              prefix={<WarningOutlined style={{ color: '#dc2626' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="超期未关闭"
              value={overdueCount}
              suffix="个"
              styles={{ content: { color: overdueCount > 0 ? '#dc2626' : undefined } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="本月关闭" value={closedThisMonth} suffix="个" />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="panel-card"
        title="未关闭问题分布"
        extra={
          <Segmented
            value={dimension}
            onChange={(value) => setDimension(value as typeof dimension)}
            options={[
              { label: '按工序', value: 'process' },
              { label: '按部门', value: 'department' },
              { label: '按严重度', value: 'severity' },
            ]}
          />
        }
      >
        {openIssues.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无未关闭问题" />
        ) : (
          <Chart option={chartOption} height={220} />
        )}
      </Card>

      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索编号、标题、产线、责任人"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'open', label: '未关闭' },
                { value: 'overdue', label: '已超期' },
                { value: 'closed', label: '已关闭' },
              ]}
            />
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: 120 }}
              options={[{ value: 'all', label: '全部严重度' }, ...ISSUE_SEVERITY_OPTIONS]}
            />
          </Space>
          <Space>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'import', icon: <ImportOutlined />, label: '导入 Excel' },
                  { key: 'export', icon: <ExportOutlined />, label: '导出 Excel' },
                  { key: 'template', icon: <CloudDownloadOutlined />, label: '下载导入模板' },
                ],
                onClick: ({ key }) => {
                  if (key === 'import') void handleImport()
                  if (key === 'export') void handleExport()
                  if (key === 'template') void downloadIssueTemplate()
                },
              }}
            >
              <Button icon={<DownOutlined />}>Excel</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建问题
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          className="clickable-table"
          columns={columns}
          dataSource={filtered}
          onRow={(record) => ({ onClick: () => setDetailId(record.id) })}
          scroll={{ x: 1000 }}
          rowClassName={(record) =>
            record.status !== 'closed' && isOverdue(record.dueDate) ? 'row-overdue' : ''
          }
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无问题记录' }}
        />
      </Card>

      <Modal
        title={editing ? `编辑问题 ${editing.code}` : '新建现场问题'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={780}
        centered
        keyboard={false}
        mask={{ closable: false }}
        styles={{ body: { maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={issueForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
            extra={
              <Button type="link" size="small" style={{ padding: 0 }} onClick={searchRelated}>
                检索知识库中同类失效
              </Button>
            }
          >
            <Input placeholder="用一句话描述问题现象" maxLength={120} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="product" label="产品/机型">
                <Input placeholder="例如：XX-1000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="line" label="产线">
                <Input placeholder="例如：SMT-01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="process" label="工序段">
                <Input placeholder="例如：焊接" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="batchNo" label="批次号">
                <Input placeholder="例如：B20260101-001（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rootCauseCategory"
                label="根因类别"
                extra={statusValue === 'closed' ? '关闭前必选' : undefined}
              >
                <Select
                  allowClear
                  placeholder={statusValue === 'closed' ? '关闭问题前请选择根因类别' : '选择根因类别（关闭前必填）'}
                  options={ROOT_CAUSE_CATEGORY_OPTIONS}
                  showSearch
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="severity" label="严重度" rules={[{ required: true }]}>
                <Select options={ISSUE_SEVERITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={ISSUE_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="owner" label="责任人">
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="department" label="责任部门">
                <Input placeholder="例如：工艺部" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="foundDate" label="发现日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dueDate" label="要求关闭日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="closedDate" label="实际关闭日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isRepeat" label="是否重复问题">
                <Select
                  options={[
                    { value: false, label: '否' },
                    { value: true, label: '是' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="问题描述">
            <Input.TextArea rows={3} placeholder="现象、发生批次、影响范围、临时处置" />
          </Form.Item>
          <Form.Item name="containment" label="临时措施">
            <Input.TextArea rows={2} placeholder="隔离、全检、参数临时调整等" />
          </Form.Item>
          <Form.Item name="rootCause" label="根因分析（5Why）">
            <Input.TextArea rows={3} placeholder="为什么发生？为什么流出？" />
          </Form.Item>
          <Form.Item name="permanentAction" label="永久措施">
            <Input.TextArea rows={2} placeholder="工艺参数、工装、SOP、防错等" />
          </Form.Item>
          <Form.Item name="verification" label="验证结果">
            <Input.TextArea rows={2} placeholder="验证批次、数据结果、是否关闭" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          detailIssue ? (
            <div className="drawer-title">
              <span className="code-text">{detailIssue.code}</span>
              <span>{detailIssue.title}</span>
            </div>
          ) : (
            '问题详情'
          )
        }
        size={780}
        open={Boolean(detailIssue)}
        onClose={() => setDetailId(null)}
        extra={
          detailIssue ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => openEdit(detailIssue)}>
                编辑
              </Button>
              {detailIssue.status !== 'closed' ? (
                <Button
                  type="primary"
                  onClick={() => setStatus(detailIssue, 'closed', '问题关闭')}
                >
                  关闭问题
                </Button>
              ) : null}
              <Button onClick={() => createKnowledge(detailIssue)}>沉淀案例</Button>
            </Space>
          ) : null
        }
      >
        {detailIssue ? (
          <div className="detail-stack">
            <Space wrap>
              <IssueSeverityTag value={detailIssue.severity} />
              <IssueStatusTag value={detailIssue.status} />
              {detailIssue.isRepeat ? <Tag color="volcano">重复问题</Tag> : null}
            </Space>

            <Steps
              size="small"
              current={Math.max(0, ISSUE_STATUS_FLOW.indexOf(detailIssue.status))}
              status={detailIssue.status === 'onhold' ? 'error' : 'process'}
              items={ISSUE_STATUS_FLOW.map((status) => ({
                title: ISSUE_STATUS_LABELS[status],
              }))}
            />

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="产品/机型">{detailIssue.product || '-'}</Descriptions.Item>
              <Descriptions.Item label="产线">{detailIssue.line || '-'}</Descriptions.Item>
              <Descriptions.Item label="工序段">{detailIssue.process || '-'}</Descriptions.Item>
              <Descriptions.Item label="批次号">{detailIssue.batchNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任人">{detailIssue.owner || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任部门">{detailIssue.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="发现日期">{formatDate(detailIssue.foundDate)}</Descriptions.Item>
              <Descriptions.Item label="要求关闭日">
                {formatDate(detailIssue.dueDate)}
              </Descriptions.Item>
              <Descriptions.Item label="实际关闭日">
                {formatDate(detailIssue.closedDate)}
              </Descriptions.Item>
              <Descriptions.Item label="根因类别">
                {detailIssue.rootCauseCategory
                  ? ROOT_CAUSE_CATEGORY_LABELS[detailIssue.rootCauseCategory]
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {[
              ['问题描述', detailIssue.description],
              ['临时措施', detailIssue.containment],
              ['根因分析（5Why）', detailIssue.rootCause],
              ['永久措施', detailIssue.permanentAction],
              ['验证结果', detailIssue.verification],
            ].map(([label, content]) => (
              <div key={label} className="detail-section">
                <div className="detail-section-title">{label}</div>
                <div className="detail-section-body">{content || '尚未填写'}</div>
              </div>
            ))}

            <div className="detail-section">
              <div className="detail-section-title">跟催与处理记录</div>
              {logs.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
              ) : (
                <Timeline
                  items={logs.map((log) => ({
                    color: '#2563eb',
                    children: (
                      <div>
                        <div className="log-head">
                          <strong>{log.action}</strong>
                          <span>{formatDate(log.date)}</span>
                        </div>
                        {log.owner ? <div className="table-subtext">责任人：{log.owner}</div> : null}
                        {log.note ? <div className="log-note">{log.note}</div> : null}
                      </div>
                    ),
                  }))}
                />
              )}
              <Form form={logForm} layout="inline" className="log-form">
                <Form.Item name="date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: 130 }} />
                </Form.Item>
                <Form.Item name="action" rules={[{ required: true, message: '请输入动作' }]}>
                  <Input placeholder="动作，如：跟催责任部门" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item name="owner">
                  <Input placeholder="责任人" style={{ width: 100 }} />
                </Form.Item>
                <Form.Item name="note">
                  <Input placeholder="备注" style={{ width: 180 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={addLog}>
                    添加记录
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div className="drawer-footer">
              <Popconfirm title="确定删除这个问题？" onConfirm={() => removeIssue(detailIssue)}>
                <Button danger icon={<DeleteOutlined />}>
                  删除问题
                </Button>
              </Popconfirm>
              {detailIssue.status !== 'closed' ? (
                <Button onClick={() => setStatus(detailIssue, 'onhold', '问题挂起')}>挂起</Button>
              ) : (
                <Button onClick={() => setStatus(detailIssue, 'analyzing', '重新打开问题')}>
                  重新打开
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        title={`同类失效检索：${relatedTitle || '…'}`}
        size={560}
        open={relatedItems.length > 0}
        onClose={() => setRelatedItems([])}
      >
        {relatedItems.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入标题后检索" />
        ) : (
          <div className="detail-stack">
            {relatedItems.map((item) => (
              <Card key={item.id} size="small" variant="borderless" className="related-card">
                <div className="text-strong">{item.title}</div>
                <div className="knowledge-excerpt">{blocksToText(item.blocks).slice(0, 160)}</div>
                <Space size={4} wrap>
                  {item.tags.slice(0, 5).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Card>
            ))}
            <div className="table-subtext">
              根据标题关键词在知识库中匹配，可参考历史案例的根因与措施
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
