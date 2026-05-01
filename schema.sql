-- UIT Knowledge Supabase Schema
-- Create this in your Supabase SQL Editor

-- 1. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    is_featured BOOLEAN DEFAULT false
);

-- Enable RLS for videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON public.videos FOR ALL USING (auth.role() = 'authenticated');

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    registration_link TEXT,
    image_class TEXT DEFAULT 'pastel-1',
    category TEXT,
    is_hot BOOLEAN DEFAULT false,
    payment_qr_url TEXT
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON public.courses FOR ALL USING (auth.role() = 'authenticated');

-- 3. MERCH TABLE
CREATE TABLE IF NOT EXISTS public.merch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    image_url TEXT,
    payment_qr_url TEXT,
    placeholder_class TEXT DEFAULT 'merch-shirt'
);

-- Enable RLS for merch
ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.merch FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON public.merch FOR ALL USING (auth.role() = 'authenticated');

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('courses', 'courses', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merch', 'merch', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policies for storage
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id IN ('courses', 'merch'));
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');
-- 5. COURSE REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.course_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    student_id_email TEXT NOT NULL,
    has_teams_email TEXT NOT NULL,
    teams_email TEXT NOT NULL,
    courses TEXT[] NOT NULL,
    goal TEXT NOT NULL,
    difficulties TEXT,
    weekend_available TEXT NOT NULL,
    time_slots TEXT[] NOT NULL
);

-- Enable RLS for course_registrations
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON public.course_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Read Access" ON public.course_registrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access" ON public.course_registrations FOR ALL USING (auth.role() = 'authenticated');

-- 6. VIDEO REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.video_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    has_teams_email TEXT NOT NULL,
    teams_email TEXT NOT NULL,
    courses TEXT[] NOT NULL,
    total_price TEXT
);

-- Enable RLS for video_registrations
ALTER TABLE public.video_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON public.video_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Read Access" ON public.video_registrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access" ON public.video_registrations FOR ALL USING (auth.role() = 'authenticated');

-- 7. MERCH REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.merch_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    merch_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    note TEXT,
    total_price INTEGER
);

-- Enable RLS for merch_registrations
ALTER TABLE public.merch_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON public.merch_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Read Access" ON public.merch_registrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access" ON public.merch_registrations FOR ALL USING (auth.role() = 'authenticated');

-- 8. SETTINGS TABLE (Global Configuration)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON public.settings FOR ALL USING (auth.role() = 'authenticated');

-- 9. AUDIT LOGS TABLE (Security Events)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    user_id UUID,
    email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Insert Access" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Select Access" ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated');

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Initial Social Links
INSERT INTO public.settings (key, value) VALUES 
('youtube_url', 'https://www.youtube.com/@UIT_Knowledge'),
('facebook_url', 'https://facebook.com'),
('discord_url', 'https://discord.gg/uitknowledge'),
('facebook_contact_url', 'https://www.facebook.com/GenCanyon'),
('email_contact', 'contact@uitknowledge.vn')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
