import { cn } from "@/lib/utils";

type LeadStatusBadgeProps = {
  status?: string | null;
  size?: "sm" | "md";
};

const badgeStyles: Record<string, string> = {
  new: "bg-slate-700/60 text-slate-200 ring-slate-600",
  contacted: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  qualified: "bg-green-500/15 text-green-300 ring-green-500/30",
  unqualified: "bg-red-500/15 text-red-300 ring-red-500/30",
  converted: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  lost: "bg-gray-500/15 text-gray-300 ring-gray-500/30",
  hot: "bg-red-500/15 text-red-300 ring-red-500/30",
  warm: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  cold: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  low: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  medium: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
  high: "bg-red-500/15 text-red-300 ring-red-500/30"
};

function labelForStatus(status?: string | null) {
  if (!status) {
    return "--";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function LeadStatusBadge({ status, size = "sm" }: LeadStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() ?? "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        badgeStyles[normalizedStatus] ?? "bg-slate-800 text-slate-300 ring-slate-700"
      )}
    >
      {labelForStatus(status)}
    </span>
  );
}
