-- Phase 2B, member identity (ADR-003 amended, BQ-78, BQ-79, ADR-030): members and
-- Company Accounts, the company created at registration, phone sign-in codes, revoked
-- sessions and activity days. Additive only (expand step).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';


-- CreateEnum
CREATE TYPE "app"."company_type" AS ENUM ('EVENT_ORGANIZER', 'SUPPLIER', 'VENUE', 'PRODUCTION', 'AGENCY', 'SERVICE_PROVIDER', 'OTHER');

-- CreateEnum
CREATE TYPE "app"."company_status" AS ENUM ('DRAFT');

-- CreateEnum
CREATE TYPE "app"."account_type" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "app"."profile_status" AS ENUM ('PROFESSIONAL', 'STUDENT');

-- CreateEnum
CREATE TYPE "app"."user_status" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "app"."companies" (
    "id" UUID NOT NULL,
    "account_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company_type" "app"."company_type" NOT NULL,
    "status" "app"."company_status" NOT NULL DEFAULT 'DRAFT',
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."users" (
    "id" UUID NOT NULL,
    "account_type" "app"."account_type" NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "profile_status" "app"."profile_status",
    "status" "app"."user_status" NOT NULL DEFAULT 'ACTIVE',
    "suspended_at" TIMESTAMPTZ(6),
    "last_sign_in_at" TIMESTAMPTZ(6),
    "last_active_at" TIMESTAMPTZ(6),
    "sessions_revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."phone_sign_in_codes" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "user_id" UUID,
    "code_hash" TEXT,
    "ip_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "closed_at" TIMESTAMPTZ(6),
    "close_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_sign_in_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."revoked_member_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "revoked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "revoked_member_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "app"."user_activity_days" (
    "user_id" UUID NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "user_activity_days_pkey" PRIMARY KEY ("user_id","day")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_companies__account_user_id" ON "app"."companies"("account_user_id");

-- CreateIndex
CREATE INDEX "ix_users__status" ON "app"."users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users__email" ON "app"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users__phone" ON "app"."users"("phone");

-- CreateIndex
CREATE INDEX "ix_phone_sign_in_codes__phone_created_at" ON "app"."phone_sign_in_codes"("phone", "created_at");

-- CreateIndex
CREATE INDEX "ix_phone_sign_in_codes__ip_hash_created_at" ON "app"."phone_sign_in_codes"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "ix_phone_sign_in_codes__user_id" ON "app"."phone_sign_in_codes"("user_id");

-- CreateIndex
CREATE INDEX "ix_revoked_member_sessions__expires_at" ON "app"."revoked_member_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "ix_user_activity_days__day" ON "app"."user_activity_days"("day");

-- AddForeignKey
ALTER TABLE "app"."companies" ADD CONSTRAINT "fk_companies__account_user_id" FOREIGN KEY ("account_user_id") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."phone_sign_in_codes" ADD CONSTRAINT "fk_phone_sign_in_codes__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."user_activity_days" ADD CONSTRAINT "fk_user_activity_days__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- ---------------------------------------------------------------------------
-- Constraints Prisma's schema language cannot express (ADR-002)
-- ---------------------------------------------------------------------------
ALTER TABLE app.users
  ADD CONSTRAINT ck_users__email_lowercase CHECK (email = lower(email)),
  ADD CONSTRAINT ck_users__email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT ck_users__phone_e164 CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$'),
  ADD CONSTRAINT ck_users__full_name_not_blank CHECK (btrim(full_name) <> ''),
  -- BQ-79: profile status belongs to individuals only, and every individual has one.
  ADD CONSTRAINT ck_users__profile_status_individual_only
    CHECK ((account_type = 'INDIVIDUAL') = (profile_status IS NOT NULL)),
  ADD CONSTRAINT ck_users__suspended_has_timestamp CHECK (status <> 'SUSPENDED' OR suspended_at IS NOT NULL);

ALTER TABLE app.companies
  ADD CONSTRAINT ck_companies__name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE app.phone_sign_in_codes
  ADD CONSTRAINT ck_phone_sign_in_codes__phone_e164 CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  -- A code is generated only for an existing account.
  ADD CONSTRAINT ck_phone_sign_in_codes__code_needs_user CHECK (code_hash IS NULL OR user_id IS NOT NULL),
  ADD CONSTRAINT ck_phone_sign_in_codes__attempts_not_negative CHECK (attempts >= 0),
  ADD CONSTRAINT ck_phone_sign_in_codes__close_reason
    CHECK ((closed_at IS NULL) = (close_reason IS NULL)
      AND (close_reason IS NULL OR close_reason IN ('USED', 'REPLACED', 'EXPIRED', 'BURNED'))),
  ADD CONSTRAINT ck_phone_sign_in_codes__expires_after_created CHECK (expires_at > created_at);

-- ---------------------------------------------------------------------------
-- RLS backstop: enabled, no policies (supabase-architecture.md §6)
-- ---------------------------------------------------------------------------
SELECT app.enable_rls('app.users');
SELECT app.enable_rls('app.companies');
SELECT app.enable_rls('app.phone_sign_in_codes');
SELECT app.enable_rls('app.revoked_member_sessions');
SELECT app.enable_rls('app.user_activity_days');
