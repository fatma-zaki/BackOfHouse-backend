-- Phase 3b: verification requests and their documents (individuals), and staff
-- notifications for the admin bell. Additive only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."verification_request_status" AS ENUM ('DRAFT', 'IN_REVIEW');

-- CreateEnum
CREATE TYPE "app"."verification_document_type" AS ENUM ('IDENTITY', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "app"."staff_notifications" (
    "id" UUID NOT NULL,
    "recipient_staff_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "source_event_id" UUID NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."verification_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "app"."verification_request_status" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."verification_documents" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "document" "app"."verification_document_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_staff_notifications__recipient_created" ON "app"."staff_notifications"("recipient_staff_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_staff_notifications__source_event_recipient_type" ON "app"."staff_notifications"("source_event_id", "recipient_staff_id", "type");

-- CreateIndex
CREATE INDEX "ix_verification_requests__status_submitted_at" ON "app"."verification_requests"("status", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_verification_requests__user_id" ON "app"."verification_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_verification_documents__request_document" ON "app"."verification_documents"("request_id", "document");

-- AddForeignKey
ALTER TABLE "app"."staff_notifications" ADD CONSTRAINT "fk_staff_notifications__recipient_staff_id" FOREIGN KEY ("recipient_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."verification_requests" ADD CONSTRAINT "fk_verification_requests__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."verification_documents" ADD CONSTRAINT "fk_verification_documents__request_id" FOREIGN KEY ("request_id") REFERENCES "app"."verification_requests"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma.
ALTER TABLE "app"."verification_requests"
  ADD CONSTRAINT ck_verification_requests__submitted_has_timestamp
    CHECK ((status = 'DRAFT') = (submitted_at IS NULL));

ALTER TABLE "app"."verification_documents"
  ADD CONSTRAINT ck_verification_documents__size_range CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  ADD CONSTRAINT ck_verification_documents__content_type
    CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  ADD CONSTRAINT ck_verification_documents__sha256 CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT ck_verification_documents__file_name_not_blank CHECK (btrim(file_name) <> '');

ALTER TABLE "app"."staff_notifications"
  ADD CONSTRAINT ck_staff_notifications__type_format CHECK (type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  ADD CONSTRAINT ck_staff_notifications__payload_object CHECK (jsonb_typeof(payload) = 'object');

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.verification_requests');
SELECT app.enable_rls('app.verification_documents');
SELECT app.enable_rls('app.staff_notifications');
