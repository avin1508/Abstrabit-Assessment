import { ago, inDays } from './mockTime.js'

/*
 * Tool calls requested by the model. Chat messages reference these by id (role: 'tool'),
 * so chat, dashboard and tool logs all read the same records.
 *
 * tools:  create_task { title, dueDate }  ·  send_summary { channel, summary }
 * status: pending → running → success | failed      (blocked = rejected at validation)
 */
export const MOCK_TOOL_RUNS = [
  // Acme Corporation
  {
    id: 'run_a6',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a5',
    tool: 'send_summary',
    args: { channel: '#product', summary: 'H2: workspace analytics and SSO/SCIM in Q3, read-only mobile beta in Q4.' },
    status: 'pending',
    summary: 'Queued: summary to #product',
    triggeredBy: 'Marcus Lee',
    createdAt: ago({ seconds: 40 }),
    durationMs: null,
  },
  {
    id: 'run_a5',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a1',
    tool: 'create_task',
    args: { title: 'Review refund policy', dueDate: inDays(3) },
    status: 'running',
    summary: 'Creating task “Review refund policy”',
    triggeredBy: 'Demo User',
    createdAt: ago({ minutes: 1 }),
    durationMs: null,
  },
  {
    id: 'run_a4',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a2',
    tool: 'create_task',
    args: { title: 'Review Q3 revenue variance with Finance', dueDate: inDays(2) },
    status: 'success',
    summary: 'Created task “Review Q3 revenue variance with Finance”',
    result: { taskId: 'task_a2' },
    triggeredBy: 'Demo User',
    createdAt: ago({ minutes: 188 }),
    durationMs: 284,
  },
  {
    id: 'run_a3',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a2',
    tool: 'send_summary',
    args: { channel: '#finance-updates', summary: 'Q3 target $4.8M. Services tracking ~6% below plan; review task created.' },
    status: 'success',
    summary: 'Sent summary to #finance-updates',
    result: { channel: '#finance-updates', messageId: 'msg_8841' },
    triggeredBy: 'Demo User',
    createdAt: ago({ minutes: 188 }),
    durationMs: 612,
  },
  {
    id: 'run_a2',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a6',
    tool: 'send_summary',
    args: { channel: '#legal-ops', summary: 'Northwind contract auto-renews Nov 30 — notice due by Oct 1.' },
    status: 'failed',
    summary: 'Webhook returned 404 — channel #legal-ops not found',
    error: 'Webhook returned 404 — channel #legal-ops not found.',
    triggeredBy: 'Demo User',
    createdAt: ago({ days: 5, minutes: 38 }),
    durationMs: 1_204,
  },
  {
    id: 'run_a1',
    workspaceId: 'ws_acme',
    conversationId: 'conv_a6',
    tool: 'create_task',
    args: { title: 'Review Northwind renewal clause', dueDate: inDays(-3) },
    status: 'success',
    summary: 'Created task “Review Northwind renewal clause”',
    result: { taskId: 'task_a3' },
    triggeredBy: 'Demo User',
    createdAt: ago({ days: 5, minutes: 38 }),
    durationMs: 301,
  },

  // Demo Workspace
  {
    id: 'run_d2',
    workspaceId: 'ws_demo',
    conversationId: 'conv_d1',
    tool: 'send_summary',
    args: { channel: '#sales', summary: 'Free plan: 3 workspaces, 100 documents, 50 AI questions/day.' },
    status: 'blocked',
    summary: 'Blocked — viewers can’t send summaries',
    error: 'Viewers can’t send summaries in Demo Workspace.',
    triggeredBy: 'Demo User',
    createdAt: ago({ minutes: 1439 }),
    durationMs: 3,
  },

  // Personal Workspace and Research Lab — no tool activity (exercises empty states).
]
