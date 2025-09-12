-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "properties" JSONB,
    "session_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Agendado',
    "value" DECIMAL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "series_id" TEXT,
    "session_number" INTEGER,
    "total_sessions" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "responses" JSONB NOT NULL,
    "score" REAL,
    "interpretation" TEXT,
    "notes" TEXT,
    "evaluated_by" TEXT NOT NULL,
    "evaluated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_results_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "assessment_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "standardized_assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" REAL NOT NULL,
    "unit" TEXT,
    "category" TEXT,
    "tags" JSONB,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "custom_metrics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_aggregations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "aggregation_type" TEXT NOT NULL,
    "total_value" REAL NOT NULL,
    "avg_value" REAL,
    "max_value" REAL,
    "min_value" REAL,
    "record_count" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "event_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "registration_id" TEXT,
    "provider_id" TEXT,
    "certificate_type" TEXT NOT NULL,
    "certificate_code" TEXT NOT NULL,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "event_certificates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_certificates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "event_providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "event_certificates_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_communications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "target_audience" JSONB,
    "scheduled_at" DATETIME,
    "sent_at" DATETIME,
    "recipients_count" INTEGER,
    "delivered_count" INTEGER,
    "opened_count" INTEGER,
    "clicked_count" INTEGER,
    CONSTRAINT "event_communications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "professional_id" TEXT,
    "pix_key" TEXT,
    "hourly_rate" DECIMAL,
    "availability" JSONB,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "application_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" DATETIME,
    "payment_amount" DECIMAL,
    "payment_date" DATETIME,
    "payment_receipt" TEXT,
    "admin_notes" TEXT,
    CONSTRAINT "event_providers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "birth_date" DATETIME,
    "address" TEXT,
    "instagram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "registration_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qr_code" TEXT,
    "checked_in_at" DATETIME,
    "checked_in_by_id" TEXT,
    "check_in_method" TEXT,
    "check_in_location" TEXT,
    "admin_notes" TEXT,
    CONSTRAINT "event_registrations_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "quantity_needed" INTEGER,
    "start_time" DATETIME,
    "end_time" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'requested',
    CONSTRAINT "event_resources_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "capacity" INTEGER,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizer_id" TEXT NOT NULL,
    "requires_registration" BOOLEAN NOT NULL DEFAULT true,
    "allows_providers" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_group" TEXT,
    "default_message" TEXT,
    "provider_rate" DECIMAL,
    "banner_url" TEXT,
    "images" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "body_parts" JSONB NOT NULL,
    "difficulty" TEXT,
    "equipment" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "duration" INTEGER,
    "indications" JSONB NOT NULL,
    "contraindications" JSONB NOT NULL,
    "modifications" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "author_id" TEXT,
    "therapeutic_goals" TEXT,
    "ai_categorized" BOOLEAN NOT NULL DEFAULT false,
    "ai_confidence" REAL,
    "ai_categorized_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "exercise_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exercise_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ai_analysis" TEXT,
    "reviewer_id" TEXT,
    "submitted_by" TEXT NOT NULL,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME,
    "comments" TEXT,
    "metadata" JSONB,
    CONSTRAINT "exercise_approvals_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exercise_approvals_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercise_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exercise_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "quality" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exercise_media_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "patient_id" TEXT,
    "user_id" TEXT NOT NULL,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "min_stock_level" INTEGER NOT NULL,
    "max_stock_level" INTEGER,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL,
    "location" TEXT,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_automations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "template_message" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "last_run" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "metric_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "measured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metric_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pain_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "x_position" REAL NOT NULL,
    "y_position" REAL NOT NULL,
    "intensity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "body_part" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pain_points_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pathologies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "symptoms" JSONB NOT NULL,
    "causes" JSONB NOT NULL,
    "icd10_code" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birth_date" DATETIME,
    "address" JSONB,
    "emergency_contact" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "last_visit" DATETIME,
    "allergies" TEXT,
    "medical_alerts" TEXT,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_consent" TEXT NOT NULL DEFAULT 'opt_out',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL DEFAULT 'cash',
    "description" TEXT,
    "due_date" DATETIME,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "professional_payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professional_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "base_amount" DECIMAL NOT NULL,
    "commission_rate" DECIMAL NOT NULL,
    "gross_amount" DECIMAL NOT NULL,
    "deductions" DECIMAL NOT NULL DEFAULT 0,
    "net_amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "professional_payouts_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "real_time_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metric_type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receipt_number" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "service_date" DATETIME NOT NULL,
    "payment_method" TEXT NOT NULL,
    "notes" TEXT,
    "items" JSONB,
    "issued_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "receipts_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "receipts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "duration" INTEGER,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "browser_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "soap_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "soap_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "standardized_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "json_fields" JSONB NOT NULL,
    "scoring_rules" JSONB NOT NULL,
    "norm_values" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "treatment_protocol_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocol_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "repetitions" TEXT,
    "rest_time" TEXT,
    "resistance_level" TEXT,
    "progression_criteria" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "treatment_protocol_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "treatment_protocol_exercises_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "treatment_protocols" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "treatment_protocols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pathology_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "contraindications" JSONB NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "treatment_protocols_pathology_id_fkey" FOREIGN KEY ("pathology_id") REFERENCES "pathologies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "whatsapp_message_id" TEXT,
    "error" TEXT,
    "sent_at" DATETIME NOT NULL,
    "delivered_at" DATETIME,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whatsapp_notification_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "appointment_reminder" BOOLEAN NOT NULL DEFAULT true,
    "appointment_confirmation" BOOLEAN NOT NULL DEFAULT true,
    "exercise_reminder" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_reminder" BOOLEAN NOT NULL DEFAULT false,
    "reminder_hours" INTEGER NOT NULL DEFAULT 24,
    "follow_up_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "telemedicine_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduled_start" DATETIME NOT NULL,
    "actual_start" DATETIME,
    "actual_end" DATETIME,
    "duration_minutes" INTEGER NOT NULL,
    "room_id" TEXT NOT NULL,
    "notes" TEXT,
    "session_notes" TEXT,
    "patient_feedback" TEXT,
    "technical_issues" JSONB NOT NULL,
    "recording_url" TEXT,
    "connection_quality" TEXT,
    "requires_recording" BOOLEAN NOT NULL DEFAULT false,
    "emergency_session" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "telemedicine_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "telemedicine_sessions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "telemedicine_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "device_info" JSONB,
    CONSTRAINT "telemedicine_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "telemedicine_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "telemedicine_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "telemedicine_chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" DATETIME,
    CONSTRAINT "telemedicine_chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "telemedicine_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "telemedicine_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "telemedicine_recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "recording_url" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "file_size_bytes" BIGINT,
    "recording_type" TEXT NOT NULL DEFAULT 'full_session',
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME NOT NULL,
    "processed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "telemedicine_recordings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "telemedicine_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "telemedicine_device_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "camera_working" BOOLEAN,
    "mic_working" BOOLEAN,
    "speakers_working" BOOLEAN,
    "bandwidth_mbps" REAL,
    "latency_ms" INTEGER,
    "browser_info" JSONB,
    "test_results" JSONB,
    "tested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "telemedicine_device_tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "analytics_events_category_idx" ON "analytics_events"("category");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "appointments_therapist_id_idx" ON "appointments"("therapist_id");

