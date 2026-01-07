/**
 * 示例 3: 会话管理和上下文保持
 *
 * 本示例展示：
 * - 如何创建和管理会话
 * - 如何在多个查询之间保持上下文
 * - 如何恢复之前的会话
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function sessionsExample() {
  console.log("=== 会话管理示例 ===\n");

  let sessionId: string | undefined;

  // 第一个查询：让 Claude 分析一些文件
  console.log("查询 1: 让 Claude 读取项目文件\n");

  for await (const message of query({
    prompt: "读取 package.json 文件并记住项目的依赖信息",
    options: {
      allowedTools: ["Read"],
      permissionMode: "bypassPermissions"
    }
  })) {
    if (message.type === "assistant" && message.content) {
      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`Claude: ${block.text}\n`);
        }
      }
    }

    // 保存会话 ID
    if (message.type === "result") {
      sessionId = message.sessionId;
      console.log(`✅ 第一个查询完成! 会话 ID: ${sessionId}\n`);
    }
  }

  // 等待一下，模拟时间间隔
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 第二个查询：继续使用同一个会话
  // Claude 会记住第一个查询中读取的内容
  console.log("\n查询 2: 在同一会话中继续对话\n");

  if (sessionId) {
    for await (const message of query({
      prompt: "根据你刚才读取的 package.json，这个项目使用了哪些主要依赖？",
      options: {
        resume: sessionId, // 恢复之前的会话
        allowedTools: ["Read"],
        permissionMode: "bypassPermissions"
      }
    })) {
      if (message.type === "assistant") {
        for (const block of message.content) {
          if (block.type === "text") {
            console.log(`Claude: ${block.text}\n`);
          }
        }
      }

      if (message.type === "result") {
        console.log(`✅ 第二个查询完成! 会话 ID: ${message.sessionId}\n`);
      }
    }
  }

  // 示例：多轮对话
  console.log("\n=== 多轮对话示例 ===\n");

  let conversationSessionId: string | undefined;

  // 第一轮
  console.log("第 1 轮: 初始分析\n");
  for await (const message of query({
    prompt: "分析当前目录结构，告诉我有哪些重要的文件夹",
    options: {
      allowedTools: ["Bash", "Glob"],
      permissionMode: "bypassPermissions"
    }
  })) {
    if (message.type === "result") {
      conversationSessionId = message.sessionId;
      console.log("✅ 第 1 轮完成\n");
    }
  }

  // 第二轮 - Claude 记得第一轮的分析结果
  if (conversationSessionId) {
    console.log("第 2 轮: 深入分析\n");
    for await (const message of query({
      prompt: "在你刚才发现的文件夹中，找出所有的 TypeScript 文件",
      options: {
        resume: conversationSessionId,
        allowedTools: ["Bash", "Glob", "Grep"],
        permissionMode: "bypassPermissions"
      }
    })) {
      if (message.type === "result") {
        conversationSessionId = message.sessionId;
        console.log("✅ 第 2 轮完成\n");
      }
    }

    // 第三轮 - Claude 记得前两轮的所有信息
    console.log("第 3 轮: 总结\n");
    for await (const message of query({
      prompt: "基于前面的分析，总结一下这个项目的结构和主要内容",
      options: {
        resume: conversationSessionId,
        permissionMode: "bypassPermissions"
      }
    })) {
      if (message.type === "assistant") {
        for (const block of message.content) {
          if (block.type === "text") {
            console.log(`Claude: ${block.text}\n`);
          }
        }
      }

      if (message.type === "result" && message.subtype === "success") {
        console.log("✅ 多轮对话完成!");
        console.log(`总成本: $${message.totalCostUSD}`);
        console.log(`总执行时间: ${message.durationMs}ms\n`);
      }
    }
  }

  // 示例：带上下文的代码重构
  console.log("\n=== 带上下文的代码重构示例 ===\n");

  let refactorSessionId: string | undefined;

  // Step 1: 让 Claude 先理解代码
  console.log("Step 1: 理解现有代码\n");
  for await (const message of query({
    prompt: "读取 examples/01-basic-example.ts 文件，理解它的功能",
    options: {
      allowedTools: ["Read"],
      permissionMode: "bypassPermissions"
    }
  })) {
    if (message.type === "result") {
      refactorSessionId = message.sessionId;
      console.log("✅ 代码理解完成\n");
    }
  }

  // Step 2: 基于理解的内容提供建议
  // Claude 会记住第一步读取的代码内容
  if (refactorSessionId) {
    console.log("Step 2: 提供改进建议\n");
    for await (const message of query({
      prompt: "基于你刚才读取的代码，提供 3 个改进建议（不需要修改文件，只需要给出建议）",
      options: {
        resume: refactorSessionId,
        permissionMode: "bypassPermissions"
      }
    })) {
      if (message.type === "assistant") {
        for (const block of message.content) {
          if (block.type === "text") {
            console.log(`Claude: ${block.text}\n`);
          }
        }
      }

      if (message.type === "result") {
        console.log("✅ 建议提供完成!\n");
      }
    }
  }
}

// 运行示例
sessionsExample().catch(console.error);
