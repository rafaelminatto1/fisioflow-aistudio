-- =============================================================================
-- FISIOFLOW - PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================
-- This migration adds strategic indexes to optimize common queries
-- Performance indexes for FisioFlow
-- =============================================================================

-- Drop existing indexes if they exist (for idempotency)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_patients_user_id;
DROP INDEX IF EXISTS idx_patients_status;
DROP INDEX IF EXISTS idx_patients_created_at;
DROP INDEX IF EXISTS idx_appointments_patient_id;
DROP INDEX IF EXISTS idx_appointments_user_id;
DROP INDEX IF EXISTS idx_appointments_date_time;
DROP INDEX IF EXISTS idx_appointments_status;
DROP INDEX IF EXISTS idx_appointments_type;
DROP INDEX IF EXISTS idx_appointments_date_status;
DROP INDEX IF EXISTS idx_appointments_user_date;
DROP INDEX IF EXISTS idx_pain_points_patient_id;
DROP INDEX IF EXISTS idx_pain_points_body_part;
DROP INDEX IF EXISTS idx_pain_points_pain_type;
DROP INDEX IF EXISTS idx_pain_points_created_at;
DROP INDEX IF EXISTS idx_metric_results_patient_id;
DROP INDEX IF EXISTS idx_metric_results_created_at;
DROP INDEX IF EXISTS idx_soap_notes_appointment_id;
DROP INDEX IF EXISTS idx_soap_notes_patient_id;
DROP INDEX IF EXISTS idx_soap_notes_created_at;
DROP INDEX IF EXISTS idx_communication_logs_patient_id;
DROP INDEX IF EXISTS idx_communication_logs_type;
DROP INDEX IF EXISTS idx_communication_logs_created_at;
DROP INDEX IF EXISTS idx_communication_logs_patient_type;

-- =============================================================================
-- USER TABLE INDEXES
-- =============================================================================

-- Email lookup (login, user search)
CREATE INDEX CONCURRENTLY idx_users_email 
ON "User" (email);

-- Role-based queries (admin dashboard, role filtering)
CREATE INDEX CONCURRENTLY idx_users_role 
ON "User" (role);

-- =============================================================================
-- PATIENT TABLE INDEXES
-- =============================================================================

-- Patient lookup by therapist (most common query)
CREATE INDEX CONCURRENTLY idx_patients_user_id 
ON "Patient" ("userId");

-- Patient status filtering (active/inactive patients)
CREATE INDEX CONCURRENTLY idx_patients_status 
ON "Patient" (status);

-- Patient creation date (recent patients, reports)
CREATE INDEX CONCURRENTLY idx_patients_created_at 
ON "Patient" ("createdAt" DESC);

-- =============================================================================
-- APPOINTMENT TABLE INDEXES
-- =============================================================================

-- Appointments by patient (patient history)
CREATE INDEX CONCURRENTLY idx_appointments_patient_id 
ON "Appointment" ("patientId");

-- Appointments by therapist (therapist schedule)
CREATE INDEX CONCURRENTLY idx_appointments_user_id 
ON "Appointment" ("userId");

-- Appointment date/time lookup (calendar view, scheduling)
CREATE INDEX CONCURRENTLY idx_appointments_date_time 
ON "Appointment" ("dateTime" DESC);

-- Appointment status filtering (pending, confirmed, completed)
CREATE INDEX CONCURRENTLY idx_appointments_status 
ON "Appointment" (status);

-- Appointment type filtering (consultation, therapy, follow-up)
CREATE INDEX CONCURRENTLY idx_appointments_type 
ON "Appointment" (type);

-- Composite index for date + status queries (dashboard, reports)
CREATE INDEX CONCURRENTLY idx_appointments_date_status 
ON "Appointment" ("dateTime" DESC, status);

-- Composite index for therapist + date queries (therapist calendar)
CREATE INDEX CONCURRENTLY idx_appointments_user_date 
ON "Appointment" ("userId", "dateTime" DESC);

-- =============================================================================
-- PAIN POINT TABLE INDEXES
-- =============================================================================

-- Pain points by patient (patient assessment)
CREATE INDEX CONCURRENTLY idx_pain_points_patient_id 
ON "PainPoint" ("patientId");

-- Body part filtering (body part analysis)
CREATE INDEX CONCURRENTLY idx_pain_points_body_part 
ON "PainPoint" ("bodyPart");

-- Pain type filtering (pain type analysis)
CREATE INDEX CONCURRENTLY idx_pain_points_pain_type 
ON "PainPoint" ("painType");

-- Pain point creation date (progress tracking)
CREATE INDEX CONCURRENTLY idx_pain_points_created_at 
ON "PainPoint" ("createdAt" DESC);

-- =============================================================================
-- METRIC RESULT TABLE INDEXES
-- =============================================================================

