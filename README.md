# Abstrabit — Multi-Workspace Document Assistant

A document assistant where each user has separate **workspaces**. You upload documents into a
workspace, then chat with an assistant that answers **only from that workspace's documents**, cites
its sources, and says exactly `I don't know.` when the documents don't support an answer. The
assistant can also run two tools: create a task and send a summary to Discord.

- **Live app:** https://abstrabit-assessment-nu.vercel.app/
- **API:** https://abstrabit-assessment-ypz1.onrender.com/api (health: `/api/health`)
- **Repository:** https://github.com/avin1508/Abstrabit-Assessment

## Features

- Email/password auth (JWT); a first workspace is created at registration
- Multiple workspaces per user, with a workspace switcher; every page is scoped to the active workspace
- Document upload (PDF, DOCX, Markdown, TXT, up to 20 MB) with background ingestion and live progress
- Grounded chat (RAG) with `[n]` citations and a sources panel
- Strict "I don't know." fallback when nothing relevant is found
- Gemini function calling: `create_task` and `send_summary`
- Tasks page (complete / reopen), Tool Logs page, and a Dashboard overview per workspace

## Architecture / Core Flow

```
frontend/  React 19 + Vite + Tailwind v4 + Redux Toolkit + React Router 7   (Vercel)
backend/   Node.js + Express 5 (ES modules) + Mongoose + Zod                 (Render)
           MongoDB Atlas (data + Atlas Vector Search) · Redis + BullMQ (ingestion queue)
           Google Gemini (embeddings + chat/function calling) · Discord webhook
```

1. **Upload** → file is type-checked by content, stored with a server-generated name, and a BullMQ job is queued.
2. **Ingestion worker** → extract text → split into overlapping chunks → embed with `gemini-embedding-001`
   (768 dims) → save chunks to `document_chunks`, each tagged with its `workspaceId`.
3. **Chat** → embed the question → `$vectorSearch` with a `workspaceId` filter **inside** the search →
   drop chunks below `RAG_MIN_SCORE` → if nothing is left, answer `I don't know.` → otherwise send the
   numbered sources to Gemini as delimited, untrusted data (never in the system instruction).
4. **Tools** → model requests a call → Zod validation (unknown fields rejected) → authorization →
   execute → log to `tool_calls` → result goes back to the model for the final reply.

Every workspace-scoped request is checked server-side: the workspace (from the `X-Workspace-Id` header
or URL) must belong to the user in the JWT, otherwise `404`. Records from another workspace are also `404`.

## Local Setup

Requirements: Node.js 20+ (22 recommended), a MongoDB Atlas cluster, Redis 7 (local or Docker), a
Gemini API key. A Discord webhook is optional (only needed for `send_summary`).

```bash
git clone https://github.com/avin1508/Abstrabit-Assessment.git
cd Abstrabit-Assessment

cd backend
npm install
cp .env.example .env            # fill in real values
npm run vector:index            # once per Atlas cluster: creates the vector search index

cd ../frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:5000/api
```

## Environment Variables

**backend/.env** (see `backend/.env.example`; never commit `.env`)

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (5000) | API port |
| `CLIENT_URL` | no | Allowed CORS origin(s), comma-separated |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_CLUSTER_URL`, `DB_NAME` | yes | MongoDB Atlas connection (URI is built in `src/config/db.js`) |
| `REDIS_URL` | yes | Redis for the BullMQ ingestion queue |
| `JWT_SECRET` | yes | JWT signing secret (long random string) |
| `GEMINI_API_KEY` | yes for ingestion/chat | Embeddings and chat |
| `GEMINI_CHAT_MODEL`, `GEMINI_CHAT_FALLBACK_MODELS` | no | Chat model and fallbacks used when a model is over quota |
| `RAG_MIN_SCORE` | no (0.78) | Minimum vector-search score for a chunk to be used as context |
| `DISCORD_WEBHOOK_URL` | for `send_summary` | Destination of summaries (server-side only) |

**frontend/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5000/api` |

## Running Locally

```bash
# backend (needs Redis on localhost:6379)
cd backend && npm run start:dev

# or backend + Redis in Docker (MongoDB stays on Atlas)
cd backend && docker compose up --build

# frontend
cd frontend && npm run dev       # http://localhost:5173
```

Other scripts: `npm run lint` / `npm run build` (frontend), `npm run embeddings:backfill` (backend).
More backend detail: [backend/README.md](backend/README.md).

## Deployment

- **Frontend:** Vercel, project root `frontend/`, `npm run build`, SPA rewrites in `frontend/vercel.json`.
  `VITE_API_URL` points at the Render API.
- **Backend:** Render, serving `https://abstrabit-assessment-ypz1.onrender.com`. `backend/Dockerfile`
  (production stage) and `docker-compose.prod.yml` are included for container deployments.
