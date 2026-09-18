-- =============================================================================
-- Stage 2 · Database foundation (backend-development-order.md)
--   * extensions in the `extensions` schema
--   * private `app` schema (not exposed by the Supabase Data API, ADR-007)
--   * helper functions: raise_immutable(), enable_rls(), normalize_ar()
--   * least-privilege runtime role `boh_app`
-- Stage 3 · Platform tables: audit_logs (append-only), outbox_events
--
-- Hand-written sections sit around the DDL generated from prisma/schema
-- (`prisma migrate diff`), as database-design-rules.md and ADR-002 require.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions (supabase-architecture.md §10)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "app";

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Attached as a BEFORE UPDATE/DELETE/TRUNCATE trigger on append-only tables.
-- Defence in depth on top of the revoked privileges (security-and-audit.md §4.1).
CREATE OR REPLACE FUNCTION app.raise_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'table %.% is append-only; % is not allowed', TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- Enables RLS with no policies: deny-all for every role without BYPASSRLS
-- (the Supabase anon/authenticated roles). Every app table calls this.
CREATE OR REPLACE FUNCTION app.enable_rls(target regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
END;
$$;

-- Arabic/Latin search normalisation (database-design-rules.md §13, ADR-012):
-- alef and hamza forms, alef maksura and ta marbuta unified; tashkeel and
-- tatweel removed; Latin accents removed; lower-cased; whitespace collapsed.
-- The TypeScript twin is src/common/text/normalize-arabic.ts; both are tested
-- against the same fixtures.
CREATE OR REPLACE FUNCTION app.normalize_ar(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT btrim(
    regexp_replace(
      lower(
        extensions.unaccent(
          'extensions.unaccent'::regdictionary,
          regexp_replace(
            translate(input, 'أإآٱؤئىة', 'ااااوييه'),
            '[\u064B-\u0652\u0670\u0640]', '', 'g'
          )
        )
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables (generated from prisma/schema by prisma migrate diff)
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "app"."audit_actor_type" AS ENUM ('USER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "app"."outbox_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "app"."audit_logs" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" "app"."audit_actor_type" NOT NULL,
    "actor_user_id" UUID,
    "actor_platform_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organization_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "changes" JSONB,
    "reason" TEXT,
    "request_id" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."outbox_events" (
    "id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "app"."outbox_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_audit_logs__entity_type_entity_id_occurred_at" ON "app"."audit_logs"("entity_type", "entity_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "ix_audit_logs__actor_user_id_occurred_at" ON "app"."audit_logs"("actor_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "ix_audit_logs__organization_id_occurred_at" ON "app"."audit_logs"("organization_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "ix_audit_logs__action_occurred_at" ON "app"."audit_logs"("action", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "ix_outbox_events__status_available_at" ON "app"."outbox_events"("status", "available_at");


-- ---------------------------------------------------------------------------
-- Constraints Prisma's schema language cannot express (ADR-002)
-- ---------------------------------------------------------------------------

-- Arrays are NOT NULL by rule (database-design-rules.md §12). Expressed as a
-- CHECK so Prisma's diff does not report drift on the column.
ALTER TABLE app.audit_logs
  ADD CONSTRAINT ck_audit_logs__actor_platform_roles_not_null CHECK (actor_platform_roles IS NOT NULL),
  -- Only SYSTEM actions have no acting user (database-entities.md §12).
  ADD CONSTRAINT ck_audit_logs__actor_user_required CHECK (actor_type = 'SYSTEM' OR actor_user_id IS NOT NULL),
  ADD CONSTRAINT ck_audit_logs__action_not_blank CHECK (btrim(action) <> ''),
  ADD CONSTRAINT ck_audit_logs__request_id_not_blank CHECK (btrim(request_id) <> '');

ALTER TABLE app.outbox_events
  ADD CONSTRAINT ck_outbox_events__attempts_not_negative CHECK (attempts >= 0),
  ADD CONSTRAINT ck_outbox_events__processed_has_timestamp CHECK (status <> 'PROCESSED' OR processed_at IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Append-only enforcement for audit_logs (ADR-016)
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON app.audit_logs
  FOR EACH ROW EXECUTE FUNCTION app.raise_immutable();

CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON app.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION app.raise_immutable();

-- ---------------------------------------------------------------------------
-- RLS backstop: enabled, no policies (supabase-architecture.md §6)
-- ---------------------------------------------------------------------------
SELECT app.enable_rls('app.audit_logs');
SELECT app.enable_rls('app.outbox_events');

-- ---------------------------------------------------------------------------
-- Runtime role `boh_app` (supabase-architecture.md §3.2)
--
-- Created WITHOUT a password. An operator enables login once per environment:
--   ALTER ROLE boh_app WITH LOGIN PASSWORD '<from the secrets manager>';
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'boh_app') THEN
    CREATE ROLE boh_app NOLOGIN;
  END IF;
END
$$;

-- BYPASSRLS lets the app read its own tables while RLS denies Supabase client
-- roles. Granting it needs a privileged migration role; if the current role
-- cannot, the app fails closed (RLS denies it) and the warning says what to run.
DO $$
BEGIN
  ALTER ROLE boh_app BYPASSRLS;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE WARNING 'Could not grant BYPASSRLS to boh_app. Run as a privileged role: ALTER ROLE boh_app BYPASSRLS;';
END
$$;

ALTER ROLE boh_app SET search_path = app, extensions;
ALTER ROLE boh_app SET statement_timeout = '15s';

GRANT USAGE ON SCHEMA app TO boh_app;
GRANT USAGE ON SCHEMA extensions TO boh_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO boh_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO boh_app;
GRANT EXECUTE ON FUNCTION app.normalize_ar(text) TO boh_app;

-- Tables created by later migrations (run as the same owner) inherit these.
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO boh_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO boh_app;

-- Append-only tables: INSERT and SELECT only.
REVOKE UPDATE, DELETE, TRUNCATE ON app.audit_logs FROM boh_app;

-- ---------------------------------------------------------------------------
-- Supabase client roles get nothing in `app` (supabase-architecture.md §3.2).
-- Guarded so the migration also runs on plain Postgres (CI, local harness).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA app FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app FROM %I', client_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM %I', client_role);
    END IF;
  END LOOP;
END
$$;
