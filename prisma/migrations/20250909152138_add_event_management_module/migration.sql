-- CreateEnum
CREATE TYPE "public"."ExerciseStatus" AS ENUM ('approved', 'pending_approval');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('SCALE', 'QUESTIONNAIRE', 'FUNCTIONAL_TEST', 'MEASUREMENT');

-- CreateEnum
CREATE TYPE "public"."FinancialTransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."AutomationType" AS ENUM ('NPS', 'BIRTHDAY', 'INACTIVITY_REMINDER', 'APPOINTMENT_REMINDER', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('corrida', 'workshop', 'palestra', 'campanha', 'atendimento');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('draft', 'published', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."EventRegistrationStatus" AS ENUM ('pending', 'confirmed', 'attended', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."CheckInMethod" AS ENUM ('qr', 'manual');

-- CreateEnum
CREATE TYPE "public"."EventProviderStatus" AS ENUM ('applied', 'confirmed', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."EventResourceType" AS ENUM ('sala', 'equipamento', 'material');

-- CreateEnum
CREATE TYPE "public"."EventResourceStatus" AS ENUM ('requested', 'confirmed', 'unavailable');

-- CreateEnum
CREATE TYPE "public"."EventCertificateType" AS ENUM ('participation', 'collaboration');

-- CreateEnum
CREATE TYPE "public"."CommunicationChannel" AS ENUM ('email', 'sms', 'whatsapp', 'push');

-- CreateTable
CREATE TABLE "public"."pathologies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "symptoms" TEXT[],
    "causes" TEXT[],
    "icd10_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pathologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "body_parts" TEXT[],
    "difficulty" SMALLINT NOT NULL,
    "equipment" TEXT[],
    "instructions" TEXT[],
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "duration" INTEGER,
    "indications" TEXT[],
    "contraindications" TEXT[],
    "modifications" JSONB,
    "status" "public"."ExerciseStatus" NOT NULL DEFAULT 'pending_approval',
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_protocols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pathology_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "objectives" TEXT[],
    "contraindications" TEXT[],
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_protocol_exercises" (
    "id" TEXT NOT NULL,
    "protocol_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order" SMALLINT NOT NULL,
    "sets" SMALLINT,
    "repetitions" TEXT,
    "rest_time" TEXT,
    "resistance_level" TEXT,
    "progression_criteria" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_protocol_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."standardized_assessments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AssessmentType" NOT NULL,
    "category" TEXT NOT NULL,
    "json_fields" JSONB NOT NULL,
    "scoring_rules" JSONB NOT NULL,
    "norm_values" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standardized_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assessment_results" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "responses" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "interpretation" TEXT,
    "notes" TEXT,
    "evaluated_by" TEXT NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_transactions" (
    "id" TEXT NOT NULL,
    "type" "public"."FinancialTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "patient_id" TEXT,
    "user_id" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professional_payouts" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marketing_automations" (
    "id" TEXT NOT NULL,
    "type" "public"."AutomationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "template_message" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "last_run" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "min_stock_level" INTEGER NOT NULL,
    "max_stock_level" INTEGER,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "location" TEXT,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_logs" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_type" "public"."EventType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(300),
    "address" TEXT,
    "capacity" INTEGER,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(10,2),
    "status" "public"."EventStatus" NOT NULL DEFAULT 'draft',
    "organizer_id" TEXT NOT NULL,
    "requires_registration" BOOLEAN NOT NULL DEFAULT true,
    "allows_providers" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_group" VARCHAR(500),
    "default_message" TEXT,
    "provider_rate" DECIMAL(10,2),
    "banner_url" VARCHAR(500),
    "images" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "cpf" VARCHAR(14),
    "birth_date" DATE,
    "address" TEXT,
    "instagram" VARCHAR(100),
    "status" "public"."EventRegistrationStatus" NOT NULL DEFAULT 'pending',
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qr_code" TEXT,
    "checked_in_at" TIMESTAMP(3),
    "checked_in_by_id" TEXT,
    "check_in_method" "public"."CheckInMethod",
    "check_in_location" VARCHAR(200),
    "admin_notes" TEXT,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_providers" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "professional_id" VARCHAR(50),
    "pix_key" VARCHAR(200),
    "hourly_rate" DECIMAL(10,2),
    "availability" JSONB,
    "status" "public"."EventProviderStatus" NOT NULL DEFAULT 'applied',
    "application_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "payment_amount" DECIMAL(10,2),
    "payment_date" TIMESTAMP(3),
    "payment_receipt" VARCHAR(500),
    "admin_notes" TEXT,

    CONSTRAINT "event_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_resources" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "resource_name" VARCHAR(200) NOT NULL,
    "resource_type" "public"."EventResourceType" NOT NULL,
    "quantity_needed" INTEGER,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" "public"."EventResourceStatus" NOT NULL DEFAULT 'requested',

    CONSTRAINT "event_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_certificates" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "registration_id" TEXT,
    "provider_id" TEXT,
    "certificate_type" "public"."EventCertificateType" NOT NULL,
    "certificate_code" VARCHAR(50) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_communications" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "campaign_name" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "public"."CommunicationChannel" NOT NULL,
    "target_audience" JSONB,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "recipients_count" INTEGER,
    "delivered_count" INTEGER,
    "opened_count" INTEGER,
    "clicked_count" INTEGER,

    CONSTRAINT "event_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pathologies_name_key" ON "public"."pathologies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_protocol_exercises_protocol_id_exercise_id_key" ON "public"."treatment_protocol_exercises"("protocol_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "standardized_assessments_name_key" ON "public"."standardized_assessments"("name");

-- CreateIndex
CREATE INDEX "assessment_results_patient_id_idx" ON "public"."assessment_results"("patient_id");

-- CreateIndex
CREATE INDEX "assessment_results_evaluated_at_idx" ON "public"."assessment_results"("evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "financial_transactions_date_idx" ON "public"."financial_transactions"("date" DESC);

-- CreateIndex
CREATE INDEX "financial_transactions_type_idx" ON "public"."financial_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "professional_payouts_professional_id_period_key" ON "public"."professional_payouts"("professional_id", "period");

-- CreateIndex
CREATE INDEX "inventory_logs_item_id_idx" ON "public"."inventory_logs"("item_id");

-- CreateIndex
CREATE INDEX "inventory_logs_created_at_idx" ON "public"."inventory_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "public"."events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "public"."events"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_qr_code_key" ON "public"."event_registrations"("qr_code");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "public"."event_registrations"("event_id");

-- CreateIndex
CREATE INDEX "event_registrations_email_idx" ON "public"."event_registrations"("email");

-- CreateIndex
CREATE INDEX "event_providers_event_id_idx" ON "public"."event_providers"("event_id");

-- CreateIndex
CREATE INDEX "event_providers_phone_idx" ON "public"."event_providers"("phone");

-- CreateIndex
CREATE INDEX "event_resources_event_id_idx" ON "public"."event_resources"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_registration_id_key" ON "public"."event_certificates"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_provider_id_key" ON "public"."event_certificates"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_certificate_code_key" ON "public"."event_certificates"("certificate_code");

-- CreateIndex
CREATE INDEX "event_certificates_event_id_idx" ON "public"."event_certificates"("event_id");

-- CreateIndex
CREATE INDEX "event_communications_event_id_idx" ON "public"."event_communications"("event_id");

-- AddForeignKey
ALTER TABLE "public"."treatment_protocols" ADD CONSTRAINT "treatment_protocols_pathology_id_fkey" FOREIGN KEY ("pathology_id") REFERENCES "public"."pathologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_protocol_exercises" ADD CONSTRAINT "treatment_protocol_exercises_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."treatment_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_protocol_exercises" ADD CONSTRAINT "treatment_protocol_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."standardized_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_results" ADD CONSTRAINT "assessment_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_results" ADD CONSTRAINT "assessment_results_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_payouts" ADD CONSTRAINT "professional_payouts_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_registrations" ADD CONSTRAINT "event_registrations_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_providers" ADD CONSTRAINT "event_providers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_resources" ADD CONSTRAINT "event_resources_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_certificates" ADD CONSTRAINT "event_certificates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_certificates" ADD CONSTRAINT "event_certificates_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."event_certificates" ADD CONSTRAINT "event_certificates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."event_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."event_communications" ADD CONSTRAINT "event_communications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
