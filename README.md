# ⚡ Thunder Stallion — V3

Multi-chain crypto discovery board with paid boosts, community votes and an admin panel.
Built with **Next.js 16 + React 19 + Tailwind 4**, data in **Supabase**, market data from **DexScreener** and **CoinGecko**. English and 中文 throughout.

## What's in it

| Page | What it does |
|---|---|
| `/` **ThunderTrend** | Live trending board. Boosted tokens are pinned by Thunder Points; Tier 3+ names shimmer gold (Thunder Ticker); Tier 5 gets the glowing Thunder Elite frame and the front-page spotlight. Banner carousel, Top 10 Hot Spot (votes), newest listings. |
| `/trenches` | Fresh launches, newest first. |
| `/hottest` | Largest stablecoins ranked by 24h volume. |
| `/advertising` | Thunder Advertising: **Thunder Profile** (Free / Elite $148), **Thunder Trend** Tiers 1–5, **Banner Ads** (1500×500, 24h / 3d / 7d). Checkout creates an order. |
| `/coin/[chain]/[address]` | Token page: chart, stats, links, votes. Elite Profiles get a banner, gold frame and every social link. |
| `/submit`, `/dashboard` | Free listing submission; a user's own listings and orders. |
| `/admin` | Overview (revenue, pending work), listing review (approve / reject / feature / add votes / edit), orders (mark paid & activate, extend, end), **pricing editor** (prices, "was" prices, points, durations, sale toggle), users (grant admin). |

### Placeholders (on purpose, for now)

- **Wallet connect** shows the wallet list as "coming soon". People sign in with a username and password.
- **Payments** are manual. Checkout records an order as *Awaiting payment* and tells the buyer to DM the admin on Telegram. The admin confirms payment and clicks **Mark paid & activate**, which starts the boost timer. The order already stores the pay token and network, plus an empty `tx_hash` column for when on-chain payments are wired in.

## Run it locally

```bash
npm install
cp .env.example .env.local      # leave the Supabase values empty to use demo mode
npm run dev                      # http://localhost:3000
```

**Demo mode.** With no Supabase keys, accounts, listings, orders and votes live in the browser's localStorage, so every screen works, admin included (sign up with the username `admin`). Demo mode is for previews only: nothing is shared between visitors.

**Offline market data.** `MARKET_FIXTURES=1 npm run dev` serves sample tokens instead of calling DexScreener and CoinGecko.

## Go live

### 1. Supabase (about 10 minutes)
1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and run it. It creates the tables, security rules, pricing rows and functions, and is safe to run again.
3. **Authentication → Providers → Email**: turn **off** "Confirm email". Accounts are username-only, so the email is internal and never receives mail.
4. **Project Settings → API**: copy the Project URL and the `anon` public key into your env (step 2).
5. Sign up on the site, then make yourself admin in the SQL editor:
   ```sql
   update profiles set is_admin = true where username = 'YourName';
   ```

### 2. Environment variables

| Variable | |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` key. It is meant to be public; the database rules protect the data. |
| `NEXT_PUBLIC_ADMIN_TELEGRAM` / `_URL` | Where buyers are sent to complete payment |

### 3. Vercel
Import the repo at [vercel.com/new](https://vercel.com/new), add the env vars, deploy. No other config is needed.

## Moving over from the old Google Sheets site

Old passwords can't be carried over, so **everyone signs up again**. Listings and votes do come across.

1. In the old Google Sheet, download the **LISTINGS** and **VOTES** tabs as CSV (File → Download → CSV).
2. `node scripts/migrate-from-sheets.mjs listings.csv votes.csv > supabase/import.sql`
3. Run `supabase/import.sql` in the Supabase SQL editor, after `schema.sql`.

Each imported listing keeps its old username. When that person signs up again **with the same username**, their listings are re-attached to the new account automatically.

## How things fit together

```
src/
├── app/                  pages (one folder per route) + /api/market/[kind]
├── components/           board, chrome (nav/footer/dialogs), checkout, home sections
└── lib/
    ├── config.ts         networks, pay tokens, banner spec, site settings
    ├── tiers.ts          default product catalog + perk rules per tier
    ├── i18n/             en.ts + zh.ts (every visible string)
    ├── market/           DexScreener/CoinGecko (server, cached) + client hooks
    └── store/            data layer: supabase.ts (live) and demo.ts (localStorage)
supabase/schema.sql       tables, row-level security, triggers, RPCs
scripts/                  Google Sheets → Supabase import
```

- **Why it's faster than V2.** Market data is fetched on the server and cached for 30 seconds, so every visitor shares one upstream call. Lookups are batched (30 tokens per request), fonts are self-hosted, and the old canvas and cursor animations are gone. The slow Apps Script backend is replaced by Supabase.
- **Security.** Prices, points and durations are always read from the `tiers` table inside the database. Whatever price a browser sends is ignored. Regular users can only create pending listings and unpaid orders; approving, activating and pricing are admin-only, enforced by row-level security.
- **Rebranding.** All colors and fonts are tokens at the top of `src/app/globals.css`.
- **Text and translations** live in `src/lib/i18n/en.ts` and `zh.ts`.

### Known gaps
- Robinhood Chain's DexScreener chain id is assumed to be `robinhood` (`src/lib/config.ts`). Change it there if their listings use a different id.
- Anonymous votes are limited to one per browser, which a determined person can get around. Require login to vote if that becomes a problem.
- Telegram announcements for Tier 2+ and Elite Profiles are posted by hand for now.
