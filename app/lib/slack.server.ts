export async function postToSlack(channel: string, payload: Record<string, unknown>): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) throw new Error('SLACK_BOT_TOKEN is not set')

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, ...payload }),
  })

  if (!response.ok) {
    console.error(`Slack API HTTP error: ${response.status}`)
    throw new Error(`Slack API responded with ${response.status}`)
  }

  const json = (await response.json()) as { ok: boolean; error?: string }
  if (!json.ok) {
    console.error('Slack API error:', json.error)
    throw new Error(`Slack API error: ${json.error}`)
  }
}
