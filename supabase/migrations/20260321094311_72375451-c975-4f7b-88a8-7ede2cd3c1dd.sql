
-- Add duration_days column to competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30;

-- Create storage bucket for competition images
INSERT INTO storage.buckets (id, name, public) VALUES ('competitions', 'competitions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to competitions bucket
CREATE POLICY "Admins can upload competition images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'competitions' AND public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view competition images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'competitions');
