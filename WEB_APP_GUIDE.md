# Claude Agent Web 应用使用指南

这是一个基于 Claude Agent SDK 的完整 Web 应用，提供了友好的图形界面来与 Claude Agent 进行对话。

## 功能特性

✨ **核心功能**
- 📝 多会话管理 - 创建、切换、删除会话
- 💬 实时对话 - 流式响应，所见即所得
- 📂 工作目录设置 - 指定 Agent 工作的目录
- 🔧 代码操作支持 - 读取、编辑、创建文件
- 💾 会话持久化 - 自动保存对话历史

✨ **用户体验**
- 🎨 现代化 UI - 深色主题，响应式设计
- ⚡ 实时更新 - SSE 技术支持流式响应
- 🛠️ 工具可视化 - 显示 Agent 使用的工具
- 📊 成本追踪 - 实时显示每次对话的成本

## 快速开始

### 1. 启动服务器

```bash
npm run server
```

服务器将在 `http://localhost:3000` 启动。

### 2. 打开浏览器

在浏览器中访问：
```
http://localhost:3000
```

### 3. 开始使用

1. **创建会话** - 点击左上角「+ 新会话」按钮
2. **设置工作目录** - 在顶部输入框设置工作目录（默认为当前项目目录）
3. **开始对话** - 在底部输入框输入消息，按 Enter 发送

## 使用示例

### 示例 1: 代码分析

```
请分析 examples/01-basic-example.ts 文件的代码结构
```

Agent 会：
- 使用 `Read` 工具读取文件
- 分析代码结构
- 提供详细的代码说明

### 示例 2: 创建文件

```
帮我创建一个新的 TypeScript 工具类 utils/helpers.ts，包含常用的字符串处理函数
```

Agent 会：
- 使用 `Write` 工具创建新文件
- 生成符合要求的代码
- 自动保存到指定路径

### 示例 3: 代码重构

```
请重构 server/index.ts 文件，将路由处理分离到单独的文件中
```

Agent 会：
- 使用 `Read` 工具读取文件
- 使用 `Write` 或 `Edit` 工具修改代码
- 创建新的路由文件
- 更新主文件的导入

### 示例 4: 项目分析

```
分析当前项目的目录结构，列出所有 TypeScript 文件
```

Agent 会：
- 使用 `Glob` 工具查找文件
- 使用 `Bash` 执行命令
- 整理并展示结果

## 项目结构

```
claude-agent-sdk-demo/
├── server/
│   └── index.ts           # Express 服务器 + API
├── public/
│   ├── index.html         # 前端页面
│   ├── styles.css         # 样式文件
│   └── app.js             # 前端逻辑
├── examples/              # CLI 示例
├── package.json
└── README.md
```

## API 接口说明

### 创建会话
```
POST /api/sessions
Response: { success: true, session: { id, createdAt } }
```

### 获取会话列表
```
GET /api/sessions
Response: { success: true, sessions: [...] }
```

### 获取会话详情
```
GET /api/sessions/:id
Response: { success: true, session: { id, messages, createdAt } }
```

### 发送消息（SSE 流式响应）
```
POST /api/chat
Body: { sessionId, message, workingDir }
Response: Server-Sent Events stream
```

SSE 事件类型：
- `content` - 助手回复的内容（增量）
- `tool` - 工具使用信息
- `done` - 对话完成
- `error` - 错误信息

### 删除会话
```
DELETE /api/sessions/:id
Response: { success: true }
```

## 技术栈

**后端**
- Node.js + TypeScript
- Express - Web 服务器
- Claude Agent SDK - AI 能力
- Server-Sent Events (SSE) - 流式响应

**前端**
- 原生 HTML/CSS/JavaScript
- Fetch API - HTTP 请求
- EventSource - SSE 客户端

## 配置说明

### 工作目录

在页面顶部可以设置 Agent 的工作目录。Agent 将在此目录下执行所有文件操作。

**默认值**：当前项目目录
```
/Users/bytedance/Desktop/近期实验/claude code agent/claude-agent-sdk-demo
```

**修改方式**：直接在输入框中修改

### 权限模式

服务器配置为 `acceptEdits` 模式，会自动批准文件编辑操作。如需更严格的控制，可以在 `server/index.ts` 中修改：

```typescript
options: {
  permissionMode: "default"  // 需要手动确认
}
```

### Agent 工具

当前启用的工具：
- `Read` - 读取文件
- `Write` - 创建新文件
- `Edit` - 编辑现有文件
- `Glob` - 文件模式匹配
- `Grep` - 搜索文件内容
- `Bash` - 执行命令

## 开发模式

启动开发模式（自动重启）：

```bash
npm run server:dev
```

## 故障排除

### 问题：无法连接到服务器

**解决方案**：
1. 确认服务器已启动：`npm run server`
2. 检查端口 3000 是否被占用
3. 查看控制台错误信息

### 问题：Agent 无响应

**解决方案**：
1. 检查 Claude Code CLI 是否已认证：`claude`
2. 查看服务器控制台的错误日志
3. 确认工作目录路径正确

### 问题：文件操作失败

**解决方案**：
1. 检查工作目录权限
2. 确认文件路径相对于工作目录是正确的
3. 查看 Agent 使用的具体工具和参数

## 注意事项

⚠️ **重要提示**

1. **工作目录权限** - Agent 可以读写工作目录下的所有文件，请谨慎设置
2. **成本控制** - 每次对话都会产生 API 费用，建议设置预算限制
3. **会话数据** - 当前版本会话存储在内存中，服务器重启后会丢失
4. **并发限制** - 同一时间只能处理一个对话请求

## 后续改进

可以考虑的功能增强：

- [ ] 会话持久化（存储到数据库）
- [ ] 用户认证和授权
- [ ] 多用户支持
- [ ] 代码高亮显示
- [ ] Markdown 渲染
- [ ] 文件浏览器集成
- [ ] 导出对话记录
- [ ] 自定义工具配置
- [ ] 成本预算限制
- [ ] WebSocket 支持（替代 SSE）

## 相关资源

- [Claude Agent SDK 文档](https://platform.claude.com/docs/en/agent-sdk)
- [Express 文档](https://expressjs.com/)
- [Server-Sent Events 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)

## 许可证

MIT License

---

**Enjoy coding with Claude Agent! 🚀**
