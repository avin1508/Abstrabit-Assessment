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
`JWT_SECRET`, `GEMINI_API_KEY` and `DISCORD_WEBHOOK_URL` are used by later modules.
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
