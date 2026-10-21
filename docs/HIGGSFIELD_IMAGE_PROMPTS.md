# Higgsfield image prompts

Higgsfield **was** available for this project, so every image below was generated directly on 10 October 2026 and is already in the site. This file is the record of how, so any image can be regenerated or extended in the same style.

- **Requested model:** `nano_banana_pro` at 2K. The service reported the model used as `nano_banana_2`.
- **Cost:** 2 credits per image, 24 images, 48 credits in total.
- **Masters:** downloaded as PNG, then resized and re-encoded by `npm run images:optimise` into `public/images/photography/`.
- **Register:** sources, alt text and placements are listed in [IMAGE_ASSETS.md](IMAGE_ASSETS.md).

## Art direction (applies to every image)

One consistent look, so the site reads as a single shoot rather than a collection of stock:

| | |
|---|---|
| Style | Documentary editorial photography, candid and unposed |
| Lens and light | 50mm at f/2.8 (35mm for wide rooms), soft natural window light |
| Palette | Pale blue and soft white interiors with **one** warm yellow accent object, echoing the site's colours |
| People | Indian professionals of mixed ages and genders in contemporary smart-casual workwear |
| Quality bar | Natural skin texture, relaxed realistic hands, believable body language |
| Never | Text, logos, watermarks, readable screens or handwriting, exaggerated expressions |

Rules followed:

- No image depicts, or is presented as, a real BCA founder, faculty member, student or client. Real people appear only in authentic photographs.
- No image contains text the visitor needs to read.
- Landscape (3:2) for wide placements, portrait (4:5) for cards and the desktop hero column.

## How to regenerate or add an image

1. Use the prompt below (or write a new one that ends with the shared style sentence).
2. Generate at the listed aspect ratio, 2K.
3. Save the PNG as `.local/raw/generated/<filename>.png`.
4. Run `npm run images:optimise`. For a new filename, add one line to the list in `scripts/optimise-images.ts` and one entry to `seed/media.ts`.
5. Or skip the scripts entirely: upload the image in **Admin > Media library** and use **Replace file** on the image you want to swap.

**Shared style sentence** (the end of every people prompt):

> Shot on a 50mm lens at f/2.8, soft natural window light, pale blue and soft white interior tones with one warm yellow accent object, smart-casual contemporary workwear, natural skin texture, relaxed realistic hands, candid unposed moment. No text, no logos, no watermarks.

## Prompts

### Homepage hero

| File | Ratio | Placement |
|---|---|---|
| `hero-coaching-conversation.jpg` | 3:2 | Home hero on phones and tablets (stacked layout) |
| `hero-coaching-conversation-portrait.jpg` | 4:5 | Home hero on laptops and desktops (split layout) |

**Landscape:** Documentary editorial photograph of a one-to-one coaching conversation. Two people seated in armchairs angled toward each other beside a large window in a calm contemporary room. The coach, an Indian woman in her mid forties in a soft navy blazer, listens with full attention, an open notebook resting on her lap. The client, an Indian man in his thirties in a pale blue shirt, is mid-thought and gesturing gently with one hand. Medium-wide framing, both people fully in frame and centred, uncluttered pale wall behind them, one small warm yellow cushion as the only accent colour. Shot on a 50mm lens at f/2.8, soft natural window light, pale blue and soft white interior tones, natural skin texture, relaxed realistic hands, candid unposed moment, calm and confident mood. No text, no logos, no watermarks.

**Portrait** (generated with the landscape image as a reference, so the same two people appear in both): Recompose this exact photograph as a vertical 4:5 portrait. Keep the same two people, the same clothing, the same room, window light, armchairs, yellow cushion and colour palette. Bring the two people slightly closer together so both fit comfortably in the vertical frame from the knees up, with a little headroom above them. Same documentary editorial style, 50mm lens, natural skin texture, realistic hands. No text, no logos, no watermarks.

### Choose your path (4:5)

**`path-become-a-coach.jpg`:** Documentary editorial photograph of a coach-training practice session. Three adult learners sit in a small triangle of chairs in a bright learning studio: an Indian woman in her thirties practises coaching a peer, an Indian man in his forties, while a third participant observes quietly and takes handwritten notes. Vertical composition, the practising coach is the focal point, leaning in slightly and listening. *Shared style sentence.*

