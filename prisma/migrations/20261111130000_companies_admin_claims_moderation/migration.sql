-- Phase 4B: the company back office (slug, featured order, source, who verified), page
-- claims, and moderation cases with their reports. Additive only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."company_source" AS ENUM ('SIGNUP', 'IMPORT');

-- CreateEnum
CREATE TYPE "app"."claim_status" AS ENUM ('OPEN', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "app"."claim_evidence" AS ENUM ('DOMAIN_MATCH', 'NEEDS_DOCUMENTS', 'DOCUMENTS_PROVIDED');

-- CreateEnum
CREATE TYPE "app"."moderation_target_type" AS ENUM ('USER', 'COMPANY', 'COMPANY_PROJECT', 'PROFILE_PROJECT');

-- CreateEnum
CREATE TYPE "app"."moderation_source" AS ENUM ('MEMBERS', 'AUTO_FILTER');

-- CreateEnum
CREATE TYPE "app"."moderation_status" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "app"."moderation_resolution" AS ENUM ('DISMISSED', 'WARNED', 'CONTENT_REMOVED', 'ACCOUNT_SUSPENDED');

-- AlterTable
ALTER TABLE "app"."companies" ADD COLUMN     "featured_order" INTEGER,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" "app"."company_source" NOT NULL DEFAULT 'SIGNUP',
ADD COLUMN     "verified_by_staff_id" UUID;

-- CreateTable
CREATE TABLE "app"."page_claims" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "claimant_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "evidence" "app"."claim_evidence" NOT NULL,
    "status" "app"."claim_status" NOT NULL DEFAULT 'OPEN',
    "decision_message" TEXT,
    "decided_by_staff_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."moderation_cases" (
    "id" UUID NOT NULL,
    "target_type" "app"."moderation_target_type" NOT NULL,
    "target_id" UUID NOT NULL,
    "owner_user_id" UUID,
    "source" "app"."moderation_source" NOT NULL,
    "status" "app"."moderation_status" NOT NULL DEFAULT 'OPEN',
    "resolution" "app"."moderation_resolution",
    "resolution_message" TEXT,
    "resolved_by_staff_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."moderation_reports" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);


-- Existing companies get a slug: the name's Latin letters and digits, then the id prefix
-- (the app writes the same with companySlug()).
UPDATE "app"."companies"
SET slug = btrim(lower(regexp_replace(name, '[^A-Za-z0-9]+', '-', 'g')) || '-' || left(id::text, 8), '-');
UPDATE "app"."companies" SET slug = 'company-' || left(id::text, 8) WHERE slug = left(id::text, 8);

-- CreateIndex
CREATE INDEX "ix_page_claims__status_created_at" ON "app"."page_claims"("status", "created_at");

-- CreateIndex
CREATE INDEX "ix_page_claims__company_id" ON "app"."page_claims"("company_id");

-- CreateIndex
CREATE INDEX "ix_moderation_cases__status_created_at" ON "app"."moderation_cases"("status", "created_at");

-- CreateIndex
CREATE INDEX "ix_moderation_cases__target" ON "app"."moderation_cases"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "ix_moderation_cases__owner_user_id" ON "app"."moderation_cases"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_moderation_reports__case_reporter" ON "app"."moderation_reports"("case_id", "reporter_user_id");

-- companies exists already, but nothing has launched and it is small, so a short lock is
-- fine. CONCURRENTLY cannot run in Prisma's migration transaction.
-- squawk-ignore require-concurrent-index-creation
CREATE UNIQUE INDEX "uq_companies__slug" ON "app"."companies"("slug");

-- AddForeignKey
ALTER TABLE "app"."companies" ADD CONSTRAINT "fk_companies__verified_by_staff_id" FOREIGN KEY ("verified_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;

-- AddForeignKey
ALTER TABLE "app"."page_claims" ADD CONSTRAINT "fk_page_claims__company_id" FOREIGN KEY ("company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."page_claims" ADD CONSTRAINT "fk_page_claims__claimant_user_id" FOREIGN KEY ("claimant_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."page_claims" ADD CONSTRAINT "fk_page_claims__decided_by_staff_id" FOREIGN KEY ("decided_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."moderation_cases" ADD CONSTRAINT "fk_moderation_cases__owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "app"."users"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."moderation_cases" ADD CONSTRAINT "fk_moderation_cases__resolved_by_staff_id" FOREIGN KEY ("resolved_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."moderation_reports" ADD CONSTRAINT "fk_moderation_reports__case_id" FOREIGN KEY ("case_id") REFERENCES "app"."moderation_cases"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."moderation_reports" ADD CONSTRAINT "fk_moderation_reports__reporter_user_id" FOREIGN KEY ("reporter_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma. companies is an existing table: NOT VALID
-- CHECKs (no scan under a write lock) that still apply to every insert and update.
ALTER TABLE "app"."companies"
  ADD CONSTRAINT ck_companies__slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') NOT VALID,
  ADD CONSTRAINT ck_companies__featured_order_positive CHECK (featured_order IS NULL OR featured_order > 0) NOT VALID,
  ADD CONSTRAINT ck_companies__featured_order_needs_pick CHECK (featured_order IS NULL OR editors_pick) NOT VALID;

ALTER TABLE "app"."page_claims"
  ADD CONSTRAINT ck_page_claims__email_lowercase CHECK (email = lower(email)),
  ADD CONSTRAINT ck_page_claims__decided_together
    CHECK ((status = 'OPEN') = (decided_at IS NULL) AND (decided_at IS NULL) = (decided_by_staff_id IS NULL));

ALTER TABLE "app"."moderation_cases"
  ADD CONSTRAINT ck_moderation_cases__resolved_together
    CHECK ((status = 'OPEN') = (resolved_at IS NULL) AND (status = 'OPEN') = (resolution IS NULL));

ALTER TABLE "app"."moderation_reports"
  ADD CONSTRAINT ck_moderation_reports__reason
    CHECK (reason IN ('SPAM', 'SCAM', 'FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER')),
  ADD CONSTRAINT ck_moderation_reports__details_length CHECK (details IS NULL OR char_length(details) <= 2000);

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.page_claims');
SELECT app.enable_rls('app.moderation_cases');
SELECT app.enable_rls('app.moderation_reports');
