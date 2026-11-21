-- Phase 5C (supplier responses): a company's response to another company's supplier
-- request. A new table only.

-- Never wait long for a lock or run away on a busy database (squawk rules).
SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- CreateEnum
CREATE TYPE "app"."supplier_response_status" AS ENUM ('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'SELECTED', 'REJECTED');

-- CreateTable
CREATE TABLE "app"."supplier_responses" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "responder_company_id" UUID NOT NULL,
    "status" "app"."supplier_response_status" NOT NULL DEFAULT 'SUBMITTED',
    "message" TEXT NOT NULL,
    "proposed_price" TEXT,
    "setup_time" TEXT,
    "projects" JSONB NOT NULL DEFAULT '[]',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL,
    "status_changed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_supplier_responses__responder_updated_at" ON "app"."supplier_responses"("responder_company_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "ix_supplier_responses__request_updated_at" ON "app"."supplier_responses"("request_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_supplier_responses__request_responder" ON "app"."supplier_responses"("request_id", "responder_company_id");

-- AddForeignKey
ALTER TABLE "app"."supplier_responses" ADD CONSTRAINT "fk_supplier_responses__request_id" FOREIGN KEY ("request_id") REFERENCES "app"."opportunities"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "app"."supplier_responses" ADD CONSTRAINT "fk_supplier_responses__responder_company_id" FOREIGN KEY ("responder_company_id") REFERENCES "app"."companies"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- Checks the application relies on.
ALTER TABLE "app"."supplier_responses"
  ADD CONSTRAINT ck_supplier_responses__message_length
    CHECK (char_length(message) BETWEEN 1 AND 1000),
  ADD CONSTRAINT ck_supplier_responses__price_length
    CHECK (proposed_price IS NULL OR char_length(proposed_price) <= 200),
  ADD CONSTRAINT ck_supplier_responses__setup_time_length
    CHECK (setup_time IS NULL OR char_length(setup_time) <= 200),
  ADD CONSTRAINT ck_supplier_responses__projects_array CHECK (jsonb_typeof(projects) = 'array');

SELECT app.enable_rls('app.supplier_responses');
