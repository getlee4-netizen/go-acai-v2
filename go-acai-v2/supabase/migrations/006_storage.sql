-- 006_storage.sql - Storage buckets and policies

-- Create logos bucket (run in Supabase Dashboard > Storage or via CLI)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('logos', 'logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Create push-subs bucket for subscription configs
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('push-subs', 'push-subs', true, 1048576, ARRAY['application/json']);

-- ============================================
-- STORAGE POLICIES (run in Supabase Dashboard > Storage > Policies)
-- ============================================

-- LOGOS BUCKET POLICIES
-- Public read access
-- CREATE POLICY "Public read logos" ON storage.objects
-- FOR SELECT USING (bucket_id = 'logos');

-- Tenant users can upload/update their logo
-- CREATE POLICY "Tenant users upload logos" ON storage.objects
-- FOR INSERT WITH CHECK (
--     bucket_id = 'logos' AND
--     auth.uid() IN (
--         SELECT user_id FROM tenant_users
--         WHERE tenant_id = split_part(name, '/', 1)
--     )
-- );

-- CREATE POLICY "Tenant users update logos" ON storage.objects
-- FOR UPDATE USING (
--     bucket_id = 'logos' AND
--     auth.uid() IN (
--         SELECT user_id FROM tenant_users
--         WHERE tenant_id = split_part(name, '/', 1)
--     )
-- );

-- CREATE POLICY "Tenant users delete logos" ON storage.objects
-- FOR DELETE USING (
--     bucket_id = 'logos' AND
--     auth.uid() IN (
--         SELECT user_id FROM tenant_users
--         WHERE tenant_id = split_part(name, '/', 1)
--     )
-- );

-- PUSH-SUBS BUCKET POLICIES
-- Public read for configs
-- CREATE POLICY "Public read push subs" ON storage.objects
-- FOR SELECT USING (bucket_id = 'push-subs');

-- Service role full access (for API routes)
-- CREATE POLICY "Service role full access push subs" ON storage.objects
-- FOR ALL USING (bucket_id = 'push-subs' AND auth.role() = 'service_role');