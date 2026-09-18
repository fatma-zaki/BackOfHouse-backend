/*
# Development seed data — NOT for production

Every account, company and person below is invented. The shared password is a
well-known development value and the addresses use the reserved `.test` domain,
so nothing here can collide with, or impersonate, a real person or mailbox.

Run against a local or disposable Supabase project only:

    supabase db reset          # applies migrations, then this file

The script is idempotent: fixed UUIDs plus ON CONFLICT DO NOTHING mean it can be
re-run without duplicating rows.
*/

-- Development password for every seeded account: DevPassword-2026
-- (bcrypt-hashed here; Supabase Auth still owns credential handling.)

BEGIN;

-- ---------------------------------------------------------------------------
-- Auth accounts
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'platform.admin@backofhouse.test',
    crypt('DevPassword-2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"app_role":"PLATFORM_ADMIN"}'::jsonb,
    '{"first_name":"Robin","last_name":"Vasquez"}'::jsonb, now(), now()
  ),
  (
    '22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ada.okonkwo@example.test',
    crypt('DevPassword-2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"app_role":"USER"}'::jsonb,
    '{"first_name":"Ada","last_name":"Okonkwo"}'::jsonb, now(), now()
  ),
  (
    '33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'luca.moretti@example.test',
    crypt('DevPassword-2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"app_role":"USER"}'::jsonb,
    '{"first_name":"Luca","last_name":"Moretti"}'::jsonb, now(), now()
  ),
  (
    '44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'nina.haddad@example.test',
    crypt('DevPassword-2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"app_role":"USER"}'::jsonb,
    '{"first_name":"Nina","last_name":"Haddad"}'::jsonb, now(), now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   '11111111-1111-4111-8111-111111111111',
   '{"sub":"11111111-1111-4111-8111-111111111111","email":"platform.admin@backofhouse.test"}'::jsonb,
   'email', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222',
   '22222222-2222-4222-8222-222222222222',
   '{"sub":"22222222-2222-4222-8222-222222222222","email":"ada.okonkwo@example.test"}'::jsonb,
   'email', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333',
   '33333333-3333-4333-8333-333333333333',
   '{"sub":"33333333-3333-4333-8333-333333333333","email":"luca.moretti@example.test"}'::jsonb,
   'email', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444',
   '44444444-4444-4444-8444-444444444444',
   '{"sub":"44444444-4444-4444-8444-444444444444","email":"nina.haddad@example.test"}'::jsonb,
   'email', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

INSERT INTO users (id, auth_user_id, email, first_name, last_name, bio, location, job_title, years_of_experience)
VALUES
  ('aaaa1111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   'platform.admin@backofhouse.test', 'Robin', 'Vasquez',
   'Platform editor for the Back Of House newsroom.', 'Lisbon, Portugal', 'Editor', 9),
  ('aaaa2222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222',
   'ada.okonkwo@example.test', 'Ada', 'Okonkwo',
   'Pastry chef with a weakness for laminated dough.', 'Porto, Portugal', 'Head Pastry Chef', 12),
  ('aaaa3333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333',
   'luca.moretti@example.test', 'Luca', 'Moretti',
   'Runs the floor, writes the wine list.', 'Lisbon, Portugal', 'Restaurant Manager', 7),
  ('aaaa4444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444',
   'nina.haddad@example.test', 'Nina', 'Haddad',
   'Sourcing produce for kitchens across the peninsula.', 'Faro, Portugal', 'Supply Lead', 5)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Companies and membership
-- ---------------------------------------------------------------------------

INSERT INTO companies (id, name, slug, description, website, industry, location)
VALUES
  ('bbbb1111-1111-4111-8111-111111111111', 'Harbour Table Group', 'harbour-table-group',
   'Hospitality group operating four venues along the waterfront.',
   'https://harbourtable.example', 'Hospitality', 'Lisbon, Portugal'),
  ('bbbb2222-2222-4222-8222-222222222222', 'Terra Produce Co-op', 'terra-produce-co-op',
   'Grower co-operative supplying restaurants with seasonal produce.',
   'https://terraproduce.example', 'Food supply', 'Faro, Portugal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_members (company_id, user_id, role)
VALUES
  ('bbbb1111-1111-4111-8111-111111111111', 'aaaa3333-3333-4333-8333-333333333333', 'admin'),
  ('bbbb1111-1111-4111-8111-111111111111', 'aaaa2222-2222-4222-8222-222222222222', 'member'),
  ('bbbb2222-2222-4222-8222-222222222222', 'aaaa4444-4444-4444-8444-444444444444', 'admin')
ON CONFLICT (company_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Professional profiles
-- ---------------------------------------------------------------------------

INSERT INTO professionals (id, user_id, profession, specialties, skills, experience, location, availability, portfolio_links, profile_visibility)
VALUES
  ('cccc2222-2222-4222-8222-222222222222', 'aaaa2222-2222-4222-8222-222222222222',
   'Pastry chef', ARRAY['viennoiserie', 'plated desserts'], ARRAY['menu costing', 'team training'],
   12, 'Porto, Portugal', 'available', ARRAY['https://portfolio.example/ada'], 'public'),
  ('cccc3333-3333-4333-8333-333333333333', 'aaaa3333-3333-4333-8333-333333333333',
   'Restaurant manager', ARRAY['wine service'], ARRAY['rota planning', 'supplier negotiation'],
   7, 'Lisbon, Portugal', 'busy', ARRAY[]::text[], 'public'),
  ('cccc4444-4444-4444-8444-444444444444', 'aaaa4444-4444-4444-8444-444444444444',
   'Supply lead', ARRAY['seasonal sourcing'], ARRAY['logistics', 'quality control'],
   5, 'Faro, Portugal', 'available', ARRAY[]::text[], 'private')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

INSERT INTO events (id, title, slug, description, organizer, location, start_date, end_date, status, capacity, created_by, company_id)
VALUES
  ('dddd1111-1111-4111-8111-111111111111', 'Winter supplier showcase', 'winter-supplier-showcase',
   'Meet growers and producers ahead of the winter menu cycle.', 'Terra Produce Co-op',
   'Faro, Portugal', now() + interval '30 days', now() + interval '30 days 8 hours',
   'published', 120, 'aaaa4444-4444-4444-8444-444444444444', 'bbbb2222-2222-4222-8222-222222222222'),
  ('dddd2222-2222-4222-8222-222222222222', 'Service leadership roundtable', 'service-leadership-roundtable',
   'A closed-door session on retaining floor teams.', 'Harbour Table Group',
   'Lisbon, Portugal', now() + interval '10 days', now() + interval '10 days 3 hours',
   'published', 25, 'aaaa3333-3333-4333-8333-333333333333', 'bbbb1111-1111-4111-8111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO event_registrations (event_id, user_id, status)
VALUES ('dddd1111-1111-4111-8111-111111111111', 'aaaa2222-2222-4222-8222-222222222222', 'registered')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Opportunities: one of each type, from one table
-- ---------------------------------------------------------------------------

INSERT INTO opportunities (id, company_id, title, description, type, location, deadline, status, created_by)
VALUES
  ('eeee1111-1111-4111-8111-111111111111', 'bbbb1111-1111-4111-8111-111111111111',
   'Head pastry chef', 'Lead the pastry section across two waterfront venues.',
   'job', 'Lisbon, Portugal', now() + interval '21 days', 'open', 'aaaa3333-3333-4333-8333-333333333333'),
  ('eeee2222-2222-4222-8222-222222222222', 'bbbb1111-1111-4111-8111-111111111111',
   'Seasonal menu redesign', 'Six-week project to rebuild the autumn menu.',
   'project', 'Remote', now() + interval '14 days', 'open', 'aaaa3333-3333-4333-8333-333333333333'),
  ('eeee3333-3333-4333-8333-333333333333', 'bbbb2222-2222-4222-8222-222222222222',
   'Citrus supply for winter', 'Looking for growers who can commit to weekly deliveries.',
   'supplier_request', 'Faro, Portugal', now() + interval '45 days', 'open', 'aaaa4444-4444-4444-8444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- News: published by the platform, commented on by members
-- ---------------------------------------------------------------------------

INSERT INTO news_articles (id, title, slug, body, excerpt, author_id, status, published_at)
VALUES
  ('ffff1111-1111-4111-8111-111111111111', 'Seasonal produce report: autumn', 'seasonal-produce-report-autumn',
   'Growers across the region expect a short but intense citrus season...',
   'What kitchens should expect from the autumn harvest.',
   'aaaa1111-1111-4111-8111-111111111111', 'published', now() - interval '3 days'),
  ('ffff2222-2222-4222-8222-222222222222', 'Wage transparency in hospitality', 'wage-transparency-in-hospitality',
   'Several groups have begun publishing pay bands for floor roles...',
   'Pay bands are becoming a hiring advantage.',
   'aaaa1111-1111-4111-8111-111111111111', 'published', now() - interval '9 days'),
  ('ffff3333-3333-4333-8333-333333333333', 'Draft: kitchen energy costs', 'draft-kitchen-energy-costs',
   'Work in progress.', NULL, 'aaaa1111-1111-4111-8111-111111111111', 'draft', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO news_comments (id, article_id, user_id, body, status)
VALUES
  ('f1f1f1f1-1111-4111-8111-111111111111', 'ffff1111-1111-4111-8111-111111111111',
   'aaaa2222-2222-4222-8222-222222222222', 'The sourcing notes were genuinely useful, thank you.', 'visible'),
  ('f2f2f2f2-2222-4222-8222-222222222222', 'ffff1111-1111-4111-8111-111111111111',
   'aaaa3333-3333-4333-8333-333333333333', 'Any figures for the northern region?', 'visible')
ON CONFLICT (id) DO NOTHING;

INSERT INTO news_reactions (article_id, user_id, type)
VALUES
  ('ffff1111-1111-4111-8111-111111111111', 'aaaa2222-2222-4222-8222-222222222222', 'insightful'),
  ('ffff2222-2222-4222-8222-222222222222', 'aaaa3333-3333-4333-8333-333333333333', 'like')
ON CONFLICT (article_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------

INSERT INTO courses (id, title, description, instructor, duration_minutes, status, points_reward, published_at)
VALUES
  ('a1a1a1a1-1111-4111-8111-111111111111', 'Front of house service standards',
   'Service sequence, guest recovery and handover discipline.', 'Mariam Haddad', 95, 'published', 150, now() - interval '20 days'),
  ('a2a2a2a2-2222-4222-8222-222222222222', 'Costing a seasonal menu',
   'Build a menu that survives contact with your supplier invoices.', 'Tomas Brenner', 140, 'published', 200, now() - interval '5 days'),
  ('a3a3a3a3-3333-4333-8333-333333333333', 'Allergen handling refresher',
   'Draft content pending review.', 'Mariam Haddad', 45, 'draft', 80, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_enrollments (course_id, user_id, status)
VALUES ('a1a1a1a1-1111-4111-8111-111111111111', 'aaaa2222-2222-4222-8222-222222222222', 'enrolled')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Rewards
-- ---------------------------------------------------------------------------

INSERT INTO rewards (id, title, description, points_cost, stock, status, expires_at)
VALUES
  ('b1b1b1b1-1111-4111-8111-111111111111', 'Knife skills masterclass seat',
   'One seat at the monthly masterclass.', 500, 10, 'active', now() + interval '90 days'),
  ('b2b2b2b2-2222-4222-8222-222222222222', 'Back Of House apron',
   'Heavyweight canvas, two pockets.', 250, 40, 'active', NULL),
  ('b3b3b3b3-3333-4333-8333-333333333333', 'Supplier showcase fast pass',
   'Skip the queue at the winter showcase.', 900, 0, 'sold_out', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Points: written through the ledger function, never by direct balance writes
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM points_transactions WHERE user_id = 'aaaa2222-2222-4222-8222-222222222222'
  ) THEN
    PERFORM award_points(
      'aaaa2222-2222-4222-8222-222222222222', 800, 'admin_adjustment',
      'admin_adjustment', 'aaaa1111-1111-4111-8111-111111111111', 'Seed balance for development'
    );
    PERFORM award_points(
      'aaaa3333-3333-4333-8333-333333333333', 300, 'admin_adjustment',
      'admin_adjustment', 'aaaa1111-1111-4111-8111-111111111111', 'Seed balance for development'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

INSERT INTO notifications (id, user_id, type, title, body)
VALUES
  ('c1c1c1c1-1111-4111-8111-111111111111', 'aaaa2222-2222-4222-8222-222222222222',
   'success', 'You are registered', 'See you at the winter supplier showcase.'),
  ('c2c2c2c2-2222-4222-8222-222222222222', 'aaaa2222-2222-4222-8222-222222222222',
   'info', 'New article published', 'Seasonal produce report: autumn is now live.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
