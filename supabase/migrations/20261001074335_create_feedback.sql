-- Choices for category and status (like a Rails enum, but enforced by Postgres)
create type public.feedback_category as enum ('care', 'food', 'cleanliness', 'staff', 'activities', 'other');
create type public.feedback_status as enum ('new', 'in_progress', 'resolved');

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  email       text,
  category    public.feedback_category not null default 'other',
  rating      smallint not null check (rating between 1 and 5),
  message     text not null check (char_length(message) between 1 and 2000),
  status      public.feedback_status not null default 'new',
  resolved_at timestamptz
);

-- Indexes for the dashboard's sorting and filtering
create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_status_idx on public.feedback (status);

-- Row Level Security: nobody can do anything unless a policy below allows it
alter table public.feedback enable row level security;

-- Anyone (logged out = "anon") can submit, but only as a fresh, unresolved item
create policy "Anyone can submit feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (status = 'new' and resolved_at is null);

-- Logged-in staff ("authenticated") can read and update everything
create policy "Staff can read feedback"
  on public.feedback for select
  to authenticated
  using (true);

create policy "Staff can update feedback"
  on public.feedback for update
  to authenticated
  using (true)
  with check (true);

-- Table permissions the policies above work within
grant insert on public.feedback to anon;
grant select, insert, update on public.feedback to authenticated;