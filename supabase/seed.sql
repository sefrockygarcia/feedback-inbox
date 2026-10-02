-- Local development seed. Runs automatically on `supabase db reset`
-- (Rails equivalent: db/seeds.rb run by db:reset).

-- Demo staff account (local and demo use only).
-- Email: staff@feedback-inbox.test   Password: inbox-demo-2026
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00',
  'authenticated', 'authenticated',
  'staff@feedback-inbox.test',
  extensions.crypt('inbox-demo-2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{"name":"Demo Staff"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  '6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00',
  '6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00',
  jsonb_build_object('sub', '6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00', 'email', 'staff@feedback-inbox.test', 'email_verified', true),
  'email', now(), now(), now()
);

-- Sample feedback spread over the last two weeks.
insert into public.feedback (created_at, name, email, category, rating, message, status, resolved_at) values
  (now() - interval '2 hours',  'Maria Santos',  'maria.santos@example.com', 'food',        2, 'Dinner was served cold again tonight. Mum barely ate.', 'new', null),
  (now() - interval '5 hours',  null,            null,                       'care',        5, 'The night nurse was so patient with Dad during his bad spell. Thank you.', 'new', null),
  (now() - interval '9 hours',  'John Reyes',    'jreyes@example.com',       'cleanliness', 1, 'Bathroom in room 12 has not been cleaned for two days.', 'in_progress', null),
  (now() - interval '1 day',    'Ana Cruz',      null,                       'activities',  4, 'Loved the music afternoon. Could we have it twice a week?', 'new', null),
  (now() - interval '1 day 4 hours', null,       null,                       'staff',       3, 'Staff are lovely but it takes a long time to answer the call bell at night.', 'in_progress', null),
  (now() - interval '2 days',   'Peter Lim',     'peter.lim@example.com',    'food',        4, 'Much better variety this week, especially the soups.', 'resolved', now() - interval '1 day'),
  (now() - interval '3 days',   'Grace Tan',     'grace.tan@example.com',    'care',        2, 'Medication was late twice this week. Please look into it.', 'resolved', now() - interval '2 days'),
  (now() - interval '4 days',   null,            null,                       'other',       5, 'The new garden seating area is beautiful.', 'resolved', now() - interval '3 days'),
  (now() - interval '5 days',   'Rosa Garcia',   null,                       'cleanliness', 4, 'Rooms are very clean and smell fresh.', 'resolved', now() - interval '4 days'),
  (now() - interval '6 days',   'Ben Torres',    'ben.torres@example.com',   'staff',       1, 'Nobody told us Mum had a fall until the next morning.', 'in_progress', null),
  (now() - interval '8 days',   null,            null,                       'activities',  3, 'Not many activities on weekends.', 'new', null),
  (now() - interval '10 days',  'Liza Mendoza',  null,                       'food',        5, 'Happy birthday cake for Lola was a lovely surprise!', 'resolved', now() - interval '9 days'),
  (now() - interval '12 days',  'Carlo Dizon',   'carlo.d@example.com',      'care',        4, 'Physio sessions are really helping Dad walk again.', 'resolved', now() - interval '11 days');
