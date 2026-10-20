import {
  ClockCircleOutlined,
  DatabaseOutlined,
  LinkOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Switch,
  Tag,
  TimePicker,
  Typography,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import type { PageKey } from '../components/AppLayout'
import { MarkdownLite } from '../components/MarkdownLite'
import { DEFAULT_NEWS_FEEDS, DEFAULT_NEWS_PUSH_TIME } from '../constants'
import {
  answerNewsQuestion,
  applyNewsResult,
  generateNewsDigest,
  newsTargetDate,
} from '../services/news'
import { useAppStore } from '../store/AppStore'
import type { NewsArticle, NewsDigest } from '../types'
import { formatDate, formatDateTime } from '../utils/date'

interface NewsSettingsFormValues {
  newsEnabled: boolean
  newsPushTime: Dayjs
  newsFeeds: string
  newsMaxArticles: number
  newsRetentionDays: number
}

const STATUS_LABELS: Record<NewsDigest['status'], { label: string; color: string }> = {
  success: { label: 'AI 摘要', color: 'green' },
  fallback: { label: '原文摘要', color: 'gold' },
  failed: { label: '生成失败', color: 'red' },
}

function DigestStatusTag({ status }: { status: NewsDigest['status'] }) {
  const config = STATUS_LABELS[status]
  return <Tag color={config.color}>{config.label}</Tag>
}

export function NewsPage({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { data, mutate } = useAppStore()
  const [newsForm] = Form.useForm<NewsSettingsFormValues>()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [asking, setAsking] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<NewsArticle[]>([])

  const digests = useMemo(
    () => [...data.newsDigests].sort((a, b) => b.date.localeCompare(a.date)),
    [data.newsDigests],
  )
  const selectedDigest =
    digests.find((digest) => digest.date === selectedDate) ?? digests[0] ?? null
  const articleMap = useMemo(
    () => new Map(data.newsArticles.map((article) => [article.id, article])),
    [data.newsArticles],
  )
  const digestArticles = useMemo(
    () =>
      (selectedDigest?.articleIds ?? [])
        .map((id) => articleMap.get(id))
        .filter((article): article is NewsArticle => Boolean(article)),
    [articleMap, selectedDigest],
  )

  const aiConfigured = Boolean(
    data.settings.aiBaseUrl?.trim() && data.settings.aiModel?.trim(),
  )
  const pushTime = data.settings.newsPushTime ?? DEFAULT_NEWS_PUSH_TIME

  const handleGenerate = async () => {
    const targetDate = newsTargetDate()
    setGenerating(true)
    try {
      const result = await generateNewsDigest({
        targetDate,
        settings: data.settings,
        existingArticles: data.newsArticles,
      })
      mutate((draft) =>
        applyNewsResult(draft, result, data.settings.newsRetentionDays ?? 90),
      )
      setSelectedDate(result.digest.date)
      setAnswer('')
      setSources([])
      if (result.digest.status === 'failed') {
        message.error(result.digest.error ?? '生成失败，请检查资讯源')
      } else if (result.digest.status === 'fallback') {
        message.warning(result.digest.error ?? '已生成原文摘要')
      } else {
        message.success('储能行业日报已生成')
      }
    } catch (error) {
      console.error(error)
      message.error('生成失败，请检查网络或资讯源')
    } finally {
      setGenerating(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || asking) return
    setAsking(true)
    try {
      const result = await answerNewsQuestion({
        question,
        articles: data.newsArticles,
        settings: data.settings,
      })
      setSources(result.sources)
      if (result.ok) {
        setAnswer(result.answer ?? '')
      } else {
        setAnswer('')
        message.error(result.error ?? '回答失败')
      }
    } finally {
      setAsking(false)
    }
  }

  const openSettings = () => {
    const [hour, minute] = pushTime.split(':').map((value) => Number(value))
    newsForm.setFieldsValue({
      newsEnabled: data.settings.newsEnabled !== false,
      newsPushTime: dayjs()
        .hour(Number.isFinite(hour) ? hour : 9)
        .minute(Number.isFinite(minute) ? minute : 0)
        .second(0),
      newsFeeds: (data.settings.newsFeeds?.length
        ? data.settings.newsFeeds
        : DEFAULT_NEWS_FEEDS
      ).join('\n'),
      newsMaxArticles: data.settings.newsMaxArticles ?? 8,
      newsRetentionDays: data.settings.newsRetentionDays ?? 90,
    })
    setSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    const values = await newsForm.validateFields()
    const feeds = values.newsFeeds
      .split('\n')
      .map((feed) => feed.trim())
      .filter(Boolean)
    mutate((draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        newsEnabled: values.newsEnabled,
        newsPushTime: values.newsPushTime.format('HH:mm'),
        newsFeeds: feeds.length > 0 ? feeds : DEFAULT_NEWS_FEEDS,
        newsMaxArticles: values.newsMaxArticles,
        newsRetentionDays: values.newsRetentionDays,
      },
    }))
    setSettingsOpen(false)
    message.success('资讯设置已保存')
  }

  const selectDigest = (digest: NewsDigest) => {
    setSelectedDate(digest.date)
    setAnswer('')
    setSources([])
  }

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="历史日报"
              value={digests.length}
              suffix="期"
              prefix={<DatabaseOutlined style={{ color: '#2563eb' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="资讯库"
              value={data.newsArticles.length}
              suffix="条"
              prefix={<ThunderboltOutlined style={{ color: '#d97706' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="最近一期"
              value={selectedDigest?.articleIds.length ?? 0}
              suffix="条"
              prefix={<LinkOutlined style={{ color: '#0f766e' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="每日推送"
              value={pushTime}
              prefix={<ClockCircleOutlined style={{ color: '#7c3aed' }} />}
            />
            <div className="stat-foot">
              {data.settings.newsEnabled === false ? '已关闭自动推送' : '应用运行时自动生成'}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            variant="borderless"
            className="panel-card news-digest-card"
            title={
              <span className="card-title">
                <ThunderboltOutlined /> {selectedDigest?.title ?? '储能行业日报'}
              </span>
            }
            extra={
              <Space>
                {selectedDigest ? <DigestStatusTag status={selectedDigest.status} /> : null}
                <Button icon={<SettingOutlined />} onClick={openSettings}>
                  资讯设置
                </Button>
                <Button
                  type="primary"
                  icon={<SyncOutlined spin={generating} />}
                  loading={generating}
                  onClick={() => void handleGenerate()}
                >
                  生成昨日资讯
                </Button>
              </Space>
            }
          >
            {!selectedDigest ? (
              <Empty
                description="还没有生成储能行业日报"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" loading={generating} onClick={() => void handleGenerate()}>
                  立即生成昨日资讯
                </Button>
              </Empty>
            ) : (
              <div className="news-digest-body">
                <div className="news-meta">
                  <span>{selectedDigest.date}</span>
                  <span>生成于 {formatDateTime(selectedDigest.createdAt)}</span>
                  <span>{selectedDigest.articleIds.length} 条资讯</span>
                </div>

                {selectedDigest.error ? (
                  <Alert
                    type={selectedDigest.status === 'failed' ? 'error' : 'info'}
                    showIcon
                    title={selectedDigest.error}
                  />
                ) : null}

                <MarkdownLite className="news-summary" text={selectedDigest.summary} />

                {selectedDigest.highlights.length > 0 ? (
                  <div className="news-highlights">
                    <div className="detail-section-title">重点速览</div>
                    <ul>
                      {selectedDigest.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="news-articles">
                  <div className="detail-section-title">抓取到的资讯</div>
                  {digestArticles.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="本期资讯原文已被清理或未保存"
                    />
                  ) : (
                    <List
                      dataSource={digestArticles}
                      renderItem={(article, index) => (
                        <List.Item className="news-article-item">
                          <div className="news-article-index">{index + 1}</div>
                          <div className="news-article-main">
                            <a
                              className="news-article-title"
                              href={article.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {article.title}
                            </a>
                            <div className="news-article-meta">
                              {article.source} · {formatDate(article.publishedAt)}
                            </div>
                            {article.summary ? (
                              <div className="news-article-summary">{article.summary}</div>
                            ) : null}
                          </div>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card
            variant="borderless"
            className="panel-card news-history-card"
            title="历史推送"
            extra={<span className="text-muted">{digests.length} 期</span>}
          >
            {digests.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史推送" />
            ) : (
              <div className="news-history-list">
                {digests.map((digest) => (
                  <button
                    key={digest.id}
                    className={`news-history-item ${
                      selectedDigest?.id === digest.id ? 'active' : ''
                    }`}
                    onClick={() => selectDigest(digest)}
                  >
                    <div>
                      <div className="news-history-date">{digest.date}</div>
                      <div className="news-history-sub">
                        {digest.articleIds.length} 条资讯
                      </div>
                    </div>
                    <DigestStatusTag status={digest.status} />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            variant="borderless"
            className="panel-card"
            title={
              <span className="card-title">
                <RobotOutlined /> 资讯问答（RAG）
              </span>
            }
          >
            {!aiConfigured ? (
              <Alert
                type="warning"
                showIcon
                title="尚未配置 AI 模型"
                description="RAG 问答需要先配置一个兼容 OpenAI 的模型。"
                action={
                  <Button size="small" onClick={() => onNavigate('settings')}>
                    去设置
                  </Button>
                }
              />
            ) : null}
            <div className="news-qa">
              <Input.TextArea
                rows={3}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="例如：最近储能政策有哪些变化？哪些企业在扩产？"
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault()
                    void handleAsk()
                  }
                }}
              />
              <div className="news-qa-actions">
                <span className="text-muted">
                  从本地 {data.newsArticles.length} 条资讯中检索相关材料后回答
                </span>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={asking}
                  disabled={!question.trim() || !aiConfigured}
                  onClick={() => void handleAsk()}
                >
                  检索并回答
                </Button>
              </div>
              {answer ? <MarkdownLite className="qa-answer" text={answer} /> : null}
              {sources.length > 0 ? (
                <div className="qa-sources">
                  <div className="detail-section-title">参考资料</div>
                  {sources.map((article, index) => (
                    <div key={article.id} className="qa-source">
                      <span className="qa-source-index">[{index + 1}]</span>
                      <div>
                        <a href={article.link} target="_blank" rel="noreferrer">
                          {article.title}
                        </a>
                        <div className="news-article-meta">
                          {article.source} · {formatDate(article.publishedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            variant="borderless"
            className="panel-card"
            title={
              <span className="card-title">
                <ThunderboltOutlined /> RAG 工作方式
              </span>
            }
          >
            <div className="rag-steps">
              {[
                ['01', '抓取入库', '按设定时间抓取 RSS 资讯，清洗后保存到本地资讯库。'],
                ['02', '检索召回', '用 BM25 关键词检索从历史资讯中找出最相关的材料。'],
                ['03', '增强生成', '把检索结果和问题一起交给 AI，生成带来源编号的摘要或回答。'],
              ].map(([step, title, description]) => (
                <div className="rag-step" key={step}>
                  <div className="rag-step-index">{step}</div>
                  <div>
                    <div className="rag-step-title">{title}</div>
                    <div className="rag-step-desc">{description}</div>
                  </div>
                </div>
              ))}
            </div>
            <Typography.Paragraph className="settings-note" style={{ marginBottom: 0 }}>
              检索在本地完成，只有生成摘要或回答时才会把选中的资讯片段发送给你配置的 AI。
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <Modal
        title="储能资讯设置"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={handleSaveSettings}
        okText="保存"
        cancelText="取消"
        width={720}
        centered
        keyboard={false}
        mask={{ closable: false }}
        styles={{ body: { maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={newsForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="newsEnabled" label="自动推送" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="newsPushTime" label="每天推送时间" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="newsFeeds"
            label="资讯源 RSS（每行一个）"
            extra="默认使用必应资讯的储能关键词 RSS，可替换为其他 RSS 2.0 源。"
          >
            <Input.TextArea rows={6} placeholder="https://example.com/rss" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="newsMaxArticles" label="每期最多资讯条数">
                <InputNumber min={3} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="newsRetentionDays" label="本地资讯保留天数">
                <InputNumber min={7} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="link"
            style={{ paddingInline: 0 }}
            onClick={() => newsForm.setFieldValue('newsFeeds', DEFAULT_NEWS_FEEDS.join('\n'))}
          >
            恢复默认资讯源
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
