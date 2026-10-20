import {
  ApiOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  ExportOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  RobotOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import { chatWithAI } from '../services/ai'
import {
  backupStore,
  exportStore,
  getAppInfo,
  importStore,
  openDataFolder,
} from '../services/storage'
import { useAppStore } from '../store/AppStore'
import type { AppInfo } from '../types'
import {
  downloadDocumentTemplate,
  downloadIssueTemplate,
  downloadKnowledgeTemplate,
} from '../utils/excel'

interface SettingsFormValues {
  ownerName?: string
  department?: string
  expiryWarningDays: number
}

interface AiSettingsFormValues {
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
  aiSystemPrompt?: string
}

const AI_PRESETS = [
  {
    value: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    value: 'qwen',
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  {
    value: 'moonshot',
    label: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
  },
  {
    value: 'ollama',
    label: 'Ollama 本地',
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'qwen2.5:7b',
  },
]

export function SettingsPage() {
  const { data, mutate, replaceStore } = useAppStore()
  const [form] = Form.useForm<SettingsFormValues>()
  const [aiForm] = Form.useForm<AiSettingsFormValues>()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    void getAppInfo().then(setInfo)
  }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    mutate((draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        ownerName: values.ownerName?.trim(),
        department: values.department?.trim(),
        expiryWarningDays: values.expiryWarningDays,
      },
    }))
    message.success('设置已保存')
  }

  const handleSaveAI = async () => {
    const values = await aiForm.validateFields()
    mutate((draft) => ({
      ...draft,
      settings: {
        ...draft.settings,
        aiBaseUrl: values.aiBaseUrl?.trim(),
        aiApiKey: values.aiApiKey?.trim(),
        aiModel: values.aiModel?.trim(),
        aiSystemPrompt: values.aiSystemPrompt?.trim(),
      },
    }))
    message.success('AI 设置已保存')
  }

  const handleTestAI = async () => {
    const values = await aiForm.validateFields()
    if (!values.aiBaseUrl?.trim() || !values.aiModel?.trim()) {
      message.warning('请先填写接口地址和模型名称')
      return
    }
    setTesting(true)
    try {
      const result = await chatWithAI({
        baseUrl: values.aiBaseUrl.trim(),
        apiKey: values.aiApiKey?.trim(),
        model: values.aiModel.trim(),
        messages: [{ role: 'user', content: '请只回复四个字：连接成功' }],
      })
      if (result.ok) {
        message.success(`连接成功：${result.content?.slice(0, 60) ?? ''}`)
      } else {
        message.error(result.error ?? '连接失败')
      }
    } finally {
      setTesting(false)
    }
  }

  const handleBackup = async () => {
    const result = await backupStore()
    if (result.ok) {
      message.success(`已备份到：${result.path}`)
    } else {
      message.warning(result.message ?? '暂无可备份数据')
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportStore()
      if (!result.canceled) message.success('工作台数据已导出')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const handleImport = async () => {
    try {
      const result = await importStore()
      if (result.canceled || !result.data) return
      Modal.confirm({
        title: '确认导入并覆盖当前数据？',
        content: `将使用「${result.path}」中的数据替换当前工作台数据。建议先执行一次“立即备份”。`,
        okText: '覆盖导入',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          await replaceStore(result.data!)
          message.success('数据已导入')
        },
      })
    } catch (error) {
      console.error(error)
      message.error('导入失败，请检查 JSON 文件格式')
    }
  }

  return (
    <div className="page-stack">
      <Row gutter={16}>
        <Col span={12}>
          <Card
            variant="borderless"
            className="panel-card"
            title={
              <span className="card-title">
                <SafetyCertificateOutlined /> 个人偏好
              </span>
            }
          >
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{
                ownerName: data.settings.ownerName,
                department: data.settings.department,
                expiryWarningDays: data.settings.expiryWarningDays ?? 30,
              }}
            >
              <Form.Item name="ownerName" label="姓名">
                <Input placeholder="显示在驾驶舱右上角" maxLength={20} />
              </Form.Item>
              <Form.Item name="department" label="部门/岗位">
                <Input placeholder="例如：工艺开发部 · 工艺开发工程师" maxLength={60} />
              </Form.Item>
              <Form.Item
                name="expiryWarningDays"
                label="文件到期提醒天数（天）"
                rules={[{ required: true, message: '请输入提醒天数' }]}
              >
                <InputNumber min={1} max={365} style={{ width: 160 }} />
              </Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存设置
              </Button>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            variant="borderless"
            className="panel-card"
            title={
              <span className="card-title">
                <DatabaseOutlined /> 数据与备份
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="数据文件">
                <Typography.Text copyable className="path-text">
                  {info?.dataPath ?? '加载中...'}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="备份目录">
                <Typography.Text copyable className="path-text">
                  {info?.backupPath ?? '加载中...'}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="应用版本">{info?.version ?? '0.1.0'}</Descriptions.Item>
            </Descriptions>
            <Space wrap className="settings-actions">
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => void openDataFolder('data')}
              >
                打开数据目录
              </Button>
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => void openDataFolder('backup')}
              >
                打开备份目录
              </Button>
              <Button icon={<SaveOutlined />} onClick={handleBackup}>
                立即备份
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出全部数据
              </Button>
              <Button icon={<ImportOutlined />} onClick={handleImport}>
                导入数据
              </Button>
            </Space>
            <div className="settings-note">
              数据只保存在这台电脑上，应用每次保存时会自动创建当日备份。换电脑前请先导出数据。
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="panel-card"
        title={
          <span className="card-title">
            <RobotOutlined /> AI 模型设置
          </span>
        }
      >
        <Form
          form={aiForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            aiBaseUrl: data.settings.aiBaseUrl,
            aiApiKey: data.settings.aiApiKey,
            aiModel: data.settings.aiModel,
            aiSystemPrompt: data.settings.aiSystemPrompt,
          }}
        >
          <Row gutter={12}>
            <Col span={7}>
              <Form.Item label="快速选择">
                <Select
                  placeholder="选择常用接口"
                  options={AI_PRESETS.map((preset) => ({
                    value: preset.value,
                    label: preset.label,
                  }))}
                  onChange={(value) => {
                    const preset = AI_PRESETS.find((item) => item.value === value)
                    if (preset) {
                      aiForm.setFieldsValue({
                        aiBaseUrl: preset.baseUrl,
                        aiModel: preset.model,
                      })
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={17}>
              <Form.Item
                name="aiBaseUrl"
                label="接口地址（OpenAI 兼容）"
                rules={[{ required: true, message: '请输入接口地址' }]}
              >
                <Input placeholder="例如：https://api.deepseek.com/v1" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="aiApiKey" label="API Key（本地模型可留空）">
                <Input.Password placeholder="sk-..." autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="aiModel"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="例如：deepseek-chat" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="aiSystemPrompt" label="系统提示词（可选）">
            <Input.TextArea
              rows={3}
              placeholder="留空则使用默认的工艺工程师助手提示词"
              maxLength={1000}
            />
          </Form.Item>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAI}>
              保存 AI 设置
            </Button>
            <Button icon={<ApiOutlined />} loading={testing} onClick={handleTestAI}>
              测试连接
            </Button>
          </Space>
          <div className="settings-note">
            API Key 只保存在本机数据文件中，只会发送给你填写的接口地址。没有 API Key
            的本地模型（如 Ollama）可以留空。
          </div>
        </Form>
      </Card>

      <Card
        variant="borderless"
        className="panel-card"
        title={
          <span className="card-title">
            <CloudDownloadOutlined /> Excel 模板
          </span>
        }
      >
        <Space wrap>
          <Button onClick={() => void downloadIssueTemplate()}>下载问题台账导入模板</Button>
          <Button onClick={() => void downloadDocumentTemplate()}>下载文件台账导入模板</Button>
          <Button onClick={() => void downloadKnowledgeTemplate()}>下载知识库导入模板</Button>
        </Space>
        <div className="settings-note">
          台账和知识库页面的“Excel”按钮也提供导入、导出和模板下载，导入时会自动补全缺失编号。
        </div>
      </Card>
    </div>
  )
}
