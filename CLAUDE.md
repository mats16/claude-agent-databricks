# Claude Agent App

A web application that serves as a Claude Code-like coding agent running on Databricks Apps.

## Architecture

- **Frontend**: React + Vite + Ant Design v5
- **Backend**: Node.js + Fastify + WebSocket (ws) + REStful API
- **Agent**: Claude Agent SDK integrated directly on the server (TypeScript SDK V2)

## Running the App

```bash
cd app
npm install
npm run dev
```

This starts both:
- Backend server on http://localhost:8000
- Vite dev server on http://localhost:5173

Visit http://localhost:5173

## Project Structure

```
claude_agent_app/
├── app/                          # Monorepo root
│   ├── shared/                   # Shared types (@app/shared)
│   ├── frontend/                 # React frontend (@app/frontend)
│   ├── backend/                  # Fastify backend (@app/backend)
│   ├── package.json
│   └── turbo.json                # Turborepo config
├── resources/
│   └── claude_agent.app.yml      # Databricks Apps settings
├── databricks.yml                # Databricks Asset Bundle settings
└── CLAUDE.md
```

## Environment Variables

### Required

- **DATABRICKS_HOST**: Databricks workspace URL (e.g., `your-workspace.cloud.databricks.com`)
- **DATABRICKS_CLIENT_ID**: OAuth2 client ID for Service Principal (used in production)
- **DATABRICKS_CLIENT_SECRET**: OAuth2 client secret for Service Principal (used in production)

### Optional

- **DATABRICKS_TOKEN**: Personal Access Token (development only, fallback for Service Principal authentication)
- **PORT**: Backend server port (default: `8000`)
- **WORKSPACE_PATH**: Agent working directory (default: current directory)
- **DB_URL**: PostgreSQL connection string for session/event persistence (e.g., `postgres://user:password@host:5432/database?sslmode=require`)

### Authentication Flow

In production (Databricks Apps), the following authentication flow is used:

1. **Service Principal Authentication**: Obtains OIDC access token using `DATABRICKS_CLIENT_ID` and `DATABRICKS_CLIENT_SECRET`
2. **User Token**: Retrieved from request header `x-forwarded-access-token` (automatically provided by Databricks Apps)

In development, `DATABRICKS_TOKEN` can be used as a fallback.


## Custom MCP Servers

The agent includes a custom MCP server for interacting with Databricks Workspace APIs, enabling the AI assistant to explore and read files stored in Databricks Workspace.

### databricks-workspace

#### Available Tools

##### list_workspace_objects

List files and directories in a Databricks Workspace directory.

- **API Endpoint**: `GET /api/2.0/workspace/list`
- **Parameters**:
  - `path` (string): The directory path in Databricks Workspace (e.g., `/Workspace/Users/user@example.com`)
  - `accessToken` (string): User access token for authentication
- **Use Case**: Explore the workspace structure, find notebooks, libraries, and other workspace objects

##### get_workspace_object

Get the contents of a file in Databricks Workspace.

- **API Endpoint**: `GET /api/2.0/workspace/export`
- **Parameters**:
  - `path` (string): The file path in Databricks Workspace (e.g., `/Workspace/Users/user@example.com/sample.py`)
  - `accessToken` (string): User access token for authentication
- **Returns**: File content and file type information
- **Use Case**: Read notebook source code, configuration files, or other workspace files

#### Authentication

Both tools use the user's access token passed from the WebSocket request header (`x-forwarded-access-token`). This ensures that the agent can only access workspace objects that the user has permission to view.


## API Endpoints

### REST API

#### POST `/api/v1/sessions` - Create new session

Creates a new chat session with an initial message.

**Request:**
```json
{
  "events": [
    {
      "uuid": "<uuid4>",
      "session_id": "",
      "type": "user",
      "message": { "role": "user", "content": "Your message here" }
    }
  ],
  "session_context": { "model": "sonnet" }
}
```

**Response:**
```json
{
  "session_id": "<sdk-generated-id>",
  "events": [
    { "uuid": "...", "session_id": "...", "type": "init", "data": { "version": "...", "model": "..." } },
    { "uuid": "...", "session_id": "...", "type": "assistant", "data": { "content": "..." } },
    { "uuid": "...", "session_id": "...", "type": "tool_use", "data": { "tool_name": "...", "tool_id": "...", "tool_input": {...} } },
    { "uuid": "...", "session_id": "...", "type": "result", "data": { "success": true } }
  ]
}
```

#### GET `/api/v1/sessions/:sessionId/events` - Get event history

Returns event history for a session from PostgreSQL database.

