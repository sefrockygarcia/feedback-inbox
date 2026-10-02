# Build notes: how Feedback Inbox was built, step by step

This is the order the app was built in, with the commands and the "why" behind each step. To
practise, delete a file and rebuild it from these notes, or start a fresh project and follow along.
Rails comparisons are included where they help.

---

## Step 1: Create the app

```bash
npx create-next-app@latest feedback-inbox --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
cd feedback-inbox
mise use node@22.22.1          # like .ruby-version: pins Node for this folder
git config --local user.name "Frocky Garcia"
git config --local user.email "se.frocky@gmail.com"
```

- `create-next-app` is the equivalent of `rails new`.
- `--app` turns on the **App Router**: each folder under `app/` is a URL, and its `page.tsx` is the
  page (like routes, controller and view in one).
- `--local` git config only affects this repo, so your work identity stays global.

## Step 2: Database with Supabase

```bash
npm install --save-dev supabase     # Supabase CLI, version-pinned in package.json
npx supabase init                   # creates supabase/config.toml (like config/database.yml)
npx supabase start                  # Postgres, Auth and Studio in Docker; prints local keys
npx supabase migration new create_feedback   # like `rails g migration`
# write the SQL in supabase/migrations/<timestamp>_create_feedback.sql
npx supabase db reset               # like `rails db:migrate:reset` + seeds (local only!)
```

- **The migration** (`supabase/migrations/*_create_feedback.sql`):
  - Postgres enums for category and status.
  - `CHECK` constraints that act as database-level validations.
  - Two indexes.
  - **Row Level Security**: like action_policy, but enforced by Postgres on every query.
    - `anon` (logged-out visitors) may only `insert` rows that are `new` and unresolved.
    - `authenticated` (logged-in staff) may `select` and `update`.
- **Checking the rules with curl:** call Supabase's auto-generated REST API with the publishable key:
  - an insert returns `201`;
  - a read returns `[]`, because RLS hides the rows;
  - inserting `status: resolved` fails with an RLS error.
- **`.env.local`** holds the keys:
  - `NEXT_PUBLIC_*` values are bundled into browser JavaScript, so only the publishable key gets
    that prefix.
  - The secret key (it bypasses RLS) stays server-only.
- **`supabase/seed.sql`** creates the demo staff user in `auth.users` / `auth.identities` and adds
  13 sample feedback rows.
- **`npm run db:types`** generates `lib/database.types.ts`, giving TypeScript types for every
  table. It's like the schema annotations in Rails models, except the compiler checks them.

**A mistake made along the way, worth remembering:** the first `migration up` applied an *empty*
migration file, because the SQL hadn't been saved. Supabase then marked it as applied, so
`migration up` wouldn't run it again. `db reset` rebuilds everything from scratch.

## Step 3: Validation and Supabase clients

- **`lib/feedback.ts`** holds the categories, statuses, labels and the **Zod** schemas. Zod is like
  strong params and model validations in one object: `schema.safeParse(input)` returns either clean,
  typed data or field errors. The schema mirrors the SQL `CHECK` constraints.
- **`lib/supabase/server.ts`** has `createClient()`, which reads and writes the login cookies.
  - It always acts *as the current visitor*, so RLS applies.
  - `getStaffEmail()` uses `auth.getClaims()`, which validates the login token rather than trusting
    the cookie.
- **`lib/supabase/admin.ts`** is the secret-key client. It bypasses RLS, so only background jobs use
  it. `import "server-only"` makes the build fail if browser code ever imports it.
- **`proxy.ts`** is new in Next.js 16 (it used to be called middleware) and runs before every request:
  1. It refreshes the Supabase session cookies.
  2. It redirects logged-out visitors away from `/dashboard`.

  This is only a *fast, optimistic* check. Each dashboard page and action checks the user again
  (defence in depth).

## Step 4: Public form

- **`app/page.tsx`** is a **Server Component**: it renders on the server, like an ERB view, and
  ships no JavaScript.
- **`app/feedback-form.tsx`** is a **Client Component** (`"use client"`), because it needs browser
  state to show errors and a "Sending…" state.
  - **This has no Rails equivalent and is the key new concept:** each component runs *either* on the
    server *or* in the browser, and the `"use client"` line decides which.
- **`useActionState(submitFeedback, initialState)`** wires the form to the Server Action and gives
  back three things: `state`, the form `action`, and a `pending` flag.
