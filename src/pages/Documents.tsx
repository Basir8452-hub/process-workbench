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
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { DocStatusTag } from '../components/Tags'
import { DOC_STATUS_OPTIONS, DOC_TYPE_OPTIONS, DOC_TYPES } from '../constants'
import { openExcel } from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { ProcessDocument } from '../types'
import { formatDate } from '../utils/date'
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
  tags?: string[]
  status: ProcessDocument['status']
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
  const [tagFilter, setTagFilter] = useState<string[]>([])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    data.documents.forEach((doc) => doc.tags.forEach((tag) => set.add(tag)))
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [data.documents])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'SOP', version: 'A', status: 'controlled', tags: [] })
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
      tags: doc.tags,
      status: doc.status,
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
      tags: values.tags ?? [],
      status: values.status,
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
          tags: row.tags ?? [],
          status: row.status ?? 'draft',
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
          const text = [doc.code, doc.name, doc.tags.join(' '), doc.filePath]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!text.includes(keyword)) return false
        }
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false
        if (typeFilter !== 'all' && doc.type !== typeFilter) return false
        if (tagFilter.length > 0 && !tagFilter.every((tag) => doc.tags.includes(tag))) return false
        return true
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [data.documents, search, statusFilter, typeFilter, tagFilter])

  const controlledCount = data.documents.filter((doc) => doc.status === 'controlled').length
  const obsoleteCount = data.documents.filter((doc) => doc.status === 'obsolete').length
  const draftCount = data.documents.filter(
    (doc) => doc.status === 'draft' || doc.status === 'reviewing',
  ).length
  const typeCount = data.documents.length

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
      title: '归档标签',
      dataIndex: 'tags',
      render: (_, doc) =>
        doc.tags.length > 0 ? (
          <div className="doc-tags">
            {doc.tags.slice(0, 4).map((tag) => (
              <Tag key={tag} style={{ marginInlineEnd: 6 }}>
                {tag}
              </Tag>
            ))}
            {doc.tags.length > 4 ? (
              <span className="table-subtext">+{doc.tags.length - 4}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-muted">未打标签</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, doc) => <DocStatusTag value={doc.status} />,
    },
    {
      title: '登记时间',
      dataIndex: 'updatedAt',
      width: 110,
      render: (value: string) => formatDate(value),
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
            <Statistic title="文件总数" value={typeCount} suffix="份" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="受控文件" value={controlledCount} suffix="份" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="草稿 / 审批中" value={draftCount} suffix="份" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic title="作废归档" value={obsoleteCount} suffix="份" />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索编号、名称、标签、路径"
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
            <Select
              mode="multiple"
              allowClear
              placeholder="按标签筛选（可多选）"
              style={{ minWidth: 200, maxWidth: 360 }}
              value={tagFilter}
              onChange={setTagFilter}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              maxTagCount="responsive"
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
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={DOC_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="tags" label="归档标签">
                <Select
                  mode="tags"
                  placeholder="输入后回车，例如：工序:焊接、产线:SMT-01"
                  tokenSeparators={[',', '，']}
                />
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
