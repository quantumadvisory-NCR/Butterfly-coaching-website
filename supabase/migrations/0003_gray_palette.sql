-- The October 2026 palette has no blue: charcoal #2B2B2B for links, headings and
-- dark sections, mid gray #5F5F5F for body text. The saved theme (Admin >
-- Settings > Colours and typography) overrides the stylesheet, so this replaces
-- the old default colours there. Colours the owner chose themselves are kept.
update public.site_settings
set value = value
      || case when lower(value->>'primary') = '#0068bf' then '{"primary": "#2b2b2b"}'::jsonb else '{}'::jsonb end
      || case when lower(value->>'navy') = '#0f256a' then '{"navy": "#2b2b2b"}'::jsonb else '{}'::jsonb end
      || case when lower(value->>'ink') = '#444746' then '{"ink": "#5f5f5f"}'::jsonb else '{}'::jsonb end,
    updated_at = now()
where key = 'theme';
--> statement-breakpoint
-- The butterfly photograph's blue wings are now charcoal, under a new filename
-- (browsers keep files under /images for a year). Its alt text is updated only if
-- it is still the original description.
update public.media
set url = '/images/photography/butterfly-on-leaf-charcoal.jpg',
    filename = 'butterfly-on-leaf-charcoal.jpg',
    size_bytes = 120122,
    alt = case
      when alt = 'A blue butterfly resting on a green leaf beside a sunlit window'
        then 'A dark butterfly with yellow-edged wings resting on a green leaf beside a sunlit window'
      else alt
    end,
    updated_at = now()
where url = '/images/photography/butterfly-on-leaf.jpg';
