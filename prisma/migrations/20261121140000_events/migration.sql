-- Phase 6B (events): events, registrations with a QR pass, check-ins (one per pass per
-- Riyadh day) and unmatched scans. New tables only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."event_type" AS ENUM ('CONFERENCE', 'WORKSHOP', 'NETWORKING', 'EXPO', 'CONCERT', 'FESTIVAL', 'MEETUP');

-- CreateEnum
CREATE TYPE "app"."event_status" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "app"."event_check_in_method" AS ENUM ('QR_SCAN', 'IMPORT');

-- CreateEnum
CREATE TYPE "app"."event_registration_status" AS ENUM ('REGISTERED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "app"."events" (
    "id" UUID NOT NULL,
    "status" "app"."event_status" NOT NULL DEFAULT 'DRAFT',
    "type" "app"."event_type" NOT NULL DEFAULT 'CONFERENCE',
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL DEFAULT '',
    "description_en" TEXT NOT NULL DEFAULT '',
    "description_ar" TEXT NOT NULL DEFAULT '',
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "map_url" TEXT,
    "organizer_company_id" UUID,
    "capacity" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "points_for_attendance" INTEGER NOT NULL,
    "check_in_method" "app"."event_check_in_method" NOT NULL DEFAULT 'QR_SCAN',
    "agenda" JSONB NOT NULL DEFAULT '[]',
    "speakers" JSONB NOT NULL DEFAULT '[]',
    "reminded_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."event_registrations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "app"."event_registration_status" NOT NULL DEFAULT 'REGISTERED',
    "pass_code" TEXT NOT NULL,
    "registered_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "attendance_verified_at" TIMESTAMPTZ(6),
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."event_check_ins" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL,
    "gate" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."event_unmatched_scans" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "pass_code" TEXT NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL,
    "gate" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_unmatched_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_events__status_starts_at" ON "app"."events"("status", "starts_at");

-- CreateIndex
CREATE INDEX "ix_event_registrations__user_registered_at" ON "app"."event_registrations"("user_id", "registered_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_event_registrations__event_user" ON "app"."event_registrations"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_event_registrations__pass_code" ON "app"."event_registrations"("pass_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_event_check_ins__registration_day" ON "app"."event_check_ins"("registration_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "uq_event_unmatched_scans__event_code_time" ON "app"."event_unmatched_scans"("event_id", "pass_code", "scanned_at");

-- AddForeignKey
ALTER TABLE "app"."events" ADD CONSTRAINT "fk_events__organizer_company_id" FOREIGN KEY ("organizer_company_id") REFERENCES "app"."companies"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."event_registrations" ADD CONSTRAINT "fk_event_registrations__event_id" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."event_registrations" ADD CONSTRAINT "fk_event_registrations__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."event_check_ins" ADD CONSTRAINT "fk_event_check_ins__registration_id" FOREIGN KEY ("registration_id") REFERENCES "app"."event_registrations"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."event_unmatched_scans" ADD CONSTRAINT "fk_event_unmatched_scans__event_id" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Checks the application relies on.
ALTER TABLE "app"."events"
  ADD CONSTRAINT ck_events__title_not_blank CHECK (btrim(title_en) <> ''),
  ADD CONSTRAINT ck_events__ends_after_start CHECK (ends_at > starts_at),
  ADD CONSTRAINT ck_events__capacity_positive CHECK (capacity IS NULL OR capacity > 0),
  ADD CONSTRAINT ck_events__points_not_negative CHECK (points_for_attendance >= 0),
  ADD CONSTRAINT ck_events__published_has_time CHECK (status = 'DRAFT' OR published_at IS NOT NULL),
  ADD CONSTRAINT ck_events__agenda_array CHECK (jsonb_typeof(agenda) = 'array'),
  ADD CONSTRAINT ck_events__speakers_array CHECK (jsonb_typeof(speakers) = 'array');

ALTER TABLE "app"."event_registrations"
  ADD CONSTRAINT ck_event_registrations__points_not_negative CHECK (points_awarded >= 0),
  ADD CONSTRAINT ck_event_registrations__attended_has_time
    CHECK (status <> 'ATTENDED' OR attendance_verified_at IS NOT NULL),
  ADD CONSTRAINT ck_event_registrations__cancelled_has_time CHECK (status <> 'CANCELLED' OR cancelled_at IS NOT NULL);

SELECT app.enable_rls('app.events');
SELECT app.enable_rls('app.event_registrations');
SELECT app.enable_rls('app.event_check_ins');
SELECT app.enable_rls('app.event_unmatched_scans');