- **Data:** MongoDB Atlas (including the Atlas Vector Search index); Redis for the queue.
- Secrets live only in the hosting providers' environment settings.

## Demo Account

Throwaway account created for this assessment:

| Email | Password |
|---|---|
| `abstrabit@gmail.com` | `password@123` |

The account starts with one workspace (**My Workspace**). The steps below create a second workspace
and upload the sample documents from [`sample-docs/`](sample-docs/). You can also register your own account.

## Evaluation / Testing Guide

1. Open the live app and sign in with the demo account.
2. **Two workspaces:** open the workspace switcher (top of the sidebar) → **Create workspace** → e.g.
   `Workspace B`. Use the existing `My Workspace` as **Workspace A**.
3. **Workspace-scoped documents:**
   - In Workspace A → **Documents** → upload `sample-docs/workspace-a/apollo-engineering-handbook.md`.
   - Switch to Workspace B → upload `sample-docs/workspace-b/apollo-operations-guide.md`.
   - Wait until each shows **Indexed**. Each workspace's Documents page lists only its own file.
     Give it ~15 seconds after "Indexed" before asking questions (Atlas syncs the search index asynchronously).
4. **Workspace-scoped RAG + citations:** in each workspace open **Chat** and ask
   *"What database does Project Apollo use?"*
   - Workspace A → **PostgreSQL**, citing `apollo-engineering-handbook.md`.
   - Workspace B → **MongoDB**, citing `apollo-operations-guide.md`.
   - Click a `[1]` citation to open the source passage; it always comes from the active workspace.
5. **"I don't know.":** ask something the active workspace doesn't cover, e.g. *"Who won the 1998 World Cup?"*
   → exactly `I don't know.` with no citations.
6. **create_task:** *"Create a task to review the on-call rotation, due next Friday."*
   → a tool block appears in the chat; the task shows up on **Tasks** (only in this workspace).
7. **send_summary** (in Workspace A): *"Send a summary of the release process to the team."*
   → the tool block shows the result. If the server's Discord webhook isn't configured or rejects the
   message, the call is shown and logged as failed with a safe error message.
8. **Tool Logs:** open **Tool Logs** → both calls are listed with their arguments, status and result (or error).
   Switch workspace → the other workspace's log doesn't show them. The **Dashboard** shows the same counts.

## Workspace Isolation Test

- In **Workspace B**, ask about a fact that exists only in Workspace A:
  *"What is the internal codename for the Q4 analytics project?"* (answer in A: **BLUE HERON**)
  → Workspace B answers `I don't know.`; Workspace A answers BLUE HERON with a citation.
- In **Workspace A**, ask *"How many days do customers have to request a refund?"* (only in B: 45 days)
  → `I don't know.`
- Tasks, Tool Logs, conversations and the Dashboard change completely when you switch workspace.
- API level: the workspace comes from `X-Workspace-Id` (or the URL for the overview) and is checked
  against the JWT user; another user's workspace, or a document/conversation/task ID from another
  workspace, returns `404`. Vector search applies the `workspaceId` filter inside `$vectorSearch`.

## Example Questions

Workspace A (`apollo-engineering-handbook.md`):
- What database does Project Apollo use, and how long are backups kept?
- How many approvals does a release need?
- How quickly must the on-call engineer acknowledge a P1 alert?

Workspace B (`apollo-operations-guide.md`):
- What database does Project Apollo use?
- What is the response time for enterprise customers?
- When does planned maintenance happen?

## Tool Calling

| Tool | Arguments | Effect |
|---|---|---|
| `create_task` | `title`, `description?`, `dueDate?` (ISO date) | Creates an open task in the active workspace |
| `send_summary` | `summary` (plain text, no links, ≤1800 chars), `channel?` (label only) | Posts to the server's `DISCORD_WEBHOOK_URL` with mentions disabled |

- Tools run only when the user's own message asks for the action, never because a document says so.
- Arguments are validated with strict Zod schemas; fields like `workspaceId` or a webhook URL are rejected.
- Workspace, user and conversation always come from the authenticated request, never from the model.
- Every executed call is logged (success or failure); webhook URLs are redacted from logs and responses.
- At most 3 tool rounds per question; a tool that already succeeded for a question isn't re-run on retry.

## Known Limitations

- **Gemini free tier:** each chat model has a small daily request quota. When all models are exhausted
  chat replies fail with a "couldn’t generate an answer" message and a **Try again** button, and
  uploads may fail ingestion with "The AI service is busy right now" (use **Retry ingestion** later).
- New documents become searchable a few seconds after they show **Indexed** (Atlas index sync).
- If the Render service is idle it may need to wake up, so the first request can be slow.
- Uploaded files are stored on the API server's disk, not object storage.
- Workspaces have a single owner (no sharing/members). No login rate limiting; the JWT is kept in
  localStorage and is valid for 7 days.
- The chat waits for the full answer (no streaming).
