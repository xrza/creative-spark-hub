
-- Create a function to check if user is admin via admins table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    JOIN public.profiles p ON p.email = a.email
    WHERE p.id = _user_id
  )
$$;

-- Drop old policies on competitions that use has_role
DROP POLICY IF EXISTS "Admins can insert competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can update competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can delete competitions" ON public.competitions;

-- Recreate using is_admin
CREATE POLICY "Admins can insert competitions" ON public.competitions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update competitions" ON public.competitions
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete competitions" ON public.competitions
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Also fix applications policies
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;

CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Also fix results policies
DROP POLICY IF EXISTS "Admins can insert results" ON public.results;
DROP POLICY IF EXISTS "Admins can update results" ON public.results;
DROP POLICY IF EXISTS "Admins can delete results" ON public.results;

CREATE POLICY "Admins can insert results" ON public.results
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update results" ON public.results
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete results" ON public.results
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
