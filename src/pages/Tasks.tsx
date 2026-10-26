import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
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
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { PriorityTag } from '../components/Tags'
import { PRIORITY_OPTIONS } from '../constants'
import { useAppStore } from '../store/AppStore'
import type { Task } from '../types'
import { dueLabel, formatDate, formatDateTime, isDueSoon, isDueToday, isOverdue } from '../utils/date'
import { uid } from '../utils/id'

interface TaskFormValues {
  title: string
  priority: Task['priority']
  dueDate?: Dayjs
  linkedType?: Task['linkedType']
  linkedId?: string
  notes?: string
  progress?: string
}

export function TasksPage({ createSignal }: { createSignal: number }) {
  const { data, mutate } = useAppStore()
  const [form] = Form.useForm<TaskFormValues>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  /** 正在播放"完成"动画的待办 id（绿色扫过→对勾弹跳→淡出） */
  const [completingId, setCompletingId] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ priority: 'medium' })
    setModalOpen(true)
  }

  useEffect(() => {
    if (createSignal > 0) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal])

  const linkedType = Form.useWatch('linkedType', form)

  const linkedOptions = useMemo(() => {
    if (!linkedType) return []
    if (linkedType === 'issue') {
      return data.issues.map((issue) => ({ value: issue.id, label: `${issue.code} ${issue.title}` }))
    }
    if (linkedType === 'document') {
      return data.documents.map((doc) => ({ value: doc.id, label: `${doc.code} ${doc.name}` }))
    }
    if (linkedType === 'knowledge') {
      return data.knowledge.map((item) => ({ value: item.id, label: item.title }))
    }
    return []
  }, [data.documents, data.issues, data.knowledge, linkedType])

  const openEdit = (task: Task) => {
    setEditing(task)
    form.setFieldsValue({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
      linkedType: task.linkedType,
      linkedId: task.linkedId,
      notes: task.notes,
      progress: task.progress,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    if (editing) {
      mutate((draft) => ({
        ...draft,
        tasks: draft.tasks.map((task) =>
          task.id === editing.id
            ? {
                ...task,
                title: values.title.trim(),
                priority: values.priority,
                dueDate: values.dueDate?.format('YYYY-MM-DD'),
                linkedType: values.linkedType,
                linkedId: values.linkedId,
                notes: values.notes?.trim(),
                progress: values.progress?.trim() || undefined,
                progressAt: values.progress?.trim() ? now : task.progressAt,
              }
            : task,
        ),
      }))
      message.success('待办已更新')
    } else {
      const task: Task = {
        id: uid('task'),
        title: values.title.trim(),
        priority: values.priority,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        done: false,
        linkedType: values.linkedType,
        linkedId: values.linkedId,
        notes: values.notes?.trim(),
        progress: values.progress?.trim() || undefined,
        progressAt: values.progress?.trim() ? now : undefined,
        createdAt: now,
      }
      mutate((draft) => ({ ...draft, tasks: [task, ...draft.tasks] }))
      message.success('待办已创建')
    }
    setModalOpen(false)
  }

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

  const removeTask = (task: Task) => {
    mutate((draft) => ({ ...draft, tasks: draft.tasks.filter((item) => item.id !== task.id) }))
    message.success('待办已删除')
  }

  /** 点击"完成"按钮：先播放绿色扫过→对勾弹跳→淡出动画，动画结束后真正置为已完成 */
  const completeTask = (task: Task) => {
    if (completingId) return
    setCompletingId(task.id)
    window.setTimeout(() => {
      toggleTask(task, true)
      message.success('待办已完成')
      setCompletingId(null)
    }, 900)
  }

  const filtered = useMemo(() => {
    return data.tasks
      .filter((task) => {
        if (search.trim()) {
          const keyword = search.trim().toLowerCase()
          if (
            !task.title.toLowerCase().includes(keyword) &&
            !(task.notes ?? '').toLowerCase().includes(keyword)
          ) {
            return false
          }
        }
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
        if (statusFilter === 'open') return !task.done
        if (statusFilter === 'soon') return !task.done && isDueSoon(task.dueDate, 3)
        if (statusFilter === 'done') return task.done
        if (statusFilter === 'overdue') return !task.done && isOverdue(task.dueDate)
        return true
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        const weight = { high: 0, medium: 1, low: 2 }
        const priorityDiff = weight[a.priority] - weight[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
      })
  }, [data.tasks, priorityFilter, search, statusFilter])

  const openCount = data.tasks.filter((task) => !task.done).length
  const todayCount = data.tasks.filter((task) => !task.done && isDueToday(task.dueDate)).length
  const soonCount = data.tasks.filter((task) => !task.done && isDueSoon(task.dueDate, 3)).length
  const overdueCount = data.tasks.filter((task) => !task.done && isOverdue(task.dueDate)).length
  const doneCount = data.tasks.filter((task) => task.done).length

  const linkedLabel = (task: Task) => {
    if (!task.linkedType || !task.linkedId) return '-'
    if (task.linkedType === 'issue') {
      const issue = data.issues.find((item) => item.id === task.linkedId)
      return issue ? `${issue.code} ${issue.title}` : '关联问题已删除'
    }
    if (task.linkedType === 'document') {
      const doc = data.documents.find((item) => item.id === task.linkedId)
      return doc ? `${doc.code} ${doc.name}` : '关联文件已删除'
    }
    const item = data.knowledge.find((entry) => entry.id === task.linkedId)
    return item ? item.title : '关联知识已删除'
  }

  const columns: ColumnsType<Task> = [
    {
      title: '',
      width: 36,
      render: (_, task) => (
        <Checkbox checked={task.done} onChange={(event) => toggleTask(task, event.target.checked)} />
      ),
    },
    {
      title: '待办事项',
      dataIndex: 'title',
      width: 260,
      render: (_, task) => (
        <div>
          <div className={task.done ? 'text-done' : 'text-strong'}>{task.title}</div>
          {task.notes ? <div className="table-subtext">{task.notes}</div> : null}
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 76,
      render: (value: Task['priority']) => <PriorityTag value={value} />,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 118,
      render: (_, task) => {
        if (!task.dueDate) return <span className="text-muted">未设置</span>
        const overdue = !task.done && isOverdue(task.dueDate)
        return (
          <div>
            <div className={overdue ? 'text-danger' : ''}>{formatDate(task.dueDate)}</div>
            <div className={`table-subtext ${overdue ? 'text-danger' : ''}`}>
              {task.done ? '已完成' : dueLabel(task.dueDate)}
            </div>
          </div>
        )
      },
    },
    {
      title: '关联对象',
      width: 150,
      render: (_, task) => {
        const label = linkedLabel(task)
        return label === '-' ? (
          <span className="text-muted">-</span>
        ) : (
          <Tooltip title={label}>
            <span className="linked-text">{label}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '进度反馈',
      width: 200,
      render: (_, task) =>
        task.progress ? (
          <div className="task-progress-line">
            <span className="task-progress-text">{task.progress}</span>
            {task.progressAt ? (
              <span className="task-progress-time">{formatDateTime(task.progressAt)}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      title: '操作',
      width: 56,
      align: 'center',
      render: (_, task) => (
        <div className="task-actions-vertical">
          {!task.done ? (
            <Tooltip title="标记完成" placement="left">
              <Button
                type="primary"
                shape="circle"
                icon={<CheckCircleOutlined />}
                className="task-complete-btn"
                aria-label="标记完成"
                onClick={() => completeTask(task)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="已完成" placement="left">
              <Button
                shape="circle"
                icon={<CheckCircleOutlined />}
                className="task-done-btn"
                aria-label="已完成"
                disabled
              />
            </Tooltip>
          )}
          <Tooltip title="编辑" placement="left">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(task)} />
          </Tooltip>
          <Popconfirm title="删除这条待办？" onConfirm={() => removeTask(task)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="未完成"
              value={openCount}
              prefix={<UnorderedListOutlined style={{ color: '#2563eb' }} />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="3天内到期"
              value={soonCount}
              prefix={<ClockCircleOutlined style={{ color: '#d97706' }} />}
              suffix="项"
            />
            <div className="stat-foot">含今天，不含已逾期</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="已逾期"
              value={overdueCount}
              prefix={<ExclamationCircleOutlined style={{ color: '#dc2626' }} />}
              suffix="项"
              styles={{ content: { color: overdueCount > 0 ? '#dc2626' : undefined } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="已完成"
              value={doneCount}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              suffix="项"
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索待办"
              style={{ width: 240 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Segmented
              value={statusFilter}
              onChange={(value) => setStatusFilter(String(value))}
              options={[
                { label: '全部', value: 'all' },
                { label: '未完成', value: 'open' },
                { label: '3天内', value: 'soon' },
                { label: '已逾期', value: 'overdue' },
                { label: '已完成', value: 'done' },
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 120 }}
              options={[{ value: 'all', label: '全部优先级' }, ...PRIORITY_OPTIONS]}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建待办
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: '暂无待办，点击右上角新建' }}
          onRow={(task) => ({
            className: task.id === completingId ? 'task-row-completing' : '',
          })}
        />
      </Card>

      <Modal
        title={editing ? '编辑待办' : '新建待办'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        centered
        keyboard={false}
        mask={{ closable: false }}
        styles={{ body: { maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="title"
            label="待办内容"
            rules={[{ required: true, message: '请输入待办内容' }]}
          >
            <Input placeholder="例如：跟催 SMT 焊接虚焊问题的永久措施" maxLength={120} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="截止日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="linkedType" label="关联类型">
                <Select
                  allowClear
                  placeholder="不关联"
                  options={[
                    { value: 'issue', label: '现场问题' },
                    { value: 'document', label: '工艺文件' },
                    { value: 'knowledge', label: '知识条目' },
                  ]}
                  onChange={() => form.setFieldValue('linkedId', undefined)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="linkedId" label="关联对象">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  disabled={!linkedType}
                  placeholder={linkedType ? '选择关联对象' : '请先选择关联类型'}
                  options={linkedOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="补充背景、跟催要求等" maxLength={500} />
          </Form.Item>
          <Form.Item name="progress" label="进度反馈">
            <Input.TextArea
              rows={2}
              placeholder="快速记录当前进展，例如：已约供应商周四到厂验证，方案基本可行"
              maxLength={200}
            />
          </Form.Item>
        </Form>

      </Modal>
    </div>
  )
}
