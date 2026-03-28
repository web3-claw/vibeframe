---
paths:
  - "packages/mcp-server/**"
---

# MCP Server (npm package)

Published as [`@vibeframe/mcp-server`](https://www.npmjs.com/package/@vibeframe/mcp-server) on npm.

**End-user setup** (no clone/build needed):
```json
{
  "mcpServers": {
    "vibeframe": {
      "command": "npx",
      "args": ["-y", "@vibeframe/mcp-server"]
    }
  }
}
```

Config file locations:
- **Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor:** `.cursor/mcp.json` in workspace

**Bundling:** esbuild bundles workspace deps (`@vibeframe/cli`, `@vibeframe/core`) into a single `dist/index.js` (37KB). External deps: `@modelcontextprotocol/sdk`, `zod`.

**Publishing:**
```bash
cd packages/mcp-server
node build.js                    # Bundle
npm publish --access public      # Publish to npm
```
