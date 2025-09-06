-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'insurance');

-- CreateEnum
CREATE TYPE "AnalyticsEventCategory" AS ENUM ('USER_ACTION', 'SYSTEM_EVENT', 'PERFORMANCE', 'ERROR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RealTimeMetricType" AS ENUM ('ACTIVE_USERS', 'PAGE_VIEWS', 'SESSIONS', 'RESPONSE_TIME', 'ERROR_RATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DailyAggregationType" AS ENUM ('APPOINTMENTS', 'REVENUE', 'USERS', 'SESSIONS', 'PAGE_VIEWS', 'CUSTOM');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "category" "AnalyticsEventCategory" NOT NULL,
    "properties" JSONB,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_metrics" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "browser_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_time_metrics" (
    "id" TEXT NOT NULL,
    "metric_type" "RealTimeMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_time_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_aggregations" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "aggregation_type" "DailyAggregationType" NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL,
    "avg_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "min_value" DOUBLE PRECISION,
    "record_count" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_aggregations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "category" TEXT,
    "tags" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_patient_id_idx" ON "payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_category_idx" ON "analytics_events"("category");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "session_metrics_session_id_idx" ON "session_metrics"("session_id");

-- CreateIndex
CREATE INDEX "session_metrics_user_id_idx" ON "session_metrics"("user_id");

-- CreateIndex
CREATE INDEX "session_metrics_start_time_idx" ON "session_metrics"("start_time" DESC);

-- CreateIndex
CREATE INDEX "real_time_metrics_metric_type_idx" ON "real_time_metrics"("metric_type");

-- CreateIndex
CREATE INDEX "real_time_metrics_timestamp_idx" ON "real_time_metrics"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_aggregations_date_aggregation_type_key" ON "daily_aggregations"("date", "aggregation_type");

-- CreateIndex
CREATE INDEX "daily_aggregations_date_idx" ON "daily_aggregations"("date" DESC);

-- CreateIndex
CREATE INDEX "daily_aggregations_aggregation_type_idx" ON "daily_aggregations"("aggregation_type");

-- CreateIndex
CREATE INDEX "custom_metrics_name_idx" ON "custom_metrics"("name");

-- CreateIndex
CREATE INDEX "custom_metrics_category_idx" ON "custom_metrics"("category");

-- CreateIndex
CREATE INDEX "custom_metrics_created_at_idx" ON "custom_metrics"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_metrics" ADD CONSTRAINT "session_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_metrics" ADD CONSTRAINT "custom_metrics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;