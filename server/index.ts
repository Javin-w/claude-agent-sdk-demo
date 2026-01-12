/**
 * Claude Agent 后端服务器
 *
 * 功能：
 * - 会话管理
 * - Agent 对话 API
 * - SSE 流式响应
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { query } from '@anthropic-ai/claude-agent-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 会话存储（内存中）
interface Session {
  id: string;
  sessionId?: string;  // Claude SDK session ID
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
}

const sessions = new Map<string, Session>();

// 生成会话 ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * API: 创建新会话
 */
app.post('/api/sessions', (req: Request, res: Response) => {
  const sessionId = generateSessionId();
  const session: Session = {
    id: sessionId,
    messages: [],
    createdAt: Date.now()
  };

  sessions.set(sessionId, session);

  res.json({
    success: true,
    session: {
      id: session.id,
      createdAt: session.createdAt
    }
  });
});

/**
 * API: 获取所有会话
 */
app.get('/api/sessions', (req: Request, res: Response) => {
  const sessionList = Array.from(sessions.values()).map(s => ({
    id: s.id,
    messageCount: s.messages.length,
    createdAt: s.createdAt
  }));

  res.json({
    success: true,
    sessions: sessionList
  });
});

/**
 * API: 获取会话详情
 */
app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      messages: session.messages,
      createdAt: session.createdAt
    }
  });
});

/**
 * API: 与 Agent 对话（SSE 流式响应）
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { sessionId, message, workingDir } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({
      success: false,
      error: 'sessionId and message are required'
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  // 添加用户消息
  session.messages.push({
    role: 'user',
    content: message,
    timestamp: Date.now()
  });

  // 设置 SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
  res.flushHeaders(); // 立即发送 headers

  let assistantMessage = '';
  let lastSentLength = 0;

  try {
    console.log(`[Chat] Starting query for session ${sessionId}`);
    console.log(`[Chat] Message: ${message}`);
    console.log(`[Chat] Working directory: ${workingDir || process.cwd()}`);
    console.log(`[Chat] Resume session ID: ${session.sessionId || 'new session'}`);

    // 调用 Claude Agent SDK
    for await (const msg of query({
      prompt: message,
      options: {
        allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
        permissionMode: "acceptEdits",
        resume: session.sessionId,
        cwd: workingDir || process.cwd(),
        pathToClaudeCodeExecutable: "/Users/bytedance/.local/bin/claude",
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: `你是一个代码助手。当前工作目录是: ${workingDir || process.cwd()}`
        }
      }
    })) {
      console.log(`[Chat] Received message type: ${msg.type}`);
      if (msg.type === 'assistant') {
        console.log(`[Chat] Assistant message:`, JSON.stringify(msg, null, 2));
      }

      // 处理助手消息
      if (msg.type === "assistant" && msg.message && msg.message.content) {
        for (const block of msg.message.content) {
          if (block.type === "text") {
            assistantMessage += block.text;

            // 发送增量更新
            const newContent = assistantMessage.slice(lastSentLength);
            if (newContent) {
              res.write(`data: ${JSON.stringify({
                type: 'content',
                content: newContent
              })}\n\n`);
              lastSentLength = assistantMessage.length;
            }
          } else if (block.type === "tool_use") {
            // 发送工具使用信息
            res.write(`data: ${JSON.stringify({
              type: 'tool',
              tool: block.name,
              input: block.input
            })}\n\n`);
          }
        }
      }

      // 处理工具结果消息
      if (msg.type === "tool_result") {
        res.write(`data: ${JSON.stringify({
          type: 'tool_result',
          toolUseId: msg.tool_use_id,
          content: msg.content
        })}\n\n`);
      }

      // 处理结果消息
      if (msg.type === "result") {
        if (msg.session_id) {
          session.sessionId = msg.session_id;
        }

        if (msg.subtype === "success") {
          // 保存助手消息
          session.messages.push({
            role: 'assistant',
            content: assistantMessage,
            timestamp: Date.now()
          });

          // 发送完成信号
          res.write(`data: ${JSON.stringify({
            type: 'done',
            cost: msg.total_cost_usd,
            duration: msg.duration_ms
          })}\n\n`);
        } else {
          // 发送错误信号
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: msg.subtype
          })}\n\n`);
        }

        res.end();
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);
    res.end();
  }
});

/**
 * API: 删除会话
 */
app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = sessions.delete(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Claude Agent Server running on http://localhost:${PORT}`);
  console.log(`📂 Working directory: ${process.cwd()}`);
  console.log(`\n💡 Open http://localhost:${PORT} in your browser to start chatting!`);
});
