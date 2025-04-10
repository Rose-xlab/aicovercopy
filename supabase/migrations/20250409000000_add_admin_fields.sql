-- Add admin-related fields to the profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create an index to improve lookup by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Create an index to improve lookup by admin status
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Add RLS policy that only allows admins to update the is_admin field
CREATE POLICY "Admin users can update is_admin field" ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (
    -- Only allow if authenticated user is an admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create a separate policy to prevent users from changing their own admin status
CREATE OR REPLACE FUNCTION auth.prevent_self_admin_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is trying to change their own admin status, block the update
  IF NEW.id = auth.uid() AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Users cannot change their own admin status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to invoke the function
DROP TRIGGER IF EXISTS prevent_self_admin_change_trigger ON public.profiles;
CREATE TRIGGER prevent_self_admin_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.prevent_self_admin_change();

-- Ensure users can't change their status to anything other than active/suspended/deleted
ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'deleted'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_admin IS 'Whether the user has admin privileges';
COMMENT ON COLUMN public.profiles.status IS 'User account status (active/suspended/deleted)';