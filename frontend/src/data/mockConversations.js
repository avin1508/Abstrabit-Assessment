import { ago } from './mockTime.js'

// Conversation shells. Messages live in mockMessages.js; `updatedAt` is derived from them.
export const MOCK_CONVERSATIONS = [
  { id: 'conv_a1', workspaceId: 'ws_acme', title: 'Refund policy clarification', createdAt: ago({ minutes: 34 }) },
  { id: 'conv_a2', workspaceId: 'ws_acme', title: 'Q3 revenue targets', createdAt: ago({ minutes: 190 }) },
  { id: 'conv_a3', workspaceId: 'ws_acme', title: 'Employee leave policy', createdAt: ago({ minutes: 1500 }) },
  { id: 'conv_a4', workspaceId: 'ws_acme', title: 'Security requirements', createdAt: ago({ minutes: 2900 }) },
  { id: 'conv_a5', workspaceId: 'ws_acme', title: 'Product roadmap questions', createdAt: ago({ minutes: 4400 }) },
  { id: 'conv_a6', workspaceId: 'ws_acme', title: 'Vendor contract renewal', createdAt: ago({ days: 5, minutes: 40 }) },

  { id: 'conv_p1', workspaceId: 'ws_personal', title: 'Lease notice period', createdAt: ago({ minutes: 370 }) },
  { id: 'conv_p2', workspaceId: 'ws_personal', title: 'Home office deductions', createdAt: ago({ minutes: 2950 }) },

  { id: 'conv_d1', workspaceId: 'ws_demo', title: 'What does the free plan include?', createdAt: ago({ minutes: 1450 }) },

  // Research Lab — no conversations (exercises the empty state).
]
