-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "whatsapp_message_id" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_notification_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "appointment_reminder" BOOLEAN NOT NULL DEFAULT true,
    "appointment_confirmation" BOOLEAN NOT NULL DEFAULT true,
    "exercise_reminder" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_reminder" BOOLEAN NOT NULL DEFAULT false,
    "reminder_hours" INTEGER NOT NULL DEFAULT 24,
    "follow_up_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_logs_patient_id_idx" ON "whatsapp_logs"("patient_id");

-- CreateIndex
CREATE INDEX "whatsapp_logs_sent_at_idx" ON "whatsapp_logs"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_logs_status_idx" ON "whatsapp_logs"("status");

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default notification settings
INSERT INTO "whatsapp_notification_settings" ("id", "updated_at") VALUES (1, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;