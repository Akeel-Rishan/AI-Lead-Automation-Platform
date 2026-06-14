"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import { setToken, setUser, type StoredUser } from "@/lib/auth";

const registerSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
  name: z.string().min(2, "Your name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  industry: z.string().optional()
});

type RegisterInput = z.infer<typeof registerSchema>;

type AuthResponse = {
  success: boolean;
  token: string;
  user: StoredUser;
};

const industries = [
  "Construction",
  "Real Estate",
  "Healthcare",
  "Legal",
  "Finance",
  "Home Services",
  "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: "",
      name: "",
      email: "",
      password: "",
      industry: ""
    }
  });

  async function onSubmit(values: RegisterInput) {
    setError("");

    try {
      const response = await api.post<AuthResponse>("/auth/register", values);

      setToken(response.data.token);
      setUser(response.data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to create your account. Please try again.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
            <Zap className="h-5 w-5 text-indigo-500" />
          </div>
          <span className="text-base font-semibold text-white">LeadFlow AI</span>
        </div>

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-white">Start your free trial</h1>
          <p className="mt-2 text-sm text-slate-400">Set up your account in seconds</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="tenantName">
              Business Name
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              id="tenantName"
              placeholder="Acme Roofing Co."
              type="text"
              {...register("tenantName")}
            />
            {errors.tenantName ? (
              <p className="mt-2 text-sm text-red-400">{errors.tenantName.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Your Name
            </label>
            <input
              autoComplete="name"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              id="name"
              placeholder="John Smith"
              type="text"
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              id="email"
              placeholder="john@acmeroofing.com"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none placeholder:text-slate-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              id="password"
              placeholder="Minimum 8 characters"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="industry">
              Industry
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              id="industry"
              {...register("industry")}
            >
              <option value="">Select industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="font-medium text-indigo-400 hover:text-indigo-300" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
