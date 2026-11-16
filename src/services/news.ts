import dayjs from 'dayjs'
import {
  AI_NEWS_SECTIONS,
  DEFAULT_AI_NEWS_FEEDS,
  DEFAULT_AI_NEWS_QUERY,
  DEFAULT_NEWS_FEEDS,
  DEFAULT_NEWS_QUERY,
  NEWS_CATEGORY_LABELS,
  STORAGE_NEWS_SECTIONS,
} from '../constants'
import type {
  AppSettings,
  NewsArticle,
  NewsCategory,
  NewsDigest,
  NewsFeedItem,
  StoreData,
} from '../types'
import { uid } from '../utils/id'
import { chatWithAI } from './ai'
import { fetchNewsFeeds } from './storage'

const STOPWORDS = new Set([
  '的',
  '了',
  '和',
  '与',
  '及',
  '在',
  '是',
  '有',
  '为',
  '对',
  '从',
  '到',
  '将',
  '等',
  '个',
  '月',
  '日',
  '年',
  '行业',
  '资讯',
  '新闻',
  '表示',
  '认为',
  '目前',
  '已经',
  '今年',
  '去年',
  '同比',
  '环比',
  '以及',
  '一个',
  '我们',
])

export interface GenerateNewsOptions {
  targetDate: string
  settings: AppSettings
  existingArticles: NewsArticle[]
  category: NewsCategory
}

export interface GenerateNewsResult {
  digest: NewsDigest
  newArticles: NewsArticle[]
  errors: string[]
}

export interface NewsAnswerResult {
  ok: boolean
  answer?: string
  sources: NewsArticle[]
  error?: string
}

function localDate(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
}

/** 分类对应的 RSS 源：储能资讯可带海辰视角源 */
export function feedsForCategory(settings: AppSettings, category: NewsCategory): string[] {
  const custom = category === 'ai' ? settings.aiNewsFeeds : settings.newsFeeds
  const fallback = category === 'ai' ? DEFAULT_AI_NEWS_FEEDS : DEFAULT_NEWS_FEEDS
  return (custom?.length ? custom : fallback).filter(Boolean)
}

function queryForCategory(category: NewsCategory): string {
  return category === 'ai' ? DEFAULT_AI_NEWS_QUERY : DEFAULT_NEWS_QUERY
}

export function articlesOfCategory(
  articles: NewsArticle[],
  category: NewsCategory,
): NewsArticle[] {
  return articles.filter((article) => (article.category ?? 'storage') === category)
}

export function digestsOfCategory(digests: NewsDigest[], category: NewsCategory): NewsDigest[] {
  return digests.filter((digest) => (digest.category ?? 'storage') === category)
}

function clip(text: string, max: number): string {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized
}

function normalizeItem(
  item: NewsFeedItem,
  targetDate: string,
  now: string,
  category: NewsCategory,
): NewsArticle {
  const published = dayjs(item.publishedAt)
  return {
    id: uid('news'),
    title: clip(item.title, 160),
    summary: clip(item.summary, 600),
    link: item.link.trim(),
    source: clip(item.source || '未知来源', 60),
    publishedAt: published.isValid() ? published.toISOString() : now,
    fetchedAt: now,
    digestDate: targetDate,
    category,
  }
}

export function mergeNewsArticles(
  existing: NewsArticle[],
  incoming: NewsArticle[],
): NewsArticle[] {
  const map = new Map<string, NewsArticle>()
  for (const article of [...existing, ...incoming]) {
    const key = `${article.category ?? 'storage'}|${article.title.trim().toLowerCase()}|${article.link.trim()}`
    if (!map.has(key)) map.set(key, article)
  }
  return [...map.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const tokens: string[] = []
  const english = lower.match(/[a-z][a-z0-9-]{1,}/g) ?? []
  tokens.push(...english)

  const chineseSegments = lower.match(/[\u4e00-\u9fa5]+/g) ?? []
  for (const segment of chineseSegments) {
    if (segment.length === 1) tokens.push(segment)
    for (let index = 0; index < segment.length - 1; index += 1) {
      tokens.push(segment.slice(index, index + 2))
    }
    if (segment.length >= 2 && segment.length <= 6) tokens.push(segment)
  }

  return tokens.filter((token) => token.length >= 2 && !STOPWORDS.has(token))
}

/**
 * 轻量 BM25 检索：中文按字符二元组、英文按单词切分。
 * 不依赖向量模型，适合本地历史资讯的快速召回。
 */
export function retrieveArticles(
  articles: NewsArticle[],
  query: string,
  topK = 6,
): NewsArticle[] {
  if (articles.length === 0) return []
  const queryTokens = [...new Set(tokenize(query))]
  if (queryTokens.length === 0) {
    return [...articles]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, topK)
  }

  const docs = articles.map((article) => {
    const titleTokens = tokenize(article.title)
    const summaryTokens = tokenize(article.summary)
    const tokens = [...titleTokens, ...titleTokens, ...summaryTokens]
    const termFrequency = new Map<string, number>()
    tokens.forEach((token) => {
      termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1)
    })
    return {
      article,
      termFrequency,
      length: tokens.length || 1,
      time: new Date(article.publishedAt).getTime() || 0,
    }
  })

  const averageLength =
    docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length || 1
  const documentFrequency = new Map<string, number>()
  for (const token of queryTokens) {
    let count = 0
    for (const doc of docs) {
      if (doc.termFrequency.has(token)) count += 1
    }
    documentFrequency.set(token, count)
  }

  const k1 = 1.2
  const b = 0.75
  const total = docs.length
  const scored = docs.map((doc) => {
    let score = 0
    for (const token of queryTokens) {
      const frequency = doc.termFrequency.get(token) ?? 0
      if (frequency === 0) continue
      const freq = documentFrequency.get(token) ?? 0
      const idf = Math.log(1 + (total - freq + 0.5) / (freq + 0.5))
      score +=
        (idf * frequency * (k1 + 1)) /
        (frequency + k1 * (1 - b + (b * doc.length) / averageLength))
    }

    const days = (Date.now() - doc.time) / 86400000
    if (days >= 0 && days <= 3) score *= 1.15
    else if (days <= 7) score *= 1.05
    return { article: doc.article, score }
  })

  const matched = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
  if (matched.length > 0) {
    return matched.slice(0, topK).map((item) => item.article)
  }

  return [...articles]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, topK)
}

