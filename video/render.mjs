// Renders video/compose.html frame by frame into an MP4 with ffmpeg.
// Usage:
//   node video/render.mjs <assetsDir> <desktop|mobile|iphone> <out.mp4> [--preview t1,t2,...]
// desktop → 1920x1080, mobile → 1080x1920, iphone → mobile UI on an iPhone 12 Pro in a 1080x1920 frame. 30 fps, silent.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const [assetsDir, set = "desktop", out = "out.mp4", flag, list] = process.argv.slice(2);
// iphone = mobile captures played on an iPhone 12 Pro inside a 1080x1920 frame
const frame = set === "iphone" ? "iphone" : "";
const capSet = set === "iphone" ? "mobile" : set;
const [W, H] = set === "desktop" ? [1920, 1080] : [1080, 1920];
const FPS = 30;

const assets = resolve(assetsDir);
if (!existsSync(`${assets}/logo.jpg`)) throw new Error(`Put the square logo at ${assets}/logo.jpg`);
const targets = JSON.parse(readFileSync(`${assets}/targets.json`, "utf8"));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.addInitScript((t) => { window.TARGETS = t; }, targets);
page.on("pageerror", (e) => console.error("pageerror:", e.message));
const url = `${pathToFileURL(resolve(here, "compose.html")).href}?set=${capSet}&frame=${frame}&w=${W}&h=${H}&base=${encodeURIComponent(pathToFileURL(assets).href + "/")}`;
await page.goto(url);
await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
const duration = await page.evaluate(() => window.DURATION);

if (flag === "--preview") {
  for (const ts of list.split(",").map(Number)) {
    await page.evaluate((t) => window.render(t), ts);
    await page.screenshot({ path: out.replace(/\.mp4$/, "") + `-${String(ts).replace(".", "_")}.jpg`, type: "jpeg", quality: 85 });
  }
  await browser.close();
  console.log("previews written");
  process.exit(0);
}

const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const frames = Math.round(duration * FPS);
const started = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.render(t), f / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 150 === 0) console.log(`frame ${f}/${frames} (${Math.round((Date.now() - started) / 1000)}s)`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log("wrote", out);
