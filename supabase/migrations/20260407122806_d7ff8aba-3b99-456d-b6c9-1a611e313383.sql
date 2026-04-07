
-- News table
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  photo_url text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news" ON public.news FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert news" ON public.news FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update news" ON public.news FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete news" ON public.news FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- News storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true);

CREATE POLICY "Anyone can read news photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'news');
CREATE POLICY "Admins can upload news photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete news photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news' AND public.is_admin(auth.uid()));

-- Add views_count to competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- RPC to increment views
CREATE OR REPLACE FUNCTION public.increment_competition_views(_competition_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.competitions SET views_count = views_count + 1 WHERE id = _competition_id;
$$;

-- Allow delete for admins on comments
CREATE POLICY "Admins can delete comments" ON public.comments FOR DELETE TO authenticated USING (is_admin(auth.uid()));
