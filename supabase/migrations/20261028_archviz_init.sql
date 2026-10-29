-- ARCHVIZ AI: Supabase Database Migration & Storage Policies
-- Table: render_jobs
-- Description: Stores architectural rendering jobs, status, prompts, and storage references

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_image_path TEXT NOT NULL,
    rendered_image_path TEXT,
    lighting_preset TEXT NOT NULL CHECK (lighting_preset IN ('pagi', 'siang', 'sore', 'malam')),
    additional_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Index for fast user job lookups
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON public.render_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON public.render_jobs(created_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view only their own jobs
CREATE POLICY "Users can view their own render jobs"
ON public.render_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert jobs assigned to their own user id
CREATE POLICY "Users can insert their own render jobs"
ON public.render_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own render jobs
CREATE POLICY "Users can update their own render jobs"
ON public.render_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS automatically in Supabase, allowing backend workers to process jobs.

-- 4. Storage Buckets (Execute via Supabase Dashboard or Storage API)
-- Buckets:
--   'original_images' (private)
--   'rendered_images' (private)

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('original_images', 'original_images', false),
    ('rendered_images', 'rendered_images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies:
-- Users can only upload original images into their own folder (user_id/*)
CREATE POLICY "Authenticated users can upload original images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'original_images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own original images
CREATE POLICY "Users can read own original images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'original_images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own rendered images
CREATE POLICY "Users can read own rendered images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'rendered_images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
