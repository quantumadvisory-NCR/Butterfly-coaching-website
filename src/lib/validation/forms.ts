import { z } from "zod";
import { ENQUIRY_TYPES, TEAM_SIZES } from "./form-constants";

export { ENQUIRY_LABELS, IDLE, TEAM_SIZES, type FormState } from "./form-constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => v || null);

export const enquirySchema = z
  .object({
    type: z.enum(ENQUIRY_TYPES).default("general"),
    name: z.string().trim().min(2, "Please tell us your name.").max(120, "That name is too long."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address, like name@example.com.").max(200),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .transform((v) => v || null)
      .refine((v) => !v || /^[+\d][\d\s().-]{6,}$/.test(v), "Enter a phone number with digits only, e.g. +91 98765 43210."),
    organisation: optionalText(160),
    roleTitle: optionalText(120),
    programmeId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    teamSize: z
      .enum(TEAM_SIZES)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    message: z.string().trim().max(4000, "Please keep your message under 4,000 characters.").default(""),
    consentMarketing: z
      .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.null()])
      .optional()
      .transform((v) => v === true || v === "on" || v === "true"),
    sourcePath: optionalText(300),
    referrer: optionalText(500),
    utm: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (value.type === "corporate" && !value.organisation) {
      ctx.addIssue({ code: "custom", path: ["organisation"], message: "Please tell us which organisation you are with." });
    }
    if (value.type === "general" && value.message.length < 10) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Please add a short message so we know how to help." });
    }
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address, like name@example.com.").max(200),
  sourcePath: optionalText(300),
});

