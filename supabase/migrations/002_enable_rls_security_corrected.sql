-- Enable Row Level Security (RLS) for all tables
-- This migration sets up comprehensive security policies for the FisioFlow application
-- Using correct table names from the existing database schema

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
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins can view and manage all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create security policies for patients table
-- Physiotherapists can only see their own patients
CREATE POLICY "Physiotherapists can view own patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      JOIN users u ON u.id = auth.uid()::text
      WHERE p.user_id = u.id
      AND patients.physiotherapist_id = p.id
    )
  );

CREATE POLICY "Physiotherapists can manage own patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM physiotherapists p
      JOIN users u ON u.id = auth.uid()::text
      WHERE p.user_id = u.id
      AND patients.physiotherapist_id = p.id
    )
  );

-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Admins can view and manage all patients
CREATE POLICY "Admins can view all patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create security policies for appointments table
-- Physiotherapists can only see appointments for their patients
CREATE POLICY "Physiotherapists can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.id = appointments.patient_id 
      AND u.id = auth.uid()::text
    )
  );

CREATE POLICY "Physiotherapists can manage own appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.id = appointments.patient_id 
      AND u.id = auth.uid()::text
    )
  );

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = appointments.patient_id 
      AND p.user_id = auth.uid()::text
    )
  );

-- Admins can view and manage all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create security policies for physiotherapists table
CREATE POLICY "Physiotherapists can view own profile" ON physiotherapists
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Physiotherapists can update own profile" ON physiotherapists
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Admins can view and manage all physiotherapists
CREATE POLICY "Admins can view all physiotherapists" ON physiotherapists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all physiotherapists" ON physiotherapists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create security policies for treatment_plans table
CREATE POLICY "Physiotherapists can view patient treatment plans" ON treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.id = treatment_plans.patient_id 
      AND u.id = auth.uid()::text
    )
  );

CREATE POLICY "Physiotherapists can manage patient treatment plans" ON treatment_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.id = treatment_plans.patient_id 
      AND u.id = auth.uid()::text
    )
  );

-- Patients can view their own treatment plans
CREATE POLICY "Patients can view own treatment plans" ON treatment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = treatment_plans.patient_id 
      AND p.user_id = auth.uid()::text
    )
  );

-- Create security policies for exercises table
-- Exercises are generally viewable by authenticated users
CREATE POLICY "Authenticated users can view exercises" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only physiotherapists and admins can manage exercises
CREATE POLICY "Physiotherapists can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM physiotherapists pt
      JOIN users u ON u.id = pt.user_id
      WHERE u.id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create security policies for exercise_logs table
CREATE POLICY "Patients can view own exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = exercise_logs.patient_id 
      AND p.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Patients can manage own exercise logs" ON exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = exercise_logs.patient_id 
      AND p.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Physiotherapists can view patient exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.id = exercise_logs.patient_id 
      AND u.id = auth.uid()::text
    )
  );

-- Create security policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

-- System can create notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create security policies for messages table
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()::text OR 
    recipient_id = auth.uid()::text
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Users can update own sent messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid()::text);

-- Create security policies for files table
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (uploaded_by = auth.uid()::text);

CREATE POLICY "Users can upload files" ON files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid()::text);

CREATE POLICY "Users can manage own files" ON files
  FOR ALL USING (uploaded_by = auth.uid()::text);

-- Physiotherapists can view patient files
CREATE POLICY "Physiotherapists can view patient files" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
      JOIN users u ON u.id = pt.user_id
      WHERE p.user_id = files.uploaded_by
      AND u.id = auth.uid()::text
    )
  );

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users 
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is physiotherapist
CREATE OR REPLACE FUNCTION is_physiotherapist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM physiotherapists pt
    JOIN users u ON u.id = pt.user_id
    WHERE u.id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user owns patient
CREATE OR REPLACE FUNCTION owns_patient(patient_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM patients p
    JOIN physiotherapists pt ON pt.id = p.physiotherapist_id
    JOIN users u ON u.id = pt.user_id
    WHERE p.id = patient_id 
    AND u.id = auth.uid()::text
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON security_audit_logs
  FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_logs
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
  INSERT INTO security_audit_logs (
    user_id,
    action,
    table_name,
    record_id,
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
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_changes
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointment_changes
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_physiotherapist_changes
  AFTER INSERT OR UPDATE OR DELETE ON physiotherapists
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_treatment_plan_changes
  AFTER INSERT OR UPDATE OR DELETE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();