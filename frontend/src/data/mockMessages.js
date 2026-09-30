import { ago } from './mockTime.js'
import {
  ACME_PASSWORDS,
  ACME_PTO,
  ACME_REFUND,
  ACME_REFUND_ENTERPRISE,
  ACME_REVENUE,
  ACME_ROADMAP,
  ACME_VENDOR,
  DEMO_FREE_PLAN,
  PERSONAL_LEASE,
  PERSONAL_RECEIPTS,
} from './mockAnswers.js'

/*
 * Chat messages. Every message carries workspaceId + conversationId.
 *   role 'user'      — { text, author }
 *   role 'assistant' — { state: answer | unknown | error | thinking, text, citations, meta, error }
 *   role 'tool'      — { toolRunId } → resolved against mockToolRuns.js
 */

let seq = 0
const at = (minutes) => ago({ minutes })
const make = (workspaceId, conversationId) => (minutesAgo, fields) => ({
  id: `msg_${++seq}`,
  workspaceId,
  conversationId,
  createdAt: at(minutesAgo),
  ...fields,
})
const user = (text) => ({ role: 'user', text, author: 'Demo User' })
const answer = ({ text, citations }, meta = {}) => ({ role: 'assistant', state: 'answer', text, citations, meta })
const unknown = (text, meta = {}) => ({ role: 'assistant', state: 'unknown', text, citations: [], meta })
const tool = (toolRunId) => ({ role: 'tool', toolRunId })

const a1 = make('ws_acme', 'conv_a1')
const a2 = make('ws_acme', 'conv_a2')
const a3 = make('ws_acme', 'conv_a3')
const a4 = make('ws_acme', 'conv_a4')
const a5 = make('ws_acme', 'conv_a5')
const a6 = make('ws_acme', 'conv_a6')
const p1 = make('ws_personal', 'conv_p1')
const p2 = make('ws_personal', 'conv_p2')
const d1 = make('ws_demo', 'conv_d1')

export const MOCK_MESSAGES = [
  // Refund policy clarification — cited answers, then a tool call still running.
  a1(34, user('What is the company’s refund policy?')),
  a1(33, answer(ACME_REFUND, { retrieved: 6, latencyMs: 1840 })),
  a1(28, user('Does that apply to enterprise plans too?')),
  a1(27, answer(ACME_REFUND_ENTERPRISE, { retrieved: 5, latencyMs: 2110 })),
  a1(2, user('Create a task to review the refund policy')),
  a1(1, tool('run_a5')),

  // Q3 revenue targets — cited answer, two successful tool calls, confirmation.
  a2(190, user('What are our Q3 revenue targets? Then create a task to review the variance with finance and post a summary to #finance-updates.')),
  a2(189, answer(ACME_REVENUE, { retrieved: 7, latencyMs: 2380 })),
  a2(188, tool('run_a4')),
  a2(188, tool('run_a3')),
  a2(187, answer({ text: 'Done — I created the task **Review Q3 revenue variance with Finance** and sent the Q3 summary to **#finance-updates**.', citations: [] }, { mode: 'tool', latencyMs: 1420 })),

  // Employee leave policy — honest "I don't know", then a cited answer.
  a3(1500, user('How many weeks of parental leave do employees in Germany get?')),
  a3(1499, unknown('I don’t know based on the documents available in Acme Corporation. The Employee Handbook covers general paid time off, but none of the indexed documents mention parental leave rules for Germany, so I can’t answer this confidently.', { searchedDocuments: 10, latencyMs: 1310 })),
  a3(1490, user('OK — what’s the general PTO policy then?')),
  a3(1489, answer(ACME_PTO, { retrieved: 4, latencyMs: 1650 })),

  // Security requirements — cited answer, then a generation error with retry.
  a4(2900, user('What are the password requirements for employee accounts?')),
  a4(2899, answer(ACME_PASSWORDS, { retrieved: 5, latencyMs: 1720 })),
  a4(2880, user('Draft a security onboarding checklist based on those rules.')),
  a4(2879, { role: 'assistant', state: 'error', error: 'The model request timed out after 30 s. No answer was generated.' }),

  // Product roadmap questions — cited answer, then a rewrite with no retrieval (normal answer).
  a5(4400, user('What’s planned for the product in H2?')),
  a5(4399, answer(ACME_ROADMAP, { retrieved: 4, latencyMs: 1930 })),
  a5(4390, user('Can you make that one sentence for a Slack update?')),
  a5(4389, answer({ text: 'H2 focuses on workspace analytics and SSO/SCIM in Q3, followed by a read-only mobile app beta in Q4.', citations: [] }, { mode: 'rewrite', latencyMs: 820 })),

  // Vendor contract renewal — cited answer, one tool success, one tool failure.
  a6(7240, user('When does the Northwind vendor contract renew? Create a review task and alert #legal-ops.')),
  a6(7239, answer(ACME_VENDOR, { retrieved: 6, latencyMs: 2040 })),
  a6(7238, tool('run_a1')),
  a6(7238, tool('run_a2')),
  a6(7237, answer({ text: 'I created the task **Review Northwind renewal clause**, but couldn’t post to **#legal-ops** — the webhook reported that the channel doesn’t exist. Reconnect the Slack integration or pick another channel.', citations: [] }, { mode: 'tool', latencyMs: 1380 })),

  // Personal Workspace
  p1(370, user('How much notice do I need to give before moving out?')),
  p1(369, answer(PERSONAL_LEASE, { retrieved: 3, latencyMs: 1290 })),
  p2(2950, user('Which receipts do I still need for the home office deduction?')),
  p2(2949, answer(PERSONAL_RECEIPTS, { retrieved: 3, latencyMs: 1410 })),
  p2(2940, user('Can I deduct my new laptop too?')),
  p2(2939, unknown('I don’t know based on the documents available in Personal Workspace. Your tax documents don’t mention equipment purchases or depreciation, so I can’t tell whether the laptop qualifies.', { searchedDocuments: 4, latencyMs: 1180 })),

  // Demo Workspace — cited answer, then a tool call blocked by the viewer role.
  d1(1450, user('What does the free plan include?')),
  d1(1449, answer(DEMO_FREE_PLAN, { retrieved: 2, latencyMs: 1150 })),
  d1(1440, user('Send this to #sales')),
  d1(1439, tool('run_d2')),
  d1(1438, answer({ text: 'I couldn’t send that — your role in Demo Workspace is **Viewer**, and viewers can’t send summaries. Ask a workspace admin for access.', citations: [] }, { mode: 'tool', latencyMs: 610 })),
]
