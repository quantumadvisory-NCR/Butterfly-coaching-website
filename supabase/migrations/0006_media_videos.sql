-- Media library videos (November 2026): the media bucket also takes MP4 and WebM
-- videos, and files up to 50 MB (videos; images are limited to 20 MB and PDFs to
-- 25 MB by the app, which checks each file's real contents before keeping it).
-- Uploads still happen only through the server's one-time signed addresses; no
-- public upload policy is added.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    update storage.buckets
       set file_size_limit = 52428800,
           allowed_mime_types = array[
             'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
             'application/pdf', 'video/mp4', 'video/webm'
           ]
     where id = 'media';
  end if;
end $$;
