// Captures the real site's UI as transparent, high-resolution cut-outs for the explainer video.
// Usage: node video/capture.mjs <baseUrl> <outDir> <desktop|mobile>
// Run against a local build started with MARKET_FIXTURES=1 and no Supabase keys (demo mode).
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [BASE = "http://localhost:3100", OUT = "video/assets/desktop", MODE = "desktop"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const mobile = MODE === "mobile";
const vp = mobile ? { width: 430, height: 932 } : { width: 1440, height: 900 };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 3 : 2, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

// Capture styling: no backdrop, no demo bar, transparent page, all motion frozen at a good-looking frame.
const CLEAN = `
  html, body { background: transparent !important; }
  header { position: relative !important; }
  :root { --surface: #10131b !important; }  /* solid panels: nothing behind a modal bleeds into the capture */
  .backdrop { display: none !important; }
  *, *::before, *::after { animation-play-state: paused !important; transition: none !important; }
  .reveal, .enter { animation: none !important; opacity: 1 !important; translate: none !important; }
`;
async function prep() {
  await page.mouse.move(1, 1); // no leftover hover highlights
  await page.addStyleTag({ content: CLEAN });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body > div")) if (el.textContent?.startsWith("Demo mode")) el.remove();
    // freeze the gold shimmer mid-sweep so it reads as gold, not as a gradient edge
    for (const a of document.getAnimations()) a.currentTime = 900;
  });
}
async function go(path) {
  await page.goto(BASE + path);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
  await prep();
}
// Positions of things the video's cursor clicks, as fractions of the captured element.
const targets = {};
const shot = async (locator, name, marks = {}) => {
  await page.mouse.move(1, 1);
  const el = locator.first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(150);
  const box = await el.boundingBox();
  for (const [key, sub] of Object.entries(marks)) {
    const b = await el.locator(sub).first().boundingBox().catch(() => null);
    if (b && box) targets[`${name}.${key}`] = { x: (b.x - box.x) / box.width, y: (b.y - box.y) / box.height, w: b.width / box.width, h: b.height / box.height };
  }
  await el.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true, animations: "disabled" });
  console.log("captured", name);
};
const dialog = () => page.getByRole("dialog").locator(".card");

// ── Home ──
await go("/");
await page.locator("tbody tr").first().waitFor();
await shot(page.locator("header"), "nav");
await shot(page.locator("section.card", { hasText: "ThunderTrend" }), "board-home", { row1: "tbody tr >> nth=0", rows: "tbody" });
await shot(page.locator("section.card", { hasText: "Top 10 Hot Spot" }), "hotspot");
await shot(page.locator("section.card", { hasText: "Newest listings" }), "latest");
await shot(page.locator("a.elite-frame"), "spotlight");

// ── Trenches / Hottest ──
await go("/trenches");
await page.locator("tbody tr").first().waitFor();
await shot(page.locator("section.card"), "trenches");
await go("/hottest");
await page.getByText("USDT").first().waitFor();
await shot(page.locator("section.card"), "hottest");

// ── Search ──
await go("/");
await page.locator("tbody tr").first().waitFor();
await page.keyboard.press("/");
await page.getByRole("dialog").getByText("Trending now").waitFor();
await page.getByRole("dialog").locator("li").first().waitFor();
await shot(dialog(), "search-trending");
await page.getByRole("dialog").getByRole("textbox").fill("ansem");
await page.getByRole("dialog").getByText("Ansem").first().waitFor();
await page.waitForTimeout(300);
await shot(dialog(), "search-results");
await page.keyboard.press("Escape");

// ── Coin page + vote ──
await go("/coin/solana/9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump");
await page.getByText("Elite Profile").first().waitFor();
await shot(page.locator("section.card").first(), "coin-head", { vote: "button:has-text('Vote')" });
await page.getByRole("button", { name: /^Vote/ }).click();
await page.getByRole("button", { name: /Voted/ }).waitFor();
await prep();
await shot(page.locator("section.card").first(), "coin-head-voted");

