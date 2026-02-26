# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Claude Agent SDK demo: Express backend (port 3000) + vanilla JS frontend, plus standalone CLI examples. See `CLAUDE.md` for full architecture and `README.md` for commands.

### Running the dev server

```bash
npm run server:dev   # tsx --watch server/index.ts on port 3000
```

The server runs via `tsx` (no prior build step needed). Frontend is served as static files from `public/`.

### Known issues

- `public/app.js` is referenced in `index.html` but missing from the repo. The frontend UI renders but is non-interactive (buttons have no JS handlers). The backend API works correctly.
- `npm run build` (tsc) fails with type errors in `examples/` because the code uses camelCase property names (`sessionId`, `totalCostUSD`, `durationMs`) but the installed SDK version uses snake_case (`session_id`, `total_cost_usd`, `duration_ms`). This does not affect server runtime (tsx skips type checking).

### External dependencies

The chat functionality (`POST /api/chat`) requires:
1. **Claude Code CLI** installed and authenticated (the SDK delegates tool execution to it)
2. **`ANTHROPIC_API_KEY`** environment variable, or interactive `claude` auth

Without these, the server starts and all session CRUD endpoints work, but sending chat messages will fail.

### Testing

No automated test suite exists. Verify the server works by starting it and testing API endpoints:

```bash
curl -s -X POST http://localhost:3000/api/sessions | python3 -m json.tool
curl -s http://localhost:3000/api/sessions | python3 -m json.tool
```
