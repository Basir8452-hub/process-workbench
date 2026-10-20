import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { DocStatusTag } from '../components/Tags'
import {
  DOC_STATUS_OPTIONS,
  DOC_TYPE_OPTIONS,
  DOC_TYPES,
} from '../constants'
import { openExcel } from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { ProcessDocument } from '../types'
import { daysUntil, formatDate, isOverdue, today } from '../utils/date'
import {
  downloadDocumentTemplate,
  exportDocuments,
  parseDocumentExcel,
} from '../utils/excel'
import { uid } from '../utils/id'

interface DocFormValues {
  code: string
  name: string
  type: string
  version: string
  process?: string
  line?: string
  status: ProcessDocument['status']
  effectiveDate?: Dayjs
  reviewDate?: Dayjs
  filePath?: string
  notes?: string
}

export function DocumentsPage({ createSignal }: { createSignal: number }) {
  const { data, mutate } = useAppStore()
  const [form] = Form.useForm<DocFormValues>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProcessDocument | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const warningDays = data.settings.expiryWarningDays ?? 30

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'SOP',
      version: 'A',
      status: 'controlled',
      effectiveDate: dayjs(),
    })
    setModalOpen(true)
  }

  useEffect(() => {
    if (createSignal > 0) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal])

  const openEdit = (doc: ProcessDocument) => {
    setEditing(doc)
    form.setFieldsValue({
      code: doc.code,
      name: doc.name,
      type: doc.type,
      version: doc.version,
      process: doc.process,
      line: doc.line,
      status: doc.status,
      effectiveDate: doc.effectiveDate ? dayjs(doc.effectiveDate) : undefined,
      reviewDate: doc.reviewDate ? dayjs(doc.reviewDate) : undefined,
      filePath: doc.filePath,
      notes: doc.notes,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      type: values.type,
      version: values.version.trim(),
      process: values.process?.trim(),
      line: values.line?.trim(),
      status: values.status,
      effectiveDate: values.effectiveDate?.format('YYYY-MM-DD'),
      reviewDate: values.reviewDate?.format('YYYY-MM-DD'),
      filePath: values.filePath?.trim(),
      notes: values.notes?.trim(),
      updatedAt: now,
    }
    if (editing) {
      mutate((draft) => ({
        ...draft,
        documents: draft.documents.map((doc) =>
          doc.id === editing.id ? { ...doc, ...payload } : doc,
        ),
      }))
      message.success('文件已更新')
    } else {
      const doc: ProcessDocument = {
        id: uid('doc'),
        ...payload,
        createdAt: now,
      }
      mutate((draft) => ({ ...draft, documents: [doc, ...draft.documents] }))
      message.success('文件已登记')
    }
    setModalOpen(false)
  }

  const removeDoc = (doc: ProcessDocument) => {
    mutate((draft) => ({
      ...draft,
      documents: draft.documents.filter((item) => item.id !== doc.id),
      tasks: draft.tasks.map((task) =>
        task.linkedType === 'document' && task.linkedId === doc.id
          ? { ...task, linkedType: undefined, linkedId: undefined }
          : task,
      ),
    }))
    message.success('文件已删除')
  }

  const handleImport = async () => {
    try {
      const result = await openExcel()
      if (result.canceled || !result.buffer) return
      const rows = await parseDocumentExcel(result.buffer)
      if (rows.length === 0) {
        message.warning('没有识别到有效数据，请检查表头是否与模板一致')
        return
      }
      const now = new Date().toISOString()
      const usedCodes = new Set(data.documents.map((doc) => doc.code))
      const imported: ProcessDocument[] = rows.map((row, index) => {
        let code = row.code?.trim() ?? ''
        if (!code || usedCodes.has(code)) {
          code = `DOC-${dayjs().format('YYYYMMDD')}-${String(index + 1).padStart(3, '0')}`
          while (usedCodes.has(code)) {
            code = `${code}-${index + 1}`
          }
        }
        usedCodes.add(code)
        return {
          id: uid('doc'),
          code,
          name: row.name ?? '未命名文件',
          type: row.type || '其他',
          version: row.version || 'A',
          process: row.process,
          line: row.line,
          status: row.status ?? 'draft',
          effectiveDate: row.effectiveDate || undefined,
          reviewDate: row.reviewDate || undefined,
          filePath: row.filePath,
          notes: row.notes,
          createdAt: now,
          updatedAt: now,
        }
      })
      mutate((draft) => ({ ...draft, documents: [...imported, ...draft.documents] }))
      message.success(`已导入 ${imported.length} 份文件`)
    } catch (error) {
      console.error(error)
      message.error('导入失败，请检查 Excel 格式')
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportDocuments(data.documents)
      if (!result.canceled) message.success('文件台账已导出')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const filtered = useMemo(() => {
    return data.documents
      .filter((doc) => {
        if (search.trim()) {
          const keyword = search.trim().toLowerCase()
          const text = [doc.code, doc.name, doc.process, doc.line, doc.filePath]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!text.includes(keyword)) return false
        }
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false
        if (typeFilter !== 'all' && doc.type !== typeFilter) return false
        return true
      })
      .sort((a, b) => {
        const aDays = daysUntil(a.reviewDate)
        const bDays = daysUntil(b.reviewDate)
        if (aDays === null && bDays === null) return b.updatedAt.localeCompare(a.updatedAt)
        if (aDays === null) return 1
        if (bDays === null) return -1
        return aDays - bDays
      })
  }, [data.documents, search, statusFilter, typeFilter])

  const controlledCount = data.documents.filter((doc) => doc.status === 'controlled').length
  const expiringCount = data.documents.filter((doc) => {
    if (doc.status === 'obsolete') return false
    const days = daysUntil(doc.reviewDate)
    return days !== null && days >= 0 && days <= warningDays
  }).length
  const reviewOverdueCount = data.documents.filter(
    (doc) => doc.status !== 'obsolete' && isOverdue(doc.reviewDate),
  ).length
  const draftCount = data.documents.filter(
    (doc) => doc.status === 'draft' || doc.status === 'reviewing',
  ).length

  const columns: ColumnsType<ProcessDocument> = [
    {
      title: '文件编号',
      dataIndex: 'code',
      width: 170,
      render: (value: string) => <span className="code-text">{value}</span>,
    },
    {
      title: '文件名称',
      dataIndex: 'name',
      render: (_, doc) => (
        <div>
          <div className="text-strong">{doc.name}</div>
          <div className="table-subtext">
            <Tag style={{ marginInlineEnd: 6 }}>{doc.type}</Tag>
            {doc.filePath || '未关联文件路径'}
          </div>
        </div>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 70,
      render: (value: string) => <span className="version-badge">{value}</span>,
    },
    {
      title: '工序 / 产线',
      width: 140,
      render: (_, doc) => (
        <div>
          <div>{doc.process || '-'}</div>
          <div className="table-subtext">{doc.line || '未指定产线'}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, doc) => <DocStatusTag value={doc.status} />,
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      width: 110,
      render: (value?: string) => formatDate(value),
    },
    {
      title: '复审日期',
      dataIndex: 'reviewDate',
      width: 150,
      render: (_, doc) => {
        if (!doc.reviewDate) return <span className="text-muted">未设置</span>
        const days = daysUntil(doc.reviewDate)
        const overdue = days !== null && days < 0 && doc.status !== 'obsolete'
        const soon = days !== null && days >= 0 && days <= warningDays
        return (
          <div>
            <div className={overdue ? 'text-danger' : ''}>{formatDate(doc.reviewDate)}</div>
            <div
              className={`table-subtext ${overdue ? 'text-danger' : soon ? 'text-warning' : ''}`}
            >
              {overdue
                ? `已逾期 ${Math.abs(days ?? 0)} 天`
                : days === 0
                  ? '今天复审'
                  : `${days} 天后复审`}
            </div>
          </div>
        )
      },
    },
    {
      title: '操作',
      width: 90,
      render: (_, doc) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(doc)} />
          <Popconfirm title="删除这份文件？" onConfirm={() => removeDoc(doc)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="受控文件" value={controlledCount} suffix="份" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title={`${warningDays} 天内复审`}
              value={expiringCount}
              suffix="份"
              styles={{ content: { color: expiringCount > 0 ? '#d97706' : undefined } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="复审已逾期"
              value={reviewOverdueCount}
              suffix="份"
              styles={{ content: { color: reviewOverdueCount > 0 ? '#dc2626' : undefined } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="草稿 / 审批中" value={draftCount} suffix="份" />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索文件编号、名称、工序"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[{ value: 'all', label: '全部状态' }, ...DOC_STATUS_OPTIONS]}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 140 }}
              options={[{ value: 'all', label: '全部类型' }, ...DOC_TYPE_OPTIONS]}
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
                  if (key === 'template') void downloadDocumentTemplate()
                },
              }}
            >
              <Button icon={<DownOutlined />}>Excel</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              登记文件
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1000 }}
          rowClassName={(doc) =>
            doc.status !== 'obsolete' && isOverdue(doc.reviewDate) ? 'row-overdue' : ''
          }
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '暂无工艺文件' }}
        />
      </Card>

      <Modal
        title={editing ? '编辑工艺文件' : '登记工艺文件'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={720}
        centered
        keyboard={false}
        mask={{ closable: false }}
        styles={{ body: { maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                name="code"
                label="文件编号"
                rules={[{ required: true, message: '请输入文件编号' }]}
              >
                <Input placeholder="例如：SOP-焊接-001" />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="name"
                label="文件名称"
                rules={[{ required: true, message: '请输入文件名称' }]}
              >
                <Input placeholder="例如：焊接作业指导书" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="type" label="文件类型" rules={[{ required: true }]}>
                <Select options={DOC_TYPES.map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="version" label="版本" rules={[{ required: true }]}>
                <Input placeholder="A" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="process" label="工序段">
                <Input placeholder="例如：焊接" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="line" label="产线">
                <Input placeholder="例如：SMT-01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={DOC_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="effectiveDate" label="生效日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reviewDate" label="下次复审日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="filePath" label="文件路径">
            <Input placeholder="共享盘或本地文件路径，方便快速定位" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="变更要求、培训要求等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
