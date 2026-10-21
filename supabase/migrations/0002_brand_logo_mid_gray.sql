-- The light-background logo and the butterfly mark now use mid gray #5F5F5F
-- instead of navy, under new filenames: browsers keep files under /images for a
-- year, so a recoloured file needs a new address. This points the existing media
-- records (and with them the header logo setting) at the new files.
update public.media
set url = '/images/brand/bca-logo-mid-gray.svg',
    filename = 'bca-logo-mid-gray.svg',
    size_bytes = 13571,
    licence = 'Official BCA logo. Wordmark and antennae recoloured from white to mid gray #5F5F5F for light backgrounds, as chosen by the owner; artwork otherwise unchanged.',
    updated_at = now()
where url = '/images/brand/bca-logo-on-light.svg';
--> statement-breakpoint
update public.media
set url = '/images/brand/bca-mark-mid-gray.svg',
    filename = 'bca-mark-mid-gray.svg',
    width = 98,
    height = 90,
    size_bytes = 4651,
    licence = 'Butterfly emblem extracted from the official BCA logo, unmodified shapes; antennae in mid gray #5F5F5F.',
    updated_at = now()
where url = '/images/brand/bca-mark.svg';
