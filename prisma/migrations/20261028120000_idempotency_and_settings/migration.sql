-- Phase 1 foundations (docs/execution-plan.md): Idempotency-Key replay store and
-- platform settings. Additive only (expand step); no existing table changes.

-- Never wait long for a lock or run away on a busy database (database-design-rules.md,
-- squawk require-lock-timeout / require-statement-timeout).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."idempotency_status" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "app"."idempotency_records" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" "app"."idempotency_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "response_status" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by_staff_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ix_idempotency_records__expires_at" ON "app"."idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_idempotency_records__scope_idempotency_key" ON "app"."idempotency_records"("scope", "idempotency_key");


-- ---------------------------------------------------------------------------
-- Constraints Prisma's schema language cannot express (ADR-002)
-- ---------------------------------------------------------------------------
ALTER TABLE app.idempotency_records
  ADD CONSTRAINT ck_idempotency_records__key_length CHECK (char_length(idempotency_key) BETWEEN 1 AND 255),
  ADD CONSTRAINT ck_idempotency_records__completed_has_response
    CHECK (status <> 'COMPLETED' OR response_status IS NOT NULL),
  ADD CONSTRAINT ck_idempotency_records__expires_after_created CHECK (expires_at > created_at);

ALTER TABLE app.platform_settings
  ADD CONSTRAINT ck_platform_settings__key_format CHECK (key ~ '^[a-z][a-z0-9_]{0,63}$');

-- ---------------------------------------------------------------------------
-- RLS backstop: enabled, no policies (supabase-architecture.md §6). Grants to
-- boh_app come from the default privileges set by the foundation migration.
-- ---------------------------------------------------------------------------
SELECT app.enable_rls('app.idempotency_records');
SELECT app.enable_rls('app.platform_settings');
