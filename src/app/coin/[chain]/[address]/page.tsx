import { Suspense } from "react";
import { Spinner } from "@/components/primitives";
import { CoinView } from "./view";

// Token pages render per request (the navbar reads the URL), so they may block.
export const instant = false;

export default function CoinPage({ params }: PageProps<"/coin/[chain]/[address]">) {
  return (
    <Suspense fallback={<Spinner />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/coin/[chain]/[address]">["params"] }) {
  const { chain, address } = await params;
  return <CoinView chain={decodeURIComponent(chain)} address={decodeURIComponent(address)} />;
}
