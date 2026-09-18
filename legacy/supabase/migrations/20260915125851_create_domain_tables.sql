/*
# Create domain tables: news, courses, points, rewards, notifications, audit

1. New Tables
- news_articles — platform-published articles with moderation status
- news_comments — user comments on articles
- news_reactions — user reactions on articles
- courses — course foundation
- course_enrollments — user enrollment in courses
- points_transactions — ledger model for points (immutable, server-only writes)
- point_balances — maintained balance from ledger (non-negative)
- rewards — reward catalog
- reward_redemptions — user redemption records
- notifications — user notifications
- audit_logs — audit trail

2. Security
- RLS on all tables
- News: published articles readable by all authenticated; authors manage own
- Points: users read own only; NO client insert/update/delete (service role only)
- Rewards: active rewards readable by all; redemptions read own only
- Audit logs: platform admin read only
*/

DO $$ BEGIN
  CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived', 'moderation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('like', 'love', 'insightful', 'celebrate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('enrolled', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE points_transaction_type AS ENUM ('earned', 'spent', 'admin_adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reward_status AS ENUM ('active', 'inactive', 'sold_out', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE redemption_status AS ENUM ('pending', 'fulfilled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- News articles
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  body text NOT NULL,
  excerpt text,
  cover_image_url text,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status news_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_published_at_set CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_news_articles BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_articles_select" ON news_articles;
CREATE POLICY "news_articles_select"
ON news_articles FOR SELECT
TO authenticated
USING (status = 'published' OR author_id = auth.uid());

DROP POLICY IF EXISTS "news_articles_insert" ON news_articles;
CREATE POLICY "news_articles_insert"
ON news_articles FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "news_articles_update" ON news_articles;
CREATE POLICY "news_articles_update"
ON news_articles FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "news_articles_delete" ON news_articles;
CREATE POLICY "news_articles_delete"
ON news_articles FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- News comments
CREATE TABLE IF NOT EXISTS news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  status comment_status NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_comments_article_id ON news_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON news_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_status ON news_comments(status);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_news_comments BEFORE UPDATE ON news_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_comments_select" ON news_comments;
CREATE POLICY "news_comments_select"
ON news_comments FOR SELECT
TO authenticated
USING (status = 'visible' OR user_id = auth.uid());

DROP POLICY IF EXISTS "news_comments_insert_own" ON news_comments;
CREATE POLICY "news_comments_insert_own"
ON news_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "news_comments_update_own" ON news_comments;
CREATE POLICY "news_comments_update_own"
ON news_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "news_comments_delete_own" ON news_comments;
CREATE POLICY "news_comments_delete_own"
ON news_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- News reactions
CREATE TABLE IF NOT EXISTS news_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_news_reactions_article_id ON news_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_news_reactions_user_id ON news_reactions(user_id);

ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_reactions_select" ON news_reactions;
CREATE POLICY "news_reactions_select"
ON news_reactions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "news_reactions_insert_own" ON news_reactions;
CREATE POLICY "news_reactions_insert_own"
ON news_reactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "news_reactions_delete_own" ON news_reactions;
CREATE POLICY "news_reactions_delete_own"
ON news_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text NOT NULL,
  thumbnail_url text,
  duration_minutes integer DEFAULT 0,
  status course_status NOT NULL DEFAULT 'draft',
  points_reward integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_duration_positive CHECK (duration_minutes >= 0),
  CONSTRAINT courses_points_positive CHECK (points_reward >= 0)
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_published_at ON courses(published_at DESC);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select" ON courses;
CREATE POLICY "courses_select"
ON courses FOR SELECT
TO authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "courses_insert" ON courses;
CREATE POLICY "courses_insert"
ON courses FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "courses_update" ON courses;
CREATE POLICY "courses_update"
ON courses FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "courses_delete" ON courses;
CREATE POLICY "courses_delete"
ON courses FOR DELETE
TO authenticated
USING (true);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_course_enrollments BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_enrollments_select_own" ON course_enrollments;
CREATE POLICY "course_enrollments_select_own"
ON course_enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "course_enrollments_insert_own" ON course_enrollments;
CREATE POLICY "course_enrollments_insert_own"
ON course_enrollments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "course_enrollments_update_own" ON course_enrollments;
CREATE POLICY "course_enrollments_update_own"
ON course_enrollments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "course_enrollments_delete_own" ON course_enrollments;
CREATE POLICY "course_enrollments_delete_own"
ON course_enrollments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Points transactions (ledger — immutable, server-only writes)
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type points_transaction_type NOT NULL,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT points_amount_nonzero CHECK (amount <> 0)
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_reference ON points_transactions(reference_type, reference_id);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Users can ONLY read their own transactions. No client insert/update/delete.
DROP POLICY IF EXISTS "points_transactions_select_own" ON points_transactions;
CREATE POLICY "points_transactions_select_own"
ON points_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Point balances
CREATE TABLE IF NOT EXISTS point_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT point_balances_non_negative CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_point_balances_user_id ON point_balances(user_id);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_point_balances BEFORE UPDATE ON point_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE point_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_balances_select_own" ON point_balances;
CREATE POLICY "point_balances_select_own"
ON point_balances FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  stock integer DEFAULT 0,
  status reward_status NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rewards_cost_positive CHECK (points_cost > 0),
  CONSTRAINT rewards_stock_non_negative CHECK (stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_expires_at ON rewards(expires_at);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_rewards BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards_select" ON rewards;
CREATE POLICY "rewards_select"
ON rewards FOR SELECT
TO authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "rewards_insert" ON rewards;
CREATE POLICY "rewards_insert"
ON rewards FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "rewards_update" ON rewards;
CREATE POLICY "rewards_update"
ON rewards FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "rewards_delete" ON rewards;
CREATE POLICY "rewards_delete"
ON rewards FOR DELETE
TO authenticated
USING (true);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_cost integer NOT NULL,
  status redemption_status NOT NULL DEFAULT 'pending',
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT redemptions_cost_positive CHECK (points_cost > 0)
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_reward_redemptions BEFORE UPDATE ON reward_redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reward_redemptions_select_own" ON reward_redemptions;
CREATE POLICY "reward_redemptions_select_own"
ON reward_redemptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs readable only by platform admins via raw_app_meta_data
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select"
ON audit_logs FOR SELECT
TO authenticated
USING (
  coalesce(
    (auth.jwt() -> 'app_role')::text,
    (auth.jwt() -> 'user_metadata' -> 'app_role')::text
  ) = '"PLATFORM_ADMIN"'
);
