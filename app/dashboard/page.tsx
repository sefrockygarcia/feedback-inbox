import type { Metadata } from "next";
import Link from "next/link";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
  STATUS_LABELS,
  daysAgoIso,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";
import { createClient } from "@/lib/supabase/server";
import { RatingBadge, StatusBadge, formatDate } from "./ui";

export const metadata: Metadata = { title: "Dashboard" };

function asStatus(value: unknown): FeedbackStatus | undefined {
  return STATUSES.find((status) => status === value);
}

function asCategory(value: unknown): FeedbackCategory | undefined {
  return CATEGORIES.find((category) => category === value);
}

function filterHref(params: { status?: string; category?: string }): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.category) search.set("category", params.category);
  const query = search.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium ${
        active ? "border-accent bg-accent text-white" : "border-line bg-white hover:bg-canvas"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  // In Next.js 16, searchParams is a Promise, so it must be awaited.
  const query = await searchParams;
  const status = asStatus(query.status);
  const category = asCategory(query.category);

  const supabase = await createClient();

  // Build the query step by step, like an ActiveRecord relation.
  let list = supabase
    .from("feedback")
    .select("id, created_at, name, category, rating, message, status")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) list = list.eq("status", status);
  if (category) list = list.eq("category", category);

  const weekAgo = daysAgoIso(7);
  const count = () => supabase.from("feedback").select("*", { count: "exact", head: true });

  const [{ data: rows, error }, openCount, newCount, negativeWeek] = await Promise.all([
    list,
    count().neq("status", "resolved"),
    count().eq("status", "new"),
    count().lte("rating", 2).gte("created_at", weekAgo),
  ]);

  if (error) throw new Error(`Could not load feedback: ${error.message}`);

  const stats = [
    { label: "Open", value: openCount.count ?? 0 },
    { label: "New, not yet triaged", value: newCount.count ?? 0 },
    { label: "Negative (1–2) this week", value: negativeWeek.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>
        <p className="mt-1 text-muted">Newest first. Low ratings are highlighted in red.</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-white p-4">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          <span className="mr-1 text-sm font-medium text-muted">Status</span>
          <FilterLink href={filterHref({ category })} active={!status}>
            All
          </FilterLink>
          {STATUSES.map((value) => (
            <FilterLink key={value} href={filterHref({ status: value, category })} active={status === value}>
              {STATUS_LABELS[value]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          <span className="mr-1 text-sm font-medium text-muted">Category</span>
          <FilterLink href={filterHref({ status })} active={!category}>
            All
          </FilterLink>
          {CATEGORIES.map((value) => (
            <FilterLink key={value} href={filterHref({ status, category: value })} active={category === value}>
              {CATEGORY_LABELS[value]}
            </FilterLink>
          ))}
        </div>
      </div>

      {rows && rows.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/dashboard/${row.id}`}
                className="flex flex-col gap-2 p-4 hover:bg-canvas sm:flex-row sm:items-center sm:gap-4"
              >
                <RatingBadge rating={row.rating} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.message}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {CATEGORY_LABELS[row.category]} · {row.name ?? "Anonymous"} · {formatDate(row.created_at)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-muted">
          No feedback matches these filters.
        </p>
      )}
    </div>
  );
}
