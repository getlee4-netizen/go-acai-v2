-- Storage policies for logos bucket
-- Allow authenticated users to upload to their own tenant folder
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- Allow public read access to logos
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'logos');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos');
