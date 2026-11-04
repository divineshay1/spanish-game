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

## Better Spanish voices (iPhone)

Settings → Accessibility → Spoken Content → Voices → Spanish → download an **Enhanced** or **Premium** voice for Mexico or Colombia.

## Your data

Everything is saved only on your phone. A Backup button (coming in step 2) saves a file you can keep.

---

### For developers

```bash
npm install
npm run dev      # preview at the printed address (add ?debug later for test tools)
npm test         # unit tests (Vitest)
npm run build    # production build into dist/
npm run smoke    # phone-size smoke test with Playwright (after build)
python3 scripts/make_icons.py   # redraw the app icons
```

See `PLAN.md` for milestones and `SPEC.md` for the full brief.
`mi-espanol-legacy.html` is the original prototype and the source of truth for content.
