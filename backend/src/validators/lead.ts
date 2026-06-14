import { z } from "zod";

export const leadSourceSchema = z.enum([
  "website",
  "facebook",
  "google",
  "sms",
  "email",
  "phone",
  "manual"
]);

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
  "lost"
]);

export const urgencySchema = z.enum(["low", "medium", "high"]);
export const qualificationSchema = z.enum(["hot", "warm", "cold"]);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const manualLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Email must be valid")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: optionalText,
  source: leadSourceSchema,
  service: optionalText,
  urgency: urgencySchema.optional(),
  budget: optionalText,
  notes: optionalText
});

export const updateLeadSchema = manualLeadSchema
  .extend({
    status: leadStatusSchema.optional(),
    qualification: qualificationSchema.optional().nullable(),
    leadScore: z.coerce.number().int().min(0).max(100).optional().nullable(),
    assignedTo: optionalText.nullable()
  })
  .partial();

export const webhookLeadSchema = z
  .object({
    name: optionalText,
    email: z
      .string()
      .trim()
      .email("Email must be valid")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: optionalText,
    service: optionalText,
    notes: optionalText,
    message: optionalText,
    source: leadSourceSchema.optional()
  })
  .passthrough();

export type ManualLeadInput = z.infer<typeof manualLeadSchema>;
export type WebhookLeadInput = z.infer<typeof webhookLeadSchema>;
