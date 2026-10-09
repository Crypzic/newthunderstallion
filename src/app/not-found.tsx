import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center pt-24 text-center">
      <p className="h-display num text-7xl text-volt">404</p>
      <p className="mt-4 text-muted">This page galloped off.</p>
      <Link href="/" className="btn-primary mt-8">Back to ThunderTrend</Link>
    </div>
  );
}
