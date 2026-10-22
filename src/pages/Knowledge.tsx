import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { KnowledgeTypeTag } from '../components/Tags'
import {
  KNOWLEDGE_TYPE_LABELS,
  KNOWLEDGE_TYPE_OPTIONS,
} from '../constants'
import { openExcel } from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { KnowledgeItem } from '../types'
import { formatDate } from '../utils/date'
import {
  downloadKnowledgeTemplate,
  exportKnowledge,
  parseKnowledgeExcel,
} from '../utils/excel'
import { uid } from '../utils/id'

interface KnowledgeFormValues {
  title: string
  type: KnowledgeItem['type']
  tags?: string[]
  content: string
  sourceIssueId?: string
}

export function KnowledgePage({ createSignal }: { createSignal: number }) {
  const { data, mutate } = useAppStore()
  const [form] = Form.useForm<KnowledgeFormValues>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')

  const detailItem = data.knowledge.find((item) => item.id === detailId) ?? null

  const allTags = useMemo(() => {
    const set = new Set<string>()
    data.knowledge.forEach((item) => item.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [data.knowledge])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'case', tags: [] })
    setModalOpen(true)
  }

  useEffect(() => {
    if (createSignal > 0) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal])

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    form.setFieldsValue({
      title: item.title,
      type: item.type,
      tags: item.tags,
      content: item.content,
      sourceIssueId: item.sourceIssueId,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    const payload = {
      title: values.title.trim(),
      type: values.type,
      tags: values.tags ?? [],
      content: values.content.trim(),
      sourceIssueId: values.sourceIssueId,
      updatedAt: now,
    }
    if (editing) {
      mutate((draft) => ({
        ...draft,
        knowledge: draft.knowledge.map((item) =>
          item.id === editing.id ? { ...item, ...payload } : item,
        ),
      }))
      message.success('知识条目已更新')
    } else {
      const item: KnowledgeItem = {
        id: uid('knowledge'),
        ...payload,
        createdAt: now,
      }
      mutate((draft) => ({ ...draft, knowledge: [item, ...draft.knowledge] }))
      message.success('知识条目已保存')
    }
    setModalOpen(false)
  }

  const removeItem = (item: KnowledgeItem) => {
    mutate((draft) => ({
      ...draft,
      knowledge: draft.knowledge.filter((entry) => entry.id !== item.id),
      tasks: draft.tasks.map((task) =>
        task.linkedType === 'knowledge' && task.linkedId === item.id
          ? { ...task, linkedType: undefined, linkedId: undefined }
          : task,
      ),
    }))
    if (detailId === item.id) setDetailId(null)
    message.success('知识条目已删除')
  }

  const handleExport = async () => {
    try {
      const result = await exportKnowledge(
        data.knowledge.map((item) => ({
          title: item.title,
          type: KNOWLEDGE_TYPE_LABELS[item.type],
          tags: item.tags.join('、'),
          content: item.content,
          sourceIssueCode: item.sourceIssueId
            ? data.issues.find((issue) => issue.id === item.sourceIssueId)?.code
            : undefined,
          updatedAt: item.updatedAt,
        })),
      )
      if (!result.canceled) message.success('知识库已导出')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const handleImport = async () => {
    try {
      const result = await openExcel()
      if (result.canceled || !result.buffer) return
      const rows = await parseKnowledgeExcel(result.buffer)
      if (rows.length === 0) {
        message.warning('没有识别到有效数据，请检查表头是否与模板一致')
        return
      }

      const now = new Date().toISOString()
      const issueMap = new Map(
        data.issues.map((issue) => [issue.code.trim().toLowerCase(), issue.id]),
      )
      const existingTitles = new Set(
        data.knowledge.map((item) => item.title.trim().toLowerCase()),
      )
      const imported: KnowledgeItem[] = []
      let skipped = 0

      rows.forEach((row) => {
        const titleKey = row.title.trim().toLowerCase()
        if (existingTitles.has(titleKey)) {
          skipped += 1
          return
        }
        existingTitles.add(titleKey)
        imported.push({
          id: uid('knowledge'),
          title: row.title,
          type: row.type,
          tags: row.tags,
          content: row.content,
          sourceIssueId: row.sourceIssueCode
            ? issueMap.get(row.sourceIssueCode.trim().toLowerCase())
            : undefined,
          createdAt: now,
          updatedAt: now,
        })
      })

      if (imported.length === 0) {
        message.warning(`识别到 ${rows.length} 条，但都与现有知识标题重复`)
        return
      }

      mutate((draft) => ({
        ...draft,
        knowledge: [...imported, ...draft.knowledge],
      }))
      message.success(
        `已导入 ${imported.length} 条知识${skipped > 0 ? `，跳过 ${skipped} 条重复标题` : ''}`,
      )
    } catch (error) {
      console.error(error)
      message.error('导入失败，请检查 Excel 格式')
    }
  }

  const filtered = useMemo(() => {
    return data.knowledge
      .filter((item) => {
        if (search.trim()) {
          const keyword = search.trim().toLowerCase()
          const text = [item.title, item.content, item.tags.join(' ')].join(' ').toLowerCase()
          if (!text.includes(keyword)) return false
        }
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false
        return true
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [data.knowledge, search, tagFilter, typeFilter])

  const sourceIssue = detailItem?.sourceIssueId
    ? data.issues.find((issue) => issue.id === detailItem.sourceIssueId)
    : undefined

  return (
    <div className="page-stack">
      <Card variant="borderless" className="panel-card">
        <div className="toolbar">
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索标题、正文或标签"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 130 }}
              options={[{ value: 'all', label: '全部类型' }, ...KNOWLEDGE_TYPE_OPTIONS]}
            />
            <Select
              value={tagFilter}
              onChange={setTagFilter}
              style={{ width: 150 }}
              showSearch
              options={[
                { value: 'all', label: '全部标签' },
                ...allTags.map((tag) => ({ value: tag, label: tag })),
              ]}
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
                  if (key === 'template') void downloadKnowledgeTemplate()
                },
              }}
            >
              <Button icon={<DownOutlined />}>Excel</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建知识
            </Button>
          </Space>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card variant="borderless" className="panel-card">
          <Empty description="还没有知识条目">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              记录第一条经验
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((item) => (
            <Col span={8} key={item.id}>
              <Card
                variant="borderless"
                className="knowledge-card"
                onClick={() => setDetailId(item.id)}
                title={<div className="knowledge-title">{item.title}</div>}
                extra={
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        { key: 'edit', icon: <EditOutlined />, label: '编辑' },
                        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                      ],
                      onClick: ({ key, domEvent }) => {
                        domEvent.stopPropagation()
                        if (key === 'edit') openEdit(item)
                        if (key === 'delete') removeItem(item)
                      },
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Dropdown>
                }
              >
                <div className="knowledge-card-top">
                  <KnowledgeTypeTag value={item.type} />
                  <span className="text-muted">{formatDate(item.updatedAt)}</span>
                </div>
                <div className="knowledge-divider" />
                <div className="knowledge-excerpt">{item.content || '暂无内容'}</div>
                <div className="knowledge-tags">
                  {item.tags.slice(0, 4).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editing ? '编辑知识条目' : '新建知识条目'}
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
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="例如：焊接虚焊问题的排查思路" maxLength={120} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={KNOWLEDGE_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="tags" label="标签">
                <Select
                  mode="tags"
                  placeholder="输入后回车，可添加多个标签"
                  tokenSeparators={[',', '，']}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="sourceIssueId" label="关联问题">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="可选：从哪个问题沉淀而来"
              options={data.issues.map((issue) => ({
                value: issue.id,
                label: `${issue.code} ${issue.title}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="正文"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder="可以记录问题现象、根因、措施、适用工序、注意事项等"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detailItem?.title ?? '知识详情'}
        size={720}
        open={Boolean(detailItem)}
        onClose={() => setDetailId(null)}
        extra={
          detailItem ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => openEdit(detailItem)}>
                编辑
              </Button>
              <Popconfirm title="删除这条知识？" onConfirm={() => removeItem(detailItem)}>
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        {detailItem ? (
          <div className="detail-stack">
            <Space wrap>
              <KnowledgeTypeTag value={detailItem.type} />
              {detailItem.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
            {sourceIssue ? (
              <div className="source-issue">
                来源问题：{sourceIssue.code} {sourceIssue.title}
              </div>
            ) : null}
            <div className="knowledge-content">{detailItem.content}</div>
            <div className="table-subtext">
              创建于 {formatDate(detailItem.createdAt)} · 更新于 {formatDate(detailItem.updatedAt)}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
