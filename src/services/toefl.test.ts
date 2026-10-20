import { describe, expect, it } from 'vitest'
import { TOEFL_QUESTIONS } from '../data/toeflQuestions'
import {
  applyToeflRecord,
  buildRecord,
  buildToeflTrend,
  collectMistakes,
  countRecord,
  pickDailyQuestions,
  submitAnswer,
  summarizeToefl,
  TOEFL_DAILY_COUNT,
} from './toefl'
import { createEmptyStore } from '../constants'

describe('托福题库数据完整性', () => {
  it('题库总数达到 120 题', () => {
    expect(TOEFL_QUESTIONS.length).toBe(120)
  })

  it('四种题型各 30 题', () => {
    const byType = TOEFL_QUESTIONS.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] ?? 0) + 1
      return acc
    }, {})
    expect(byType.vocab).toBe(30)
    expect(byType.grammar).toBe(30)
    expect(byType.sentence).toBe(30)
    expect(byType.reading).toBe(30)
  })

  it('题目 ID 唯一', () => {
    const ids = TOEFL_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每题选项 4 个、答案下标合法、解析非空', () => {
    for (const q of TOEFL_QUESTIONS) {
      expect(q.options.length, q.id).toBe(4)
      expect(q.answerIndex, q.id).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex, q.id).toBeLessThan(4)
      expect(q.prompt.trim().length, q.id).toBeGreaterThan(0)
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(0)
    }
  })

  it('阅读题带短文，其他题型不带', () => {
    for (const q of TOEFL_QUESTIONS) {
      if (q.type === 'reading') {
        expect((q.passage ?? '').length, q.id).toBeGreaterThan(30)
      } else {
        expect(q.passage, q.id).toBeFalsy()
      }
    }
  })
})

describe('每日选题算法', () => {
  it('每天恰好 10 题', () => {
    const questions = pickDailyQuestions('2026-10-20')
    expect(questions).toHaveLength(TOEFL_DAILY_COUNT)
  })

  it('同一天两次选题结果一致（同日稳定）', () => {
    const a = pickDailyQuestions('2026-10-20')
    const b = pickDailyQuestions('2026-10-20')
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('相邻两天选题不完全相同（异日随机）', () => {
    const a = pickDailyQuestions('2026-10-20')
    const b = pickDailyQuestions('2026-10-21')
    const overlap = a.filter((q) => b.some((x) => x.id === q.id)).length
    expect(overlap).toBeLessThan(TOEFL_DAILY_COUNT)
  })

  it('连续 7 天两两重复不超过 6 题', () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = String(20 + i).padStart(2, '0')
      return pickDailyQuestions(`2026-10-${d}`).map((q) => q.id)
    })
    for (let i = 0; i < days.length; i += 1) {
      for (let j = i + 1; j < days.length; j += 1) {
        const overlap = days[i].filter((id) => days[j].includes(id)).length
        expect(overlap, `day${i} vs day${j}`).toBeLessThanOrEqual(6)
      }
    }
  })
})

