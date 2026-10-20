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
import type { PageKey } from '../components/AppLayout'
import { TOEFL_QUESTION_TYPES } from '../data/toeflQuestions'
import {
  applyToeflRecord,
  buildRecord,
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
