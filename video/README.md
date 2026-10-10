# Explainer video

A 60-second motion-graphics explainer built from the site's own UI. No screen recording: the
real pages are captured as cut-outs, animated on a timeline and rendered frame by frame.

```bash
# 1. run the site with sample data (demo mode, no Supabase keys)
MARKET_FIXTURES=1 npm run build && MARKET_FIXTURES=1 npx next start -p 3100

# 2. capture UI pieces (desktop → 16:9, mobile → 9:16)
node video/capture.mjs http://localhost:3100 video/assets/desktop desktop
node video/capture.mjs http://localhost:3100 video/assets/mobile mobile
#    then copy the square logo artwork to video/assets/<set>/logo.jpg

# 3. render (needs ffmpeg). --preview t1,t2 writes stills instead of a video
node video/render.mjs video/assets/desktop desktop video/out/explainer-16x9.mp4
node video/render.mjs video/assets/mobile iphone video/out/explainer-iphone-9x16.mp4   # on an iPhone 12 Pro
```

- `compose.html` / `compose.js` — the timeline. Every frame is `render(t)`, so renders are exact.
- `VOICEOVER.md` — the script, timed to the scenes.
- Silent output: add the voiceover and music in an editor.