const SYSTEM_ROLE: Record<NewsCategory, string> = {
  storage:
    '你是一名储能行业研究分析师，服务对象是海辰储能的工艺开发工程师。请只依据用户提供的资讯生成中文日报，不要编造资料中没有的信息，并始终给出与海辰及工艺开发视角相关的判断。',
  ai: '你是一名 AI 行业研究分析师，服务对象是制造企业的工艺与数字化岗位。请只依据用户提供的资讯生成中文日报，不要编造资料中没有的信息，并始终给出与制造企业落地视角相关的判断。',
}

const QA_ROLE: Record<NewsCategory, string> = {
  storage: '你是一名储能行业研究助手。请严格依据提供的本地资讯回答问题，并使用 [编号] 标注引用来源。',
  ai: '你是一名 AI 行业研究助手。请严格依据提供的本地资讯回答问题，并使用 [编号] 标注引用来源。',
}

function buildDigestPrompt(
  date: string,
  articles: NewsArticle[],
  category: NewsCategory,
): string {
  const sourceList = articles
    .map((article, index) => {
      const published = dayjs(article.publishedAt).format('YYYY-MM-DD HH:mm')
      return `[${index + 1}] ${article.title}\n来源：${article.source}｜时间：${published}\n摘要：${
        article.summary || '无摘要'
      }\n链接：${article.link}`
    })
    .join('\n\n')

  const sections = (
    category === 'ai' ? AI_NEWS_SECTIONS : STORAGE_NEWS_SECTIONS
  ).join(' / ')

  const extraRules =
    category === 'storage'
      ? [
          '3. 与海辰相关的内容（海辰储能 / Hithium / 海辰订单、出海、产能、价格，以及主要竞品动态）优先放入「焦点动态」分区。',
          '4. 每条重点后另起一行，用「对我们的意义：」补一句与储能工艺开发、制造、良率或成本相关的启示。',
        ]
      : [
          '3. 「今日焦点」只放当天最重要、最值得看的一两条。',
          '4. 「工业与储能 AI」优先选择制造、储能、工业软件、机器视觉、预测性维护相关内容；若当日没有相关资讯，明确写「今日无相关资讯」。',
          '5. 每条重点后另起一行，用「对我们的意义：」补一句对工艺开发或制造岗位的启示。',
        ]

  return `请基于以下资讯，生成 ${date} 的${NEWS_CATEGORY_LABELS[category]}日报。

输出要求：
1. 先用 2-3 句话概括整体动态。
2. 按「${sections}」分区列出重点，每条 1-2 句，句末用 [编号] 标注来源；同一分区内不要重复。
${extraRules.join('\n')}
${extraRules.length + 2}. 最后给出 1-2 条值得关注的趋势判断。
${extraRules.length + 3}. 只能使用给定资料，不要编造；资料不足时明确说明。

资讯：
${sourceList}`
}

function buildFallbackSummary(
  date: string,
  articles: NewsArticle[],
  category: NewsCategory,
): string {
  const lines = articles
    .slice(0, 8)
    .map((article, index) => `${index + 1}. ${article.title}（${article.source}）`)
  return `${date} 共抓取 ${articles.length} 条${NEWS_CATEGORY_LABELS[category]}：\n${lines.join(
    '\n',
  )}\n\n配置 AI 模型后可生成分区摘要、对我们的意义与趋势判断。`
}

function buildQaPrompt(question: string, articles: NewsArticle[]): string {
  const context = articles
    .map((article, index) => {
      const published = dayjs(article.publishedAt).format('YYYY-MM-DD')
      return `[${index + 1}] ${article.title}\n来源：${article.source}｜时间：${published}\n摘要：${
        article.summary || '无摘要'
      }`
    })
    .join('\n\n')

  return `请根据以下本地资讯回答问题。答案要简洁、分点，引用资料时在句末标注 [1][2]。如果资料不足，请明确说明。

问题：${question}

资讯：
${context}`
}

