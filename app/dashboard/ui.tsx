import { STATUS_LABELS, isLowRating, type FeedbackStatus } from "@/lib/feedback";

const statusStyles: Record<FeedbackStatus, string> = {
  new: "bg-blue-50 text-blue-800 ring-blue-200",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function RatingBadge({ rating }: { rating: number }) {
  const low = isLowRating(rating);
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 font-mono text-sm font-semibold ${
        low ? "bg-red-50 text-danger" : "bg-canvas text-ink"
      }`}
      title={`${rating} out of 5`}
    >
      {rating}/5
    </span>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
