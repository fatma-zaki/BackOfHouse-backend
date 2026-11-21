-- Phase 6A (points): the append-only points ledger, the balance projection and the earning
-- rules (BQ-76, BQ-77). New tables only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."point_entry_type" AS ENUM ('EVENT_ATTENDANCE', 'VOLUNTEER_SHIFT', 'PROFILE_COMPLETED', 'REFERRAL', 'WORKSHOP_ATTENDANCE', 'REWARD_REDEMPTION', 'MANUAL_ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "app"."earning_rule_key" AS ENUM ('EVENT_REGISTRATION', 'EVENT_ATTENDANCE', 'VOLUNTEER_SHIFT', 'PROFILE_COMPLETED', 'REFERRAL_ATTENDED');

-- CreateEnum
CREATE TYPE "app"."point_adjustment_reason" AS ENUM ('ATTENDANCE_NOT_RECORDED', 'VOLUNTEER_SHIFT_MISSING', 'GOODWILL', 'CORRECTION', 'OTHER');

-- CreateTable
CREATE TABLE "app"."point_ledger" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "app"."point_entry_type" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "reason" "app"."point_adjustment_reason",
    "note" TEXT,
    "created_by_staff_id" UUID,
    "idempotency_key" TEXT NOT NULL,
    "reverses_entry_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."point_balances" (
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_spent" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "point_balances_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app"."earning_rules" (
    "key" "app"."earning_rule_key" NOT NULL,
    "points" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit_note" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_staff_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "earning_rules_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ix_point_ledger__user_created_at" ON "app"."point_ledger"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ix_point_ledger__created_at" ON "app"."point_ledger"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_point_ledger__idempotency_key" ON "app"."point_ledger"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_point_ledger__reverses_entry_id" ON "app"."point_ledger"("reverses_entry_id");

-- AddForeignKey
ALTER TABLE "app"."point_ledger" ADD CONSTRAINT "fk_point_ledger__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."point_ledger" ADD CONSTRAINT "fk_point_ledger__created_by_staff_id" FOREIGN KEY ("created_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."point_balances" ADD CONSTRAINT "fk_point_balances__user_id" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."earning_rules" ADD CONSTRAINT "fk_earning_rules__updated_by_staff_id" FOREIGN KEY ("updated_by_staff_id") REFERENCES "app"."staff_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Checks the application relies on.
ALTER TABLE "app"."point_ledger"
  ADD CONSTRAINT ck_point_ledger__amount_not_zero CHECK (amount <> 0),
  ADD CONSTRAINT ck_point_ledger__title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT ck_point_ledger__adjustment_has_reason
    CHECK (type <> 'MANUAL_ADJUSTMENT' OR (reason IS NOT NULL AND note IS NOT NULL AND created_by_staff_id IS NOT NULL)),
  ADD CONSTRAINT ck_point_ledger__redemption_is_negative CHECK (type <> 'REWARD_REDEMPTION' OR amount < 0),
  ADD CONSTRAINT ck_point_ledger__reversal_names_entry CHECK ((type = 'REVERSAL') = (reverses_entry_id IS NOT NULL));

ALTER TABLE "app"."point_balances"
  ADD CONSTRAINT ck_point_balances__balance_not_negative CHECK (balance >= 0),
  ADD CONSTRAINT ck_point_balances__spent_not_negative CHECK (total_spent >= 0),
  ADD CONSTRAINT ck_point_balances__balance_is_earned_minus_spent CHECK (balance = total_earned - total_spent);

ALTER TABLE "app"."earning_rules"
  ADD CONSTRAINT ck_earning_rules__points_not_negative CHECK (points >= 0),
  ADD CONSTRAINT ck_earning_rules__registration_earns_nothing CHECK (key <> 'EVENT_REGISTRATION' OR points = 0);

-- Append-only ledger (points-architecture.md §3), as audit_logs (ADR-016).
CREATE TRIGGER point_ledger_immutable
  BEFORE UPDATE OR DELETE ON app.point_ledger
  FOR EACH ROW EXECUTE FUNCTION app.raise_immutable();

CREATE TRIGGER point_ledger_no_truncate
  BEFORE TRUNCATE ON app.point_ledger
  FOR EACH STATEMENT EXECUTE FUNCTION app.raise_immutable();

REVOKE UPDATE, DELETE, TRUNCATE ON app.point_ledger FROM boh_app;

-- Earning rules (BQ-77 seed values).
INSERT INTO "app"."earning_rules" (key, points, enabled, limit_note, locked, updated_at) VALUES
  ('EVENT_REGISTRATION', 0, true, 'Registering never earns points', true, now()),
  ('EVENT_ATTENDANCE', 150, true, 'Default; each event can set its own', false, now()),
  ('VOLUNTEER_SHIFT', 200, true, 'Per confirmed shift', false, now()),
  ('PROFILE_COMPLETED', 50, true, 'Once', false, now()),
  ('REFERRAL_ATTENDED', 50, true, 'Max 10 a month', false, now());

SELECT app.enable_rls('app.point_ledger');
SELECT app.enable_rls('app.point_balances');
SELECT app.enable_rls('app.earning_rules');
