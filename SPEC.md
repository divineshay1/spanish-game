# Mi Español: project spec

This file is the full brief. Read it completely before doing anything.

> Note for Claude Code: I am on my phone and upload files one at a time. If `mi-espanol-legacy.html`, `pics.json` or `reference/` are not in the repo yet, tell me which one you need and I will upload it. Do not guess its contents.

## Files in this repo
- `mi-espanol-legacy.html`: my working single-file prototype (the source of truth for content and learning logic). It is about 300 KB, so read it in chunks using the index below, do not load it all at once.
- `pics.json`: the 73 pictures as base64 JPEGs. Keys are card ids: `m1` to `m62` are the picture words in order of the `IMG` array, `desayuno`, and `cov_cort`, `cov_salu`, `cov_reac`, `cov_conoc`, `cov_ayuda`, `cov_pedir`, `cov_lugar`, `cov_tiempo`, `cov_sentir`, `cov_pac` are phrase set covers. Decode them to files when you need them.
- `reference/`: mood references for the art style (pastel pixel art). Use as mood only.

## Who and limits
I am an English-speaking adult learning Latin American Spanish (Colombian and Mexican). I am a medical assistant and nursing student who needs to speak with patients and friends, read paragraphs and stories, and understand music. Everything must be free: no paid APIs or services. Host on GitHub Pages or Netlify free tier. It must be an installable PWA on iPhone Safari, mobile-first portrait, offline capable, with all data on my device. Add JSON export and import for backups. No data leaves the device.

## What to extract from the prototype
Move ALL content and logic into typed TypeScript and JSON modules without changing the Spanish unless you flag the change to me:
vocabulary and picture ids, essential phrases, root words, dialogues, stories with word glosses, grammar topics and drills, the 100 common verbs, the conjugation engine (13 tenses, irregulars, reflexives, commands, subjunctive), similar-word groups, pronunciation (syllables, stress, respelling), number-to-Spanish, the spaced repetition engine, Focus sessions, immersion mode, the clinic game, the card duel, and the progress dashboard. Cover the conjugation engine, number-to-Spanish, grading and SRS code with Vitest tests.

## Aesthetic (see reference/)
Dreamy pastel pixel art in the spirit of the references: pink and lavender cloud skies, twinkling stars, a crescent moon, soft glows, dithered gradient dusks over water, sparkles. Palette: pink #fb9ecd, blush #fcb4db, lavender #b399f5, cream #f6e4f8, sky #0ea1ff, deep navy #000099, star yellow #ffe066, plus cream and sand neutrals for interiors. Render at a low internal resolution (about 180x320 portrait) scaled with nearest-neighbor. Use parallax cloud layers, twinkling star sprites, sparkle particles, soft bloom, dithered fades and a star-burst screen transition. UI uses a free pixel font bundled locally (Pixelify Sans or another OFL font), pixel panels and big touch targets. Do NOT copy any Nintendo or other copyrighted characters, sprites or music. Create original characters: faceless or simply stylized adults, a cute original companion creature, and original enemies.

## The world
A floating sky-island hub, El Cielo, with portals to realms:
- **El Jardín** (the heart of the game): every word I learn is a pixel plant. Spaced-repetition box level is the growth stage, due words wilt and need watering. Watering IS the review session, and it supports all four test modes.
- **La Clínica**: patients speak Spanish only. Steps: check-in (name and birth date by ear), symptoms (tap the body, turn the patient around, pick symptom picture and days), usted questions, interpreting the answer, vitals read aloud in Spanish, commands with animated reactions, plan, thanks. Patience hearts and stars.
- **El Café**: listen to orders in Spanish and serve them.
- **El Barrio**: walk a neighborhood, talk to people, ask directions, with dialogue choices and speaking.
- **El Duelo**: tarot-style card battler powered by my words.
- **La Biblioteca**: graded stories with tap-for-meaning, an immersion mode with no English, and sentence ordering.
- **La Isla de Inmersión**: timed Spanish-only sessions (listen, read, speak, write).