describe('答题记录逻辑', () => {
  const date = '2026-10-20'
  const questions = pickDailyQuestions(date)
  const record = buildRecord(date, questions)

  it('buildRecord 生成 10 个未答答案', () => {
    expect(record.answers).toHaveLength(10)
    expect(record.answers.every((a) => a.selectedIndex === null && a.correct === null)).toBe(true)
  })

  it('submitAnswer 正确判定对错（不可变更新）', () => {
    const q0 = questions[0]
    const right = submitAnswer(record, 0, q0.answerIndex, questions)
    expect(right.answers[0].correct).toBe(true)
    expect(right.answers[0].selectedIndex).toBe(q0.answerIndex)
    // 原记录不被修改
    expect(record.answers[0].selectedIndex).toBe(null)

    const wrong = submitAnswer(right, 1, (questions[1].answerIndex + 1) % 4, questions)
    expect(wrong.answers[1].correct).toBe(false)
    expect(wrong.answers[0].correct).toBe(true) // 前一题结果保留
  })

  it('countRecord 统计正确', () => {
    const updated = submitAnswer(record, 0, questions[0].answerIndex, questions)
    const wrong = submitAnswer(updated, 1, (questions[1].answerIndex + 1) % 4, questions)
    const stats = countRecord(wrong)
    expect(stats.answered).toBe(2)
    expect(stats.correct).toBe(1)
    expect(stats.total).toBe(10)
  })

  it('applyToeflRecord 同日去重', () => {
    const draft = createEmptyStore()
    const applied = applyToeflRecord(draft, record)
    expect(applied.toeflRecords).toHaveLength(1)
    const appliedAgain = applyToeflRecord(applied, { ...record, updatedAt: '2026-10-20T12:00:00Z' })
    expect(appliedAgain.toeflRecords).toHaveLength(1)
    expect(appliedAgain.toeflRecords[0].updatedAt).toBe('2026-10-20T12:00:00Z')
  })

  it('summarizeToefl 跨日累计正确', () => {
    const day1 = submitAnswer(record, 0, questions[0].answerIndex, questions)
    const day1Wrong = submitAnswer(day1, 1, (questions[1].answerIndex + 1) % 4, questions)
    const day2 = buildRecord('2026-10-21', pickDailyQuestions('2026-10-21'))
    const day2Right = submitAnswer(day2, 0, questions[0].answerIndex, questions)
    const stats = summarizeToefl([day1Wrong, day2Right])
    expect(stats.days).toBe(2)
    expect(stats.answered).toBe(3)
    expect(stats.correct).toBe(2)
    expect(stats.rate).toBe(67)
  })

  it('collectMistakes 聚合错题并按次数排序', () => {
    const q0 = questions[0]
    const q1 = questions[1]
    const day1 = submitAnswer(record, 0, (q0.answerIndex + 1) % 4, questions)
    const day1Wrong = submitAnswer(day1, 1, (q1.answerIndex + 1) % 4, questions)
    const day2 = buildRecord('2026-10-21', pickDailyQuestions('2026-10-21'))
    // 找到 q0 在 day2 中的下标（若不在当日题目中则跳过该断言）
    const day2Index = day2.answers.findIndex((answer) => answer.questionId === q0.id)
    let day2Wrong = day2
    if (day2Index >= 0) {
      day2Wrong = submitAnswer(day2, day2Index, (q0.answerIndex + 1) % 4, questions)
    }
    const mistakes = collectMistakes([day1Wrong, day2Wrong])
    const mistake0 = mistakes.find((mistake) => mistake.questionId === q0.id)
    expect(mistakes.length).toBeGreaterThanOrEqual(1)
    expect(mistake0).toBeDefined()
    if (mistake0 && day2Index >= 0) {
      expect(mistake0.wrongCount).toBe(2)
    } else if (mistake0) {
      expect(mistake0.wrongCount).toBe(1)
    }
    // 排序：错误次数多的在前
    for (let index = 1; index < mistakes.length; index += 1) {
      expect(mistakes[index - 1].wrongCount).toBeGreaterThanOrEqual(mistakes[index].wrongCount)
    }
  })

  it('buildToeflTrend 按日期升序且只含有答题的天', () => {
    const day1 = submitAnswer(record, 0, questions[0].answerIndex, questions)
    const day1Wrong = submitAnswer(day1, 1, (questions[1].answerIndex + 1) % 4, questions)
    const day2 = buildRecord('2026-10-21', pickDailyQuestions('2026-10-21'))
    const day2Right = submitAnswer(day2, 0, questions[0].answerIndex, questions)
    const emptyDay = buildRecord('2026-10-22', pickDailyQuestions('2026-10-22'))
    const trend = buildToeflTrend([day2Right, day1Wrong, emptyDay])
    expect(trend).toHaveLength(2)
    expect(trend[0].date).toBe('2026-10-20')
    expect(trend[1].date).toBe('2026-10-21')
    expect(trend[1].rate).toBe(100)
    expect(trend[0].answered).toBe(2)
  })
})
