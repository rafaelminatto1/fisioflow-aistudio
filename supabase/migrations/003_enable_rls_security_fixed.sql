-- Enable Row Level Security (RLS) for all tables
-- This migration sets up comprehensive security policies for the FisioFlow application
-- Using correct UUID types and proper auth functions

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on physiotherapists table
ALTER TABLE physiotherapists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on treatment_plans table
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on exercises table
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Enable RLS on exercise_logs table
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create security policies for users table
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create security policies for patients table
-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

-- Physiotherapists can view and manage their patients
CREATE POLICY "Physiotherapists can view own patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.user_id = auth.uid()
      AND patients.id IN (
        SELECT patient_id FROM appointments 
        WHERE physiotherapist_id = p.id
      )
    )
  );

CREATE POLICY "Physiotherapists can manage own patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.user_id = auth.uid()
      AND patients.id IN (
        SELECT patient_id FROM appointments 
        WHERE physiotherapist_id = p.id
      )
    )
  );

-- Create security policies for appointments table
-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = appointments.patient_id 
      AND p.user_id = auth.uid()
    )
  );

-- Physiotherapists can view and manage their appointments
CREATE POLICY "Physiotherapists can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.id = appointments.physiotherapist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Physiotherapists can manage own appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.id = appointments.physiotherapist_id
      AND p.user_id = auth.uid()
    )
  );

-- Create security policies for physiotherapists table
CREATE POLICY "Physiotherapists can view own profile" ON physiotherapists
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Physiotherapists can update own profile" ON physiotherapists
  FOR UPDATE USING (user_id = auth.uid());

-- Create security policies for treatment_plans table
CREATE POLICY "Physiotherapists can view patient treatment plans" ON treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.id = treatment_plans.physiotherapist_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Physiotherapists can manage patient treatment plans" ON treatment_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      WHERE p.id = treatment_plans.physiotherapist_id
      AND p.user_id = auth.uid()
    )
  );

-- Patients can view their own treatment plans
CREATE POLICY "Patients can view own treatment plans" ON treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = treatment_plans.patient_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create security policies for exercises table
-- Exercises are generally viewable by authenticated users
CREATE POLICY "Authenticated users can view exercises" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only users who created exercises can manage them
CREATE POLICY "Users can manage own exercises" ON exercises
  FOR ALL USING (created_by = auth.uid());

-- Create security policies for exercise_logs table
CREATE POLICY "Patients can view own exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = exercise_logs.patient_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can manage own exercise logs" ON exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = exercise_logs.patient_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Physiotherapists can view patient exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM physiotherapists pt
      JOIN patients p ON p.id = exercise_logs.patient_id
      WHERE pt.user_id = auth.uid()
      AND p.id IN (
        SELECT patient_id FROM appointments 
        WHERE physiotherapist_id = pt.id
      )
    )
  );

-- Create security policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create security policies for messages table
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (user_id = auth.uid());

-- Create security policies for files table
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload files" ON files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own files" ON files
  FOR ALL USING (user_id = auth.uid());

-- Create function to get current user role from users table
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT plan FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is physiotherapist
CREATE OR REPLACE FUNCTION is_physiotherapist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM physiotherapists
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is patient
CREATE OR REPLACE FUNCTION is_patient()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM patients
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon role for public access
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON exercises TO anon;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_logs
  FOR INSERT WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON security_audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
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
DROP TRIGGER IF EXISTS audit_user_changes ON users;
CREATE TRIGGER audit_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_patient_changes ON patients;
CREATE TRIGGER audit_patient_changes
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_appointment_changes ON appointments;
CREATE TRIGGER audit_appointment_changes
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_physiotherapist_changes ON physiotherapists;
CREATE TRIGGER audit_physiotherapist_changes
  AFTER INSERT OR UPDATE OR DELETE ON physiotherapists
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_treatment_plan_changes ON treatment_plans;
CREATE TRIGGER audit_treatment_plan_changes
  AFTER INSERT OR UPDATE OR DELETE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Grant permissions for the new audit table
GRANT SELECT ON security_audit_logs TO authenticated;
GRANT INSERT ON security_audit_logs TO authenticated;