## Learning engine (must be correct)
- Leitner schedule with intervals [0,1,2,4,8,16,35,70,140] days across 9 boxes (0 to 8), with about 10 percent random fuzz on gaps of 16 days or more.
- A miss steps the box back: box 5 or higher halves it, box 2 to 4 subtracts 1, otherwise 0.
- Test modes I can choose: multiple choice, recall the translation (type English), recall the word (type Spanish, accent aware, typo tolerant, with an "I was right" override), and flashcards.
- An on-screen accent row (á é í ó ú ñ ¿ ¡) for every typed answer.
- Speaking with the Web Speech API and graceful fallback. Device Spanish voices with a picker for Colombian or Mexican accents.
- Track misses and feed a Focus session. Progress dashboard: 14-day chart, strongest and weakest skills, word strength levels, milestones.
- Use usted with patients everywhere.

## Tech
Vite + TypeScript + Phaser 3 for scenes, DOM overlays for text input, vite-plugin-pwa for offline and install. Generate placeholder pixel sprites procedurally in code so the game runs before I add art, and load real art from `public/assets` by documented names. Synthesize tiny chiptune SFX and an optional soft ambient loop with WebAudio so no audio files are needed. Add a reduce-motion toggle and a text size setting. Keep 60 fps on an iPhone.

## How to work
1. First write `PLAN.md` with milestones and ask me about anything unclear. Do not start building until I approve.
2. Build in playable milestones, each committed: (a) engine and tests, hub and El Jardín with real reviews; (b) La Clínica; (c) Biblioteca and Inmersión; (d) Duelo, Café, Barrio.
3. Write `ART_PROMPTS.md` listing every sprite, tile and background you need with exact sizes and consistent pixel-art prompts I can paste into Gemini, in the style of reference/.
4. Write a short README for a non-developer: how to preview on my phone, deploy free to GitHub Pages, and install to my home screen.
5. Add smoke tests that play each realm end to end. Explain any limit you hit plainly instead of hiding it.

## Where things live in mi-espanol-legacy.html (line numbers)
- Lines 1 to ~290: data constants: DICT (word glosses), STORIES, CARDS, BUILD (sentence bank), IMG (62 picture words with mnemonics and examples), SVRAW/SIETE (seven step words), QW, QQ, TENSES, TOPICS, VGROUPS/VERBS, CONN, CQ, COMP, TQ
- 297 GRAMÁTICA data (question words, tenses, 100 verbs, connectors, topics)
- 417 CIMIENTOS data: PCATS/PHR (phrases), RGRP/RAIZ (root words), DLG (dialogues), extra stories
- 501 SIETE PASOS data
- 533 DIFERENCIAS data (DIFS)
- 582 pronunciation engine (syllabify, stress, respelling) ; also near 600: conjugation engine (SPEC, conj, forms, subjForms, impForms)
- 659 cloud sync (uses window.claude db, replace with local storage and export/import)
- 680 audio (speechSynthesis), 689 state and defaults (S object, SRS constants INT, MAXBOX, lapse, dueIn)
- 712 HOY, 734 LEER (reader, immersion reading), 746 PRACTICAR hub
- 755 review (Repaso with 4 test modes, grading), 802 think, 811 listen, 820 speak, 832 IMAGINAR
- 863 GRAMÁTICA UI, 886 generic quiz, 983 ARMAR build workshop, 1030 CONJUGAR
- 1045 CIMIENTOS UI, 1057 conversations, 1076 OÍDO FINO, 1161 FOCUS SESSION
- 1196 INMERSIÓN TOTAL, 1262 DUELO DE PALABRAS (card battler), 1313 LA CLÍNICA (clinic game, n2s number-to-Spanish, SVG figure)
- 1405 PROGRESO (progress dashboard), 1448 speech recognition, 1455 actions (event handlers)
