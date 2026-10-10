"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { enquiries, newsletterSubscribers, programmes } from "@/lib/db/schema";
import { escapeHtml, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { sanitisePlainText } from "@/lib/sanitise";
import { issueFormToken, rateLimit, verifyFormToken } from "@/lib/security";
import { ENQUIRY_LABELS, type FormState, enquirySchema, newsletterSchema } from "@/lib/validation/forms";

const GENERIC_ERROR = "Sorry, something went wrong on our side. Please try again, or contact us by phone or WhatsApp.";
const TOO_MANY = "You have sent several messages in a short time. Please wait a few minutes and try again.";

/** Called by forms when a visitor starts typing. See verifyFormToken(). */
export async function getFormToken(): Promise<string> {
  return issueFormToken();
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

function echo(formData: FormData, keys: string[]) {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

const ENQUIRY_FIELDS = ["type", "name", "email", "phone", "organisation", "roleTitle", "programmeId", "teamSize", "message", "consentMarketing"];

export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, ENQUIRY_FIELDS);

  // Honeypot: real visitors never see or fill this field. Pretend it worked.
  if (formData.get("website")) redirect("/thank-you/");

  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      errors: fieldErrors(parsed.error.issues),
      values,
    };
  }

  if (!verifyFormToken(String(formData.get("token") ?? ""))) {
    return {
      status: "error",
      message: "We could not verify this submission. Please refresh the page and send the form again.",
      values,
    };
  }

  let enquiryId: string;
  try {
    if (!(await rateLimit("enquiry", 5, 15 * 60))) return { status: "error", message: TOO_MANY, values };

    const input = parsed.data;
    let programmeName: string | null = null;
    if (input.programmeId) {
      const [programme] = await db().select({ name: programmes.name }).from(programmes).where(eq(programmes.id, input.programmeId)).limit(1);
      programmeName = programme?.name ?? null;
    }

    let utm: Record<string, string> | null = null;
    try {
      const raw = input.utm ? (JSON.parse(input.utm) as Record<string, unknown>) : null;
      if (raw) {
        utm = Object.fromEntries(
          Object.entries(raw)
            .filter(([key, value]) => key.startsWith("utm_") && typeof value === "string")
            .map(([key, value]) => [key, sanitisePlainText(String(value)).slice(0, 120)]),
        );
      }
    } catch {
      utm = null;
    }

    const [row] = await db()
      .insert(enquiries)
      .values({
        type: input.type,
        name: sanitisePlainText(input.name),
        email: input.email,
        phone: input.phone,
        organisation: input.organisation ? sanitisePlainText(input.organisation) : null,
        roleTitle: input.roleTitle ? sanitisePlainText(input.roleTitle) : null,
        programmeId: programmeName ? input.programmeId : null,
        programmeInterest: programmeName,
        teamSize: input.teamSize,
        message: sanitisePlainText(input.message),
        consentMarketing: input.consentMarketing,
        sourcePath: input.sourcePath,
        referrer: input.referrer,
        utm,
      })
      .returning({ id: enquiries.id });
    enquiryId = row!.id;

    // Notify the team. Failure to send never loses the enquiry: it is already stored.
    const settings = await getSettings();
    const to = (process.env.ENQUIRY_NOTIFY_TO || settings.contact.email).split(",").map((s) => s.trim()).filter(Boolean);
    const lines: [string, string | null][] = [
      ["Type", ENQUIRY_LABELS[input.type]],
      ["Name", input.name],
      ["Email", input.email],
      ["Phone", input.phone],
      ["Organisation", input.organisation],
      ["Role", input.roleTitle],
      ["Interested in", programmeName],
      ["Team size", input.teamSize],
      ["Message", input.message || null],
      ["Sent from", input.sourcePath],
    ];
    const present = lines.filter((line): line is [string, string] => Boolean(line[1]));
    const adminLink = `${siteUrl()}/admin/enquiries/${enquiryId}/`;
    const result = await sendEmail({
      to,
      replyTo: input.email,
      subject: `New ${ENQUIRY_LABELS[input.type].toLowerCase()} from ${input.name}`,
      text: `${present.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nOpen in the admin: ${adminLink}`,
      html: `<table cellpadding="6" style="font-family:sans-serif;font-size:14px">${present
        .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
        .join("")}</table><p style="font-family:sans-serif;font-size:14px"><a href="${adminLink}">Open in the admin</a></p>`,
    });
    await db().update(enquiries).set({ notificationStatus: result }).where(eq(enquiries.id, enquiryId));

    if (input.consentMarketing) {
      await db()
        .insert(newsletterSubscribers)
        .values({ email: input.email, name: sanitisePlainText(input.name), sourcePath: input.sourcePath })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error("[enquiry] failed to store enquiry", error);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  redirect(`/thank-you/?type=${parsed.data.type}`);
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { status: "success", message: "Thank you. You are on the list." };

  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", errors: fieldErrors(parsed.error.issues), values: echo(formData, ["email"]) };
  }
  if (!verifyFormToken(String(formData.get("token") ?? ""), 1)) {
    return { status: "error", message: "We could not verify this submission. Please try again.", values: echo(formData, ["email"]) };
  }
  try {
    if (!(await rateLimit("newsletter", 5, 15 * 60))) return { status: "error", message: TOO_MANY };
    // The unique index is on lower(email), which the query builder cannot target, hence raw SQL.
    await db().execute(sql`
      insert into newsletter_subscribers (email, source_path)
      values (${parsed.data.email}, ${parsed.data.sourcePath})
      on conflict (lower(email)) do update set status = 'subscribed', updated_at = now()
    `);
  } catch (error) {
    console.error("[newsletter] failed to subscribe", error);
    return { status: "error", message: GENERIC_ERROR };
  }
  return { status: "success", message: "Thank you. You are on the list." };
}
