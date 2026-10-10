/**
 * Transactional email through Resend's HTTP API. When RESEND_API_KEY or
 * EMAIL_FROM is missing the function reports "skipped" rather than failing,
 * and callers record that honestly instead of pretending an email went out.
 */
import "server-only";

export type EmailResult = "sent" | "skipped" | "failed";

type Message = { to: string[]; subject: string; text: string; html: string; replyTo?: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: Message): Promise<EmailResult> {
  if (!emailConfigured() || message.to.length === 0) return "skipped";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[email] Resend rejected the message", response.status, await response.text());
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[email] could not reach Resend", error);
    return "failed";
  }
}

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
