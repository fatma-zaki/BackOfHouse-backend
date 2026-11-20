-- Phase 5A (opportunities): listings with review, revisions and automated checks, and the
-- review history. Moderation gets an OPPORTUNITY target and a snapshot of targets it cannot
-- read itself. New tables, plus additive changes to moderation_cases (small, pre-launch).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';
-- CreateEnum
CREATE TYPE "app"."opportunity_type" AS ENUM ('JOB', 'PROJECT', 'CO_OP', 'VOLUNTEERING', 'SUPPLIER_REQUEST');

-- CreateEnum
CREATE TYPE "app"."opportunity_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "app"."opportunity_revision_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "app"."employment_type" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE');

-- CreateEnum
CREATE TYPE "app"."work_setup" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "app"."opportunity_review_decision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "app"."moderation_target_type" ADD VALUE 'OPPORTUNITY' AFTER 'PROFILE_PROJECT';

-- AlterTable
ALTER TABLE "app"."moderation_cases" ADD COLUMN     "target_preview" TEXT,
ADD COLUMN     "target_title" TEXT;

-- CreateTable
CREATE TABLE "app"."opportunities" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "type" "app"."opportunity_type" NOT NULL,
    "status" "app"."opportunity_status" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "employment_type" "app"."employment_type",
    "compensation" TEXT,
    "duration" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supplier_types" "app"."company_type"[] DEFAULT ARRAY[]::"app"."company_type"[],
    "closes_at" TIMESTAMPTZ(6),
    "work_setup" "app"."work_setup",
    "reviewer_note" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "review_due_at" TIMESTAMPTZ(6),
    "sla_alerted_at" TIMESTAMPTZ(6),
    "resubmitted" BOOLEAN NOT NULL DEFAULT false,
    "auto_flagged" BOOLEAN NOT NULL DEFAULT false,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "revision_status" "app"."opportunity_revision_status",
    "revision_draft" JSONB,
    "revision_note" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "close_reason" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."opportunity_reviews" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "decision" "app"."opportunity_review_decision" NOT NULL,
    "revision" BOOLEAN NOT NULL DEFAULT false,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "message" TEXT,
    "staff_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_opportunities__status_published_at" ON "app"."opportunities"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "ix_opportunities__company_updated_at" ON "app"."opportunities"("company_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "ix_opportunities__status_review_due_at" ON "app"."opportunities"("status", "review_due_at");

-- CreateIndex
CREATE INDEX "ix_opportunities__revision_status_review_due_at" ON "app"."opportunities"("revision_status", "review_due_at");

-- CreateIndex
CREATE INDEX "ix_opportunity_reviews__opportunity_created_at" ON "app"."opportunity_reviews"("opportunity_id", "created_at");

-- AddForeignKey
ALTER TABLE "app"."opportunities" ADD CONSTRAINT "fk_opportunities__company_id" FOREIGN KEY ("company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."opportunity_reviews" ADD CONSTRAINT "fk_opportunity_reviews__opportunity_id" FOREIGN KEY ("opportunity_id") REFERENCES "app"."opportunities"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."opportunity_reviews" ADD CONSTRAINT "fk_opportunity_reviews__staff_id" FOREIGN KEY ("staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Checks the application relies on.
ALTER TABLE "app"."opportunities"
  ADD CONSTRAINT ck_opportunities__title_length CHECK (char_length(title) <= 120),
  ADD CONSTRAINT ck_opportunities__summary_length CHECK (char_length(summary) <= 200),
  ADD CONSTRAINT ck_opportunities__description_length CHECK (char_length(description) <= 5000),
  ADD CONSTRAINT ck_opportunities__views_not_negative CHECK (views >= 0),
  ADD CONSTRAINT ck_opportunities__checks_array CHECK (jsonb_typeof(checks) = 'array'),
  ADD CONSTRAINT ck_opportunities__review_has_times
    CHECK (status <> 'IN_REVIEW' OR (submitted_at IS NOT NULL AND review_due_at IS NOT NULL)),
  ADD CONSTRAINT ck_opportunities__published_has_time CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL),
  ADD CONSTRAINT ck_opportunities__revision_only_live
    CHECK (revision_status IS NULL OR (status = 'PUBLISHED' AND revision_draft IS NOT NULL)),
  ADD CONSTRAINT ck_opportunities__supplier_types_only_requests
    CHECK (type = 'SUPPLIER_REQUEST' OR cardinality(supplier_types) = 0);

ALTER TABLE "app"."opportunity_reviews"
  ADD CONSTRAINT ck_opportunity_reviews__message_when_not_approved
    CHECK (decision = 'APPROVED' OR (message IS NOT NULL AND btrim(message) <> ''));

SELECT app.enable_rls('app.opportunities');
SELECT app.enable_rls('app.opportunity_reviews');
