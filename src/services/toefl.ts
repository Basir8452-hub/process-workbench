import dayjs from 'dayjs'
import { TOEFL_QUESTIONS } from '../data/toeflQuestions'
import type { StoreData, ToeflDailyRecord, ToeflQuestion } from '../types'

export const TOEFL_DAILY_COUNT = 10

/** 每日 10 题：用日期字符串作为稳定种子初始化 PRNG，保证同一天题目固定、不同日期题目不同 */
export function pickDailyQuestions(date: string, count = TOEFL_DAILY_COUNT): ToeflQuestion[] {
  const rand = mulberry32(hashString(date))
  const pool = [...TOEFL_QUESTIONS]
  // Fisher-Yates 洗牌
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  return pool.slice(0, Math.min(count, pool.length))
}

function hashString(input: string): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

/** mulberry32：种子伪随机数生成器（确定性，同种子输出同序列） */
function mulberry32(seed: number): () => number {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 取今日（或指定日期）的答题记录，不存在则返回默认结构 */
export function getRecord(
  records: ToeflDailyRecord[],
  date: string,
): ToeflDailyRecord | undefined {
  return records.find((record) => record.date === date)
}

export function todayKey(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** 生成一条新的答题记录，answers 长度与题目数量一致 */
export function buildRecord(date: string, questions: ToeflQuestion[]): ToeflDailyRecord {
  const now = new Date().toISOString()
  return {
    id: `toefl_${date}`,
    date,
    answers: questions.map((question) => ({
      questionId: question.id,
      selectedIndex: null,
      correct: null,
    })),
    startedAt: now,
    updatedAt: now,
  }
}

/** 提交第 index 题答案，返回更新后的记录 */
export function submitAnswer(
  record: ToeflDailyRecord,
  index: number,
  selectedIndex: number,
  questions: ToeflQuestion[],
): ToeflDailyRecord {
  const question = questions[index]
  if (!question) return record
  const answered = record.answers.map((answer, answerIndex) =>
    answerIndex === index
      ? {
          ...answer,
          selectedIndex,
          correct: selectedIndex === question.answerIndex,
        }
      : answer,
  )
  return {
    ...record,
    answers: answered,
    updatedAt: new Date().toISOString(),
  }
}

/** 统计已答/答对数量 */
export function countRecord(record: ToeflDailyRecord): {
  answered: number
  correct: number
  total: number
} {
  const total = record.answers.length
  const answered = record.answers.filter((answer) => answer.selectedIndex !== null).length
  const correct = record.answers.filter((answer) => answer.correct === true).length
  return { answered, correct, total }
}

/** 把当日记录合并进 StoreData（同日去重） */
export function applyToeflRecord(draft: StoreData, record: ToeflDailyRecord): StoreData {
  return {
    ...draft,
    toeflRecords: [
      record,
      ...draft.toeflRecords.filter((item) => item.date !== record.date),
    ].sort((a, b) => b.date.localeCompare(a.date)),
  }
}

/** 累计统计（跨日） */
export function summarizeToefl(records: ToeflDailyRecord[]): {
  days: number
  answered: number
  correct: number
  rate: number
} {
  const days = records.length
  let answered = 0
  let correct = 0
  for (const record of records) {
    for (const answer of record.answers) {
      if (answer.selectedIndex !== null) {
        answered += 1
        if (answer.correct === true) correct += 1
      }
    }
  }
  return {
    days,
    answered,
    correct,
    rate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
  }
}

export const TOEFL_TYPE_LABELS: Record<ToeflQuestion['type'], string> = {
  vocab: '词汇',
  grammar: '语法',
  sentence: '句子填空',
  reading: '短阅读',
}

export interface ToeflMistake {
  questionId: string
  question: ToeflQuestion
  wrongCount: number
  lastDate: string
  lastSelectedIndex: number
}

/** 聚合错题：跨日去重统计，按错误次数降序、最近出错日期次之 */
export function collectMistakes(records: ToeflDailyRecord[]): ToeflMistake[] {
  const map = new Map<string, { count: number; lastDate: string; lastSelectedIndex: number }>()
  const questionsById = new Map(TOEFL_QUESTIONS.map((question) => [question.id, question]))
  for (const record of records) {
    for (const answer of record.answers) {
      if (answer.correct === false && answer.selectedIndex !== null) {
        const entry =
          map.get(answer.questionId) ?? {
            count: 0,
            lastDate: '',
            lastSelectedIndex: answer.selectedIndex,
          }
        entry.count += 1
        if (record.date > entry.lastDate) {
          entry.lastDate = record.date
          entry.lastSelectedIndex = answer.selectedIndex
        }
        map.set(answer.questionId, entry)
      }
    }
  }
  return [...map.entries()]
    .map(([questionId, info]) => ({
      questionId,
      question: questionsById.get(questionId) as ToeflQuestion | undefined,
      wrongCount: info.count,
      lastDate: info.lastDate,
      lastSelectedIndex: info.lastSelectedIndex,
    }))
    .filter((item): item is ToeflMistake => Boolean(item.question))
    .sort(
      (a, b) =>
        b.wrongCount - a.wrongCount || b.lastDate.localeCompare(a.lastDate),
    )
}

export interface ToeflTrendPoint {
  date: string
  rate: number
  answered: number
  correct: number
}

/** 每日正确率趋势：仅含有答题的天，按日期升序 */
export function buildToeflTrend(records: ToeflDailyRecord[]): ToeflTrendPoint[] {
  return [...records]
    .map((record) => {
      const stat = countRecord(record)
      return {
        date: record.date,
        rate: stat.answered > 0 ? Math.round((stat.correct / stat.answered) * 100) : 0,
        answered: stat.answered,
        correct: stat.correct,
      }
    })
    .filter((point) => point.answered > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}
