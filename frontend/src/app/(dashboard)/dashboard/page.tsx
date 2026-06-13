import { CalendarClock, Flame, Target, UsersRound } from "lucide-react";

const stats = [
  {
    label: "Total Leads",
    value: "0",
    icon: UsersRound,
    accent: "text-cyan-300"
  },
  {
    label: "Hot Leads",
    value: "0",
    icon: Flame,
    accent: "text-rose-300"
  },
  {
    label: "Appointments",
    value: "0",
    icon: CalendarClock,
    accent: "text-emerald-300"
  },
  {
    label: "Conversion Rate",
    value: "--",
    icon: Target,
    accent: "text-amber-300"
  }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Welcome to LeadFlow AI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Monitor lead capture, qualification, appointment activity, and conversion
            performance across your business.
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
          Phase 1 Foundation
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-slate-950/20"
              key={stat.label}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900">
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-lg font-semibold text-white">Lead Pipeline</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {["New", "Contacted", "Qualified", "Converted", "Lost"].map((stage) => (
              <div className="rounded-md border border-slate-800 bg-slate-900 p-4" key={stage}>
                <p className="text-sm font-medium text-slate-300">{stage}</p>
                <p className="mt-3 text-2xl font-semibold text-white">0</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-lg font-semibold text-white">Automation Status</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Active sequences</span>
              <span className="text-sm font-semibold text-white">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Pending follow-ups</span>
              <span className="text-sm font-semibold text-white">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Knowledge documents</span>
              <span className="text-sm font-semibold text-white">0</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