**Response:**
```json
{
  "events": [
    { "uuid": "...", "session_id": "...", "type": "user", "message": { "role": "user", "content": "..." } },
    { "uuid": "...", "session_id": "...", "type": "init", "data": { "version": "...", "model": "..." } },
    { "uuid": "...", "session_id": "...", "type": "assistant", "data": { "content": "..." } },
    { "uuid": "...", "session_id": "...", "type": "tool_use", "data": { "tool_name": "...", "tool_id": "...", "tool_input": {...} } },
    { "uuid": "...", "session_id": "...", "type": "result", "data": { "success": true } }
  ]
}
```

### WebSocket (`ws://localhost:8000/api/v1/ws`)

Create a new session and stream responses in real-time.

**Client -> Server:**
- `{ type: "connect" }` - Connection request
- `{ type: "user_message", content: string, model: string }` - Send user message (first message creates session)

**Server -> Client:**
- `{ type: "connected" }` - Connection established
- `{ type: "init", sessionId: string, version: string, model: string }` - Session created (contains the new session ID)
- `{ type: "assistant_message", content: string }` - AI response
- `{ type: "tool_use", toolName: string, toolInput: {...} }` - Tool being used
- `{ type: "result", success: boolean }` - Query complete
- `{ type: "error", error: string }` - Error occurred

### WebSocket (`ws://localhost:8000/api/v1/sessions/:sessionId/ws`)

Connect to an existing session for real-time streaming.

**Client -> Server:**
- `{ type: "connect" }` - Connection request
- `{ type: "user_message", content: string, model: string }` - Send user message

**Server -> Client:**
- `{ type: "connected" }` - Connection established
- `{ type: "init", sessionId: string, version: string, model: string }` - Session confirmed
- `{ type: "assistant_message", content: string }` - AI response
- `{ type: "tool_use", toolName: string, toolInput: {...} }` - Tool being used
- `{ type: "result", success: boolean }` - Query complete
- `{ type: "error", error: string }` - Error occurred

## Frontend Routes

| Path | Description |
|------|-------------|
| `/` | Home page - create new session |
| `/sessions/:sessionId` | Chat page - interact with existing session |

## Notes

- PostgreSQL (Neon) is used for session and event persistence via Drizzle ORM
- Agent has access to: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
- Uses Vite for frontend development with hot reload
- Uses tsx for TypeScript execution on the backend

## UI/Design

### Design Concept

- **Style**: Clean, minimal, professional (inspired by Claude Code on Web)
- **Brand Color**: `#f5a623` (Orange/Gold)
- **Font**: Noto Sans JP (with system font fallbacks)

### Ant Design Theme Configuration

The theme is configured in `app/frontend/src/main.tsx` via ConfigProvider:

```tsx
const theme = {
  token: {
    colorPrimary: '#f5a623',
    colorSuccess: '#4caf50',
    colorError: '#f44336',
    colorWarning: '#ff9800',
    borderRadius: 8,
    fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Button: { primaryShadow: 'none' },
    Input: { activeBorderColor: '#f5a623', hoverBorderColor: '#f5a623' },
    Modal: { borderRadiusLG: 12 },
  },
};
```

### Key UI Components

| Component | Ant Design Components Used |
|-----------|---------------------------|
| Layout.tsx | Layout, Sider, Content (with custom resize handle) |
| Sidebar.tsx | Input.TextArea, Select, Button, Checkbox, Tooltip, Typography, Flex |
| SessionPage.tsx | Input, Button, Tag, Typography, Flex, Tooltip, Spin |
| SessionList.tsx | Typography, Spin, Empty, Flex |
| AccountMenu.tsx | Dropdown, Avatar, Menu |
| TitleEditModal.tsx | Modal, Input, Checkbox, Typography |
| PATModal.tsx | Modal, Input.Password, Button, Alert, Tooltip |
| WorkspaceSelectModal.tsx | Modal, List, Spin, Empty, Alert, Flex |
| App.tsx (WelcomePage) | Card, Typography, Flex |

### Icons

All icons use `@ant-design/icons`. Common icons:
- `SendOutlined` - Send button
- `FolderOutlined`, `FolderOpenOutlined` - Workspace/folder
- `SyncOutlined` - Auto sync
- `UserOutlined` - Account
- `EditOutlined` - Edit
- `DeleteOutlined` - Delete
- `EyeOutlined`, `EyeInvisibleOutlined` - Show/hide password

### Layout Notes

- Sidebar uses custom resize handle (CSS in App.css: `.resize-handle`)
- Layout height is fixed to `100vh` to enable proper scrolling
- Session list scrolls within its container (parent has `overflow: auto`)
- Message formatting styles (markdown, code blocks, tool output) are in App.css

## Database Setup

1. Set the `DB_URL` environment variable with your PostgreSQL connection string
2. Run the migration SQL to create tables:
   ```bash
   cd app/backend
   psql $DB_URL -f db/migrations/0001_init.sql
   ```
