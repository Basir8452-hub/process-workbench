import { ArrowRightOutlined, ReadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Tag } from 'antd'
import type { PageKey } from '../components/AppLayout'
import { useAppStore } from '../store/AppStore'
import { summarizeToefl } from '../services/toefl'

export function ExtensionsPage({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const { data } = useAppStore()
  const toeflStats = summarizeToefl(data.toeflRecords)

  return (
    <div className="page-stack">
      <div className="extension-banner">
        <div className="extension-banner-main">
          <div className="extension-banner-eyebrow">EXTENSIONS</div>
          <h1 className="extension-banner-title">扩展功能</h1>
          <p className="extension-banner-desc">
            在工艺工作台基础上按需添加的轻量工具与学习应用，所有数据仍保存在本机。
          </p>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={12} lg={12}>
          <Card
            variant="borderless"
            className="extension-card toefl-extension-card"
            onClick={() => onNavigate('toefl')}
          >
            <div className="extension-card-icon">
              <ReadOutlined />
            </div>
            <div className="extension-card-body">
              <div className="extension-card-title-row">
                <span className="extension-card-title">托福英语学习</span>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  每日 10 题
                </Tag>
              </div>
              <div className="extension-card-desc">
                每天推送 10 道托福选择题，覆盖词汇、语法、句子填空与短阅读。做完一题立即反馈对错并展示解析，适合通勤与碎片时间积累。
              </div>
              <div className="extension-card-meta">
                <span>
                  <ThunderboltOutlined /> 已学习 {toeflStats.days} 天
                </span>
                <span>累计答题 {toeflStats.answered} 题</span>
                <span>正确率 {toeflStats.rate}%</span>
              </div>
            </div>
            <div className="extension-card-action">
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  onNavigate('toefl')
                }}
              >
                开始学习
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="panel-card">
        <div className="detail-section-title">扩展功能说明</div>
        <div className="settings-note" style={{ marginTop: 4 }}>
          扩展功能区是独立于核心工作流的轻量应用集合。当前提供托福英语学习；后续扩展（如行业英语词汇、NPI 项目跟踪等）都会集中放在这里，入口统一、数据各自独立保存。
        </div>
      </Card>
    </div>
  )
}
