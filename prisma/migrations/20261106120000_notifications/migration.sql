-- Phase 2C, notification delivery (nest-module-map.md §4.12): in-app notifications,
-- their push and email deliveries, per-member preferences and FCM device tokens, plus
-- the member's notification language. Additive only (expand step).

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."notification_channel" AS ENUM ('PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "app"."delivery_status" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "app"."device_platform" AS ENUM ('IOS', 'ANDROID');

-- AlterTable
ALTER TABLE "app"."users" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'ar';

-- CreateTable
CREATE TABLE "app"."notifications" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "source_event_id" UUID NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "target_type" TEXT,
    "target_id" TEXT,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "app"."notification_channel" NOT NULL,
    "status" "app"."delivery_status" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT,
    "provider_message_id" TEXT,
    "destination_masked" TEXT,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."notification_preferences" (
    "user_id" UUID NOT NULL,
    "notification_type" TEXT NOT NULL,
    "channel" "app"."notification_channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id","notification_type","channel")
);

-- CreateTable
CREATE TABLE "app"."member_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "app"."device_platform" NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_notifications__recipient_read_created" ON "app"."notifications"("recipient_user_id", "read_at", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_notifications__source_event_recipient_type" ON "app"."notifications"("source_event_id", "recipient_user_id", "type");

-- CreateIndex
CREATE INDEX "ix_notification_deliveries__status_next_attempt_at" ON "app"."notification_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_notification_deliveries__notification_channel" ON "app"."notification_deliveries"("notification_id", "channel");

-- CreateIndex
CREATE INDEX "ix_member_devices__user_id" ON "app"."member_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_member_devices__token" ON "app"."member_devices"("token");

-- AddForeignKey
ALTER TABLE "app"."notifications" ADD CONSTRAINT "fk_notifications__recipient_user_id" FOREIGN KEY ("recipient_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."notification_deliveries" ADD CONSTRAINT "fk_notification_deliveries__notification_id" FOREIGN KEY ("notification_id") REFERENCES "app"."notifications"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."notification_preferences" ADD CONSTRAINT "fk_notification_preferences__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."member_devices" ADD CONSTRAINT "fk_member_devices__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Rules the schema cannot express in Prisma. users is an existing table, so its CHECK is
-- NOT VALID (no scan under a write lock). It still applies to every insert and update,
-- and existing rows all hold the default 'ar'.
ALTER TABLE "app"."users"
  ADD CONSTRAINT ck_users__locale CHECK (locale IN ('en', 'ar')) NOT VALID;

ALTER TABLE "app"."notifications"
  ADD CONSTRAINT ck_notifications__type_format CHECK (type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  ADD CONSTRAINT ck_notifications__payload_object CHECK (jsonb_typeof(payload) = 'object'),
  ADD CONSTRAINT ck_notifications__target_id_needs_type CHECK (target_id IS NULL OR target_type IS NOT NULL);

ALTER TABLE "app"."notification_deliveries"
  ADD CONSTRAINT ck_notification_deliveries__attempts_not_negative CHECK (attempts >= 0),
  ADD CONSTRAINT ck_notification_deliveries__sent_has_details
    CHECK (status <> 'SENT' OR (sent_at IS NOT NULL AND destination_masked IS NOT NULL));

ALTER TABLE "app"."member_devices"
  ADD CONSTRAINT ck_member_devices__token_not_blank CHECK (btrim(token) <> '');

-- Deny by default to Supabase client roles (supabase-architecture.md §3).
SELECT app.enable_rls('app.notifications');
SELECT app.enable_rls('app.notification_deliveries');
SELECT app.enable_rls('app.notification_preferences');
SELECT app.enable_rls('app.member_devices');
