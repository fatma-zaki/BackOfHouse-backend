/*
# Storage buckets and their policies

The buckets hold profile pictures, company branding, event covers and course
thumbnails. They are public for reads because those images are rendered in the
app without an extra round trip, but every write goes through the API:

- `INSERT`, `UPDATE` and `DELETE` policies are granted to `service_role` only,
  so a client holding the anon key cannot upload, overwrite or delete an object
  even if it discovers a bucket name.
- The API generates each object path as `<profile id>/<random uuid>.<ext>` and
  validates the leading bytes of the file, so a client controls neither where an
  object lands nor what it really contains.
- Per-bucket size and MIME limits are a backstop for the checks in FilesService.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('event-covers', 'event-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('course-thumbnails', 'course-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
DECLARE
  bucket_name text;
BEGIN
  FOREACH bucket_name IN ARRAY ARRAY['avatars', 'company-logos', 'event-covers', 'course-thumbnails']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_name || '_public_read');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_name || '_service_write');

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT TO public USING (bucket_id = %L)',
      bucket_name || '_public_read', bucket_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR ALL TO service_role USING (bucket_id = %L) WITH CHECK (bucket_id = %L)',
      bucket_name || '_service_write', bucket_name, bucket_name
    );
  END LOOP;
END $$;
