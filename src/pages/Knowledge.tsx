import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  TableOutlined,
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
  Table as AntTable,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { KnowledgeTypeTag } from '../components/Tags'
import { KNOWLEDGE_TYPE_LABELS, KNOWLEDGE_TYPE_OPTIONS } from '../constants'
import { openExcel } from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { ContentBlock, KnowledgeItem } from '../types'
import { formatDate } from '../utils/date'
import {
  downloadKnowledgeTemplate,
  exportKnowledge,
  parseKnowledgeExcel,
} from '../utils/excel'
import { uid } from '../utils/id'
import { blocksToExcerpt, blocksToText } from '../utils/knowledge'

interface KnowledgeFormValues {
  title: string
  type: KnowledgeItem['type']
  tags?: string[]
  sourceIssueId?: string
}

interface TableBlockDraft {
  headers: string[]
  rows: string[][]
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function BlockTable({ block }: { block: Extract<ContentBlock, { type: 'table' }> }) {
  interface TableRowRecord {
    key: string
    [cell: string]: string
  }
  const columns: ColumnsType<TableRowRecord> = block.headers.map((header, index) => ({
    title: header,
    dataIndex: String(index),
    key: String(index),
    ellipsis: true,
  }))
  const dataSource = block.rows.map((row, rowIndex) => {
    const record: TableRowRecord = { key: String(rowIndex) }
    row.forEach((cell, cellIndex) => {
      record[String(cellIndex)] = cell
    })
    return record
  })
  return (
    <AntTable
      size="small"
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      bordered
      scroll={{ x: 'max-content' }}
    />
  )
}

function BlockView({ block }: { block: ContentBlock }) {
  if (block.type === 'text') {
    return <div className="knowledge-block-text">{block.text}</div>
  }
  if (block.type === 'image') {
    return (
      <div className="knowledge-block-image">
        <img src={block.dataUrl} alt="知识图片" />
      </div>
    )
  }
  return <BlockTable block={block} />
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
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [textDraft, setTextDraft] = useState('')
  const [tableDraft, setTableDraft] = useState<TableBlockDraft>({
    headers: ['参数', '数值'],
    rows: [['', '']],
  })
  const [tableModalOpen, setTableModalOpen] = useState(false)

  const detailItem = data.knowledge.find((item) => item.id === detailId) ?? null

  const allTags = useMemo(() => {
    const set = new Set<string>()
    data.knowledge.forEach((item) => item.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [data.knowledge])

  const resetEditor = () => {
    setBlocks([])
    setTextDraft('')
    setTableDraft({ headers: ['参数', '数值'], rows: [['', '']] })
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'case', tags: [] })
    resetEditor()
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
      sourceIssueId: item.sourceIssueId,
    })
    setBlocks(item.blocks)
    setTextDraft('')
    setTableDraft({ headers: ['参数', '数值'], rows: [['', '']] })
    setModalOpen(true)
  }

  const addTextBlock = () => {
    const text = textDraft.trim()
    if (!text) {
      message.info('请先输入文字内容')
      return
    }
    setBlocks((previous) => [...previous, { type: 'text', text }])
    setTextDraft('')
  }

  const addImageBlock = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      message.warning('图片请控制在 2MB 以内')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setBlocks((previous) => [...previous, { type: 'image', dataUrl }])
      message.success('图片已添加')
    } catch (error) {
      console.error(error)
      message.error('图片读取失败')
    }
  }

  const addTableBlock = () => {
    const headers = tableDraft.headers.map((header) => header.trim()).filter(Boolean)
    if (headers.length === 0) {
      message.info('请至少填写一个表头')
      return
    }
    const rows = tableDraft.rows
      .map((row) => row.map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell))
    setBlocks((previous) => [...previous, { type: 'table', headers, rows }])
    setTableModalOpen(false)
    setTableDraft({ headers: ['参数', '数值'], rows: [['', '']] })
  }

  const removeBlock = (index: number) => {
    setBlocks((previous) => previous.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (blocks.length === 0) {
      message.warning('请至少添加一段内容（文字/图片/表格）')
      return
    }
    const now = new Date().toISOString()
    const payload = {
      title: values.title.trim(),
      type: values.type,
      tags: values.tags ?? [],
      blocks,
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
          content: blocksToText(item.blocks),
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
          blocks: row.content ? [{ type: 'text', text: row.content }] : [],
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
          const text = [item.title, blocksToText(item.blocks), item.tags.join(' ')]
            .join(' ')
            .toLowerCase()
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
                <div className="knowledge-excerpt">{blocksToExcerpt(item.blocks) || '（空内容）'}</div>
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
        width={760}
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

          <div className="knowledge-editor">
            <div className="knowledge-editor-title">正文内容（可混排文字 / 图片 / 表格）</div>

            {blocks.length > 0 ? (
              <div className="knowledge-editor-blocks">
                {blocks.map((block, index) => (
                  <div key={`${index}-${block.type}`} className="knowledge-editor-block">
                    <div className="knowledge-editor-block-head">
                      <span className="table-subtext">
                        {block.type === 'text'
                          ? '文字'
                          : block.type === 'image'
                            ? '图片'
                            : '表格'}
                      </span>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeBlock(index)}
                      />
                    </div>
                    {block.type === 'text' ? (
                      <div className="knowledge-block-text">{block.text}</div>
                    ) : block.type === 'image' ? (
                      <div className="knowledge-block-image">
                        <img src={block.dataUrl} alt="知识图片" />
                      </div>
                    ) : (
                      <BlockTable block={block} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="还没有内容块，从下方添加"
              />
            )}

            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Input.TextArea
                rows={3}
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                placeholder="输入文字内容（支持多行）"
              />
              <Space wrap>
                <Button icon={<PlusOutlined />} onClick={addTextBlock}>
                  添加文字
                </Button>
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = () => {
                      const file = input.files?.[0]
                      if (file) void addImageBlock(file)
                    }
                    input.click()
                  }}
                >
                  添加图片
                </Button>
                <Button icon={<TableOutlined />} onClick={() => setTableModalOpen(true)}>
                  添加表格
                </Button>
              </Space>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="添加表格"
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        onOk={addTableBlock}
        okText="添加"
        cancelText="取消"
        width={560}
        centered
        destroyOnHidden
      >
        <div className="table-editor">
          <div className="detail-section-title">表头（用逗号分隔）</div>
          <Input
            value={tableDraft.headers.join('，')}
            onChange={(event) =>
              setTableDraft((previous) => ({
                ...previous,
                headers: event.target.value.split(/[，,]/).map((header) => header.trim()),
              }))
            }
            placeholder="参数，数值"
          />
          <div className="detail-section-title" style={{ marginTop: 12 }}>
            数据行（每行用逗号分隔单元格，回车添加新行）
          </div>
          {tableDraft.rows.map((row, rowIndex) => (
            <Input
              key={rowIndex}
              value={row.join('，')}
              style={{ marginBottom: 6 }}
              onChange={(event) =>
                setTableDraft((previous) => ({
                  ...previous,
                  rows: previous.rows.map((item, index) =>
                    index === rowIndex
                      ? event.target.value.split(/[，,]/).map((cell) => cell.trim())
                      : item,
                  ),
                }))
              }
              placeholder="例如：焊接电流，180A"
            />
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() =>
              setTableDraft((previous) => ({ ...previous, rows: [...previous.rows, ['', '']] }))
            }
          >
            添加一行
          </Button>
        </div>
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
            <div className="knowledge-content">
              {detailItem.blocks.length === 0 ? (
                <span className="text-muted">（空内容）</span>
              ) : (
                detailItem.blocks.map((block, index) => <BlockView key={index} block={block} />)
              )}
            </div>
            <div className="table-subtext">
              创建于 {formatDate(detailItem.createdAt)} · 更新于 {formatDate(detailItem.updatedAt)}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
