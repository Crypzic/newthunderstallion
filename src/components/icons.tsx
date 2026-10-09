import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const Bolt = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);
export const Flame = (p: P) => <svg {...base(p)}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" /></svg>;
export const Crosshair = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></svg>;
export const Coins = (p: P) => <svg {...base(p)}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3" /></svg>;
export const Megaphone = (p: P) => <svg {...base(p)}><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M17 8a5 5 0 0 1 0 8" /></svg>;
export const Plus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const Wallet = (p: P) => <svg {...base(p)}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h2M3 9h15a3 3 0 0 0-3-3H6" /></svg>;
export const Search = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const Menu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const Close = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const Check = (p: P) => <svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>;
export const ArrowRight = (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ArrowLeft = (p: P) => <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const External = (p: P) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
export const Copy = (p: P) => <svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>;
export const Star = (p: P) => <svg {...base(p)}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>;
export const User = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const Shield = (p: P) => <svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /></svg>;
export const Globe = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
export const Telegram = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.3 13.1l-4.7-1.5c-1-.3-1-1 .2-1.5L20.4 3c.9-.3 1.7.2 1.5 1.3z" /></svg>
);
export const XLogo = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" /></svg>
);
export const Discord = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M19.5 5.3A17 17 0 0 0 15.4 4l-.5 1a15.6 15.6 0 0 0-5.8 0l-.5-1a17 17 0 0 0-4.1 1.3C1.9 9.2 1.2 13 1.5 16.7A17 17 0 0 0 6.6 19l1-1.6a11 11 0 0 1-1.7-.8l.4-.3a12 12 0 0 0 11.4 0l.4.3-1.7.8 1 1.6a17 17 0 0 0 5.1-2.3c.4-4.3-.7-8.1-3-11.4zM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" /></svg>
);
