# Art prompts for Gemini

The game runs today with placeholder art drawn in code. To use real art, make a PNG with the
**exact file name and size** below and upload it into the `public/assets/` folder of this repo
(GitHub website: open the folder → **Add file** → **Upload files**). The next build uses it automatically.
Anything you don't replace keeps its placeholder.

## Paste this style block before every prompt

> Original pixel art sprite, 16-bit handheld game style, dreamy and soft. Pastel palette only:
> pink #fb9ecd, blush #fcb4db, lavender #b399f5, cream #f6e4f8, sky blue #0ea1ff, deep navy #000099,
> star yellow #ffe066, plum outline #6b4fa8, with cream and sand neutrals. Hard square pixels on an exact
> pixel grid, no anti-aliasing, no blur, no gradients except dithering, limited colours, 1px dark plum
> outline where useful. Transparent background. Original design: no existing game characters,
> logos or copyrighted sprites. Mood: pink and lavender cloud skies, twinkling four-point sparkles,
> a thin crescent moon, soft glows, cosy and calm.

Then add the line from the table. Ask Gemini for the image **scaled up 10×** (for example 160×260 for a
16×26 sprite) so each pixel is a clean block.

**Gemini images are rarely perfect pixel grids.** Upload the big image here in chat and I will shrink it to
the exact size with nearest-neighbour, snap the colours to the palette and clear the background for you.

## Sky and islands

