-- With "automatically expose new tables" turned off (the safer setting), no role gets
-- table privileges by default. The background jobs use the secret key (service_role),
-- which bypasses RLS but still needs ordinary table privileges.
grant select, insert, update, delete on public.feedback to service_role;
