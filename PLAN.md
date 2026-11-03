# 🌙 El Jardín — Plan

A dreamy pastel pixel-art game for learning **Latin American Spanish for a medical assistant job**.
Every word you learn is a plant in your garden. Review words to water them and help them grow.

---

## The big idea (in plain words)

- **Learn a word → plant a seed.**
- **Review it at the right time → it grows** (seed → sprout → leaves → bud → flower → glowing bloom).
- **Forget to review → it wilts** (droops, colors fade). It never dies. Watering brings it back.
- **Watering = a short review session** of the words that need you today.
- The game decides *when* each word needs water using **spaced repetition**: words you know well wait longer, words you miss come back sooner.

---

## How it will look

- Phone screen, held upright (portrait).
- Sky: pink and lavender gradient, soft drifting clouds, twinkling stars, a crescent moon, gentle glow.
- Crisp, blocky pixel art (no blur when scaled up).
- All art drawn by me in code, from scratch. **No Nintendo or other copyrighted characters, art, music, or fonts.**
- A tiny pixel font I draw myself, so Spanish letters show correctly: **á é í ó ú ñ ü ¿ ¡**.
- An optional little companion (original character, e.g. a sleepy star or a moth gardener) who cheers you on.

## How it works on your phone

- It's a website you can **"Add to Home Screen"** so it acts like an app.
- **Works offline** after the first visit.
- **Your progress stays on your phone** (no account, no server, free).
- A **Backup** button saves your progress to a file, and **Restore** loads it back (useful if you switch phones).
- Hosted free on **GitHub Pages**.

---

## What I'll teach (word packs)

Spanish is Latin American, using **usted** (formal "you") with patients by default.
Each word has: Spanish, English, an example sentence, and notes (like "informal" or "Mexico mostly").

1. **Saludos** – greetings, introducing yourself, "please wait", "follow me"
2. **Registro** – name, date of birth, address, phone, insurance, ID
3. **Números y fechas** – numbers, days, months, times
4. **El cuerpo** – body parts
5. **Síntomas** – pain, fever, cough, nausea, dizziness…
6. **El dolor** – where, how long, how strong (pain scale 1–10)
7. **Signos vitales** – blood pressure, temperature, weight, height, pulse
8. **Instrucciones** – "sit here", "breathe deeply", "roll up your sleeve", "open your mouth"
9. **Medicamentos y alergias** – medicines, doses, allergies
10. **Historial médico** – conditions (diabetes, asthma…), surgeries, pregnancy
11. **Despedidas y citas** – appointments, follow-ups, "the doctor will be right in"

> ⚠️ I'll write this carefully, but it's a learning tool, not a certified medical translation.
> It's a good idea to have a native speaker or your clinic's interpreter glance at the word list.

---

## Kinds of practice