**`path-grow-as-a-leader.jpg`:** Documentary editorial photograph of a team leader having a relaxed one-to-one conversation with a younger colleague. An Indian man in his forties with rolled shirt sleeves stands at a high table in a modern office, listening closely rather than instructing, while a younger Indian woman explains an idea with an open notebook in front of her. Vertical composition, eye-level, warm and attentive expressions. *Shared style sentence.* No screens with readable content.

**`path-develop-your-organisation.jpg`:** Documentary editorial photograph of a leadership team in a facilitated development workshop. Six Indian professionals of mixed ages and genders sit in a loose semicircle of chairs in a bright meeting space; one woman is speaking while the others listen with genuine interest. Blurred sticky notes on a glass wall in the background with no readable writing. Vertical composition with depth, the speaker in focus in the middle distance. *Shared style sentence.*

### Programmes (3:2)

**`programme-acc-learning-lab.jpg`** (Level 1; Programmes overview hero): Documentary editorial photograph of a small cohort in a coach-training learning lab. Five adult learners of mixed ages sit in a circle of chairs in a bright training studio, practising a coaching exercise in pairs with notebooks on their laps, while a facilitator crouches beside one pair and observes quietly. Wide framing showing the whole circle, friendly focused atmosphere. Shot on a 35mm lens. *Shared style sentence.*

**`programme-pcc-deep-practice.jpg`** (Level 2; Individual coaching): Documentary editorial photograph of a deep one-to-one coaching session. An experienced coach, an Indian man in his late forties with a short greying beard and a charcoal knit jacket, sits forward slightly and is completely present. Across from him a senior professional woman in her forties pauses to reflect, looking toward the window in thought. Quiet, spacious composition with soft negative space, low table with two glasses of water between them. Contemplative mood. *Shared style sentence.*

**`programme-mcc-mastery.jpg`** (Level 3; Supervision): Documentary editorial photograph of a master coach in quiet reflective conversation with a peer. An Indian woman in her fifties with silver-streaked hair and a deep blue kurta sits in a book-lined study, calm and unhurried, listening with a slight smile to a colleague seen partly from behind in the foreground. Spacious composition, warm lamp glow mixed with soft daylight. Sense of depth and experience. *Shared style sentence.* No readable book titles.

### Services (3:2)

**`mentoring-session-review.jpg`:** Documentary editorial photograph of a mentor coaching session. A mentor and a coach sit side by side at a pale wooden table reviewing a recorded coaching conversation: an open laptop turned away from the camera, wired earphones resting on the table, the mentor, an Indian man in his fifties, gesturing toward handwritten notes while the coach, an Indian woman in her thirties, listens and nods. Over-the-shoulder three-quarter framing, collaborative and warm. *Shared style sentence.* No readable handwriting.

**`corporate-leadership-workshop.jpg`:** Documentary editorial photograph of a corporate leadership development session in a modern glass-walled meeting room. Eight managers of mixed ages and genders work in pairs in conversation around the room, engaged and at ease, some smiling, while a facilitator stands to one side observing. Wide framing with depth and daylight, plants and pale furniture. Shot on a 35mm lens. *Shared style sentence.* No screens with readable content.

**`executive-coaching-walk.jpg`:** Documentary editorial photograph of an executive coaching conversation on the move. A senior leader, an Indian woman in her forties in a tailored blazer, walks and talks with her coach, an Indian man in his fifties, along a sunlit office corridor lined with plants. Mid-stride, relaxed, both looking at each other in conversation. Three-quarter front framing with the corridor receding behind them. *Shared style sentence.*

### Supporting imagery

**`practice-feedback.jpg`** (3:2; Why BCA, How we teach, Mentoring): Documentary editorial photograph of peer feedback after a coaching practice session. An Indian woman in her forties holds a clipboard loosely and shares feedback with a younger male coach, who listens openly with a notebook on his knee; both seated in a bright learning studio, supportive and warm expressions, a third chair empty beside them. Medium framing at eye level. *Shared style sentence.* No readable writing.

**`cohort-community.jpg`** (3:2; How we build capability): Editorial photograph of a small group of adult learners laughing together during a break in a bright learning studio, standing in a loose cluster holding cups of tea, notebooks tucked under arms, warm sense of community among peers. Five Indian professionals of mixed ages and genders. *Shared style sentence.*

