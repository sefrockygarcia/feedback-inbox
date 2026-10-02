import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStatus } from "@/lib/actions/dashboard";
import { CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/feedback";
import { createClient } from "@/lib/supabase/server";
import { RatingBadge, StatusBadge, formatDate } from "../ui";

export const metadata: Metadata = { title: "Feedback detail" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FeedbackDetailPage({ params }: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase.from("feedback").select("*").eq("id", id).maybeSingle();
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm font-medium text-accent hover:underline">
        ← Back to all feedback
      </Link>

      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <RatingBadge rating={item.rating} />
          <StatusBadge status={item.status} />
          <span className="text-sm text-muted">{CATEGORY_LABELS[item.category]}</span>
        </div>

        <p className="mt-5 text-lg whitespace-pre-line">{item.message}</p>

        <dl className="mt-6 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">From</dt>
            <dd className="mt-0.5 font-medium">{item.name ?? "Anonymous"}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 font-medium">
              {item.email ? (
                <a href={`mailto:${item.email}`} className="text-accent hover:underline">
                  {item.email}
                </a>
              ) : (
                "Not provided"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Received</dt>
            <dd className="mt-0.5 font-medium">{formatDate(item.created_at)}</dd>
          </div>
          {item.resolved_at && (
            <div>
              <dt className="text-muted">Resolved</dt>
              <dd className="mt-0.5 font-medium">{formatDate(item.resolved_at)}</dd>
            </div>
          )}
        </dl>
      </article>

      <section aria-labelledby="status-heading" className="rounded-2xl border border-line bg-white p-6">
        <h2 id="status-heading" className="font-semibold">
          Change status
        </h2>
        {/* One form, several submit buttons: the clicked button's name/value is sent. */}
        <form action={updateStatus} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={item.id} />
          {STATUSES.map((status) => (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              disabled={status === item.status}
              className="min-h-11 rounded-lg border border-line px-4 font-medium hover:bg-canvas disabled:cursor-default disabled:border-accent disabled:bg-accent disabled:text-white"
            >
              {status === item.status ? `${STATUS_LABELS[status]} (current)` : `Mark ${STATUS_LABELS[status].toLowerCase()}`}
            </button>
          ))}
        </form>
      </section>
    </div>
  );
}
