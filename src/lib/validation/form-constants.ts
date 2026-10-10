/**
 * Form values shared between the server and the browser.
 *
 * The public forms import from here, so this file must stay free of Zod and
 * database imports: anything it pulls in is shipped to every visitor.
 */
export const ENQUIRY_TYPES = ["general", "programme", "corporate", "discovery_call", "mentoring", "coaching"] as const;

export const TEAM_SIZES = ["Up to 10 people", "11 to 50 people", "51 to 200 people", "More than 200 people"] as const;

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string>;
  /** Echo of the submitted values so a failed submission keeps what the visitor typed. */
  values?: Record<string, string>;
};

export const IDLE: FormState = { status: "idle" };

export const ENQUIRY_LABELS: Record<(typeof ENQUIRY_TYPES)[number], string> = {
  general: "General enquiry",
  programme: "Programme enquiry",
  corporate: "Corporate enquiry",
  discovery_call: "Discovery call request",
  mentoring: "Mentoring and supervision enquiry",
  coaching: "Coaching enquiry",
};
