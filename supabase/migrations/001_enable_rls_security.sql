-- Enable Row Level Security (RLS) for all tables
-- This migration sets up comprehensive security policies for the FisioFlow application

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Patient table
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Appointment table
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on PainPoint table
ALTER TABLE "PainPoint" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on MetricResult table
ALTER TABLE "MetricResult" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on SoapNote table
ALTER TABLE "SoapNote" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on CommunicationLog table
ALTER TABLE "CommunicationLog" ENABLE ROW LEVEL SECURITY;

-- Create security policies for User table
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins can view and manage all users
CREATE POLICY "Admins can view all users" ON "User"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage all users" ON "User"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Create security policies for Patient table
-- Physiotherapists can only see their own patients
CREATE POLICY "Physiotherapists can view own patients" ON "Patient"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND (role = 'PHYSIOTHERAPIST' AND id = "Patient"."physiotherapistId")
    )
  );

CREATE POLICY "Physiotherapists can manage own patients" ON "Patient"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND (role = 'PHYSIOTHERAPIST' AND id = "Patient"."physiotherapistId")
    )
  );

-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON "Patient"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Patients can update own data" ON "Patient"
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins can view and manage all patients
CREATE POLICY "Admins can view all patients" ON "Patient"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage all patients" ON "Patient"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Create security policies for Appointment table
-- Physiotherapists can only see appointments for their patients
CREATE POLICY "Physiotherapists can view own appointments" ON "Appointment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "Appointment"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

CREATE POLICY "Physiotherapists can manage own appointments" ON "Appointment"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "Appointment"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON "Appointment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "Appointment"."patientId" 
      AND p.id = auth.uid()::text
    )
  );

-- Admins can view and manage all appointments
CREATE POLICY "Admins can view all appointments" ON "Appointment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage all appointments" ON "Appointment"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Create security policies for PainPoint table
-- Only accessible by physiotherapists for their patients and patients themselves
CREATE POLICY "Physiotherapists can view patient pain points" ON "PainPoint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "PainPoint"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

CREATE POLICY "Physiotherapists can manage patient pain points" ON "PainPoint"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "PainPoint"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

-- Patients can view their own pain points
CREATE POLICY "Patients can view own pain points" ON "PainPoint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "PainPoint"."patientId" 
      AND p.id = auth.uid()::text
    )
  );

-- Create security policies for MetricResult table
CREATE POLICY "Physiotherapists can view patient metrics" ON "MetricResult"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "MetricResult"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

CREATE POLICY "Physiotherapists can manage patient metrics" ON "MetricResult"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "MetricResult"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

-- Patients can view their own metrics
CREATE POLICY "Patients can view own metrics" ON "MetricResult"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "MetricResult"."patientId" 
      AND p.id = auth.uid()::text
    )
  );

-- Create security policies for SoapNote table
CREATE POLICY "Physiotherapists can view patient soap notes" ON "SoapNote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "SoapNote"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

CREATE POLICY "Physiotherapists can manage patient soap notes" ON "SoapNote"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "SoapNote"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

-- Patients can view their own soap notes
CREATE POLICY "Patients can view own soap notes" ON "SoapNote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "SoapNote"."patientId" 
      AND p.id = auth.uid()::text
    )
  );

-- Create security policies for CommunicationLog table
CREATE POLICY "Physiotherapists can view patient communications" ON "CommunicationLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "CommunicationLog"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

CREATE POLICY "Physiotherapists can manage patient communications" ON "CommunicationLog"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE p.id = "CommunicationLog"."patientId" 
      AND p."physiotherapistId" = u.id
      AND u.role = 'PHYSIOTHERAPIST'
    )
  );

-- Patients can view their own communications
CREATE POLICY "Patients can view own communications" ON "CommunicationLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Patient" p
      WHERE p.id = "CommunicationLog"."patientId" 
      AND p.id = auth.uid()::text
    )
  );

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM "User" 
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is physiotherapist
CREATE OR REPLACE FUNCTION is_physiotherapist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'PHYSIOTHERAPIST';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user owns patient
CREATE OR REPLACE FUNCTION owns_patient(patient_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "Patient" 
    WHERE id = patient_id 
    AND "physiotherapistId" = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  action TEXT NOT NULL,
  "tableName" TEXT,
  "recordId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log
ALTER TABLE "SecurityAuditLog" ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON "SecurityAuditLog"
  FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON "SecurityAuditLog"
  FOR INSERT WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO "SecurityAuditLog" (
    "userId",
    action,
    "tableName",
    "recordId",
    metadata
  ) VALUES (
    auth.uid()::text,
    p_action,
    p_table_name,
    p_record_id,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Patient"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Appointment"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();