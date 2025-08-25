-- =====================================================
-- Neon DB Row Level Security (RLS) Configuration
-- =====================================================
-- This script sets up comprehensive RLS policies for the FisioFlow application
-- ensuring data isolation and security at the database level.

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PainPoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetricResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SoapNote" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER TABLE POLICIES
-- =====================================================

-- Users can only see and modify their own profile
CREATE POLICY "users_own_profile" ON "User"
  FOR ALL
  USING (id = current_setting('app.current_user_id')::text)
  WITH CHECK (id = current_setting('app.current_user_id')::text);

-- Admins can see all users
CREATE POLICY "admin_all_users" ON "User"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- =====================================================
-- PATIENT TABLE POLICIES
-- =====================================================

-- Physiotherapists can only see their own patients
CREATE POLICY "physio_own_patients" ON "Patient"
  FOR ALL
  USING (
    "createdBy" = current_setting('app.current_user_id')::text
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    "createdBy" = current_setting('app.current_user_id')::text
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Patients can only see their own record
CREATE POLICY "patient_own_record" ON "Patient"
  FOR SELECT
  USING (
    email = current_setting('app.current_user_email')::text
    AND EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.email = current_setting('app.current_user_email')::text 
      AND u.role = 'PATIENT'
    )
  );

-- =====================================================
-- APPOINTMENT TABLE POLICIES
-- =====================================================

-- Physiotherapists can see appointments for their patients
CREATE POLICY "physio_patient_appointments" ON "Appointment"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "Appointment"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "Appointment"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Patients can see their own appointments
CREATE POLICY "patient_own_appointments" ON "Appointment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "Appointment"."patientId" 
      AND p.email = current_setting('app.current_user_email')::text
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.email = current_setting('app.current_user_email')::text 
        AND u.role = 'PATIENT'
      )
    )
  );

-- =====================================================
-- PAIN POINT TABLE POLICIES
-- =====================================================

-- Physiotherapists can manage pain points for their patients
CREATE POLICY "physio_patient_pain_points" ON "PainPoint"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "PainPoint"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "PainPoint"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Patients can view their own pain points
CREATE POLICY "patient_own_pain_points" ON "PainPoint"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "PainPoint"."patientId" 
      AND p.email = current_setting('app.current_user_email')::text
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.email = current_setting('app.current_user_email')::text 
        AND u.role = 'PATIENT'
      )
    )
  );

-- =====================================================
-- METRIC RESULT TABLE POLICIES
-- =====================================================

-- Physiotherapists can manage metrics for their patients
CREATE POLICY "physio_patient_metrics" ON "MetricResult"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "MetricResult"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "MetricResult"."patientId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Patients can view their own metrics
CREATE POLICY "patient_own_metrics" ON "MetricResult"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Patient" p 
      WHERE p.id = "MetricResult"."patientId" 
      AND p.email = current_setting('app.current_user_email')::text
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.email = current_setting('app.current_user_email')::text 
        AND u.role = 'PATIENT'
      )
    )
  );

-- =====================================================
-- SOAP NOTE TABLE POLICIES
-- =====================================================

-- Physiotherapists can manage SOAP notes for their patients
CREATE POLICY "physio_patient_soap_notes" ON "SoapNote"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      JOIN "Patient" p ON p.id = a."patientId"
      WHERE a.id = "SoapNote"."appointmentId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      JOIN "Patient" p ON p.id = a."patientId"
      WHERE a.id = "SoapNote"."appointmentId" 
      AND p."createdBy" = current_setting('app.current_user_id')::text
    )
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Patients can view SOAP notes from their appointments
CREATE POLICY "patient_own_soap_notes" ON "SoapNote"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      JOIN "Patient" p ON p.id = a."patientId"
      WHERE a.id = "SoapNote"."appointmentId" 
      AND p.email = current_setting('app.current_user_email')::text
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.email = current_setting('app.current_user_email')::text 
        AND u.role = 'PATIENT'
      )
    )
  );

-- =====================================================
-- UTILITY FUNCTIONS FOR RLS
-- =====================================================

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user(user_id text, user_email text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
  IF user_email IS NOT NULL THEN
    PERFORM set_config('app.current_user_email', user_email, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear current user context
CREATE OR REPLACE FUNCTION clear_current_user()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', '', true);
  PERFORM set_config('app.current_user_email', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM "User" 
  WHERE id = current_setting('app.current_user_id', true);
  
  RETURN COALESCE(user_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT TRIGGERS FOR SECURITY MONITORING
-- =====================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id SERIAL PRIMARY KEY,
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id text,
  user_role text,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Only admins can see audit logs
CREATE POLICY "admin_audit_logs" ON "AuditLog"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = current_setting('app.current_user_id')::text 
      AND u.role = 'ADMIN'
    )
  );

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  INSERT INTO "AuditLog" (
    table_name,
    operation,
    user_id,
    user_role,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    current_setting('app.current_user_id', true),
    get_current_user_role(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all tables
CREATE TRIGGER audit_user_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Patient"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Appointment"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_pain_point_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "PainPoint"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_metric_result_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "MetricResult"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_soap_note_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "SoapNote"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- SECURITY VIEWS FOR MONITORING
-- =====================================================

-- View for monitoring RLS policy usage
CREATE OR REPLACE VIEW rls_policy_stats AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- View for monitoring user access patterns
CREATE OR REPLACE VIEW user_access_summary AS
SELECT 
  user_id,
  user_role,
  table_name,
  operation,
  COUNT(*) as operation_count,
  MAX(timestamp) as last_access
FROM "AuditLog"
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, user_role, table_name, operation
ORDER BY operation_count DESC;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION set_current_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- Grant select permissions on security views to admins only
GRANT SELECT ON rls_policy_stats TO authenticated;
GRANT SELECT ON user_access_summary TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE "AuditLog" IS 'Audit trail for all data modifications with RLS enforcement';
COMMENT ON FUNCTION set_current_user(text, text) IS 'Sets the current user context for RLS policies';
COMMENT ON FUNCTION clear_current_user() IS 'Clears the current user context';
COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the current user';
COMMENT ON VIEW rls_policy_stats IS 'Overview of all RLS policies in the database';
COMMENT ON VIEW user_access_summary IS 'Summary of user access patterns for security monitoring';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Patient', 'Appointment', 'PainPoint', 'MetricResult', 'SoapNote')
ORDER BY tablename;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

PRINT 'RLS setup completed successfully!';
PRINT 'Remember to:';
PRINT '1. Set user context using set_current_user() before database operations';
PRINT '2. Clear user context using clear_current_user() after operations';
PRINT '3. Monitor audit logs regularly for security compliance';
PRINT '4. Review RLS policies periodically for effectiveness';