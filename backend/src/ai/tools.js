import { Type } from '@google/genai'

// These declarations only guide the model. They aren't a security boundary: every call is
// validated and authorized in tool.service.js before anything runs.
export const TOOL_NAMES = ['create_task', 'send_summary']

export const TOOL_DECLARATIONS = [
  {
    name: 'create_task',
    description:
      "Create a task in the user's current workspace. Use only when the user explicitly asks to create, add or schedule a task, to-do or reminder.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short task title (max 200 characters).' },
        description: { type: Type.STRING, description: 'Optional details (max 2000 characters).' },
        dueDate: { type: Type.STRING, description: 'Optional due date as an ISO 8601 date, e.g. 2026-10-03.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'send_summary',
    description:
      "Send a short written summary to the team's Discord channel configured on the server. Use only when the user explicitly asks to send, share or post a summary. Write the summary yourself in plain text, without URLs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: 'The summary text (max 1800 characters, no URLs).' },
        channel: { type: Type.STRING, description: 'Optional label of where it is going, e.g. #general. Informational only.' },
      },
      required: ['summary'],
    },
  },
]
