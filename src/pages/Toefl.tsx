import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  FireOutlined,
  HistoryOutlined,
  ReadOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Empty,
  message,
  Progress,
  Radio,
  Row,
  Space,
  Statistic,
  Tag,
} from 'antd'
import { useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { Chart } from '../components/Chart'
import type { PageKey } from '../components/AppLayout'
import { TOEFL_QUESTION_TYPES } from '../data/toeflQuestions'
import {
  applyToeflRecord,
  buildRecord,
  buildToeflTrend,
  collectMistakes,
  countRecord,
  getRecord,
  pickDailyQuestions,
  submitAnswer,
  summarizeToefl,
  todayKey,
  TOEFL_DAILY_COUNT,
} from '../services/toefl'
import { useAppStore } from '../store/AppStore'
import type { ToeflDailyRecord } from '../types'
import { formatDate, formatDateTime } from '../utils/date'

export function ToeflPage({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { data, mutate } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = todayKey()
  const questions = useMemo(() => pickDailyQuestions(today), [today])

  const records = useMemo(
    () => [...data.toeflRecords].sort((a, b) => b.date.localeCompare(a.date)),
    [data.toeflRecords],
  )
  const todayRecord = useMemo(
    () => getRecord(data.toeflRecords, today) ?? buildRecord(today, questions),
    [data.toeflRecords, today, questions],
  )
  const stats = useMemo(() => summarizeToefl(records), [records])
  const todayStats = countRecord(todayRecord)
  const mistakes = useMemo(() => collectMistakes(records), [records])
  const trend = useMemo(() => buildToeflTrend(records), [records])

  const trendOption = useMemo<EChartsOption>(() => {
    const dates = trend.map((point) => point.date.slice(5))
    return {
      grid: { left: 34, right: 16, top: 24, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        formatter(params: unknown) {
          const list = Array.isArray(params) ? params : [params]
          const first = list[0] as { axisValue?: string; data?: { rate?: number; answered?: number; correct?: number } } | undefined
          const point = first?.data
          if (!first || !point) return ''
          return `${first.axisValue ?? ''}<br/>正确率 <b>${point.rate ?? 0}%</b><br/>答题 ${point.answered ?? 0} · 答对 ${point.correct ?? 0}`
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '正确率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: trend.map((point) => ({
            value: point.rate,
            rate: point.rate,
            answered: point.answered,
            correct: point.correct,
          })),
          lineStyle: { color: '#2563eb', width: 2.5 },
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.22)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
              ],
            },
          },
        },
      ],
    }
  }, [trend])

  const viewDate = selectedDate ?? today
  const viewRecord = getRecord(data.toeflRecords, viewDate) ?? buildRecord(viewDate, questions)
  const viewQuestions = viewDate === today ? questions : pickDailyQuestions(viewDate)

  const handleAnswer = (index: number, selectedIndex: number) => {
    if (viewDate !== today) return
    const answer = todayRecord.answers[index]
    if (answer.selectedIndex !== null) return
    const updated = submitAnswer(todayRecord, index, selectedIndex, questions)
    mutate((draft) => applyToeflRecord(draft, updated))
    const correct = selectedIndex === questions[index].answerIndex
    message[correct ? 'success' : 'error'](
      correct ? `第 ${index + 1} 题回答正确` : `第 ${index + 1} 题回答错误，已展示解析`,
    )
  }

  const recordMap = useMemo(
    () => new Map(records.map((record) => [record.date, record])),
    [records],
  )

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="学习天数"
              value={stats.days}
              suffix="天"
              prefix={<FireOutlined style={{ color: '#ea580c' }} />}
            />
            <div className="stat-foot">坚持每日 10 题，保持语感</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="累计答题"
              value={stats.answered}
              suffix="题"
              prefix={<ReadOutlined style={{ color: '#2563eb' }} />}
            />
            <div className="stat-foot">其中答对 {stats.correct} 题</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="正确率"
              value={stats.rate}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: '#d97706' }} />}
            />
            <div className="stat-foot">全部历史答题的正确比例</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card variant="borderless" className="stat-card">
            <Statistic
              title="今日进度"
              value={todayStats.answered}
              suffix={`/ ${todayStats.total}`}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
            />
            <div className="stat-foot">已答对 {todayStats.correct} 题</div>
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
                <ReadOutlined /> {viewDate === today ? '今日练习' : `${viewDate} 练习回顾`}
              </span>
            }
            extra={
              <Space>
                <Tag color="blue">{viewQuestions.length} 题</Tag>
                {viewDate === today ? (
                  <Tag color="green">每日推送 · 完成 {todayStats.answered}/{todayStats.total}</Tag>
                ) : (
                  <Tag>历史记录</Tag>
                )}
              </Space>
            }
          >
            <div className="toefl-progress-line">
              <Progress
                percent={
                  viewQuestions.length > 0
                    ? Math.round((todayStats.answered / viewQuestions.length) * 100)
                    : 0
                }
                strokeColor={{ '0%': '#38bdf8', '100%': '#22c55e' }}
                size="small"
              />
            </div>

            {viewQuestions.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="题库为空，请稍后再来"
              />
            ) : (
              <div className="toefl-question-list">
                {viewQuestions.map((question, index) => {
                  const answer = viewRecord.answers[index]
                  const answered = answer?.selectedIndex !== null
                  const isCorrect = answer?.correct === true
                  return (
                    <div
                      key={question.id}
                      className={`toefl-question-card ${
                        answered ? (isCorrect ? 'is-correct' : 'is-wrong') : ''
                      }`}
                    >
                      <div className="toefl-question-head">
                        <span className="toefl-question-index">Q{index + 1}</span>
                        <Tag
                          color={TOEFL_QUESTION_TYPES[question.type].color}
                          style={{ marginInlineEnd: 0 }}
                        >
                          {TOEFL_QUESTION_TYPES[question.type].label}
                        </Tag>
                        {answered ? (
                          isCorrect ? (
                            <span className="toefl-verdict correct">
                              <CheckCircleFilled /> 回答正确
                            </span>
                          ) : (
                            <span className="toefl-verdict wrong">
                              <CloseCircleFilled /> 回答错误
                            </span>
                          )
                        ) : null}
                      </div>

                      {question.passage ? (
                        <div className="toefl-passage">{question.passage}</div>
                      ) : null}

                      <div className="toefl-prompt">{question.prompt}</div>

                      <Radio.Group
                        className="toefl-options"
                        value={answer?.selectedIndex ?? undefined}
                        onChange={(event) => handleAnswer(index, event.target.value)}
                        disabled={viewDate !== today || answered}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          {question.options.map((option, optionIndex) => {
                            const isAnswer = optionIndex === question.answerIndex
                            const isSelected = answer?.selectedIndex === optionIndex
                            return (
                              <Radio
                                key={optionIndex}
                                value={optionIndex}
                                className={`toefl-option ${
                                  answered && isAnswer
                                    ? 'is-answer'
                                    : answered && isSelected && !isAnswer
                                      ? 'is-selected-wrong'
                                      : ''
                                }`}
                              >
                                <span className="toefl-option-label">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                {option}
                              </Radio>
                            )
                          })}
                        </Space>
                      </Radio.Group>

                      {answered ? (
                        <div
                          className={`toefl-feedback ${isCorrect ? 'correct' : 'wrong'}`}
                        >
                          <div className="toefl-feedback-title">
                            {isCorrect ? '解析 · 你答对了' : '解析 · 正确答案'}：
                            {String.fromCharCode(65 + question.answerIndex)}.{' '}
                            {question.options[question.answerIndex]}
                          </div>
                          <div className="toefl-feedback-body">{question.explanation}</div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card
            variant="borderless"
            className="panel-card toefl-history-card"
            title={
              <span className="card-title">
                <HistoryOutlined /> 学习记录
              </span>
            }
            extra={<span className="text-muted">{records.length} 天</span>}
          >
            {records.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="还没有学习记录，今天开始第一组练习"
              />
            ) : (
              <div className="toefl-history-list">
                {records.map((record) => {
                  const recordStats = countRecord(record)
                  const recordQuestions = pickDailyQuestions(record.date)
                  const dateLabel = record.date === today ? '今天' : formatDate(record.date)
                  return (
                    <button
                      key={record.id}
                      className={`toefl-history-item ${
                        viewDate === record.date ? 'active' : ''
                      }`}
                      onClick={() => setSelectedDate(record.date === today ? null : record.date)}
                    >
                      <div>
                        <div className="toefl-history-date">{dateLabel}</div>
                        <div className="toefl-history-sub">
                          {recordStats.answered}/{recordQuestions.length} 题 · 对{' '}
                          {recordStats.correct}
                        </div>
                      </div>
                      <Tag
                        color={
                          recordStats.answered === 0
                            ? 'default'
                            : recordStats.correct / Math.max(recordStats.answered, 1) >= 0.7
                              ? 'green'
                              : 'red'
                        }
                        style={{ marginInlineEnd: 0 }}
                      >
                        {recordStats.answered === 0
                          ? '未开始'
                          : `${Math.round((recordStats.correct / recordStats.answered) * 100)}%`}
                      </Tag>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="toefl-today-note">
              <ClockCircleOutlined /> 每日 0 点自动更换一组新题，当日题目固定、可随时回顾。
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={10}>
          <Card
            variant="borderless"
            className="panel-card toefl-mistake-card"
            title={
              <span className="card-title">
                <CloseCircleFilled style={{ color: '#dc2626' }} /> 错题本
              </span>
            }
            extra={<span className="text-muted">{mistakes.length} 道易错题</span>}
          >
            {mistakes.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="太棒了，暂时没有错题"
              />
            ) : (
              <div className="toefl-mistake-list">
                {mistakes.map((mistake) => {
                  const question = mistake.question
                  const wrongOption = question.options[mistake.lastSelectedIndex]
                  return (
                    <div className="toefl-mistake-item" key={mistake.questionId}>
                      <div className="toefl-mistake-head">
                        <Tag
                          color={TOEFL_QUESTION_TYPES[question.type].color}
                          style={{ marginInlineEnd: 0 }}
                        >
                          {TOEFL_QUESTION_TYPES[question.type].label}
                        </Tag>
                        <span className="toefl-mistake-count">
                          错 {mistake.wrongCount} 次 · {formatDate(mistake.lastDate)}
                        </span>
                      </div>
                      <div className="toefl-mistake-prompt">
                        {question.passage ? (
                          <div className="toefl-passage toefl-mistake-passage">
                            {question.passage}
                          </div>
                        ) : null}
                        {question.prompt}
                      </div>
                      <div className="toefl-mistake-answer">
                        <span className="toefl-mistake-answer-label">正确答案</span>
                        {String.fromCharCode(65 + question.answerIndex)}.{' '}
                        {question.options[question.answerIndex]}
                      </div>
                      {wrongOption !== undefined && wrongOption !== question.options[question.answerIndex] ? (
                        <div className="toefl-mistake-answer wrong">
                          <span className="toefl-mistake-answer-label">你选过</span>
                          {String.fromCharCode(65 + mistake.lastSelectedIndex)}. {wrongOption}
                        </div>
                      ) : null}
                      <div className="toefl-mistake-explain">{question.explanation}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Col>
        <Col span={14}>
          <Card
            variant="borderless"
            className="panel-card toefl-trend-card"
            title={
              <span className="card-title">
                <TrophyOutlined style={{ color: '#d97706' }} /> 正确率趋势
              </span>
            }
            extra={
              trend.length > 0 ? (
                <span className="text-muted">
                  最近 {trend[trend.length - 1].rate}% · 共 {trend.length} 天
                </span>
              ) : null
            }
          >
            {trend.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="完成答题后这里会展示每日正确率曲线"
              />
            ) : (
              <Chart option={trendOption} height={300} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card
            variant="borderless"
            className="panel-card"
            title={
              <span className="card-title">
                <ReloadOutlined /> 学习说明
              </span>
            }
          >
            <div className="toefl-help-steps">
              {[
                ['01', '每日 10 题', '每天按日期自动生成 10 道托福样题，覆盖词汇、语法、句子填空与短阅读。'],
                ['02', '逐题作答', '选择答案后立即反馈对错，并展示本题解析，做完一题看一题。'],
                ['03', '回顾与坚持', '历史记录保留每日答题情况，可随时回看错题和解析。'],
                ['04', '错题巩固', '答错的题自动进错题本，按错误次数排序，集中复习薄弱点。'],
                ['05', '趋势复盘', '正确率趋势图记录每天的表现，帮助观察进步曲线。'],
              ].map(([step, title, description]) => (
                <div className="toefl-help-step" key={step}>
                  <div className="toefl-help-index">{step}</div>
                  <div>
                    <div className="toefl-help-title">{title}</div>
                    <div className="toefl-help-desc">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export function formatToeflRecordTime(record: ToeflDailyRecord | undefined): string {
  return record ? formatDateTime(record.updatedAt) : '-'
}
