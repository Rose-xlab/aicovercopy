-- Create admin settings table to store system-wide configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create unique constraint on category + key
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_settings_category_key ON public.admin_settings(category, key);

-- Enable RLS on admin settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify settings
CREATE POLICY "Admins can view admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Admins can modify admin settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update timestamps
CREATE TRIGGER trigger_update_admin_settings_timestamp
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();

-- Insert default settings
INSERT INTO public.admin_settings (category, key, value, description)
VALUES
  ('system', 'maintenance_mode', 'false'::jsonb, 'Whether the system is in maintenance mode'),
  ('limits', 'free_tier_cover_letters', '3'::jsonb, 'Number of cover letters allowed in free tier'),
  ('limits', 'free_tier_resumes', '1'::jsonb, 'Number of resumes allowed in free tier'),
  ('limits', 'free_tier_ats_scans', '2'::jsonb, 'Number of ATS scans allowed in free tier'),
  ('pricing', 'pro_monthly', '9.99'::jsonb, 'Pro tier monthly price'),
  ('pricing', 'pro_quarterly', '26.99'::jsonb, 'Pro tier quarterly price'),
  ('pricing', 'pro_annually', '99.99'::jsonb, 'Pro tier annual price'),
  ('pricing', 'business_monthly', '19.99'::jsonb, 'Business tier monthly price'),
  ('pricing', 'business_quarterly', '53.99'::jsonb, 'Business tier quarterly price'),
  ('pricing', 'business_annually', '199.99'::jsonb, 'Business tier annual price'),
  ('notifications', 'admin_email_notifications', 'true'::jsonb, 'Whether to send email notifications to admins')
ON CONFLICT (category, key) DO NOTHING;

-- Create admin audit log table to track admin actions
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Enable RLS on admin audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view admin audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.admin_settings IS 'Stores system-wide configuration settings manageable by admins';
COMMENT ON TABLE public.admin_audit_logs IS 'Tracks actions performed by admin users for accountability';