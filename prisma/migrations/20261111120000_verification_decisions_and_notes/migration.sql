-- Phase 4A: verification decisions (approve, ask for more information, reject, remove) with
-- their history and review deadline, and internal staff notes on users and companies.
-- Additive only. Nothing has launched, and verification_requests is new and tiny, so short
-- locks on it are fine (CONCURRENTLY cannot run in Prisma's migration transaction).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."note_subject" AS ENUM ('USER', 'COMPANY');

-- CreateEnum
CREATE TYPE "app"."verification_action" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_INFO', 'REMOVE');

-- AlterEnum


ALTER TYPE "app"."verification_request_status" ADD VALUE 'MORE_INFO' AFTER 'IN_REVIEW';
ALTER TYPE "app"."verification_request_status" ADD VALUE 'APPROVED' AFTER 'MORE_INFO';
ALTER TYPE "app"."verification_request_status" ADD VALUE 'REJECTED' AFTER 'APPROVED';

-- DropIndex (small, pre-launch table; see the header)
-- squawk-ignore require-concurrent-index-deletion
DROP INDEX "app"."ix_verification_requests__status_submitted_at";

-- AlterTable
ALTER TABLE "app"."verification_requests" ADD COLUMN     "decided_at" TIMESTAMPTZ(6),
ADD COLUMN     "decided_by_staff_id" UUID,
ADD COLUMN     "decision_note" TEXT,
ADD COLUMN     "due_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "app"."staff_notes" (
    "id" UUID NOT NULL,
    "subject_type" "app"."note_subject" NOT NULL,
    "subject_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "author_staff_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."verification_decisions" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "action" "app"."verification_action" NOT NULL,
    "note" TEXT,
    "staff_id" UUID NOT NULL,
    "decided_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_staff_notes__subject_created" ON "app"."staff_notes"("subject_type", "subject_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ix_verification_decisions__request_decided_at" ON "app"."verification_decisions"("request_id", "decided_at");

-- CreateIndex (small, pre-launch table; see the header)
-- squawk-ignore require-concurrent-index-creation
CREATE INDEX "ix_verification_requests__status_due_at" ON "app"."verification_requests"("status", "due_at");

-- AddForeignKey
ALTER TABLE "app"."staff_notes" ADD CONSTRAINT "fk_staff_notes__author_staff_id" FOREIGN KEY ("author_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."verification_requests" ADD CONSTRAINT "fk_verification_requests__decided_by_staff_id" FOREIGN KEY ("decided_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;

-- AddForeignKey
ALTER TABLE "app"."verification_decisions" ADD CONSTRAINT "fk_verification_decisions__request_id" FOREIGN KEY ("request_id") REFERENCES "app"."verification_requests"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."verification_decisions" ADD CONSTRAINT "fk_verification_decisions__staff_id" FOREIGN KEY ("staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma.
ALTER TABLE "app"."verification_requests"
  ADD CONSTRAINT ck_verification_requests__decided_together
    CHECK ((decided_at IS NULL) = (decided_by_staff_id IS NULL)) NOT VALID,
  ADD CONSTRAINT ck_verification_requests__review_has_due_at
    CHECK (status = 'DRAFT' OR due_at IS NOT NULL) NOT VALID;

ALTER TABLE "app"."staff_notes"
  ADD CONSTRAINT ck_staff_notes__body_length CHECK (btrim(body) <> '' AND char_length(body) <= 4000);

-- Notes are append-only.
CREATE TRIGGER trg_staff_notes__immutable
  BEFORE UPDATE OR DELETE ON "app"."staff_notes"
  FOR EACH ROW EXECUTE FUNCTION app.raise_immutable();

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.verification_decisions');
SELECT app.enable_rls('app.staff_notes');
