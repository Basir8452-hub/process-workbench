# 测试与验收

## 1. 基础命令

```bash
npm install
npx tsc --noEmit      # 类型检查
npm run build         # 类型检查 + 前端构建
npm run dev           # Electron 开发模式
npm run package       # 打包 NSIS
```

Windows PowerShell 如果找不到 `npx`，使用：

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

## 2. 冒烟测试

### 2.1 启动与导航

- [ ] `npm run dev` 后 Electron 窗口正常打开。
- [ ] 左侧 8 个菜单都存在：工作驾驶舱、储能资讯、待办事项、现场问题闭环、工艺文件台账、周报与复盘、个人知识库、设置。
- [ ] 右侧内容区独立滚动，左侧导航固定不动。
- [ ] 切换页面后内容区回到顶部，标题和图标随页面变化。
- [ ] 顶部标题栏高度 100px，左右留白 32px，日期卡和头像不被裁切。

### 2.2 驾驶舱与个人信息

- [ ] 首页统计卡、今日待办、风险提醒、问题状态分布正常。
- [ ] 点击“填写个人信息”，填写姓名/部门后保存。
- [ ] 欢迎语出现姓名，标题栏右上角头像首字同步更新。
- [ ] 刷新/重启后信息保留。

### 2.3 待办

- [ ] 新建待办，填写优先级、截止日、关联问题/文件/知识。
- [ ] 勾选完成后状态变为已完成，统计更新。
- [ ] 编辑、删除正常。
- [ ] 刷新后数据保留。

### 2.4 现场问题闭环

- [ ] 新建问题，自动生成 `Q-YYYYMMDD-###` 编号。
- [ ] 列表支持按状态、严重度、关键词筛选。
- [ ] 点击行打开详情抽屉，状态步骤条、基本信息、5Why、措施正常。
- [ ] 添加跟催记录，时间线出现记录。
- [ ] 关闭问题后状态、关闭日期、统计更新。
- [ ] “沉淀案例”后知识库出现对应案例。

### 2.5 工艺文件

- [ ] 登记文件，填写编号、版本、工序、产线、生效日、复审日。
- [ ] 复审到期有剩余天数提示，逾期行有高亮。
- [ ] 导入/导出 Excel 正常，模板可下载。
- [ ] 删除文件后关联任务自动解除关联。

### 2.6 知识库

- [ ] 新建、编辑、删除、标签筛选正常。
- [ ] Excel 批量导入：
  - [ ] 下载模板。
  - [ ] 导入含“标题/类型/标签/正文/关联问题编号”的文件。
  - [ ] 重复标题被跳过。
  - [ ] 关联问题编号能匹配到已有问题。
- [ ] 导出 Excel 包含关联问题编号和更新时间。

### 2.7 周报

- [ ] 默认统计本周。
- [ ] 新增/关闭问题、完成待办、文件到期统计正确。
- [ ] 可编辑本周重点和下周计划。
- [ ] 保存后历史周报出现，重新载入正常。
- [ ] 导出 Excel 包含摘要、关闭问题、完成待办、风险与到期。

### 2.8 储能资讯

- [ ] 左侧菜单存在“储能资讯”。
- [ ] 首次进入或 9:00 后启动时，能自动生成昨日日报。
- [ ] 日报显示 AI 摘要/原文摘要、重点速览、原文列表。
- [ ] 历史推送列表可切换往期。
- [ ] “资讯设置”可改推送时间、RSS 源、最大条数、保留天数。
- [ ] 在“设置 → AI 模型设置”配置模型后，RAG 问答能返回带 `[1][2]` 引用的答案。
- [ ] 未配置 AI 时，生成原文摘要而不是崩溃。

> 浏览器 `npm run dev:web` 预览时，RSS 抓取可能被 CORS 拦截；资讯抓取请以 Electron 模式为准。

### 2.9 设置与数据

- [ ] 设置页显示数据文件、备份目录、版本号。
- [ ] 打开数据目录/备份目录正常。
- [ ] 立即备份生成 `backups/workbench-时间戳.json`。
- [ ] 导出全部数据生成 JSON。
- [ ] 导入 JSON 后数据覆盖，页面刷新正常。
- [ ] Excel 模板下载正常。

### 2.10 打包

- [ ] `npm run package` 成功。
- [ ] 启动 `release-*/win-unpacked/工艺工作台.exe`，窗口和图标正常。
- [ ] 安装包能覆盖安装，旧数据保留。
- [ ] 打包后 AI 对话、资讯抓取、Excel 导入导出仍可用。

## 3. 用 Mock AI 测试 RAG

没有 API Key 时，可以启动一个本地 Mock 服务：

```js
// mock-ai.cjs
const http = require('node:http')

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    if (req.method === 'POST' && req.url.includes('/chat/completions')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                role: 'assistant',
                content: '这是 Mock AI 的回复。[1]',
              },
            },
          ],
        }),
      )
      return
    }
    res.writeHead(404)
    res.end()
  })
  .listen(18080, '127.0.0.1', () => console.log('mock ai on 18080'))
```

运行：

```bash
node mock-ai.cjs
```

在应用“设置 → AI 模型设置”中填写：

```text
接口地址：http://127.0.0.1:18080/v1
模型名称：mock-model
API Key：留空
```

然后测试：
- AI 助手对话
- 储能资讯生成
- RAG 资讯问答

## 4. 预期警告

以下警告不影响功能：

- `[antd: List] The List component is deprecated...`
- Electron Security Warning (Insecure Content-Security-Policy)
- Vite HMR 重连提示

如果出现 React 未捕获异常、白屏、数据未保存、打包后资源 404，视为失败。

## 5. 完成定义

- [ ] `tsc --noEmit` 通过
- [ ] `npm run build` 通过
- [ ] 新增功能的增删改查通过
- [ ] 刷新/重启后数据保留
- [ ] 打包后的 EXE 能启动并完成核心操作
- [ ] 没有新增运行时错误
- [ ] 没有把测试数据、API Key、用户数据文件带进仓库
