import { MOCK_TOOL_RUNS } from '../data/mockToolRuns.js'
import { MOCK_WORKSPACES } from '../data/mockWorkspaces.js'
import { createTaskSync } from './taskService.js'

/*
 * Mock tool-run store and executor. Stands in for:
 *   GET /api/workspaces/:workspaceId/tool-runs
 * and for the server-side flow: model requests a tool call → arguments + permissions are
 * validated → the tool executes → the result is recorded.
 *
 * Status lifecycle: pending → running → success | failed; blocked = rejected at validation.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runs = MOCK_TOOL_RUNS.map((run) => ({ ...run, args: { ...run.args } }))
const scheduled = new Set()
const listeners = new Set()

const clone = (run) => (run ? { ...run, args: { ...run.args }, result: run.result && { ...run.result } } : null)

const BLOCKED_VERB = { create_task: 'create tasks', send_summary: 'send summaries' }

// Called with the finished run whenever a run completes (used by chat to post a confirmation).
export function onToolRunFinished(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function inFlightSummary(tool, args, status) {
  if (tool === 'create_task') return `${status === 'pending' ? 'Queued' : 'Creating'} task “${args.title}”`
  if (tool === 'send_summary') return `${status === 'pending' ? 'Queued: summary to' : 'Sending summary to'} ${args.channel}`
  return `Running ${tool}`
}

export function getToolRunSync(runId) {
  return clone(runs.find((run) => run.id === runId))
}

export function listToolRunsSync(workspaceId) {
  return runs
    .filter((run) => run.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(clone)
}

export function createToolRun({ workspaceId, conversationId, tool, args, triggeredBy }) {
  const run = {
    id: `run_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    workspaceId,
    conversationId,
    tool,
    args: { ...args },
    status: 'running',
    summary: inFlightSummary(tool, args, 'running'),
    triggeredBy,
    createdAt: new Date().toISOString(),
    durationMs: null,
  }
  runs.unshift(run)
  return clone(run)
}

/*
 * Simulated validation + execution, enforcing the same guardrails the backend must:
 *   - read-only roles (Viewer) are blocked before execution
 *   - a missing Slack channel (#legal-ops) fails like a real webhook would
 *   - create_task writes a real (mock) task in the same workspace
 */
export function executeToolRun(runId) {
  const run = runs.find((candidate) => candidate.id === runId)
  if (!run || (run.status !== 'running' && run.status !== 'pending')) return clone(run)
  const workspace = MOCK_WORKSPACES.find((candidate) => candidate.id === run.workspaceId)
  const durationMs = 180 + Math.round(Math.random() * 520)

  if (workspace?.role === 'Viewer') {
    const error = `Viewers can’t ${BLOCKED_VERB[run.tool] ?? 'run tools'} in ${workspace.name}.`
    Object.assign(run, { status: 'blocked', error, summary: `Blocked — viewers can’t ${BLOCKED_VERB[run.tool]}`, durationMs: 3 })
  } else if (run.tool === 'send_summary' && run.args.channel === '#legal-ops') {
    const error = `Webhook returned 404 — channel ${run.args.channel} not found.`
    Object.assign(run, { status: 'failed', error, summary: error.replace(/\.$/, ''), durationMs })
  } else if (run.tool === 'create_task') {
    try {
      const task = createTaskSync(run.workspaceId, {
        title: run.args.title,
        dueDate: run.args.dueDate,
        createdBy: run.triggeredBy,
        conversationId: run.conversationId,
        toolRunId: run.id,
      })
      Object.assign(run, { status: 'success', summary: `Created task “${task.title}”`, result: { taskId: task.id }, durationMs })
    } catch (error) {
      Object.assign(run, { status: 'failed', error: `Validation failed: ${error.message}`, summary: 'Validation failed', durationMs })
    }
  } else {
    Object.assign(run, {
      status: 'success',
      summary: `Sent summary to ${run.args.channel}`,
      result: { channel: run.args.channel, messageId: `msg_${1000 + Math.floor(Math.random() * 9000)}` },
      durationMs,
    })
  }

  const finished = clone(run)
  listeners.forEach((listener) => listener(finished))
  return finished
}

// Seeded pending/running runs progress once someone looks at them (chat or tool logs).
export function resumeInFlightRuns(workspaceId) {
  for (const run of runs) {
    if (run.workspaceId !== workspaceId || scheduled.has(run.id)) continue
    if (run.status !== 'pending' && run.status !== 'running') continue
    scheduled.add(run.id)

    const execute = () => executeToolRun(run.id)
    if (run.status === 'pending') {
      setTimeout(() => {
        Object.assign(run, { status: 'running', summary: inFlightSummary(run.tool, run.args, 'running') })
        setTimeout(execute, 2500)
      }, 2500)
    } else {
      setTimeout(execute, 3500)
    }
  }
}

export async function listToolRuns(workspaceId) {
  await delay(300)
  resumeInFlightRuns(workspaceId)
  return listToolRunsSync(workspaceId)
}
