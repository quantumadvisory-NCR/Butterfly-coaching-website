-- Homepage repeats (owner, October 2026): each claim once. The hero loses its
-- "ICF-accredited coach education · India" tag and the "ICF-accredited",
-- "Founded by Anup Mittal, MCC" and "4,100+ hours of founder coaching" chips
-- (the line under the heading and the photograph's tag already say so), and the
-- founder section loses its 4,100+ figure (the figures row gives it). Only those
-- exact items are removed, in the working and the published copy of the homepage;
-- anything else, including unpublished drafts, stays as it is.
create function pg_temp.bca_trim_home(section jsonb) returns jsonb language sql immutable as $$
  select case
    when section->>'type' = 'hero' and section->'data'->>'heading' = 'Learning that stays.' then
      jsonb_set(
        jsonb_set(
          section,
          '{data,chips}',
          coalesce(
            jsonb_path_query_array(
              section->'data'->'chips',
              '$[*] ? (@.label != "ICF-accredited" && @.label != "Founded by Anup Mittal, MCC" && @.label != "4,100+ hours of founder coaching")'
            ),
            '[]'::jsonb
          )
        ),
        '{data,eyebrow}',
        case
          when section->'data'->>'eyebrow' = 'ICF-accredited coach education · India' then '""'::jsonb
          else coalesce(section->'data'->'eyebrow', '""'::jsonb)
        end
      )
    when section->>'type' = 'profiles' and section->'data'->>'heading' = 'Meet the founder' and section->'data' ? 'facts' then
      jsonb_set(section, '{data,facts}', jsonb_path_query_array(section->'data'->'facts', '$[*] ? (@.value != "4,100+")'))
    else section
  end
$$;
--> statement-breakpoint
-- Working copy.
with trimmed as (
  select ps.id, ps.data, pg_temp.bca_trim_home(jsonb_build_object('type', ps.type, 'data', ps.data))->'data' as next
  from public.page_sections ps
  join public.pages p on p.id = ps.page_id
  where p.path = '/' and ps.type in ('hero', 'profiles')
)
update public.page_sections ps
set data = trimmed.next,
    updated_at = now()
from trimmed
where ps.id = trimmed.id
  and trimmed.next <> trimmed.data;
--> statement-breakpoint
-- Published copy: a new revision with only those items removed.
with patched as (
  select p.id, r.snapshot,
    jsonb_set(
      r.snapshot,
      '{sections}',
      (select coalesce(jsonb_agg(pg_temp.bca_trim_home(e.s) order by e.ord), '[]'::jsonb)
       from jsonb_array_elements(r.snapshot->'sections') with ordinality as e(s, ord))
    ) as next
  from public.pages p
  join public.revisions r on r.id = p.published_revision_id
  where p.path = '/'
),
saved as (
  insert into public.revisions (entity_type, entity_id, snapshot, label)
  select 'page', id, next, 'Homepage repeats removed (October 2026)' from patched where next <> snapshot
  returning id, entity_id
)
update public.pages p
set published_revision_id = saved.id,
    published_at = now(),
    updated_at = now()
from saved
where p.id = saved.entity_id;
--> statement-breakpoint
drop function pg_temp.bca_trim_home(jsonb);
