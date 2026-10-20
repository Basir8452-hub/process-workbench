import {
  ClearOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Tooltip,
  message,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import { ISSUE_STATUS_LABELS } from '../constants'
import { chatWithAI } from '../services/ai'
import { useAppStore } from '../store/AppStore'
import type { StoreData } from '../types'
import { isDueToday, isOverdue, isWithinDays, today } from '../utils/date'
import { uid } from '../utils/id'
import type { PageKey } from './AppLayout'

const CHAT_STORAGE_KEY = 'process-workbench:ai-chat'
const MAX_HISTORY = 20

interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

const SUGGESTIONS = [
  '帮我梳理一个 5Why 分析思路',
  '根据本周问题写一段周报',
  '工艺文件复审要检查哪些内容？',
]

function loadChat(): ChatEntry[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is ChatEntry =>
            Boolean(item && (item.role === 'user' || item.role === 'assistant') && item.content),
        )
      : []
  } catch {
    return []
  }
}

function timeLabel(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function buildWorkbenchContext(data: StoreData): string {
  const openIssues = data.issues.filter((issue) => issue.status !== 'closed')
  const overdueIssues = openIssues.filter((issue) => isOverdue(issue.dueDate))
  const todayTasks = data.tasks.filter(
    (task) => !task.done && (isDueToday(task.dueDate) || isOverdue(task.dueDate)),
  )
  const expiringDocs = data.documents.filter(
    (doc) =>
      doc.status !== 'obsolete' &&
      isWithinDays(doc.reviewDate, data.settings.expiryWarningDays ?? 30),
  )

  return [
    `今天：${today()}`,
    `未关闭问题：${openIssues.length} 个，其中超期 ${overdueIssues.length} 个`,
    `最近未关闭问题：${
      openIssues
        .slice(0, 6)
        .map(
          (issue) =>
            `${issue.code} ${issue.title}（${issue.line ?? '未填产线'}/${issue.process ?? '未填工序'}，${
              ISSUE_STATUS_LABELS[issue.status]
            }）`,
        )
        .join('；') || '无'
    }`,
    `今日待办：${todayTasks.slice(0, 6).map((task) => task.title).join('；') || '无'}`,
    `临近复审文件：${
      expiringDocs
        .slice(0, 6)
        .map((doc) => `${doc.code} ${doc.name}（${doc.reviewDate}）`)
        .join('；') || '无'
    }`,
  ].join('\n')
}

export function AiChat({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { data } = useAppStore()
  const [messages, setMessages] = useState<ChatEntry[]>(loadChat)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [withContext, setWithContext] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const ownerName = data.settings.ownerName?.trim()
  const configured = Boolean(
    data.settings.aiBaseUrl?.trim() && data.settings.aiModel?.trim(),
  )
  const modelLabel = data.settings.aiModel?.trim() || '未配置模型'

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    } catch {
      // 本地存储不可用时忽略
    }
  }, [messages])

  useEffect(() => {
    const container = listRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, sending])

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || sending) return
    if (!configured) {
      message.warning('请先在设置中配置 AI 接口地址和模型')
      onNavigate('settings')
      return
    }

    const userEntry: ChatEntry = {
      id: uid('chat'),
      role: 'user',
      content: text,
      time: timeLabel(),
    }
    const next = [...messages, userEntry]
    setMessages(next)
    setInput('')
    setSending(true)

    const systemPrompt =
      data.settings.aiSystemPrompt?.trim() ||
      '你是一名制造企业工艺开发工程师的助手，擅长前期工艺开发、NPI、现场问题分析、8D/5Why、工艺文件与产线放行。请用简洁、可执行的中文回答；涉及安全、质量或合规风险时明确提醒。'
    const context = withContext ? buildWorkbenchContext(data) : ''
    const requestMessages = [
      {
        role: 'system' as const,
        content: systemPrompt + (context ? `\n\n以下是我当前工作台的摘要：\n${context}` : ''),
      },
      ...next.slice(-MAX_HISTORY).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    ]

    const result = await chatWithAI({
      baseUrl: data.settings.aiBaseUrl!.trim(),
      apiKey: data.settings.aiApiKey?.trim(),
      model: data.settings.aiModel!.trim(),
      messages: requestMessages,
    })

    if (result.ok && result.content) {
      setMessages((previous) => [
        ...previous,
        {
          id: uid('chat'),
          role: 'assistant',
          content: result.content!,
          time: timeLabel(),
        },
      ])
    } else {
      const errorText = result.error ?? 'AI 请求失败'
      message.error(errorText)
      setMessages((previous) => [
        ...previous,
        {
          id: uid('chat'),
          role: 'assistant',
          content: `请求失败：${errorText}`,
          time: timeLabel(),
        },
      ])
    }
    setSending(false)
  }

  return (
    <Card
      variant="borderless"
      className="panel-card ai-chat-card"
      title={
        <span className="card-title">
          <RobotOutlined /> AI 助手
        </span>
      }
      extra={
        <Space size={8}>
          <Tag color={configured ? 'blue' : 'default'} style={{ marginInlineEnd: 0 }}>
            {modelLabel}
          </Tag>
          <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => onNavigate('settings')}>
            AI 设置
          </Button>
        </Space>
      }
    >
      {!configured ? (
        <Alert
          type="info"
          showIcon
          title="尚未配置 AI 模型"
          description="在设置中填写兼容 OpenAI 的接口地址、模型名称和 API Key 后即可对话；本地模型可以留空 API Key。"
          action={
            <Button size="small" type="primary" onClick={() => onNavigate('settings')}>
              去配置
            </Button>
          }
        />
      ) : null}

      <div className="ai-chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="ai-empty">
            <RobotOutlined className="ai-empty-icon" />
            <div className="ai-empty-title">
              你好{ownerName ? `，${ownerName}` : ''}，我是你的工艺助手
            </div>
            <div className="ai-empty-desc">
              可以帮你梳理问题分析思路、整理周报、检查工艺文件清单
            </div>
            <div className="ai-suggestion">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => setInput(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={`ai-msg ${item.role}`}>
              <div className="ai-avatar">
                {item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              </div>
              <div className="ai-msg-body">
                <div className="ai-bubble">{item.content}</div>
                <div className="ai-time">{item.time}</div>
              </div>
            </div>
          ))
        )}
        {sending ? (
          <div className="ai-msg assistant">
            <div className="ai-avatar">
              <RobotOutlined />
            </div>
            <div className="ai-msg-body">
              <div className="ai-bubble ai-typing">正在思考...</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ai-chat-input">
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={configured ? '输入问题，Enter 发送，Shift+Enter 换行' : '请先在设置中配置 AI 模型'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
          disabled={!configured || sending}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          disabled={!configured || !input.trim()}
          onClick={() => void handleSend()}
        >
          发送
        </Button>
      </div>

      <div className="ai-chat-meta">
        <Space size={8}>
          <Switch size="small" checked={withContext} onChange={setWithContext} />
          <span>附带工作台摘要</span>
          <Tooltip title="开启后会把未关闭问题标题、今日待办和临近复审文件摘要发送给你配置的 AI 服务，请确认可接受后再开启。">
            <span className="ai-help">?</span>
          </Tooltip>
        </Space>
        <Popconfirm title="清空当前对话记录？" onConfirm={() => setMessages([])}>
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            disabled={messages.length === 0}
          >
            清空对话
          </Button>
        </Popconfirm>
      </div>
    </Card>
  )
}
