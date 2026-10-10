/** Fixed, decorative background: aurora light, grids, a scan line, lightning flashes and grain. CSS-only. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="bd-aurora a" />
      <div className="bd-aurora b" />
      <div className="bd-aurora c" />
      <div className="bd-grid" />
      <div className="bd-floor" />
      <div className="bd-scan" />
      <div className="bd-flash" />
      <div className="bd-grain" />
    </div>
  );
}
