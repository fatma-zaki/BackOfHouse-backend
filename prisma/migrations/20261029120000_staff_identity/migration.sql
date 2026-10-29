-- Phase 2A, staff identity (ADR-032): staff accounts, admin web sessions and pending
-- Google sign-ins. Additive only (expand step).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."staff_role" AS ENUM ('SUPER_ADMIN', 'REVIEWER', 'EDITOR', 'SUPPORT', 'ANALYST');

-- CreateEnum
CREATE TYPE "app"."staff_status" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "app"."staff_accounts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "app"."staff_role" NOT NULL,
    "status" "app"."staff_status" NOT NULL DEFAULT 'INVITED',
    "invited_by_staff_id" UUID,
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMPTZ(6),
    "last_sign_in_at" TIMESTAMPTZ(6),
    "last_active_at" TIMESTAMPTZ(6),
    "disabled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."admin_sessions" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "csrf_token_hash" TEXT NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoke_reason" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."admin_oidc_states" (
    "id" UUID NOT NULL,
    "state_hash" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "code_verifier" TEXT NOT NULL,
    "return_to" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_oidc_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_staff_accounts__role_status" ON "app"."staff_accounts"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_staff_accounts__email" ON "app"."staff_accounts"("email");

-- CreateIndex
CREATE INDEX "ix_admin_sessions__staff_id" ON "app"."admin_sessions"("staff_id");

-- CreateIndex
CREATE INDEX "ix_admin_sessions__expires_at" ON "app"."admin_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_admin_sessions__token_hash" ON "app"."admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "ix_admin_oidc_states__expires_at" ON "app"."admin_oidc_states"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_admin_oidc_states__state_hash" ON "app"."admin_oidc_states"("state_hash");

-- AddForeignKey
ALTER TABLE "app"."admin_sessions" ADD CONSTRAINT "fk_admin_sessions__staff_id" FOREIGN KEY ("staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- ---------------------------------------------------------------------------
-- Constraints Prisma's schema language cannot express (ADR-002)
-- ---------------------------------------------------------------------------
ALTER TABLE app.staff_accounts
  ADD CONSTRAINT ck_staff_accounts__email_lowercase CHECK (email = lower(email)),
  ADD CONSTRAINT ck_staff_accounts__email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT ck_staff_accounts__name_not_blank CHECK (btrim(name) <> ''),
  ADD CONSTRAINT ck_staff_accounts__active_was_activated CHECK (status <> 'ACTIVE' OR activated_at IS NOT NULL),
  ADD CONSTRAINT ck_staff_accounts__disabled_has_timestamp CHECK (status <> 'DISABLED' OR disabled_at IS NOT NULL);

ALTER TABLE app.admin_sessions
  ADD CONSTRAINT ck_admin_sessions__expires_after_created CHECK (expires_at > created_at),
  ADD CONSTRAINT ck_admin_sessions__revoked_has_reason CHECK (revoked_at IS NULL OR revoke_reason IS NOT NULL);

ALTER TABLE app.admin_oidc_states
  ADD CONSTRAINT ck_admin_oidc_states__return_to_relative CHECK (return_to ~ '^/([^/]|$)');

-- ---------------------------------------------------------------------------
-- RLS backstop: enabled, no policies (supabase-architecture.md §6)
-- ---------------------------------------------------------------------------
SELECT app.enable_rls('app.staff_accounts');
SELECT app.enable_rls('app.admin_sessions');
SELECT app.enable_rls('app.admin_oidc_states');
