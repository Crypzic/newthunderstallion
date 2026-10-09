import { NextResponse, type NextRequest } from "next/server";
import { getCoin, getHottest, getTokens, getTrenches, getTrending, searchTokens } from "@/lib/market/server";

const headers = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" };

export async function GET(req: NextRequest, ctx: RouteContext<"/api/market/[kind]">) {
  const { kind } = await ctx.params;
  const q = req.nextUrl.searchParams;
  try {
    switch (kind) {
      case "trending":
        return NextResponse.json(await getTrending(), { headers });
      case "trenches":
        return NextResponse.json(await getTrenches(), { headers });
      case "hottest":
        return NextResponse.json(await getHottest(), { headers });
      case "search":
        return NextResponse.json(await searchTokens(q.get("q") || ""), { headers });
      case "coin":
        return NextResponse.json(await getCoin(q.get("chain") || "", q.get("address") || ""), { headers });
      case "tokens": {
        // keys=chain:address,chain:address — sorted so equal sets share a cache entry
        const keys = (q.get("keys") || "").split(",").map((k) => k.trim()).filter((k) => k.includes(":")).slice(0, 120);
        return NextResponse.json(keys.length ? await getTokens([...new Set(keys)].sort()) : [], { headers });
      }
      default:
        return NextResponse.json({ error: "Unknown market endpoint" }, { status: 404 });
    }
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message || e) }, { status: 502 });
  }
}