-- CreateIndex
CREATE INDEX "assessment_results_evaluated_at_idx" ON "assessment_results"("evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "assessment_results_patient_id_idx" ON "assessment_results"("patient_id");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "communication_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "communication_logs_patient_id_idx" ON "communication_logs"("patient_id");

-- CreateIndex
CREATE INDEX "custom_metrics_category_idx" ON "custom_metrics"("category");

-- CreateIndex
CREATE INDEX "custom_metrics_created_at_idx" ON "custom_metrics"("created_at" DESC);

-- CreateIndex
CREATE INDEX "custom_metrics_name_idx" ON "custom_metrics"("name");

-- CreateIndex
CREATE INDEX "daily_aggregations_aggregation_type_idx" ON "daily_aggregations"("aggregation_type");

-- CreateIndex
CREATE INDEX "daily_aggregations_date_idx" ON "daily_aggregations"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_aggregations_date_aggregation_type_key" ON "daily_aggregations"("date", "aggregation_type");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_registration_id_key" ON "event_certificates"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_provider_id_key" ON "event_certificates"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_certificate_code_key" ON "event_certificates"("certificate_code");

-- CreateIndex
CREATE INDEX "event_certificates_event_id_idx" ON "event_certificates"("event_id");

-- CreateIndex
CREATE INDEX "event_communications_event_id_idx" ON "event_communications"("event_id");

-- CreateIndex
CREATE INDEX "event_providers_event_id_idx" ON "event_providers"("event_id");

-- CreateIndex
CREATE INDEX "event_providers_phone_idx" ON "event_providers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_qr_code_key" ON "event_registrations"("qr_code");

-- CreateIndex
CREATE INDEX "event_registrations_email_idx" ON "event_registrations"("email");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE INDEX "event_resources_event_id_idx" ON "event_resources"("event_id");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "exercises"("category");

-- CreateIndex
CREATE INDEX "exercises_ai_categorized_idx" ON "exercises"("ai_categorized");

-- CreateIndex
CREATE INDEX "exercises_status_idx" ON "exercises"("status");

-- CreateIndex
CREATE INDEX "exercise_approvals_exercise_id_idx" ON "exercise_approvals"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_approvals_status_idx" ON "exercise_approvals"("status");

-- CreateIndex
CREATE INDEX "exercise_approvals_submitted_at_idx" ON "exercise_approvals"("submitted_at");

-- CreateIndex
CREATE INDEX "exercise_media_exercise_id_idx" ON "exercise_media"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_media_type_idx" ON "exercise_media"("type");

-- CreateIndex
CREATE INDEX "financial_transactions_date_idx" ON "financial_transactions"("date" DESC);

-- CreateIndex
CREATE INDEX "financial_transactions_type_idx" ON "financial_transactions"("type");

-- CreateIndex
CREATE INDEX "inventory_logs_created_at_idx" ON "inventory_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_logs_item_id_idx" ON "inventory_logs"("item_id");

-- CreateIndex
CREATE INDEX "metric_results_measured_at_idx" ON "metric_results"("measured_at" DESC);

-- CreateIndex
CREATE INDEX "metric_results_patient_id_idx" ON "metric_results"("patient_id");

-- CreateIndex
CREATE INDEX "pain_points_created_at_idx" ON "pain_points"("created_at" DESC);

-- CreateIndex
CREATE INDEX "pain_points_patient_id_idx" ON "pain_points"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "pathologies_name_key" ON "pathologies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "payments_patient_id_idx" ON "payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "professional_payouts_professional_id_period_key" ON "professional_payouts"("professional_id", "period");

-- CreateIndex
CREATE INDEX "real_time_metrics_metric_type_idx" ON "real_time_metrics"("metric_type");

-- CreateIndex
CREATE INDEX "real_time_metrics_timestamp_idx" ON "real_time_metrics"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_transaction_id_key" ON "receipts"("transaction_id");

-- CreateIndex
CREATE INDEX "receipts_patient_id_idx" ON "receipts"("patient_id");

-- CreateIndex
CREATE INDEX "receipts_receipt_number_idx" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_service_date_idx" ON "receipts"("service_date");

-- CreateIndex
CREATE INDEX "session_metrics_session_id_idx" ON "session_metrics"("session_id");

-- CreateIndex
CREATE INDEX "session_metrics_start_time_idx" ON "session_metrics"("start_time" DESC);

-- CreateIndex
CREATE INDEX "session_metrics_user_id_idx" ON "session_metrics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "standardized_assessments_name_key" ON "standardized_assessments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_protocol_exercises_protocol_id_exercise_id_key" ON "treatment_protocol_exercises"("protocol_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "whatsapp_logs_patient_id_idx" ON "whatsapp_logs"("patient_id");

-- CreateIndex
CREATE INDEX "whatsapp_logs_sent_at_idx" ON "whatsapp_logs"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_logs_status_idx" ON "whatsapp_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "telemedicine_sessions_room_id_key" ON "telemedicine_sessions"("room_id");

-- CreateIndex
CREATE INDEX "telemedicine_sessions_patient_id_idx" ON "telemedicine_sessions"("patient_id");

-- CreateIndex
CREATE INDEX "telemedicine_sessions_therapist_id_idx" ON "telemedicine_sessions"("therapist_id");

-- CreateIndex
CREATE INDEX "telemedicine_sessions_scheduled_start_idx" ON "telemedicine_sessions"("scheduled_start");

-- CreateIndex
CREATE INDEX "telemedicine_sessions_status_idx" ON "telemedicine_sessions"("status");

-- CreateIndex
CREATE INDEX "telemedicine_participants_session_id_idx" ON "telemedicine_participants"("session_id");

-- CreateIndex
CREATE INDEX "telemedicine_participants_user_id_idx" ON "telemedicine_participants"("user_id");

-- CreateIndex
CREATE INDEX "telemedicine_chat_messages_session_id_sent_at_idx" ON "telemedicine_chat_messages"("session_id", "sent_at");

-- CreateIndex
CREATE INDEX "telemedicine_chat_messages_sender_id_idx" ON "telemedicine_chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "telemedicine_recordings_session_id_idx" ON "telemedicine_recordings"("session_id");

-- CreateIndex
CREATE INDEX "telemedicine_recordings_status_idx" ON "telemedicine_recordings"("status");

-- CreateIndex
CREATE INDEX "telemedicine_device_tests_user_id_tested_at_idx" ON "telemedicine_device_tests"("user_id", "tested_at");