-- Metrics by patient (patient progress)
CREATE INDEX CONCURRENTLY idx_metric_results_patient_id 
ON "MetricResult" ("patientId");

-- Metric creation date (progress timeline)
CREATE INDEX CONCURRENTLY idx_metric_results_created_at 
ON "MetricResult" ("createdAt" DESC);

-- =============================================================================
-- SOAP NOTE TABLE INDEXES
-- =============================================================================

-- SOAP notes by appointment (appointment details)
CREATE INDEX CONCURRENTLY idx_soap_notes_appointment_id 
ON "SoapNote" ("appointmentId");

-- SOAP notes by patient (patient history)
CREATE INDEX CONCURRENTLY idx_soap_notes_patient_id 
ON "SoapNote" ("patientId");

-- SOAP note creation date (recent notes)
CREATE INDEX CONCURRENTLY idx_soap_notes_created_at 
ON "SoapNote" ("createdAt" DESC);

-- =============================================================================
-- COMMUNICATION LOG TABLE INDEXES
-- =============================================================================

-- Communication logs by patient (patient communication history)
CREATE INDEX CONCURRENTLY idx_communication_logs_patient_id 
ON "CommunicationLog" ("patientId");

-- Communication type filtering (WhatsApp, email, phone)
CREATE INDEX CONCURRENTLY idx_communication_logs_type 
ON "CommunicationLog" (type);

-- Communication log creation date (recent communications)
CREATE INDEX CONCURRENTLY idx_communication_logs_created_at 
ON "CommunicationLog" ("createdAt" DESC);

-- Composite index for patient + type queries (patient communication by type)
CREATE INDEX CONCURRENTLY idx_communication_logs_patient_type 
ON "CommunicationLog" ("patientId", type);

-- =============================================================================
-- FULL-TEXT SEARCH INDEXES (PostgreSQL specific)
-- =============================================================================

-- Patient name search (GIN index for full-text search)
CREATE INDEX CONCURRENTLY idx_patients_name_search 
ON "Patient" USING GIN (to_tsvector('portuguese', name));

-- Patient phone search (for quick patient lookup)
CREATE INDEX CONCURRENTLY idx_patients_phone 
ON "Patient" (phone) WHERE phone IS NOT NULL;

-- Patient email search
CREATE INDEX CONCURRENTLY idx_patients_email 
ON "Patient" (email) WHERE email IS NOT NULL;

-- SOAP note content search (for finding specific notes)
CREATE INDEX CONCURRENTLY idx_soap_notes_content_search 
ON "SoapNote" USING GIN (
  to_tsvector('portuguese', 
    COALESCE(subjective, '') || ' ' || 
    COALESCE(objective, '') || ' ' || 
    COALESCE(assessment, '') || ' ' || 
    COALESCE(plan, '')
  )
);

-- =============================================================================
-- PARTIAL INDEXES (for specific conditions)
-- =============================================================================

-- Active patients only (most queries filter by active status)
CREATE INDEX CONCURRENTLY idx_patients_active 
ON "Patient" ("userId", "createdAt" DESC) 
WHERE status = 'ACTIVE';

-- Future appointments only (scheduling queries)
CREATE INDEX CONCURRENTLY idx_appointments_future 
ON "Appointment" ("userId", "dateTime") 
WHERE "dateTime" > NOW();

-- Pending appointments (notifications, reminders)
CREATE INDEX CONCURRENTLY idx_appointments_pending 
ON "Appointment" ("dateTime") 
WHERE status = 'PENDING';

-- Recent pain points (last 30 days)
CREATE INDEX CONCURRENTLY idx_pain_points_recent 
ON "PainPoint" ("patientId", "createdAt" DESC) 
WHERE "createdAt" > (NOW() - INTERVAL '30 days');

-- =============================================================================
-- STATISTICS UPDATE
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE "User";
ANALYZE "Patient";
ANALYZE "Appointment";
ANALYZE "PainPoint";
ANALYZE "MetricResult";
ANALYZE "SoapNote";
ANALYZE "CommunicationLog";

-- =============================================================================
-- INDEX USAGE MONITORING
-- =============================================================================

-- Create a view to monitor index usage (for future optimization)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =============================================================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
    query_text text,
    calls bigint,
    total_time double precision,
    mean_time double precision,
    rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_statements.query,
        pg_stat_statements.calls,
        pg_stat_statements.total_exec_time,
        pg_stat_statements.mean_exec_time,
        pg_stat_statements.rows
    FROM pg_stat_statements
    WHERE pg_stat_statements.mean_exec_time > 100 -- queries taking more than 100ms
    ORDER BY pg_stat_statements.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'FisioFlow performance indexes created successfully!';
    RAISE NOTICE 'Total indexes created: 25+';
    RAISE NOTICE 'Monitoring views and functions created';
    RAISE NOTICE 'Run ANALYZE on tables to update statistics';
END $$;