**`reflection-journal.jpg`** (4:5; Individual coaching, blog): Documentary editorial photograph of a professional writing in a journal by a window in soft morning light. An Indian man in his thirties in a pale blue shirt sits at a small table, pen in hand, pausing to reflect; hands and notebook in sharp focus, face in soft three-quarter profile, a cup of tea on the windowsill. Vertical composition, quiet and reflective. Shot at f/2.2. *Shared style sentence.* No readable handwriting.

**`butterfly-on-leaf.jpg`** (16:9; About, 404 page, blog, admin sign-in screen; published as `butterfly-on-leaf-charcoal.jpg`, its blue wings turned charcoal by `npm run images:optimise`): Macro photograph of a butterfly resting on a green leaf beside a sunlit window, wings partly open showing deep blue with a fine warm yellow edge, extremely shallow depth of field, large smooth out-of-focus background in pale blue and soft white, calm premium natural-history editorial style, the butterfly placed in the right third of the frame with generous clean negative space on the left. No text, no logos, no watermarks.

### Blog featured images (3:2)

The legacy blog images had unclear licences, so each article received an image from this set.

| File | Prompt |
|---|---|
| `blog-planning-desk.jpg` | Editorial still-life photograph seen from above at a slight angle: an open paper planner on a pale wooden desk, a hand holding a pen about to write, a small potted plant, a cup of tea and a warm yellow sticky note pad, soft morning window light with gentle shadows, pale blue and soft white tones. Calm and purposeful mood. No readable text or handwriting. |
| `blog-conversation-table.jpg` | Editorial photograph of two colleagues in conversation at a small table by a window, seen from the side at table height: two coffee cups, two closed notebooks, one person's hands open mid-gesture while the other person leans in to listen, faces soft and partly out of frame. Shot at f/2.2. |
| `blog-steps-forward.jpg` | Editorial photograph of a professional seen from behind climbing a wide outdoor stone staircase in early morning light, carrying a notebook under one arm, soft long shadows, pale sky, calm sense of forward movement and new beginnings. Indian woman in her thirties in a soft blue blazer. 35mm lens at f/4. No signage. |
| `blog-speaking-with-confidence.jpg` | Editorial photograph of a professional speaking with quiet confidence to a small group in a bright meeting room. An Indian woman in her thirties stands relaxed with open hands while three colleagues listen from chairs in the soft-focus foreground. |
| `blog-repotting-plant.jpg` | Editorial still-life photograph of hands gently repotting a small green plant into a larger pale ceramic pot on a wooden table by a window, loose soil, a small trowel, soft morning light. Calm metaphor for growth and change. |
| `blog-window-reflection.jpg` | Editorial photograph of a person seen from behind standing at a large window in soft morning light, holding a cup of tea, looking out over a quiet city, thoughtful and still. Indian man in his forties in a pale blue shirt. Spacious composition with soft negative space. 35mm lens. |
| `blog-morning-routine.jpg` | Editorial still-life photograph of a morning routine laid out on a pale wooden surface by a window: a pair of running shoes, a rolled yoga mat, a glass of water and a small closed notebook with a pen, soft early light and long gentle shadows. No brand marks on the shoes. |
| `blog-founder-at-work.jpg` | Editorial photograph of a founder at work in a small bright studio office: an Indian woman in her thirties stands at a desk sketching a plan in a large notebook, a laptop closed beside her, shelves and a plant behind in soft focus, purposeful and calm. No readable writing. |
| `blog-reviewing-progress.jpg` | Editorial photograph of two colleagues reviewing progress together at a pale wooden table, one pointing with a pen at a printed chart with simple unlabelled bars while the other smiles, coffee cups nearby, seen at a three-quarter angle. No readable numbers. |

Each blog prompt ends with the shared style sentence.

## Ideas for a later round

Not generated, because authentic photographs are the right choice for these and none are available yet:

- A genuine photograph of a BCA cohort in session, to replace `programme-acc-learning-lab.jpg` on the Level 1 page.
- A genuine photograph of Anup mentoring a coach, for the Mentoring page.
- Portraits of faculty in a consistent style and background.

When these exist, upload them in the Media library, set **Where it came from** to **Authentic BCA photograph**, and replace the generated image.