export async function generateNewsDigest(
  options: GenerateNewsOptions,
): Promise<GenerateNewsResult> {
  const { targetDate, settings, existingArticles, category } = options
  const label = NEWS_CATEGORY_LABELS[category]
  const feeds = feedsForCategory(settings, category)
  const fetched = await fetchNewsFeeds(feeds)
  const now = new Date().toISOString()
  const newArticles = fetched.items
    .map((item) => normalizeItem(item, targetDate, now, category))
    .filter((article) => article.title && article.link)
  const categoryArticles = articlesOfCategory(
    mergeNewsArticles(existingArticles, newArticles),
    category,
  )

  const dateArticles = categoryArticles.filter(
    (article) => localDate(article.publishedAt) === targetDate,
  )
  const candidates =
    dateArticles.length > 0 ? dateArticles : categoryArticles.slice(0, 30)
  const maxArticles = Math.min(Math.max(settings.newsMaxArticles ?? 8, 3), 20)
  const retrieved = retrieveArticles(candidates, queryForCategory(category), maxArticles)
  const digestArticles = retrieved.length > 0 ? retrieved : candidates.slice(0, maxArticles)

  const errors = [...fetched.errors]
  const aiConfigured = Boolean(settings.aiBaseUrl?.trim() && settings.aiModel?.trim())
  let summary = ''
  let status: NewsDigest['status'] = 'fallback'
  let error: string | undefined

  if (digestArticles.length === 0) {
    status = 'failed'
    error = errors.length > 0 ? errors.join('；') : '未获取到资讯，请检查网络或资讯源'
    summary = `昨日未抓取到${label}。`
  } else if (aiConfigured) {
    const result = await chatWithAI({
      baseUrl: settings.aiBaseUrl!.trim(),
      apiKey: settings.aiApiKey?.trim(),
      model: settings.aiModel!.trim(),
      messages: [
        { role: 'system', content: SYSTEM_ROLE[category] },
        { role: 'user', content: buildDigestPrompt(targetDate, digestArticles, category) },
      ],
    })
    if (result.ok && result.content) {
      summary = result.content.trim()
      status = 'success'
    } else {
      error = result.error || 'AI 摘要生成失败'
      summary = buildFallbackSummary(targetDate, digestArticles, category)
    }
  } else {
    error = '未配置 AI 模型，已生成原文摘要'
    summary = buildFallbackSummary(targetDate, digestArticles, category)
  }

  const highlights = digestArticles.slice(0, 6).map((article) => article.title)
  const digest: NewsDigest = {
    id: uid('digest'),
    date: targetDate,
    title: `${label}日报 · ${targetDate}`,
    summary,
    highlights,
    articleIds: digestArticles.map((article) => article.id),
    status,
    error,
    category,
    createdAt: now,
    updatedAt: now,
  }

  return { digest, newArticles, errors }
}

export async function answerNewsQuestion(options: {
  question: string
  articles: NewsArticle[]
  settings: AppSettings
  category: NewsCategory
}): Promise<NewsAnswerResult> {
  const question = options.question.trim()
  if (!question) return { ok: false, sources: [], error: '请输入问题' }

  const sources = retrieveArticles(options.articles, question, 6)
  if (sources.length === 0) {
    return {
      ok: false,
      sources: [],
      error: '本地资讯库还没有可用内容，请先生成日报',
    }
  }
  if (!options.settings.aiBaseUrl?.trim() || !options.settings.aiModel?.trim()) {
    return {
      ok: false,
      sources,
      error: '请先在设置中配置 AI 模型',
    }
  }

  const result = await chatWithAI({
    baseUrl: options.settings.aiBaseUrl.trim(),
    apiKey: options.settings.aiApiKey?.trim(),
    model: options.settings.aiModel.trim(),
    messages: [
      { role: 'system', content: QA_ROLE[options.category] },
      { role: 'user', content: buildQaPrompt(question, sources) },
    ],
  })

  if (!result.ok || !result.content) {
    return { ok: false, sources, error: result.error || 'AI 回答失败' }
  }

  return { ok: true, answer: result.content, sources }
}

export function applyNewsResult(
  draft: StoreData,
  result: GenerateNewsResult,
  retentionDays: number,
): StoreData {
  const articles = mergeNewsArticles(draft.newsArticles, result.newArticles)
  const cutoff = dayjs()
    .subtract(Math.max(retentionDays, 7), 'day')
    .format('YYYY-MM-DD')
  const filteredArticles = articles
    .filter((article) => localDate(article.publishedAt) >= cutoff)
    .slice(0, 2000)
  const digestCategory = result.digest.category ?? 'storage'
  const digests = [
    result.digest,
    ...draft.newsDigests.filter(
      (digest) => !(digest.date === result.digest.date && (digest.category ?? 'storage') === digestCategory),
    ),
  ]
    .filter((digest) => digest.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 365)

  return {
    ...draft,
    newsArticles: filteredArticles,
    newsDigests: digests,
  }
}

export function newsTargetDate(): string {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD')
}
