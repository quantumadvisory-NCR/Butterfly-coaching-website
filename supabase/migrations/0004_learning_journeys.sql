-- October 2026 copy from the owner's references: "Why learners choose BCA" and
-- the learning journey (now a loop) on the homepage, "How we teach" on About,
-- and the PCC and MCC journey steps. Each change applies only while the text is
-- still the original, so nothing the owner has edited is overwritten. Pages are
-- changed in both the working copy and the published copy; unpublished drafts
-- of other sections stay unpublished.
create temp table bca_patches (path text, block_type text, heading text, guard jsonb, patch jsonb) on commit drop;
--> statement-breakpoint
insert into bca_patches values
(
  '/', 'feature_list', 'Why learners choose BCA',
  '{"intro": "Coach training should change how you work, not only what you know.",
    "items": [
      {"title": "Learning that stays", "body": "You meet an idea, use it with real clients, then come back to it with experience. Returning to what you have learnt is what makes it last."},
      {"title": "The iKAN framework", "body": "Our own coaching methodology: Identify the real need, explore the Known and unknown, choose an Alternate path, then take Action and repeat."},
      {"title": "Practice, reflection and mentoring", "body": "Learning labs build understanding. Practice labs, mentor coaching and competency-based feedback build capability."}
    ]}',
  '{"intro": "Coach training that changes how you show up with people, not just what you know about coaching.",
    "items": [
      {"title": "Learning that sticks", "body": "You learn a concept, use it in real coaching conversations, then come back to it with what you''ve learnt. Going round that loop is how knowledge becomes instinct."},
      {"title": "iKAN, our own coaching framework", "body": "A clear structure you can use from your first session: **I**dentify the real need, explore the **K**nown and unknown, choose an **A**lternate path, and take actio**N**. Then repeat."},
      {"title": "Practice, reflection and mentoring", "body": "Learning labs build understanding. Practice labs, mentor coaching and feedback against ICF competencies build skill, so you leave ready to coach and not just knowing about coaching."}
    ]}'
),
(
  '/', 'timeline', 'The learning journey',
  '{"intro": "Every programme follows the same rhythm, so each skill builds on the last.",
    "steps": [
      {"title": "Learn", "body": "Learning labs introduce coaching principles, competencies and mindset."},
      {"title": "Practise", "body": "Practice labs put ideas to work in real coaching conversations."},
      {"title": "Receive feedback", "body": "Mentor coaches and peers give specific, competency-based feedback."},
      {"title": "Reflect and revisit", "body": "You return to earlier ideas with new experience, and they deepen."},
      {"title": "Build capability", "body": "Evaluated practice shows you are ready for your credential."}
    ]}',
  '{"layout": "loop",
    "eyebrow": "The learning journey",
    "heading": "How you''ll grow, one loop at a time",
    "intro": "Every programme follows the same rhythm. Each time round, the skill goes deeper.",
    "steps": [
      {"marker": "", "title": "Learn", "body": "Live learning labs with Anup and faculty. Small groups, real questions.",
       "quote": "The hands-on learning labs makes it experiential.", "quoteBy": "Naved Narayan"},
      {"marker": "", "title": "Practise", "body": "Coach a peer in your first week. Yes, your first week.",
       "quote": "Understanding the nuances of ICF standards and applying it in my work has provided some remarkable results.", "quoteBy": "Mrinal Bafna"},
      {"marker": "", "title": "Receive feedback", "body": "Specific notes against ICF competencies, not \"that was good\".",
       "quote": "Anup makes himself available always, be it additional group sessions or a one-on-one mentoring calls.", "quoteBy": "Naved Narayan"},
      {"marker": "", "title": "Reflect and revisit", "body": "Come back to week-one ideas in week eight and see them differently.",
       "quote": "I am a firm believer that in order to be an effective coach, you keep challenging your own beliefs and patterns in order to be the same with clients.", "quoteBy": "Dr. Supriya Dhongde"},
      {"marker": "", "title": "Build capability", "body": "Evaluated practice shows you are ready for your credential.", "quote": "", "quoteBy": ""}
    ],
    "ctaLead": "Want to see a practice lab before you decide?",
    "cta": {"label": "Book a discovery call", "href": "booking"}}'
),
(
  '/about-us/', 'feature_list', 'How we teach',
  '{"intro": "Awareness leads to choice, choice leads to action, and action leads to transformation.",
    "items": [
      {"title": "Clarity over complexity", "body": "We simplify learning so it is accessible and usable in any context."},
      {"title": "Practice over theory", "body": "Skills are built in real conversations, then observed and reflected on."},
      {"title": "Reflection over instruction", "body": "Feedback and mentoring help you see your own coaching clearly."},
      {"title": "Open to everyone", "body": "We welcome diverse learners. Coaching is for anyone and everyone."}
    ]}',
  '{"intro": "Every programme follows the same arc:",
    "sequence": ["Awareness", "Choice", "Action", "Transformation"],
    "items": [
      {"title": "Clarity over complexity", "body": "No jargon walls. Every idea comes with a simple tool you can use in your very next conversation, whether that''s with a client, a colleague or your team."},
      {"title": "Practice over theory", "body": "You start coaching early. Real conversations, observed by a mentor and unpacked together, so you know exactly what worked and why."},
      {"title": "Reflection over instruction", "body": "We don''t hand you answers. Feedback, mentoring and guided reflection help you hear your own coaching and grow your own style."},
      {"title": "Open to everyone", "body": "We welcome diverse learners. Coaching is for anyone and everyone."}
    ]}'
);
--> statement-breakpoint
-- Working copies.
update public.page_sections ps
set data = ps.data || x.patch,
    updated_at = now()
