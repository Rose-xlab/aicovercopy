-- Create activity logs table to store user actions for admin monitoring
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON public.activity_logs(entity_id);

-- Add RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Create function to automatically log user actions
CREATE OR REPLACE FUNCTION public.fn_log_activity()
RETURNS TRIGGER AS $$
DECLARE
  event_type TEXT;
  details JSONB;
  changed_fields JSONB := '{}'::jsonb;
  k TEXT;
  v JSONB;
BEGIN
  -- Determine event type based on operation
  IF TG_OP = 'INSERT' THEN
    event_type := TG_TABLE_NAME || '.created';
    details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := TG_TABLE_NAME || '.updated';
    
    -- Build changed fields object
    FOR k, v IN 
      SELECT * FROM jsonb_each(to_jsonb(NEW))
    LOOP
      IF to_jsonb(OLD) ->> k IS DISTINCT FROM to_jsonb(NEW) ->> k THEN
        changed_fields := changed_fields || jsonb_build_object(k, v);
      END IF;
    END LOOP;
    
    details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed', changed_fields
    );
  ELSIF TG_OP = 'DELETE' THEN
    event_type := TG_TABLE_NAME || '.deleted';
    details := to_jsonb(OLD);
  END IF;
  
  -- Insert activity log
  INSERT INTO public.activity_logs (
    user_id,
    event_type,
    entity_type,
    entity_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    event_type,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    details,
    nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
    nullif(current_setting('request.headers', true)::json->>'user-agent', '')
  );
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply activity logging triggers to key tables
CREATE TRIGGER trigger_log_cover_letters 
AFTER INSERT OR UPDATE OR DELETE ON public.cover_letters 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

CREATE TRIGGER trigger_log_resumes 
AFTER INSERT OR UPDATE OR DELETE ON public.resumes 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

CREATE TRIGGER trigger_log_subscriptions 
AFTER INSERT OR UPDATE ON public.subscriptions 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

CREATE TRIGGER trigger_log_follow_up_emails 
AFTER INSERT OR UPDATE ON public.follow_up_emails 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

CREATE TRIGGER trigger_log_resume_ats_analyses 
AFTER INSERT ON public.resume_ats_analyses 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

CREATE TRIGGER trigger_log_interview_sessions 
AFTER INSERT ON public.interview_sessions 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- Add comment for documentation
COMMENT ON TABLE public.activity_logs IS 'Stores user activity events for admin monitoring';