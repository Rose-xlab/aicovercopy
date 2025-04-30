CREATE OR REPLACE FUNCTION public.fn_create_initial_admin(
  admin_email TEXT,
  admin_password TEXT,
  admin_first_name TEXT,
  admin_last_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if any admin users already exist
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE is_admin = TRUE) INTO admin_exists;
  
  IF admin_exists THEN
    RETURN 'Admin users already exist. No action taken.';
  END IF;
  
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Create a new user in auth.users
  INSERT INTO auth.users (
    id,                        -- Explicitly include the id column
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,               -- Use the generated UUID
    admin_email,
    crypt(admin_password, gen_salt('bf')), -- Encrypt the password
    now(),                     -- Email already confirmed
    '{"provider": "email", "providers": ["email"], "is_admin": true}',
    format('{"first_name": "%s", "last_name": "%s"}', admin_first_name, admin_last_name)::jsonb,
    now(),
    now()
  );
  
  -- Update the profile to set admin flag
  UPDATE public.profiles
  SET 
    first_name = admin_first_name,
    last_name = admin_last_name,
    full_name = admin_first_name || ' ' || admin_last_name,
    is_admin = TRUE,
    updated_at = now()
  WHERE id = new_user_id;
  
  RETURN 'Initial admin user created with ID: ' || new_user_id;
END;
$function$;