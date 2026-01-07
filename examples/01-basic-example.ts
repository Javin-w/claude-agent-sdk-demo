/**
 * 示例 1: Claude Agent SDK 基础用法
 *
 * 本示例展示：
 * - 如何创建基本的 agent
 * - 如何配置允许的工具
 * - 如何处理 agent 的响应消息
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function basicExample() {
  console.log("=== Claude Agent SDK 基础示例 ===\n");

  // 示例 1: 简单的文件列表查询
  console.log("示例 1: 列出当前目录的文件\n");

  for await (const message of query({
    prompt: "列出当前目录中的所有 TypeScript 文件",
    options: {
      allowedTools: ["Bash", "Glob"],
      permissionMode: "bypassPermissions" // 自动批准所有操作
    }
  })) {
    // 处理不同类型的消息
    if (message.type === "assistant" && message.content) {
      // 助手的文本响应
      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`Claude: ${block.text}\n`);
        } else if (block.type === "tool_use") {
          console.log(`使用工具: ${block.name}`);
        }
      }
    } else if (message.type === "result") {
      // 最终结果
      if (message.subtype === "success") {
        console.log("✅ 任务完成!");
        console.log(`成本: $${message.totalCostUSD}`);
        console.log(`执行时间: ${message.durationMs}ms\n`);
      } else {
        console.log(`❌ 错误: ${message.subtype}\n`);
      }
    }
  }

  // 示例 2: 代码分析
  console.log("\n示例 2: 分析代码文件\n");

  for await (const message of query({
    prompt: "读取 package.json 文件并总结项目信息",
    options: {
      allowedTools: ["Read"],
      permissionMode: "bypassPermissions",
      maxTurns: 5 // 限制最大交互轮数
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log("✅ 分析完成!\n");
    }
  }

  // 示例 3: 使用系统提示词
  console.log("\n示例 3: 使用自定义系统提示词\n");

  for await (const message of query({
    prompt: "创建一个简单的 hello world 函数",
    options: {
      allowedTools: ["Read", "Write"],
      permissionMode: "acceptEdits", // 自动接受编辑操作
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "你是一位专业的 TypeScript 开发者。请提供清晰、简洁的代码示例。"
      }
    }
  })) {
    if (message.type === "assistant" && message.content) {
      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`Claude: ${block.text}\n`);
        }
      }
    }
  }
}

// 运行示例
basicExample().catch(console.error);
