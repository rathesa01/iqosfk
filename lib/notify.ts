import 'server-only';
import { getNotifySettings } from '@/lib/settings';

export type NotifyResult = {
  channel: 'line' | 'webhook';
  ok: boolean;
  error?: string;
};

/**
 * Send a plain-text message to all configured channels.
 *
 * `lineToken` + `lineTo` -> LINE Messaging API push
 * `webhookUrl`           -> POST { content: text } (Discord-compatible)
 */
export async function notify(text: string): Promise<NotifyResult[]> {
  const cfg = await getNotifySettings();
  const results: NotifyResult[] = [];

  if (cfg.lineToken && cfg.lineTo) {
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.lineToken}`,
        },
        body: JSON.stringify({
          to: cfg.lineTo,
          messages: [{ type: 'text', text: text.slice(0, 4900) }],
        }),
      });
      results.push({
        channel: 'line',
        ok: res.ok,
        error: res.ok ? undefined : `${res.status} ${res.statusText}`,
      });
    } catch (e) {
      results.push({ channel: 'line', ok: false, error: String(e) });
    }
  }

  if (cfg.webhookUrl) {
    try {
      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, text }),
      });
      results.push({
        channel: 'webhook',
        ok: res.ok,
        error: res.ok ? undefined : `${res.status} ${res.statusText}`,
      });
    } catch (e) {
      results.push({ channel: 'webhook', ok: false, error: String(e) });
    }
  }

  return results;
}