// ── Account + submit ──
await go("/signup");
await page.getByLabel("Username").fill("admin");
await page.getByLabel("Password", { exact: true }).fill("secret123");
await page.getByLabel("Confirm password").fill("secret123");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/dashboard");
await go("/submit");
await shot(page.locator("form"), "submit-empty", { autofill: "button:has-text('Auto-fill')", contract: "input >> nth=0" });
await page.getByLabel("Contract address *").fill("Fx0001" + "A".repeat(36) + "pump");
await page.getByRole("button", { name: "Auto-fill from chain" }).click();
await page.getByText("Details filled").waitFor();
await page.getByLabel("Logo URL").fill("https://frock.xyz/logo.png"); // sample tokens carry an inline logo; show a normal link
await prep();
await shot(page.locator("form"), "submit-filled");

// ── Advertising ──
await go("/advertising");
await page.getByText("$750").first().waitFor();
for (let n = 1; n <= 5; n++) await shot(page.locator("div.card", { hasText: `Tier 0${n}` }).filter({ hasText: "Get started" }).last(), `tier-${n}`, { cta: "button:has-text('Get started')", row: "div.rounded-xl.bg-bg-2 >> nth=0" });
await shot(page.locator("div.card", { hasText: "Free Profile" }).filter({ hasText: "Token page preview" }).first(), "profile-free");
await shot(page.locator("div.card", { hasText: "Elite Profile" }).filter({ hasText: "Token page preview" }).first(), "profile-elite");

// Checkout: Tier 5 for HEEHAW, paid in USDT
await page.locator("div.card", { hasText: "Tier 05" }).filter({ hasText: "Get started" }).last().getByRole("button", { name: "Get started" }).click();
const d = page.getByRole("dialog");
await d.getByRole("button", { name: "BSC" }).first().click();
await d.getByLabel("Token contract address").fill("0x0002" + "b".repeat(36));
await d.getByText(/Found/).waitFor();
await d.getByRole("button", { name: "USDT" }).click();
await page.waitForTimeout(200);
await shot(dialog(), "checkout", { submit: "button:has-text('Submit order')" });
await d.getByRole("button", { name: /Submit order/ }).click();
await page.getByText("Order received").waitFor();
await shot(dialog(), "order-ok");
await page.keyboard.press("Escape");

// ── Admin: end the seeded Tier 5 so the new order can take #1 ──
await go("/admin");
await page.getByRole("button", { name: /^Orders/ }).click();
await page.getByRole("button", { name: /^Active/ }).first().click();
await page.locator("tr", { hasText: "ANSEM" }).filter({ hasText: "Trend" }).getByRole("button", { name: "End now" }).click();
await page.waitForTimeout(400);

await go("/");
await page.locator("tbody tr").first().waitFor();
await shot(page.locator("section.card", { hasText: "ThunderTrend" }), "board-before", { row1: "tbody tr >> nth=0", row2: "tbody tr >> nth=1" });

// the orders table scrolls sideways on phones; capture it wide enough to include the activate button
if (mobile) await page.setViewportSize({ width: 860, height: 932 });
await go("/admin");
await page.getByRole("button", { name: /^Orders/ }).click();
await page.locator("tr", { hasText: "HEEHAW" }).waitFor();
await prep();
await shot(page.locator("div.card", { hasText: "HEEHAW" }).last(), "admin-orders", { activate: "button:has-text('Mark paid')" });
await page.getByRole("button", { name: "Mark paid & activate" }).first().click();
await page.waitForTimeout(400);
if (mobile) await page.setViewportSize(vp);

await go("/");
await page.locator("tbody tr", { hasText: "HEEHAW" }).waitFor();
await page.waitForTimeout(500);
await prep();
await shot(page.locator("section.card", { hasText: "ThunderTrend" }), "board-after", { row1: "tbody tr >> nth=0", row2: "tbody tr >> nth=1" });
await shot(page.locator("tbody tr", { hasText: "HEEHAW" }), "row-heehaw");
await shot(page.locator("a.elite-frame"), "spotlight-after");

writeFileSync(`${OUT}/targets.json`, JSON.stringify(targets, null, 1));
await browser.close();
console.log("done", Object.keys(targets).length, "targets");
