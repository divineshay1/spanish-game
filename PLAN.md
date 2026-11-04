# 🌙 Mi Español: El Cielo — Plan

This plan follows `SPEC.md`. ✅ Approved. Building milestone by milestone.

---

## In one breath

A cozy pastel pixel-art game on your phone. You live on a floating sky island, **El Cielo**, with doors to little worlds. The heart is **El Jardín**: every word you learn is a plant. Reviewing a word waters it and it grows. Words you forget wilt, and watering them is your review session.

All of your Mi Español content and learning logic moves over, **without changing the Spanish** unless I tell you first.

---

## What I found in your prototype

| Content | Amount |
|---|---|
| Word glosses (tap-a-word dictionary) | 200 |
| Stories | 6 (+ extra stories in Cimientos) |
| Phrase cards (Everyday, Colombia, México, Paciente) | 47 |
| Essential phrases (10 sets) | 152 |
| Root words | 163 |
| Picture words with memory tricks | 62 |
| Siete Pasos words | 21 |
| Dialogues | 14 |
| Sentence-building items | 62 |
| Think-it-through lessons | 8 |
| Tenses | 14 entries |
| Common verbs | 100 |
| Connectors | 9 |
| Grammar topics | 5 |
| Similar-word groups (Diferencias) | 20 |

Plus the engines: spaced repetition, grading (accent aware, typo tolerant), conjugation (13 tenses, irregulars, reflexives, commands, subjunctive), number-to-Spanish, pronunciation (syllables, stress, respelling), Focus sessions, immersion, clinic game, card duel, progress dashboard.

---

## The world

- **El Cielo** (home): a floating island in a pink-and-lavender sky with clouds, stars and a crescent moon. Doors lead to each realm. A cute original companion creature follows you around.
- **El Jardín** 🌱: your words as plants. See below.
- **La Clínica** 🩺: patients speak only Spanish. Check-in, symptoms (tap the body and turn the patient around), usted questions, vitals read aloud, commands with animated reactions, the plan, and goodbye. Patience hearts and stars.
- **La Biblioteca** 📚: graded stories, tap any word for its meaning, a no-English mode, and sentence ordering.
- **La Isla de Inmersión** 🏝️: timed Spanish-only sessions (listen, read, speak, write).
- **El Observatorio** 🔭: a starry tower for grammar: verb conjugation, the 100 verbs, tenses, connectors, question words, Armar (build sentences), Diferencias (similar words), Oído Fino (ear training) and Sonidos (pronunciation).
- **El Duelo** 🃏: a tarot-style card battle powered by your words. Original enemies (La Duda, El Olvido, La Prisa…).
- **El Café** ☕: listen to orders in Spanish and serve them.
- **El Barrio** 🏘️: walk a neighborhood, talk to people, ask for directions. Uses your dialogues.

## El Jardín (how the plants work)

Your Leitner boxes (0 to 8) are the plant's growth stages:

| Box | Plant | Next watering |
|---|---|---|
| 0 | Seed | today |
| 1 | Sprout | 1 day |
| 2 | Two leaves | 2 days |
| 3 | Small plant | 4 days |
| 4 | Leafy | 8 days |
| 5 | Bud | 16 days* |
| 6 | Flower | 35 days* |
| 7 | Full bloom | 70 days* |
| 8 | Glowing star-flower ✨ | 140 days* |

\* gaps of 16 days or more get about 10% random wiggle, as in your prototype.

- **Right answer:** the plant grows one stage.
- **Miss:** at box 5 or higher it halves, at box 2 to 4 it drops one, otherwise back to seed. It shrinks but **never dies**.
- **Due:** the plant droops. **Very overdue:** it fades more.
- **Watering = review**, in the test mode you choose: multiple choice, recall the meaning (type English), recall the word (type Spanish, forgives accents and typos, with an "I was right" button), or flashcards.
- An accent row (á é í ó ú ñ ¿ ¡) appears for every typed answer.
- **5 new seeds a day** (you can change this in settings).
- Each word family grows its own flower type (phrases, root words, picture words, verbs, clinic…), so your garden shows what you know.
- Missed words feed a **Focus session**: a glowing watering can for your trickiest plants.

## Look and sound

- Low-resolution pixel canvas (180×320, portrait) scaled up crisply with no blur.
- Your palette: pink `#fb9ecd`, blush `#fcb4db`, lavender `#b399f5`, cream `#f6e4f8`, sky `#0ea1ff`, deep navy `#000099`, star yellow `#ffe066`, plus cream and sand for indoors.
- Moving cloud layers, twinkling stars, sparkles, soft glow, dithered dusk over water, and a star-burst transition between screens.
- **Pixelify Sans** font (free OFL license), saved inside the app so it works offline. It supports á é í ó ú ñ ü ¿ ¡.
- Original characters only: simple or faceless adults, a cute companion, and original enemies. Nothing copied from Nintendo or anyone else.
- The game first runs with simple placeholder sprites made in code. When you make real art with Gemini (from `ART_PROMPTS.md`), drop it into `public/assets/` and it replaces the placeholders.
- Tiny chiptune sound effects and an optional soft ambient loop, made in code (no audio files).
- Settings: reduce motion and text size.

## Mood from your reference pictures

I studied the 5 pictures you sent. They're for **mood only**: I'm taking the feeling and colors from them, not their characters or drawings.

