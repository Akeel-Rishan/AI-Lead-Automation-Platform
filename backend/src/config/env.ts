import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalEnvString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    const placeholderPattern = /^(your_|replace_this_|paste_|example_|noreply@yourdomain\.com|\+1x+)/i;

    return trimmedValue === "" || placeholderPattern.test(trimmedValue)
      ? undefined
      : trimmedValue;
  },
  z.string().optional()
);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  GOOGLE_API_KEY: optionalEnvString,
  TWILIO_ACCOUNT_SID: optionalEnvString,
  TWILIO_AUTH_TOKEN: optionalEnvString,
  TWILIO_PHONE_NUMBER: optionalEnvString,
  RESEND_API_KEY: optionalEnvString,
  RESEND_FROM_EMAIL: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue === "" || trimmedValue === "noreply@yourdomain.com"
        ? undefined
        : trimmedValue;
    },
    z.string().email("RESEND_FROM_EMAIL must be a valid email").optional()
  ),
  FACEBOOK_VERIFY_TOKEN: optionalEnvString,
  FRONTEND_URL: z.string().url().default("http://localhost:3000")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${formattedErrors}`);
}

export const env = parsedEnv.data;
export type Env = typeof env;
