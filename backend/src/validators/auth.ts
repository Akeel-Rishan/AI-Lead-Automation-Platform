import { z } from "zod";

export const registerSchema = z.object({
  tenantName: z.string().trim().min(2, "Business name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  industry: z.string().trim().optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