1. **Pink dream town**: lavender buildings, round pink trees, a winding gray track, a heart and score counter in the corner. → Inspires **El Cielo and El Barrio**: soft pink town and a heart-and-stars counter.
2. **Pink cloud sky**: chunky pixel clouds shaded pink to lavender to white, a thin crescent moon, 4-point sparkles, tiny dot stars. → The **main sky** and the El Jardín background.
3. **Night over the sea**: deep navy sky, big yellow stars, then stripy dithered bands of navy, lavender, pink and white at the horizon, over bright blue water with a splashing wave. → **La Isla de Inmersión** and the evening sky.
4. **Deep space**: black sky full of purple and magenta star bursts, a glowing star with a sparkle trail. → **El Duelo** arena and the star-burst screen change.
5. **Bright day sky**: sky blue with tiny white stars, little colored stars, and swirly white wind ribbons. → **Daytime** sky and floating between realms.

The colors I sampled from them match your SPEC palette exactly (pink `#fc9dcd`/`#fcb4db`, cream-lavender `#f1d1ed`, navy `#000099`, sky `#20a2ff`), so I'll use your palette as written.

**About the picture files:** three of them show Nintendo's Kirby, one shows another company's character, and one is an artist's signed artwork. Your repo is public, so I **won't add these pictures to it**. That would be sharing other people's art. These written notes replace the `reference/` folder, and the Gemini prompts in `ART_PROMPTS.md` will describe the style in words only. They won't name those characters or artists.

## Your phone

- Installable from iPhone Safari (Share → Add to Home Screen), works offline, portrait.
- Everything stays on your phone. **Backup** saves a file and **Restore** loads one. No data leaves the device.
- Voices: picks your phone's Mexican or Colombian Spanish voice, with a voice picker, Slow / Normal / Natural speed, and **Test voice**.
- Free hosting on GitHub Pages: **divineshay1.github.io/spanish-game**.

---

## Milestones

Each one is playable on your phone and saved to GitHub. Your SPEC's 4 stages are split into smaller steps so you can try things sooner.

### Stage A: engine, hub and El Jardín

**M1. The sky** ☁️
App setup, install to home screen, offline, auto-publish to GitHub Pages, pixel font. El Cielo with drifting clouds, twinkling stars and the moon.
*Try it:* install it on your phone and open it in airplane mode.

**M2. The brain** 🧠
All content moved into typed files. Spaced repetition, grading, conjugation, number-to-Spanish and pronunciation, all with automatic tests. Saving, Backup/Restore, and the voice settings.
*Try it:* Settings → test the Mexican and Colombian voices, then make a backup file.

**M3. El Jardín** 🌱
Plant new words as seeds, watch them grow, wilting, watering reviews in all 4 test modes, the accent row, and Focus sessions.
*Try it:* plant 10 words, water them, and watch them grow. A hidden "time travel" switch lets us test wilting without waiting days.

**M4. Home sweet sky** ✨
El Cielo hub with doors (locked ones say "soon"), companion, daily route with XP, streak and levels, phrase of the day, progress dashboard (14-day chart, strongest and weakest skills, word strength, milestones), sounds, reduce motion, text size. Also `ART_PROMPTS.md` and a simple `README.md`.
*Try it:* a full day: phrase of the day, water the garden, check your progress.

### Stage B: La Clínica

**M5. La Clínica** 🩺
The full patient visit from your prototype, rebuilt as pixel scenes.
*Try it:* check in a patient and take their vitals in Spanish.

### Stage C: reading, immersion and grammar

**M6. La Biblioteca** 📚 Stories, tap for meaning, no-English mode, sentence ordering.
**M7. La Isla de Inmersión** 🏝️ Timed Spanish-only sessions, including speaking.
**M8. El Observatorio** 🔭 Grammar tower: conjugation, verbs, Armar, Diferencias, Oído Fino, Sonidos.

### Stage D: games and the town

**M9. El Duelo** 🃏
**M10. El Café** ☕
**M11. El Barrio** 🏘️

Every realm gets a smoke test that plays it start to finish automatically.

---

## Limits I want to be honest about

- **Speaking practice on iPhone** uses Apple's speech recognition. It may need internet and may not work inside the installed app. If it fails, you'll get "listen, say it, then check yourself" instead.
- **Voices** depend on your phone. If there's no Colombian voice, it falls back to Mexican, then any Spanish voice. Free Enhanced voices can be downloaded in iPhone Settings.
- **iPhone storage:** data is safest when the app is installed to your home screen. Make a backup now and then.
- **Old progress:** starting fresh (you said that's fine). The save keeps the same shape as Mi Español (cards with box and due date), so Restore will also accept an old Mi Español save if you ever export one.
- I won't change any Spanish without asking. If I spot something that looks wrong, I'll list it for you to decide.

---

## Tech (for me)

- Vite + TypeScript + Phaser 3, `pixelArt: true`, 180×320 base with integer scaling and sky-filled edges.
- DOM overlays for typed answers and long text; Phaser for scenes.
- `src/content/*` (typed TS/JSON), `src/engine/*` (SRS, grading, conjugation, n2s, pronunciation, stats), `src/scenes/*` (one per realm), `src/ui/*`.
- Save: IndexedDB with a localStorage fallback, `navigator.storage.persist()`, versioned JSON export/import.
- `vite-plugin-pwa` (precache everything), GitHub Actions → Pages with `base: '/spanish-game/'`.
- Vitest for engines; Playwright smoke tests at iPhone size for each realm.
- Placeholder sprites generated from pixel maps in code; real art loaded from `public/assets/<documented-name>.png` when present.

---

## Answers so far

1. `pics.json` ✅ received (all 73 pictures). Added in M3.
2. Grammar home: **El Observatorio** ✅
3. New words: **5 a day** ✅
4. Start fresh ✅ (same save format as Mi Español)
5. Plan approved ✅

## Progress

- [x] **M1. The sky**: El Cielo, clouds, stars, moon, island with 3 doors, companion, installable, offline, auto-publish.
- [ ] M2. The brain
