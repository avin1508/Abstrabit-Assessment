import { env } from '../config/env.js'

const TIMEOUT_MS = 10_000

// A Discord failure with a message that is safe to show and log (never contains the webhook).
export class DiscordError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DiscordError'
  }
}

/*
 * Posts a message to the server-configured DISCORD_WEBHOOK_URL. The destination is never
 * chosen by the caller, the model or a document. Mentions (@everyone, roles, users) are disabled.
 * Returns { messageId } from Discord.
 */
export async function sendDiscordMessage(content) {
  let url
  try {
    url = new URL(env.discordWebhookUrl)
  } catch {
    throw new DiscordError('Discord isn’t configured on the server.')
  }
  if (!['https:', 'http:'].includes(url.protocol)) throw new DiscordError('Discord isn’t configured on the server.')
  url.searchParams.set('wait', 'true') // Discord replies with the created message

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new DiscordError('Couldn’t reach Discord. Try again later.')
  }
  if (!response.ok) throw new DiscordError(`Discord didn’t accept the summary (HTTP ${response.status}).`)

  const body = await response.json().catch(() => ({}))
  return { messageId: typeof body?.id === 'string' ? body.id : null }
}
