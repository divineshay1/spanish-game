# Mi Español: El Cielo 🌙

A dreamy pastel pixel-art game for learning Latin American Spanish, made for a medical assistant.
It's free, works offline, and keeps all your progress on your phone.

**Play:** https://divineshay1.github.io/spanish-game/

## Put it on your iPhone home screen

1. Open the link above in **Safari**.
2. Tap the **Share** button (square with an arrow).
3. Tap **Add to Home Screen**, then **Add**.
4. Open it from your home screen. After the first open it works with no internet.

## Turn on free publishing (one time only)

1. On GitHub, open this repo → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.

After that, every change saved to the `main` branch publishes itself in about 2 minutes.
You can watch it in the **Actions** tab (green check = live).

## How El Jardín works

- **Sembrar** (seed bag): meet up to 5 new words a day, then a quick check plants them.
- **Regar** (watering can): plants with a water drop are thirsty. Watering = reviewing those words.
  Right answers make a plant grow (9 stages, up to a glowing star flower). Misses shrink it a little. Plants never die.
- **Focus** (gold can): a rescue round for the words you keep missing.
- Tap any plant to see its word, picture, pronunciation and next watering day.

Testing tip: add `?day=3` to the address to pretend it is 3 days later, or `?debug` for a time-travel button in the garden.

## Better Spanish voices (iPhone)

Settings → Accessibility → Spoken Content → Voices → Spanish → download an **Enhanced** or **Premium** voice for Mexico or Colombia.

## Your data

Everything is saved only on your phone. In **Ajustes** (the gear, top right) tap **Backup** to save a file you can keep, and **Restore** to load it back. Restore also accepts an old Mi Español save.

---

### For developers

```bash
npm install
npm run dev      # preview at the printed address (add ?debug later for test tools)
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
npm run smoke    # phone-size smoke test with Playwright (after build)
python3 scripts/make_icons.py   # redraw the app icons
node scripts/extract_legacy.mjs # re-copy content + golden test answers from the prototype
node scripts/decode_pics.mjs    # pics.json -> public/pics/*.jpg
node scripts/plant_sheet.mjs out.png  # picture of every plant stage
```

See `PLAN.md` for milestones and `SPEC.md` for the full brief.
`mi-espanol-legacy.html` is the original prototype and the source of truth for content.
