# Claude Agent SDK Demo - TypeScript 学习示例

这是一个完整的 Claude Agent SDK TypeScript 学习项目，包含多个实用示例，帮助你快速掌握如何使用 Claude Agent SDK 构建智能代理应用。

## 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [示例说明](#示例说明)
- [核心概念](#核心概念)
- [常见问题](#常见问题)
- [进阶学习](#进阶学习)

## 前置要求

在开始之前，请确保你已经安装：

- **Node.js 18+**
- **Claude Code CLI**（SDK 需要它作为运行时）

### 安装 Claude Code

```bash
# macOS/Linux/WSL
curl -fsSL https://claude.ai/install.sh | bash

# 或使用 Homebrew
brew install --cask claude-code

# 或使用 npm
npm install -g @anthropic-ai/claude-code
```

### 认证设置

运行以下命令进行认证：

```bash
claude
```

或者设置 API 密钥：

```bash
export ANTHROPIC_API_KEY=your-api-key
```

## 快速开始

### 方式一：使用 Web 界面（推荐）

1. **安装依赖**

```bash
npm install
```

2. **启动 Web 服务器**

```bash
npm run server
```

3. **打开浏览器**

访问 `http://localhost:3000` 即可使用图形界面与 Claude Agent 对话！

详细使用说明请查看 [WEB_APP_GUIDE.md](./WEB_APP_GUIDE.md)

### 方式二：运行命令行示例

```bash
# 运行基础示例
npm run example:basic

# 运行自定义工具示例
npm run example:custom-tools

# 运行会话管理示例
npm run example:sessions
```

## 示例说明

### 示例 1: 基础用法 (`examples/01-basic-example.ts`)

展示 Claude Agent SDK 的基础功能：

- ✅ 创建基本的 agent
- ✅ 配置允许的工具（Bash, Glob, Read, Write）
- ✅ 处理 agent 的响应消息
- ✅ 使用自定义系统提示词
- ✅ 控制交互轮数和权限模式

**运行方式：**
```bash
npm run example:basic
```

**学习要点：**
- `query()` 函数的基本用法
- `allowedTools` 配置
- `permissionMode` 的不同模式
- 消息流处理

### 示例 2: 自定义工具 (`examples/02-custom-tools.ts`)

展示如何创建和使用自定义工具：

- ✅ 定义自定义工具（天气查询、计算器、数据库查询）
- ✅ 创建 MCP 服务器
- ✅ 在 agent 中集成自定义工具
- ✅ 工具参数验证（使用 Zod）
- ✅ 错误处理

**运行方式：**
```bash
npm run example:custom-tools
```

**学习要点：**
- 使用 `tool()` 函数定义工具
- `createSdkMcpServer()` 创建 MCP 服务器
- 工具命名规范：`mcp__<server-name>__<tool-name>`
- Zod schema 定义参数类型

### 示例 3: 会话管理 (`examples/03-sessions.ts`)

展示如何在多个查询之间保持上下文：

- ✅ 创建和保存会话
- ✅ 恢复之前的会话
- ✅ 多轮对话
- ✅ 带上下文的代码分析

**运行方式：**
```bash
npm run example:sessions
```

**学习要点：**
- 使用 `sessionId` 保存会话
- 使用 `resume` 选项恢复会话
- Claude 如何保持对话上下文
- 实际应用场景（代码审查、重构建议）

## 核心概念

### 1. Agent 配置选项

```typescript
{
  allowedTools: string[],        // 允许的工具列表
  permissionMode: string,        // 权限模式
  mcpServers: object,            // MCP 服务器配置
  systemPrompt: object,          // 系统提示词
  maxTurns: number,              // 最大交互轮数
  maxBudgetUSD: number,          // 最大预算
  resume: string                 // 会话 ID（恢复会话）
}
```

### 2. 权限模式

- **`bypassPermissions`**: 绕过所有权限检查（开发/测试用）
- **`acceptEdits`**: 自动批准文件编辑操作
- **`default`**: 使用默认权限设置

### 3. 内置工具

| 工具 | 功能 |
|------|------|
| `Read` | 读取文件 |
| `Write` | 创建新文件 |
| `Edit` | 编辑现有文件 |
| `Bash` | 运行 shell 命令 |
| `Glob` | 文件模式匹配 |
| `Grep` | 搜索文件内容 |
| `WebSearch` | 网络搜索 |
| `WebFetch` | 获取网页内容 |
| `Task` | 创建子 agent |

### 4. 消息类型

```typescript
// 助手消息
if (message.type === "assistant") {
  // 处理 Claude 的响应
}

// 结果消息
if (message.type === "result") {
  // 任务完成
  message.sessionId     // 会话 ID
  message.totalCostUSD  // 总成本
  message.durationMs    // 执行时间
}
```

### 5. 自定义工具定义

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const myTool = tool(
  "tool_name",              // 工具名称
  "工具描述",               // 工具描述
  {                         // 参数 schema
    param1: z.string(),
    param2: z.number().optional()
  },
  async (args) => {         // 工具实现
    return {
      content: [{ type: "text", text: "结果" }]
    };
  }
);
```

## 项目结构

```
claude-agent-sdk-demo/
├── server/
│   └── index.ts                 # Web 服务器 + API
├── public/
│   ├── index.html               # Web 前端页面
│   ├── styles.css               # 样式文件
│   └── app.js                   # 前端 JavaScript
├── examples/
│   ├── 01-basic-example.ts      # 基础用法示例
│   ├── 02-custom-tools.ts       # 自定义工具示例
│   └── 03-sessions.ts           # 会话管理示例
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
├── README.md                    # 本文档
└── WEB_APP_GUIDE.md             # Web 应用使用指南
```

## 常见问题

### Q: 如何限制 agent 的成本？

```typescript
options: {
  maxBudgetUSD: 1.0  // 限制最大成本为 $1
}
```

### Q: 如何防止 agent 执行危险命令？

```typescript
options: {
  permissionMode: "default",
  canUseTool: async (toolName, input) => {
    if (toolName === "Bash" && input.command.includes("rm -rf")) {
      return false;  // 阻止危险命令
    }
    return true;
  }
}
```

### Q: 如何获取结构化输出？

```typescript
options: {
  outputFormat: {
    type: "json_schema",
    schema: {
      type: "object",
      properties: {
        result: { type: "string" }
      }
    }
  }
}
```

### Q: Session 会话会保存多久？

会话默认保存 24 小时，之后会被自动清理。

### Q: 如何调试工具调用？

查看 message 对象中的 `tool_use` 块：

```typescript
if (block.type === "tool_use") {
  console.log(`工具: ${block.name}`);
  console.log(`参数:`, block.input);
}
```

## 进阶学习

### 实战项目建议

1. **代码审查 Agent**
   - 使用 Read、Grep 工具分析代码
   - 提供改进建议
   - 生成审查报告

2. **文档生成 Agent**
   - 读取代码文件
   - 自动生成 API 文档
   - 更新 README

3. **测试助手 Agent**
   - 分析代码覆盖率
   - 生成测试用例
   - 运行测试并报告结果

4. **项目重构 Agent**
   - 多轮对话理解需求
   - 生成重构方案
   - 执行代码重构

### 推荐资源

- [Claude Agent SDK 官方文档](https://platform.claude.com/docs/en/agent-sdk)
- [Claude API 文档](https://docs.anthropic.com/)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请在 GitHub 上创建 Issue。

---

**Happy Coding with Claude Agent SDK!** 🚀
