
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admins" ON public.admins
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.admins (email) VALUES ('kidkonkurs@yandex.ru');
