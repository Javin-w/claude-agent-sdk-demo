/**
 * 示例 2: 创建和使用自定义工具
 *
 * 本示例展示：
 * - 如何定义自定义工具
 * - 如何创建 MCP 服务器
 * - 如何在 agent 中使用自定义工具
 */

import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// 定义自定义工具 1: 天气查询工具
const weatherTool = tool(
  "get_weather",
  "获取指定城市的天气信息",
  {
    city: z.string().describe("城市名称，例如 'Beijing'、'Shanghai'"),
    unit: z.enum(["celsius", "fahrenheit"]).optional().describe("温度单位")
  },
  async (args) => {
    console.log(`🌤️  正在查询 ${args.city} 的天气...`);

    // 模拟调用天气 API（实际应用中应该调用真实的天气服务）
    const mockWeatherData = {
      city: args.city,
      temperature: 22,
      condition: "晴朗",
      humidity: 65,
      windSpeed: 12
    };

    const unit = args.unit || "celsius";
    const tempDisplay = unit === "fahrenheit"
      ? `${mockWeatherData.temperature * 9/5 + 32}°F`
      : `${mockWeatherData.temperature}°C`;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          city: mockWeatherData.city,
          temperature: tempDisplay,
          condition: mockWeatherData.condition,
          humidity: `${mockWeatherData.humidity}%`,
          windSpeed: `${mockWeatherData.windSpeed} km/h`
        }, null, 2)
      }]
    };
  }
);

// 定义自定义工具 2: 计算器工具
const calculatorTool = tool(
  "calculate",
  "执行数学计算，支持基本的算术运算",
  {
    expression: z.string().describe("数学表达式，例如 '2 + 2' 或 '(10 * 5) / 2'")
  },
  async (args) => {
    console.log(`🔢 正在计算: ${args.expression}`);

    try {
      // 安全的表达式求值（实际应用中应该使用更安全的方法）
      const sanitizedExpr = args.expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = eval(sanitizedExpr);

      return {
        content: [{
          type: "text",
          text: `计算结果: ${args.expression} = ${result}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `计算错误: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// 定义自定义工具 3: 数据库查询模拟工具
const databaseTool = tool(
  "query_database",
  "查询模拟数据库中的用户信息",
  {
    userId: z.number().describe("用户 ID")
  },
  async (args) => {
    console.log(`💾 正在查询用户 ID: ${args.userId}`);

    // 模拟数据库
    const mockDatabase = {
      1: { id: 1, name: "张三", email: "zhangsan@example.com", role: "admin" },
      2: { id: 2, name: "李四", email: "lisi@example.com", role: "user" },
      3: { id: 3, name: "王五", email: "wangwu@example.com", role: "user" }
    };

    const user = mockDatabase[args.userId as keyof typeof mockDatabase];

    if (user) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify(user, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `未找到用户 ID: ${args.userId}`
        }],
        isError: true
      };
    }
  }
);

// 创建 MCP 服务器，包含所有自定义工具
const customToolsServer = createSdkMcpServer({
  name: "custom-tools",
  version: "1.0.0",
  tools: [weatherTool, calculatorTool, databaseTool]
});

async function customToolsExample() {
  console.log("=== 自定义工具示例 ===\n");

  // 示例 1: 使用天气工具
  console.log("示例 1: 使用天气查询工具\n");

  for await (const message of query({
    prompt: "北京和上海的天气怎么样？",
    options: {
      mcpServers: { "custom-tools": customToolsServer },
      allowedTools: [
        "mcp__custom-tools__get_weather"
      ],
      permissionMode: "bypassPermissions"
    }
  })) {
    if (message.type === "assistant" && message.content) {
      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`Claude: ${block.text}\n`);
        }
      }
    } else if (message.type === "result" && message.subtype === "success") {
      console.log("✅ 天气查询完成!\n");
    }
  }

  // 示例 2: 使用计算器工具
  console.log("\n示例 2: 使用计算器工具\n");

  for await (const message of query({
    prompt: "帮我计算以下表达式: (100 + 50) * 2 - 25",
    options: {
      mcpServers: { "custom-tools": customToolsServer },
      allowedTools: [
        "mcp__custom-tools__calculate"
      ],
      permissionMode: "bypassPermissions"
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log("✅ 计算完成!\n");
    }
  }

  // 示例 3: 组合使用多个工具
  console.log("\n示例 3: 组合使用多个自定义工具\n");

  for await (const message of query({
    prompt: "查询用户 ID 为 1 的用户信息，然后计算 123 * 456",
    options: {
      mcpServers: { "custom-tools": customToolsServer },
      allowedTools: [
        "mcp__custom-tools__query_database",
        "mcp__custom-tools__calculate",
        "mcp__custom-tools__get_weather"
      ],
      permissionMode: "bypassPermissions",
      maxTurns: 10
    }
  })) {
    if (message.type === "assistant" && message.content) {
      for (const block of message.content) {
        if (block.type === "text") {
          console.log(`Claude: ${block.text}\n`);
        } else if (block.type === "tool_use") {
          console.log(`使用工具: ${block.name}`);
        }
      }
    } else if (message.type === "result") {
      if (message.subtype === "success") {
        console.log("✅ 所有任务完成!");
        console.log(`总成本: $${message.totalCostUSD}`);
        console.log(`执行时间: ${message.durationMs}ms\n`);
      }
    }
  }
}

// 运行示例
customToolsExample().catch(console.error);
