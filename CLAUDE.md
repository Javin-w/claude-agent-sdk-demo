# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning project demonstrating the Claude Agent SDK in TypeScript, consisting of:
1. **CLI Examples** - Three standalone examples showing SDK fundamentals
2. **Web Application** - Full-stack app with Express backend and vanilla JS frontend for interactive agent conversations

**Critical Dependencies:**
- Requires Claude Code CLI (2.0+) as runtime - the SDK delegates actual tool execution to the CLI
- Node.js 18+ with ES modules (`"type": "module"` in package.json)

## Development Commands

### Web Application
```bash
npm run server          # Start production server on port 3000
npm run server:dev      # Start dev server with auto-reload
```

### CLI Examples
```bash
npm run example:basic         # Basic SDK usage
npm run example:custom-tools  # Custom tool definitions
npm run example:sessions      # Session management
```

### Build
```bash
npm run build          # TypeScript compilation
npm install            # Install all dependencies
```

## Architecture

### Two-Tier System

**CLI Examples** (`examples/`) - Standalone scripts demonstrating SDK patterns:
- Direct imports from `@anthropic-ai/claude-agent-sdk`
- Async generators for streaming responses
- Each example is self-contained and runnable independently

**Web App** - Client-server architecture:
```
Frontend (public/)          Backend (server/)           Claude SDK
    ↓ HTTP/SSE                    ↓ SDK calls              ↓ subprocess
index.html ←→ /api/chat ←→ query() function ←→ Claude Code CLI
app.js          Express          TypeScript        (actual execution)
styles.css      Endpoints
```

### Server Architecture (`server/index.ts`)

**In-Memory Session Store:**
- `sessions: Map<string, Session>` - stores conversation history
- Each session tracks both app session ID and Claude SDK session ID
- Sessions are NOT persisted - lost on server restart

**Critical API Pattern - SSE Streaming:**
```typescript
// POST /api/chat returns Server-Sent Events stream
// Frontend must handle incremental content updates
res.setHeader('Content-Type', 'text/event-stream')
// Events: 'content', 'tool', 'tool_result', 'done', 'error'
```

**SDK Integration:**
```typescript
for await (const msg of query({
  prompt: message,
  options: {
    allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
    permissionMode: "acceptEdits",  // Auto-approve file edits
    resume: session.sessionId,       // Continue conversation
    cwd: workingDir                  // Tool execution directory
  }
}))
```

### Frontend Architecture (`public/`)

**State Management:**
- Vanilla JavaScript with global `state` object
- No framework - direct DOM manipulation
- EventSource API for SSE consumption

**Critical Flow:**
1. User sends message → `POST /api/chat`
2. Server streams SSE events
3. Frontend incrementally updates message content
4. Tool usage displayed as indicators with results

**Message Processing:**
```javascript
// Handle different event types from SSE
data.type === 'content'      → Append to message
data.type === 'tool'         → Show tool indicator
data.type === 'tool_result'  → Display tool output
data.type === 'done'         → Add metadata (cost/duration)
```

## SDK Patterns

### Permission Modes
- `bypassPermissions` - No confirmation (dev/test only)
- `acceptEdits` - Auto-approve file operations (used in web app)
- `default` - Prompt for each tool use

### Message Types from SDK
```typescript
msg.type === "assistant"    // Claude's response, contains content blocks
msg.type === "tool_result"  // Output from tool execution
msg.type === "result"       // Final result with sessionId, cost, duration
```

### Session Continuity
- First query: omit `resume` option → gets new `sessionId` in result
- Subsequent queries: pass `resume: sessionId` → maintains context
- Critical: server tracks mapping between app session IDs and SDK session IDs

### Custom Tools (MCP)
```typescript
// Pattern from examples/02-custom-tools.ts
const customServer = createSdkMcpServer({
  name: "server-name",
  tools: [tool("tool-name", "description", zodSchema, async handler)]
})
// Reference as: "mcp__server-name__tool-name"
```

## TypeScript Configuration

**Key Settings:**
- `module: "ESNext"` with `moduleResolution: "bundler"` - required for SDK imports
- `include: ["examples/**/*"]` - server/ not included in build (runs via tsx)
- Use `tsx` for running TypeScript without compilation

## Working Directory Context

**Default:** Project root (`claude-agent-sdk-demo/`)
**Web App:** User-configurable via UI input field
**Critical:** All tool operations (Read, Write, Edit, Bash) execute relative to this directory

## Common Patterns

### Adding New CLI Example
1. Create `examples/0X-name.ts`
2. Import `query` from SDK
3. Add npm script: `"example:name": "tsx examples/0X-name.ts"`
4. Follow async generator pattern for message handling

### Modifying API Endpoints
1. Add route in `server/index.ts`
2. Update `API_BASE` in `public/app.js` if path changes
3. Document SSE event types if adding streaming endpoint

### Adding Frontend Features
1. Update `public/index.html` for UI elements
2. Add handlers in `public/app.js` (check state object)
3. Style in `public/styles.css` (uses CSS variables in `:root`)

## Critical Notes

**SDK vs CLI Distinction:**
- SDK is a wrapper - Claude Code CLI performs actual file operations
- Must have Claude Code CLI installed and authenticated
- Permission modes control CLI behavior, not SDK behavior

**Session Storage:**
- Web app sessions stored in memory only
- Server restart = lost sessions
- For production, implement persistent storage

**Tool Execution Safety:**
- `permissionMode: "acceptEdits"` is convenient but risky
- All allowed tools can modify `workingDir` filesystem
- Consider restricting tools or using `canUseTool` callback for validation

**SSE vs WebSocket:**
- Current implementation uses SSE (Server-Sent Events)
- Unidirectional: server → client only
- If need bidirectional, would require WebSocket upgrade
