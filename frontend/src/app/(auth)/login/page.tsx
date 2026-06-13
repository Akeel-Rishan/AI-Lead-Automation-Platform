import { LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-8 shadow-2xl shadow-slate-950/40">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-400 text-sm font-black text-slate-950">
            LF
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            Sign in to LeadFlow AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your lead inbox, qualification pipeline, and automations.
          </p>
        </div>
        <form className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <span className="mt-2 flex items-center rounded-md border border-slate-800 bg-slate-900 px-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                className="h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <span className="mt-2 flex items-center rounded-md border border-slate-800 bg-slate-900 px-3">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              <input
                className="h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </span>
          </label>
          <button
            className="h-11 w-full rounded-md bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
