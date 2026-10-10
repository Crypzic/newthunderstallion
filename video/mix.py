import numpy as np, librosa, soundfile as sf

SR = 44100
DUR = 60.0
N = int(DUR * SR)
rng = np.random.default_rng(7)

def load(p, mono=False):
    y, _ = librosa.load(p, sr=SR, mono=mono)
    if y.ndim == 1: y = np.stack([y, y])
    return y

def fade(x, a=0.008, b=0.008):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[..., :na] *= np.linspace(0, 1, na)
    if nb: x[..., -nb:] *= np.linspace(1, 0, nb)
    return x

def put(track, clip, t, g=1.0):
    i = int(t * SR); n = min(clip.shape[-1], track.shape[-1] - i)
    track[..., i:i + n] += clip[..., :n] * g

def seg(y, a, b): return y[..., int(a * SR):int(b * SR)]

# ── voiceover: each line moved onto its scene ──
vo_src = load("/root/.claude/uploads/f97ac90c-4dd9-5e52-96c1-997ae86ddd30/5f9ae1d3-Thunderstallion.mp3")
LINES = [  # (src start, src end, video time)
    (0.05, 3.70, 0.30), (3.85, 10.65, 3.95), (10.72, 12.52, 10.78), (12.58, 13.96, 13.15),
    (14.03, 15.78, 15.75), (15.92, 19.33, 18.90), (19.52, 21.56, 24.00), (21.64, 24.30, 26.05),
    (24.40, 29.33, 30.15), (29.50, 32.99, 36.75), (33.24, 35.95, 41.00), (36.26, 39.16, 46.30),
    (39.25, 40.58, 50.15), (40.70, 41.90, 52.25), (42.17, 42.98, 55.00), (43.21, 43.78, 56.15),
    (43.91, 44.30, 56.95), (44.45, 44.95, 57.60),
]
vo = np.zeros((2, N))
for a, b, t in LINES: put(vo, fade(seg(vo_src, a, b), 0.01, 0.03), t)
vo *= 10 ** (-17 / 20) / (np.sqrt(np.mean(vo[0][np.abs(vo[0]) > 1e-3] ** 2)) + 1e-9)  # speech at about -17 dB RMS

# ── music: drop lands on the boost scene (0:30), pulls back for checkout, slams back in for "go live" ──
mus_src = load("music.wav")
OFF = 2.17                       # music 32.17s (the drop) → video 30.0
CUT = 46.35                      # on a beat of the drop
music = np.zeros((2, N))
put(music, fade(seg(mus_src, OFF, OFF + CUT + 0.05), 0.12, 0.05), 0)
put(music, fade(seg(mus_src, 96.2 - (50.5 - CUT), 96.2), 0.05, 0.01), CUT)  # tail of the breakdown
put(music, fade(seg(mus_src, 96.2, 96.2 + (DUR - 50.5)), 0.005, 1.6), 50.5)  # re-entry, fades out at the end

# duck the music under the voice
env = np.abs(vo[0])
k = int(0.02 * SR); env = np.convolve(env, np.ones(k) / k, "same")
on = (env > 0.01).astype(float)
g = np.zeros_like(on); att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
# one-pole smoothing of the "speaking" flag (fast attack, slow release), done in blocks for speed
blk = 64; gb = on[: len(on) // blk * blk].reshape(-1, blk).max(1); sm = np.zeros_like(gb); s = 0
for i, v in enumerate(gb):
    c = 1 - att ** blk if v > s else 1 - rel ** blk
    s += (v - s) * c; sm[i] = s
g[: len(sm) * blk] = np.repeat(sm, blk)
music *= 10 ** (-8 / 20) * (1 - 0.62 * g)  # about -8 dB under speech

# ── synthesized sound effects ──
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)
def hp(x, fc): return x - lp(x, fc)
def bp_sweep(x, f0, f1):
    from scipy.signal import butter, sosfilt
    out = np.zeros_like(x); n = len(x); step = 1024
    for i in range(0, n, step):
        f = f0 + (f1 - f0) * (i / n); lo, hi = max(f * 0.6, 40), min(f * 1.6, SR / 2 - 100)
        sos = butter(2, [lo, hi], btype="band", fs=SR, output="sos")
        out[i:i + step] = sosfilt(sos, x[max(0, i - 2048):i + step])[-len(x[i:i + step]):]
    return out
def st(x, w=0.0):
    return np.stack([x * (1 - w), x * (1 + w)])

def boom(d=1.2, f0=70, f1=32):
    t = t_(d); ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (t / d)) / SR
    return np.sin(ph) * np.exp(-t * 3.2) * np.minimum(t / 0.004, 1)

def thunder(d=2.2, big=True):
    t = t_(d); n = rng.standard_normal(len(t))
    crack = hp(n, 1800) * np.exp(-t * 22) * 1.4
    crack2 = hp(rng.standard_normal(len(t)), 900) * np.exp(-np.maximum(t - 0.09, 0) * 18) * (t > 0.09) * 0.9
    rumble = lp(lp(np.cumsum(rng.standard_normal(len(t))) * 0.02, 180), 180)
    rumble = rumble / (np.abs(rumble).max() + 1e-9) * np.exp(-t * (1.6 if big else 3)) * np.minimum(t / 0.05, 1)
    x = crack + crack2 + rumble * 1.3 + (boom(d) * 1.2 if big else 0)
    return x / np.abs(x).max()