- **Flashcard** – see Spanish, flip, tap "I knew it" / "I didn't".
- **Pick the meaning** – 4 choices.
- **Listen** – hear the word (your phone's built-in Spanish voice), pick the meaning.
- **Type it** – with easy buttons for á é í ó ú ñ. Missing an accent counts as "almost right", not wrong.
- **Patient phrases** – short real-life lines a patient might say, and what you'd say back.

---

## Growth stages (spaced repetition)

| Stage | Plant | Next water in |
|---|---|---|
| 0 | Seed in soil | today |
| 1 | Sprout | 1 day |
| 2 | Seedling | 3 days |
| 3 | Leafy plant | 1 week |
| 4 | Bud | 2 weeks |
| 5 | Flower | 1 month |
| 6 | Glowing bloom ✨ (mastered) | 3 months |

- Right answer → grows one stage.
- Wrong answer → shrinks one stage and comes back soon.
- Due → slightly droopy. Very overdue → more wilted. Never dies.
- Each word pack has its own flower type and color, so your garden shows what you've learned.

---

## Milestones (small, playable steps)

Each step ends with something you can open on your phone and try.

### M0 — The sky ☁️
Project setup (Vite + TypeScript + Phaser 3). Shows the dreamy sky: gradient, stars twinkling, moon, clouds drifting.
Auto-deploys to GitHub Pages when I push.
**Try it:** open the link on your phone and see the sky.

### M1 — Install & offline 📲
App icon, name, splash color. Add to Home Screen. Works with airplane mode on.
**Try it:** install it, turn on airplane mode, open it.

### M2 — First lesson 📖
My pixel font with accents. First word pack (**Saludos**, ~15 words). Flashcards + "pick the meaning". Progress saves on your phone.
**Try it:** learn 15 words, close the app, reopen — progress is still there.

### M3 — El Jardín 🌱
The garden screen. Each learned word appears as a seed/plant. Tap a plant to see the word, meaning, and example.
**Try it:** your 15 words appear as little plants.

### M4 — Growing & wilting 💧
Spaced repetition turns on. Due words wilt. A watering can button starts a review of today's due words. Plants grow or shrink after.
(Includes a hidden "time travel" setting so we can test wilting without waiting days.)
**Try it:** water your garden and watch plants grow.

### M5 — More practice 🎧
Listening (phone voice) and typing (with accent buttons, accent-forgiving).
**Try it:** hear words and type them.

### M6 — Medical word packs 🩺
Add the rest of the packs above (aim ~300 words + phrases). New packs unlock as you go, or pick any pack anytime.
**Try it:** learn pain-scale and vital-signs words.

### M7 — Cozy polish ✨
Soft sounds and a gentle music loop (made in code), little animations (sparkles, falling petals), companion character, Backup/Restore, settings (sound, text size, daily goal).
**Try it:** play a full day's session.

### M8 — Nice extras (later, optional) 🌸
Gentle daily streak, garden decorations you earn, stats page ("words mastered"), a "clinic day" mini-scenario that strings phrases into a short patient visit.

---

## Tech notes (for me)

- **Vite + TypeScript + Phaser 3**, `pixelArt: true`, base canvas **216×384** (9:16), scaled up by whole numbers; extra space filled with sky.
- Sprites defined as small text pixel maps in TS → turned into textures at startup. No image files to license.
- Custom bitmap font (5×7-ish) including Spanish characters.
- Typing uses a small HTML input over the game (better phone keyboard support).
- Saving: **IndexedDB** (via `idb-keyval`), ask the browser for persistent storage, JSON Backup/Restore.
- PWA: `vite-plugin-pwa` (manifest + service worker that caches everything for offline).
- Voice: Web Speech API, prefer `es-MX` / `es-US` / `es-419` voices; game still works if none exist.
- Deploy: GitHub Actions → GitHub Pages, `base: '/spanish-game/'`.
- Tests: Vitest for spaced-repetition math and answer checking; Playwright screenshot check at phone size.
- Data: `src/data/packs/*.ts` — easy to add/edit words.

---

## Feels like a video game 🎮

El Jardín is a **separate app** from Mi Español, and much more visual, like a cozy video game:

- **You walk around your garden** as a small original character. Tap where you want to go.
- **Tap a wilting plant to water it.** That starts a quick review of that word, with splashes and sparkles.
- **Practice turns into mini-games:** catch falling seeds with the right meaning, pick the right flower, help a patient character at the little clinic by the garden.
- **Day and night:** the sky shifts through pink sunset, lavender dusk, and starry night.
- **Rewards you can see:** new flower types, garden paths, lanterns, a fountain, a cozy bench.
- Very little reading of menus. The garden itself is the menu.

## Ideas from your app "Mi Español"

You shared screenshots of your app (as a PDF). It's a different app, but some ideas fit here too:

- **Today's route:** a short daily list of steps (Repaso, Leer, Imaginar, Escuchar, Hablar…). In El Jardín these become **garden chores**: water (review), plant (new words), listen, speak, read.
- **XP ring, streak, levels:** I'll keep them gentle. A missed day never makes you lose anything.
- **Frase del día:** a phrase of the day with **Listen** and **Slow** buttons, shown as a little sign in the garden.
- **Accent choice:** Mexicana / Colombiana for audio.
- **Voice picker + speed:** Slow / Normal / Natural, choose the phone voice, and a **Test voice** button.
- **iPhone tip:** download a free Enhanced/Premium Spanish voice in iPhone Settings for better sound.
- **Hablar (say it out loud):** speech practice. On iPhone this may need internet, so it will be optional.
- **"Saved on this device only"** + Reset progress. I'll also add Backup/Restore.

## Decisions so far

- ✅ Audio: yes, phone's built-in Spanish voice.
- ✅ Answering: tap choices + some typing (with accent buttons).
- ✅ Hosting: new public repo `divineshay1/spanish-game` → `divineshay1.github.io/spanish-game`.
- ✅ Separate app from Mi Español, more visual and game-like.
- ✅ Accent: Mexican by default, Colombian available in settings.
- ✅ Spanish level: a little. Start easy, move quickly to medical words.

## Open questions

- **Mi Español repo name:** which GitHub repo has it? I may reuse its word lists and voice settings code.
- **Your clinic:** what kind (family, pediatrics, urgent care…)? Patients mostly from where (Mexico, Central America, Caribbean, South America)?
- **Companion character:** want one? Any name or animal idea?
- **Daily goal:** about how many minutes a day? (I'd guess 5–10.)
