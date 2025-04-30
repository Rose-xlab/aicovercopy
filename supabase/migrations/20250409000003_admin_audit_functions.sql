-- Create admin_audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Add RLS policies
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin audit logs
CREATE POLICY "Admins can view all admin audit logs" ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Create a function to log admin actions
CREATE OR REPLACE FUNCTION public.fn_log_admin_action(
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Only admin users can log admin actions';
  END IF;
  
  -- Insert the audit log
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    details,
    nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', '')
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create a trigger function to automatically log user status changes
CREATE OR REPLACE FUNCTION public.fn_log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if status has changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log the admin action
    PERFORM public.fn_log_admin_action(
      'user.status_change',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the profiles table
CREATE TRIGGER trigger_log_user_status_change
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.fn_log_user_status_change();

-- Create a trigger function to automatically log admin role changes
CREATE OR REPLACE FUNCTION public.fn_log_admin_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if is_admin has changed
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    -- Log the admin action
    PERFORM public.fn_log_admin_action(
      'user.admin_change',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'previous_is_admin', OLD.is_admin,
        'new_is_admin', NEW.is_admin
      )
    );
  END IF;
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the profiles table
CREATE TRIGGER trigger_log_admin_role_change
AFTER UPDATE OF is_admin ON public.profiles
FOR EACH ROW
WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
EXECUTE FUNCTION public.fn_log_admin_role_change();

-- Create a function to check if the user has admin rights
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$;

-- Create a function to get all admin users
CREATE OR REPLACE FUNCTION public.fn_get_admin_users()
RETURNS SETOF public.profiles LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.profiles
  WHERE is_admin = TRUE
  ORDER BY updated_at DESC NULLS LAST;
$$;