from public.pages p, bca_patches x
where p.id = ps.page_id
  and p.path = x.path
  and ps.type = x.block_type
  and ps.data->>'heading' = x.heading
  and ps.data @> x.guard;
--> statement-breakpoint
-- Published copies: a new revision with only these sections changed.
create function pg_temp.bca_patch_sections(page_path text, sections jsonb) returns jsonb language sql stable as $$
  select coalesce(
    jsonb_agg(
      coalesce(
        (select jsonb_set(e.s, '{data}', (e.s->'data') || x.patch)
         from bca_patches x
         where x.path = page_path
           and e.s->>'type' = x.block_type
           and e.s->'data'->>'heading' = x.heading
           and (e.s->'data') @> x.guard
         limit 1),
        e.s)
      order by e.ord),
    '[]'::jsonb)
  from jsonb_array_elements(sections) with ordinality as e(s, ord)
$$;
--> statement-breakpoint
with patched as (
  select p.id, r.snapshot, jsonb_set(r.snapshot, '{sections}', pg_temp.bca_patch_sections(p.path, r.snapshot->'sections')) as next
  from public.pages p
  join public.revisions r on r.id = p.published_revision_id
  where p.path in (select path from bca_patches)
),
saved as (
  insert into public.revisions (entity_type, entity_id, snapshot, label)
  select 'page', id, next, 'October 2026 copy update' from patched where next <> snapshot
  returning id, entity_id
)
update public.pages p
set published_revision_id = saved.id,
    published_at = now(),
    updated_at = now()
from saved
where p.id = saved.entity_id;
--> statement-breakpoint
drop function pg_temp.bca_patch_sections(text, jsonb);
--> statement-breakpoint
-- PCC steps, worded as in the PCC journey mockup.
update public.programme_modules m
set description = v.next
from public.programmes p,
  (values
    ('Deep Practice Lab', 'Sustained practice with observation, reflection and feedback.', 'Sustained practice with close observation, reflection and feedback.'),
    ('Mentor coaching and reflective feedback', 'Mentor coaching aligned with PCC markers.', 'Reflect on your coaching conversations with a mentor coach, against PCC markers.'),
    ('Coaching experience', 'Coaching experience with real clients.', 'Coach real clients and build your experience hours.'),
    ('Performance evaluation', 'A PCC call review. BCA awards your certificate.', 'Your coaching call is reviewed against PCC-level markers. BCA awards your certificate.')
  ) as v(title, previous, next)
where p.id = m.programme_id
  and p.slug = 'level-2-pcc'
  and m.title = v.title
  and m.description = v.previous;
--> statement-breakpoint
-- MCC: 10 hours of advanced mentor coaching, confirmed by the owner.
update public.programme_modules m
set description = 'High-touch mentor coaching for mastery-level development, against MCC markers.',
    hours_label = '10 hours'
from public.programmes p
where p.id = m.programme_id
  and p.slug = 'level-3-mcc'
  and m.title = 'Advanced mentor coaching'
  and m.description = 'High-touch mentor coaching for mastery-level development.'
  and m.hours_label is null;
--> statement-breakpoint
update public.programmes
set mentoring_hours = 10,
    updated_at = now()
where slug = 'level-3-mcc'
  and mentoring_hours is null;
