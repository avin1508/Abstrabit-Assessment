# Document Assistant — Backend

Express + MongoDB Atlas + Redis/BullMQ backend for the Multi-Workspace Document Assistant.
JavaScript (ES Modules) only.

## Prerequisites

- Node.js 20+ (22 recommended)
- A MongoDB Atlas cluster
- Redis 7 (local, or via Docker)
- Docker Desktop (optional, for `docker compose`)

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
```

Required to start: `DB_USERNAME`, `DB_PASSWORD`, `DB_CLUSTER_URL`, `DB_NAME`, `REDIS_URL`.
Also required: `JWT_SECRET`. `GEMINI_API_KEY` and `DISCORD_WEBHOOK_URL` are used by later modules.
Never commit `.env`.

## Run

```bash
npm run start:dev   # nodemon (needs Redis on localhost:6379)
npm run start       # plain node
```

With Docker (backend + Redis; MongoDB stays on Atlas):

```bash
docker compose up --build
```

## Health check

```
GET http://localhost:5000/api/health
→ { "success": true, "message": "Server is healthy" }
```

## Embeddings and vector search

Document chunks are embedded with Gemini during background ingestion
(extract → chunk → embed → save → indexed).

- Model: `gemini-embedding-001`, `outputDimensionality: 768`
  (`taskType` `RETRIEVAL_DOCUMENT` for chunks, `RETRIEVAL_QUERY` for searches)
- Settings: `src/ai/gemini.js`. Requires `GEMINI_API_KEY` (server-side only).

### Atlas Vector Search index

Create it once per cluster (idempotent; waits until it is queryable):

```bash
npm run vector:index
```

It creates the index `document_chunks_vector_index` on the `document_chunks` collection.
To create it by hand instead (Atlas → Search & Vector Search → Create index → Atlas Vector Search, JSON editor):

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "workspaceId" }
  ]
}
```

Every query filters by `workspaceId` inside `$vectorSearch`. New chunks become searchable a few
seconds after a document is indexed (Atlas syncs the index asynchronously).

### Embedding existing chunks

Chunks created before embeddings existed are re-processed through the normal pipeline:

```bash
npm run embeddings:backfill -- --dry-run   # report only
npm run embeddings:backfill                # re-queue; the running server's worker embeds them
```

### Retrieval check

`GET /api/documents/search?q=<text>&limit=5` (JWT + `X-Workspace-Id`) returns the most similar
chunks of the verified workspace with their Atlas similarity score.

## Chat (grounded RAG)

All routes need a JWT and `X-Workspace-Id`; conversations are visible only to their user, in their workspace.

| Method | Path | |
|---|---|---|
| POST | `/api/conversations` | `{ title? }` |
| GET | `/api/conversations` | newest first |
| GET | `/api/conversations/:id` | conversation + messages |
| POST | `/api/conversations/:id/messages` | `{ content }` → `{ userMessage, assistantMessage }` |
| POST | `/api/conversations/:id/retry` | re-answers the latest failed question |

Flow: retrieve the top chunks of the verified workspace (`$vectorSearch` with a `workspaceId` filter)
→ keep chunks scoring at least `RAG_MIN_SCORE` → if none, answer `I don't know.` → otherwise send the
numbered sources (as untrusted data, separate from the system instruction) to Gemini → keep only the
sources the answer cites `[n]` as the message's citations.

Settings: `GEMINI_CHAT_MODEL` (default `gemini-3.5-flash`), `GEMINI_CHAT_FALLBACK_MODELS` (used when
the main model is over quota or unavailable) and `RAG_MIN_SCORE` (default `0.78`).
