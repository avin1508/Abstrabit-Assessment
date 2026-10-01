# AI Notes

## Tools and how the work was split

I built this with **Claude Code** (Anthropic's Claude models, in VS Code) as the main coding assistant.
Inside the app, **Google Gemini** does the embeddings (`gemini-embedding-001`) and chat/function calling.

I didn't use a `CLAUDE.md`, `AGENTS.md` or any other persistent context file. Instead I drove the work
module by module (0 auth foundation → 10 security audit). Each module started with a written spec I
pasted into the session: scope, files allowed to change, what was frozen from earlier modules, security
rules, and the exact tests that had to pass before I'd accept the module. Those specs were the context.

AI wrote most of the implementation code and the throwaway API/browser test scripts (Playwright against
a local backend). I decided the architecture and module boundaries, wrote the security requirements,
chose the test cases, reviewed the diffs, and didn't accept a module until the tests and regressions
passed. A lot of the back-and-forth was me rejecting changes that went outside a module's scope, and
asking for an explanation when a failure looked like a regression.

## Decisions I made and why

1. **One shared `document_chunks` collection, filtered by `workspaceId` inside `$vectorSearch`.**
   A collection or index per workspace doesn't scale and makes the index setup painful. With a shared
   index, the risk is filtering *after* the search (and leaking other tenants' chunks into the top-k), so
   the rule was: `workspaceId` is a `filter` field in the Atlas index, and the verified workspace
   ObjectId is applied inside `$vectorSearch` itself. The workspace always comes from server-side
   ownership checks (`requireWorkspace`), never from what the frontend has selected.
2. **Background ingestion with BullMQ/Redis.** Text extraction and embedding are slow and rate-limited,
   so the upload request only stores the file and queues a job. The worker reports stage/progress, retries
   temporary errors (not broken files), and only inserts chunks at the end, so a half-processed
   document is never searchable.
3. **Tools treated as untrusted input.** Gemini's tool arguments go through strict Zod schemas (unknown
   fields like `workspaceId` or a webhook URL are rejected), and workspace/user/conversation are taken
   from the authenticated request. The Discord destination is fixed server config with mentions disabled,
   and webhook URLs are redacted from logs. Combined with a fixed "I don't know." when retrieval finds
   nothing above `RAG_MIN_SCORE`, the model has very little room to act on its own.

## Hardest AI wrong turn

In the tool-calling module, asking the assistant to create a task in a workspace with no documents got
**"I don't know."** back. The grounding rule the AI wrote ("if the context doesn't
support it, answer exactly I don't know.") also applied to action requests, so the model never called
the tool. I found it in the end-to-end tests, not by reading the code. The fix was a prompt rule saying
that action requests don't need document context.

While testing that, a second problem came up: if the model failed *after* a tool had already run, the
user got an error, and pressing **Try again** would run the action again (a duplicate task or Discord
message). Now the server builds the confirmation from the tool results when the model returns nothing,
and a retry checks for a successful call of the same tool for that question and doesn't repeat it.

A smaller one: the Tasks page went blank (`RangeError: Invalid time value`) because the API returned ISO
date-times while the UI's date helpers expected `YYYY-MM-DD`. The browser test caught it, and the fix
was a single date conversion in the API mapping layer.

## What I'd improve with more time

- Commit the API/browser test scripts as a real test suite with CI. They were run per module but live
  outside the repo.
- A paid Gemini tier, or a queue for chat requests. The free daily quota is the main reliability issue.
- httpOnly cookie sessions instead of a token in localStorage, login rate limiting, and secret scanning
  in a pre-commit hook.
- Object storage for uploads, streaming chat responses, and workspace sharing.

## Prompt excerpt (from the module specs)

> "workspace_id is a tenant/security boundary. The backend MUST enforce workspace isolation at the
> data/query level, especially inside vector search. Never rely only on frontend workspace selection."
