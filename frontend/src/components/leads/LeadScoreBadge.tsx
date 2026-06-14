import { cn } from "@/lib/utils";

type LeadScoreBadgeProps = {
  score: number | null | undefined;
  qualification: string | null | undefined;
};

function scoreClasses(score: number) {
  if (score >= 75) {
    return "bg-green-500/15 text-green-300 ring-green-500/30";
  }

  if (score >= 45) {
    return "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30";
  }

  return "bg-red-500/15 text-red-300 ring-red-500/30";
}

export default function LeadScoreBadge({ score, qualification }: LeadScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-slate-500">--</span>;
  }

  const label = qualification
    ? `${qualification.charAt(0).toUpperCase()}${qualification.slice(1)} lead`
    : "Not qualified";

  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset",
        scoreClasses(score)
      )}
      title={label}
    >
      {score}
    </span>
  );
}
