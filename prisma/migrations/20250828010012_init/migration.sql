-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Fisioterapeuta', 'Paciente', 'EducadorFisico');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('Avaliacao', 'Sessao', 'Retorno', 'Pilates', 'Urgente', 'Teleconsulta');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Agendado', 'Realizado', 'Concluido', 'Cancelado', 'Faltou');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('Active', 'Inactive', 'Discharged');

-- CreateEnum
CREATE TYPE "PainType" AS ENUM ('latejante', 'aguda', 'queimacao', 'formigamento', 'cansaco');

-- CreateEnum
CREATE TYPE "BodyPart" AS ENUM ('front', 'back');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('WhatsApp', 'Ligacao', 'Email', 'Outro');

-- CreateEnum
CREATE TYPE "WhatsAppConsent" AS ENUM ('opt_in', 'opt_out');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birth_date" TIMESTAMP(3),
    "address" JSONB,
    "emergency_contact" JSONB,
    "status" "PatientStatus" NOT NULL DEFAULT 'Active',
    "last_visit" TIMESTAMP(3),
    "allergies" TEXT,
    "medical_alerts" TEXT,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_consent" "WhatsAppConsent" NOT NULL DEFAULT 'opt_out',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Agendado',
    "value" DECIMAL(10,2),
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "series_id" TEXT,
    "session_number" INTEGER,
    "total_sessions" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pain_points" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "x_position" DOUBLE PRECISION NOT NULL,
    "y_position" DOUBLE PRECISION NOT NULL,
    "intensity" SMALLINT NOT NULL,
    "type" "PainType" NOT NULL,
    "description" TEXT,
    "body_part" "BodyPart" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pain_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_results" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soap_notes" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soap_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_therapist_id_idx" ON "appointments"("therapist_id");

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "pain_points_patient_id_idx" ON "pain_points"("patient_id");

-- CreateIndex
CREATE INDEX "pain_points_created_at_idx" ON "pain_points"("created_at" DESC);

-- CreateIndex
CREATE INDEX "metric_results_patient_id_idx" ON "metric_results"("patient_id");

-- CreateIndex
CREATE INDEX "metric_results_measured_at_idx" ON "metric_results"("measured_at" DESC);

-- CreateIndex
CREATE INDEX "communication_logs_patient_id_idx" ON "communication_logs"("patient_id");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "communication_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pain_points" ADD CONSTRAINT "pain_points_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
