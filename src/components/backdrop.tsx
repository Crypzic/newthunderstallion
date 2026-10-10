import type { CSSProperties } from "react";

// Fixed, decorative background: aurora light, a tech grid with light pulses
// running along its lines, glowing nodes, a moving perspective floor and
// lightning bolts that strike in turn. CSS animations only (see globals.css).

const v = (vars: Record<string, string | undefined>) => vars as CSSProperties;

// Grid cells are 56px (major lines every 224px), so beams and nodes sit on lines.
const BEAMS_X = [{ top: 112, dur: "7s", delay: "0s" }, { top: 336, dur: "9s", delay: "2.5s" }, { top: 560, dur: "8s", delay: "5s" }, { top: 840, dur: "11s", delay: "1s" }];
const BEAMS_Y = [{ left: 224, dur: "8s", delay: "1.5s" }, { left: 672, dur: "10s", delay: "4s" }, { left: 1120, dur: "9s", delay: "0.5s" }, { left: 1568, dur: "12s", delay: "6s" }];
const NODES = [[224, 224], [672, 448], [1120, 224], [448, 672], [896, 672], [1344, 448], [1568, 224]];

const BOLTS = [
  { // big yellow bolt, top right
    cls: "", style: { right: "6%", top: "-2%", height: "min(60vh, 560px)", "--dur": "9s", "--delay": "0s" }, view: "0 0 160 520",
    paths: ["M118 0 L96 70 L112 78 L72 170 L94 178 L50 290 L70 298 L28 420 L46 428 L20 520", "M94 178 L130 230 L120 236 L150 300", "M50 290 L18 330 L28 336 L4 380"],
  },
  { // yellow bolt, top left
    cls: "", style: { left: "3%", top: "4%", height: "min(46vh, 420px)", "--dur": "11s", "--delay": "4s" }, view: "0 0 140 420",
    paths: ["M30 0 L52 80 L36 86 L70 190 L50 196 L88 300 L70 306 L100 420", "M50 196 L20 250 L30 256 L8 310"],
  },
  { // blue bolt, middle right
    cls: "blue", style: { right: "22%", top: "30%", height: "min(36vh, 340px)", "--dur": "13s", "--delay": "7s" }, view: "0 0 120 340",
    paths: ["M80 0 L60 60 L74 66 L44 150 L62 156 L30 250 L46 256 L24 340", "M62 156 L96 200 L88 206 L112 250"],
  },
];

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="bd-aurora a" />
      <div className="bd-aurora b" />
      <div className="bd-aurora c" />
      <div className="bd-grid" />
      {BEAMS_X.map((b) => <span key={`x${b.top}`} className="bd-beam" style={v({ top: `${b.top - 1}px`, "--dur": b.dur, "--delay": b.delay })} />)}
      {BEAMS_Y.map((b) => <span key={`y${b.left}`} className="bd-beam v" style={v({ left: `${b.left - 1}px`, "--dur": b.dur, "--delay": b.delay })} />)}
      {NODES.map(([x, y], i) => <span key={`n${i}`} className="bd-node" style={v({ left: `${x}px`, top: `${y}px`, "--delay": `${(i * 0.7) % 3.6}s` })} />)}
      <div className="bd-floor" />
      {BOLTS.map((b, i) => {
        const [, , w, h] = b.view.split(" ").map(Number);
        return (
          <svg key={i} className={`bd-bolt ${b.cls}`} viewBox={b.view} style={v({ ...b.style, width: `calc(${b.style.height} * ${w} / ${h})` })}>
            {b.paths.map((d) => <path key={`g${d}`} className="glow" d={d} />)}
            {b.paths.map((d) => <path key={`c${d}`} className="core" d={d} />)}
          </svg>
        );
      })}
      <div className="bd-flash" />
      <div className="bd-grain" />
    </div>
  );
}