- **`lib/actions/feedback.ts`** holds `submitFeedback`, a **Server Action** (`"use server"`):
  - It's a POST endpoint Next.js creates for you. It's like `FeedbackController#create`, but called
    straight from the form.
  - Because anyone can POST to it directly, it validates everything again.
  - It generates the UUID itself, since RLS stops anonymous visitors reading the row back.
  - It then sends the `feedback/submitted` Inngest event inside a `try/catch`, so a jobs outage never
    loses the feedback.
- **The "Send more feedback" button** resets the form by changing the form's React `key`, which
  makes React throw the old form away and mount a fresh one.

## Step 5: Staff login and dashboard

- **`lib/actions/auth.ts`** has `signIn` and `signOut`, which work like Devise's `SessionsController`.
  - Wrong email and wrong password show the same message, so the form doesn't reveal which emails
    have accounts.
  - `redirect()` works by throwing internally, so it goes last.
- **`app/dashboard/layout.tsx`** wraps every `/dashboard/*` page. It checks the login and shows the
  "Signed in as" bar and the Sign out button.
- **`app/dashboard/page.tsx`**:
  - In Next.js 16 `searchParams` is a **Promise**, so it must be `await`ed.
  - The Supabase query is built step by step, like an ActiveRecord relation:
    `.eq("status", status)`.
  - The count cards use `select("*", { count: "exact", head: true })`, the equivalent of
    `relation.count`.
- **`app/dashboard/[id]/page.tsx`**: `[id]` is a dynamic segment, like `/feedback/:id`. It has one
  form with three submit buttons, and the clicked button's `name`/`value` becomes the new status.
- **`lib/actions/dashboard.ts`**:
  - `updateStatus` checks the user again, validates the input, sets `resolved_at`, then calls
    `revalidatePath()` so the pages re-render with fresh data.
  - It's like expiring a cache in Rails.

## Step 6: Background jobs with Inngest and Discord

- **`lib/inngest/client.ts`** is the single Inngest client and the event name.
- **`lib/inngest/functions.ts`** has the two jobs:
  - **`notify-low-rating`** runs when the `feedback/submitted` event arrives, and posts a Discord
    alert when the rating is 2 or lower. Its Rails equivalent is a Sidekiq job enqueued from the
    controller.
  - **`daily-digest`** runs on `cron: "TZ=Asia/Manila 0 8 * * *"`, counts the last 24 hours with the
    admin client, and posts a summary. Its Rails equivalent is a sidekiq-scheduler entry.
  - **`step.run(...)`** marks a retryable unit of work: if Discord fails, only that step retries.
- **`app/api/inngest/route.ts`** is the HTTP endpoint Inngest calls to find and run the jobs. Unlike
  Sidekiq, there's no Redis and no worker process.
- **`lib/discord.ts`** contains:
  - pure functions that build the webhook JSON, with `allowed_mentions: { parse: [] }` so user text
    can't ping `@everyone`;
  - `postToDiscord()`, which only logs the message when `DISCORD_WEBHOOK_URL` isn't set.
- **Running it locally:** `npm run inngest:dev` starts the dev server and UI at
  http://localhost:8288. `INNGEST_DEV=1` in `.env.local` sends events there. To trigger the digest
  by hand, click **Invoke** in the UI.

## Step 7: Quality

- **`lib/*.test.ts`** has 19 Vitest unit tests, for the validation rules and the Discord payloads
  (with `fetch` stubbed). They're like model specs.
- **`vitest.config.mts`** maps the `@/` import alias.
- **`.github/workflows/ci.yml`** runs `npm ci`, lint, type-check, the tests and a production build
  on every push.
- **`npm audit` is clean.** Installing `inngest-cli` as a dependency pulled in a vulnerable
  `adm-zip`, so it runs through `npx` in the `inngest:dev` script instead.
- **Problems the React 19 linter caught:**
  - `Date.now()` inside a component isn't "pure", so it moved into the helper `daysAgoIso()`.
  - A plain `<a href="/">` inside the app became a proper reset button.

## Checked end to end before handing over

All of these were checked in a real browser against local Supabase and Inngest:
- An empty submit shows the three field errors, and the typed values stay filled in.
- A rating-2 submission saves the row, fires the event, and the alert job builds the Discord
  message.
- The digest, invoked by hand, gives the expected counts: 4 new, 3 negative, 8 open.
- `/dashboard` while logged out redirects to `/login`.
  - A wrong password shows an error.
  - The demo login reaches the dashboard.
- The combined status + category filter returns the right single item.
  - "Mark resolved" saves `resolved_at`.
  - A bad id returns a 404.
  - Sign-out works.
- The phone-width layout (390px) has no horizontal scrolling.
- `next build` passes.
