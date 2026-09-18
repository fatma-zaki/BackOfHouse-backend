/*
# Create domain tables: events, event_registrations, opportunities

1. New Tables
- `events` — platform events with title, slug, description, organizer, location, dates, status, cover, capacity
- `event_registrations` — user registration for events (separate table, extensible)
- `opportunities` — flexible model for jobs/projects/supplier requests with type/status

2. Security
- RLS enabled on all tables
- Authenticated users can read published events/opportunities
- Users can register for events; can manage own registrations
- Users can create/update opportunities for their companies (company admin)
*/

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_type AS ENUM ('job', 'project', 'supplier_request');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM ('draft', 'open', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  organizer text NOT NULL,
  location text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  cover_image_url text,
  capacity integer,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_date_range CHECK (end_date >= start_date),
  CONSTRAINT events_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select"
ON events FOR SELECT
TO authenticated
USING (
  status IN ('published', 'cancelled', 'completed') OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = events.company_id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = events.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update"
ON events FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = events.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = events.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete"
ON events FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = events.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_event_registrations BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_registrations_select" ON event_registrations;
CREATE POLICY "event_registrations_select"
ON event_registrations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events e
    JOIN company_members cm ON cm.company_id = e.company_id
    WHERE e.id = event_registrations.event_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

DROP POLICY IF EXISTS "event_registrations_insert_own" ON event_registrations;
CREATE POLICY "event_registrations_insert_own"
ON event_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "event_registrations_update_own" ON event_registrations;
CREATE POLICY "event_registrations_update_own"
ON event_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "event_registrations_delete_own" ON event_registrations;
CREATE POLICY "event_registrations_delete_own"
ON event_registrations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type opportunity_type NOT NULL,
  location text,
  deadline timestamptz,
  status opportunity_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_opportunities BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunities_select" ON opportunities;
CREATE POLICY "opportunities_select"
ON opportunities FOR SELECT
TO authenticated
USING (
  status IN ('open', 'closed', 'archived') OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = opportunities.company_id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "opportunities_insert" ON opportunities;
CREATE POLICY "opportunities_insert"
ON opportunities FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "opportunities_update" ON opportunities;
CREATE POLICY "opportunities_update"
ON opportunities FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = opportunities.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = opportunities.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

DROP POLICY IF EXISTS "opportunities_delete" ON opportunities;
CREATE POLICY "opportunities_delete"
ON opportunities FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = opportunities.company_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);