| File | Size (px) | What to draw |
|---|---|---|
| `bg-cielo.png` | 216×440 | Portrait sky background: lavender at the top fading through pink and blush to cream at the bottom, dithered bands, scattered tiny stars, a few soft clouds. No islands or text (those are drawn on top). The centre 180×320 must look good on its own. |
| `island.png` | 120×64 | Floating sky island seen from the side: flat mint grass top (#a6dcb4) with tiny flowers, a sandy soil band, and lavender/plum crystal rocks hanging underneath in points. Top 14 rows are the grass surface where doors stand. |
| `islet-a.png` | 64×36 | Small floating islet, same style as the island. |
| `islet-b.png` | 84×38 | Small floating islet, same style, a bit wider. |
| `moon.png` | 15×15 | Thin crescent moon facing left, cream with a lilac edge. |
| `moon-glow.png` | 41×41 | Round soft glow made of dithered white dots, densest in the middle. |
| `cloud-far.png` | 256×48 | Strip of small distant lilac clouds, must tile seamlessly left-right, transparent sky. |
| `cloud-mid.png` | 256×64 | Strip of puffy pink-white clouds, tiles left-right. |
| `cloud-near.png` | 256×70 | Strip of big cream-white clouds lit from the top left, tiles left-right. |
| `cloud-floor.png` | 256×60 | Strip of very white fluffy clouds, a cloud sea, tiles left-right. |
| `cloud-garden.png` | 256×40 | Strip of small clouds for the garden sky, tiles left-right. |

## Doors (one per realm)

| File | Size (px) | What to draw |
|---|---|---|
| `door-jardin.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour mint green #a6dcb4, with a tiny leaf painted on it and a gold knob. |
| `door-clinica.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour blush #fcb4db, with a small cross painted on it and a gold knob. |
| `door-observatorio.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour lavender #b399f5, with a tiny star painted on it and a gold knob. |
| `door-biblioteca.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour sand #f0d6b4, with a tiny open book painted on it and a gold knob. |
| `door-isla.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour sky blue #7cc8ff, with a tiny wave painted on it and a gold knob. |
| `door-duelo.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour deep lavender #8f76d9, with a tiny card painted on it and a gold knob. |
| `door-cafe.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour clay #d6ab8c, with a tiny cup painted on it and a gold knob. |
| `door-barrio.png` | 13×17 | Arched door, plum outline #6b4fa8, cream frame, door colour pink #fb9ecd, with a tiny house painted on it and a gold knob. |

## Characters and icons

| File | Size (px) | What to draw |
|---|---|---|
| `pal-0.png` | 14×13 | The companion: a round, fluffy cloud-puff creature, white with lilac shading, tiny dot eyes, pink cheeks, a little star tuft on its head. Original character. Frame 1 of a 2-frame idle bob. |
| `pal-1.png` | 14×13 | Same companion, frame 2: squashed 1px lower, star tuft raised. |
| `sparkle-s.png` | 5×5 | Small four-point sparkle: white centre, blush and lilac arms. |
| `sparkle-b.png` | 9×9 | Big four-point sparkle, same colours. |
| `star-gold.png` | 7×7 | Little gold five-point star with a white highlight. |
| `gear.png` | 15×15 | Settings button: plum-outlined cream tile with a lavender gear. |
| `back-arrow.png` | 15×15 | Back button: plum-outlined cream tile with a lavender left arrow. |
| `can.png` | 16×12 | Light blue watering can facing right, plum outline. |
| `can-gold.png` | 16×12 | Same watering can in gold, slightly glowing (used for Focus). |
| `seed-bag.png` | 12×12 | Small sand-coloured seed bag tied at the top, with seed dots. |
| `drop.png` | 5×7 | Light blue water drop with a white shine, plum outline. |
| `grass.png` | 16×16 | Seamless mint grass tile with a few darker and lighter blades. Must tile in every direction. |

## Plants (El Jardín)

One file per word family and growth stage (0 = seed, 8 = star flower). The stem and leaves are greens
darker than the grass (#4f8f6a, #6fb88a, #3f7a5a) so they stand out. The game tints and tilts the
same picture when a plant is thirsty, so you only draw the healthy version.

| File | Size (px) | What to draw |
|---|---|---|
| `plant-paciente-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-2.png` | 16×26 | a seedling with two proper leaves; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-3.png` | 16×26 | a small plant with three leaves; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-4.png` | 16×26 | a leafy plant with four leaves; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-6.png` | 16×26 | the plant with one small open flower; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-paciente-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: soft pink round rose-like flower (#fb9ecd, highlights #fcb4db), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-imagen-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-2.png` | 16×26 | a seedling with two proper leaves; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-3.png` | 16×26 | a small plant with three leaves; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-4.png` | 16×26 | a leafy plant with four leaves; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-6.png` | 16×26 | the plant with one small open flower; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-imagen-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: white daisy (#fff7fc petals, #f6e4f8 shading), star-yellow centre (#ffe066). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-2.png` | 16×26 | a seedling with two proper leaves; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-3.png` | 16×26 | a small plant with three leaves; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-4.png` | 16×26 | a leafy plant with four leaves; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-6.png` | 16×26 | the plant with one small open flower; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-tarjetas-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: lavender tulip (#b399f5, highlights #d9c6f7). Soil mound in the bottom 3 rows. |
| `plant-frases-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-2.png` | 16×26 | a seedling with two proper leaves; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-3.png` | 16×26 | a small plant with three leaves; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-4.png` | 16×26 | a leafy plant with four leaves; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-6.png` | 16×26 | the plant with one small open flower; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-frases-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: blush star-petal flower (#fcb4db) with white tips and a pink centre. Soil mound in the bottom 3 rows. |
| `plant-raices-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-2.png` | 16×26 | a seedling with two proper leaves; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-3.png` | 16×26 | a small plant with three leaves; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-4.png` | 16×26 | a leafy plant with four leaves; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-6.png` | 16×26 | the plant with one small open flower; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-raices-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: sky-blue round forget-me-not (#7cc8ff, highlights #c3e6ff), white centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-2.png` | 16×26 | a seedling with two proper leaves; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-3.png` | 16×26 | a small plant with three leaves; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-4.png` | 16×26 | a leafy plant with four leaves; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-6.png` | 16×26 | the plant with one small open flower; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-verbos-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: deep lavender star flower (#8f76d9, highlights #d9c6f7), yellow centre. Soil mound in the bottom 3 rows. |
| `plant-siete-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-2.png` | 16×26 | a seedling with two proper leaves; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-3.png` | 16×26 | a small plant with three leaves; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-4.png` | 16×26 | a leafy plant with four leaves; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-6.png` | 16×26 | the plant with one small open flower; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-siete-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: peach tulip (#f7b58a, highlights #fbd3b5). Soil mound in the bottom 3 rows. |
| `plant-mias-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-2.png` | 16×26 | a seedling with two proper leaves; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-3.png` | 16×26 | a small plant with three leaves; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-4.png` | 16×26 | a leafy plant with four leaves; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-6.png` | 16×26 | the plant with one small open flower; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-mias-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: lilac daisy (#d9c6f7 petals), pink centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-0.png` | 16×26 | a single seed peeking out of a small mound of soil, no plant yet; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-1.png` | 16×26 | a tiny sprout with two baby leaves; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-2.png` | 16×26 | a seedling with two proper leaves; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-3.png` | 16×26 | a small plant with three leaves; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-4.png` | 16×26 | a leafy plant with four leaves; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-5.png` | 16×26 | a tall leafy plant with a closed flower bud on top; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-6.png` | 16×26 | the plant with one small open flower; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-7.png` | 16×26 | the plant in full bloom with a big flower and a little side bud; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
| `plant-vocab-8.png` | 16×26 | the plant in full bloom with a glowing star-shaped flower and four tiny gold sparkles around it; flower: star-yellow round flower (#ffe066) with white highlights and a clay centre. Soil mound in the bottom 3 rows. |