def zap(d=0.45):
    t = t_(d); n = hp(rng.standard_normal(len(t)), 2500)
    flick = (np.sin(2 * np.pi * 38 * t) > 0.2).astype(float) * 0.6 + 0.4
    x = n * flick * np.exp(-t * 9) + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 14) * 0.5
    return x / np.abs(x).max()

def whoosh(d=0.55, up=True):
    t = t_(d); n = rng.standard_normal(len(t))
    x = bp_sweep(n, 400 if up else 3000, 3000 if up else 400)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    x = x * env
    return x / np.abs(x).max()

def click(d=0.06):
    t = t_(d)
    x = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 180) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 400) * 0.6
    return x / np.abs(x).max()

def pop(d=0.18):
    t = t_(d); ph = 2 * np.pi * np.cumsum(500 + 900 * t / d) / SR
    x = np.sin(ph) * np.exp(-t * 22)
    return x / np.abs(x).max()

def ding(d=1.4):
    t = t_(d); x = np.zeros_like(t)
    for f, a in [(1568, 1), (2093, .7), (3136, .45), (4186, .25)]:
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * (2.5 + f / 2000))
    x2 = np.zeros_like(t); dt = int(0.09 * SR)
    for f, a in [(2093, 1), (2637, .6), (4186, .3)]:
        x2[dt:] += a * np.sin(2 * np.pi * f * t[:-dt]) * np.exp(-t[:-dt] * 3)
    x = x + x2
    return x / np.abs(x).max()

def shimmer(d=1.2):
    t = t_(d); x = np.zeros_like(t)
    for i in range(14):
        f = 2400 + i * 260; t0 = i * d / 18
        m = t >= t0; x[m] += np.sin(2 * np.pi * f * (t[m] - t0)) * np.exp(-(t[m] - t0) * 9)
    x *= np.sin(np.pi * t / d)
    return x / np.abs(x).max()

def riser(d=2.0):
    t = t_(d); n = rng.standard_normal(len(t))
    x = bp_sweep(n, 300, 6000) * (t / d) ** 2
    ph = 2 * np.pi * np.cumsum(180 * (1 + 5 * (t / d) ** 2)) / SR
    x = x / np.abs(x).max() + np.sin(ph) * (t / d) ** 2 * 0.35
    return x / np.abs(x).max()

def ticks(d=1.1, rate=22):
    out = np.zeros(int(d * SR)); c = click(0.03) * 0.5
    for i in range(int(d * rate)):
        j = int(i / rate * SR); out[j:j + len(c)] += c[: len(out) - j] * (1 - i / (d * rate) * 0.5)
    return out / np.abs(out).max()

sfx = np.zeros((2, N))
def S(x, t, db, w=0.0): put(sfx, st(x, w), t, 10 ** (db / 20))

# intro: three strikes + logo slam
S(thunder(2.6), 0.28, -6); S(zap(), 0.93, -16, .2); S(zap(), 1.58, -16, -.2)
S(whoosh(0.6), 3.55, -18)
# scene changes (bolts on screen get a zap, the rest a whoosh)
for t in [9.92, 17.92, 23.92]: S(zap(), t, -17); S(whoosh(0.45), t - 0.2, -21)
for t in [12.9, 15.4, 40.3]: S(whoosh(0.5), t, -20)
# taps
for t in [17.6, 20.8, 26.05, 36.0, 48.95, 51.4]: S(click(), t, -14)
S(pop(), 20.85, -16)                       # vote counted
S(shimmer(1.2), 21.25, -24)                # Hot Spot glows
S(ticks(1.1), 26.3, -24)                   # form fills itself in
S(boom(1.6), 29.98, -6); S(thunder(1.6, big=False), 29.98, -15)  # the drop
for i in range(5): S(whoosh(0.4), 30.0 + i * 1.15, -22, (i - 2) * .1)  # tier cards deal in
S(zap(), 36.35, -17); S(whoosh(0.5), 36.25, -20)
S(shimmer(1.4), 37.2, -22)                 # gold Thunder Ticker
S(whoosh(0.5), 38.3, -22)                  # spotlight rises
S(shimmer(1.0), 42.0, -24)                 # Elite halo
S(thunder(1.8, big=False), 45.95, -12)     # pull back into checkout
S(ding(), 49.1, -14)                       # order received
S(riser(2.0), 48.5, -16)                   # build into the re-entry
S(boom(1.2), 50.48, -9)
S(whoosh(0.5, up=True), 52.4, -18)         # token flies up
S(boom(1.4), 53.08, -8); S(zap(), 53.1, -14); S(ding(), 53.15, -18)  # live at #1
S(thunder(2.8), 54.28, -6)                 # outro strike
S(zap(), 54.98, -18, .2); S(zap(), 55.58, -18, -.2)
S(boom(1.4), 54.72, -10)                   # logo slam
S(thunder(2.2), 57.58, -9)                 # "Ride."

mix = music + vo + sfx
peak = np.abs(mix).max()
if peak > 0.98: mix *= 0.98 / peak
sf.write("mix.wav", mix.T, SR, subtype="PCM_24")
sf.write("stem-music.wav", music.T, SR, subtype="PCM_24")
sf.write("stem-vo.wav", vo.T, SR, subtype="PCM_24")
sf.write("stem-sfx.wav", sfx.T, SR, subtype="PCM_24")
print("ok peak", peak)
