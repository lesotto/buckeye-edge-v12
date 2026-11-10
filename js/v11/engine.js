// v11 position-specific evaluation engine.
// Historical replay only: every metric here reads 2024-2025 seasons. 2026 outcomes live in a separate file.
export const LVF = { P4: 1, G5: 0.85, FCS: 0.7, Other: 0.6 };
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
const S = (o, k) => (o && typeof o[k] === "number" ? o[k] : 0);

// Pool count stats across the 2024 and 2025 seasons (any school).
export function pool(h, keys) {
  const out = { games: 0, seasons: 0 };
  for (const y of ["s2024", "s2025"]) {
    const s = h[y]; if (!s) continue;
    out.seasons++; out.games += s.teamGames || 0;
    for (const k of keys) out[k] = (out[k] || 0) + S(s, k);
  }
  return out;
}
const lvOf = (h) => h.olv || h.s2025?.lv || h.s2024?.lv || "Other";
const per = (p, k) => (p.games ? (p[k] || 0) / p.games : null);

// ---------------- position configurations ----------------
// Each metric: k, label, what (plain-language), fn(h) -> {v, n}, dir (+1 higher is better), w (default weight), kShrink.
// NA lists criteria the brief asks for that public data cannot supply.
export const POS = {
  qb: {
    label: "Quarterback", short: "QB",
    metrics: [
      { k: "eff", label: "Passing efficiency", what: "PPA per pass, 2024–25, attempt-weighted (CFBD's expected points added per pass; the closest public stand-in for EPA per dropback)", w: 20, ks: 150,
        fn: (h) => { const a = [h.pre24, h.pre25].filter((x) => x && x.att && num(x.ppa_pass) !== null); const n = a.reduce((s, x) => s + x.att, 0); return n ? { v: a.reduce((s, x) => s + x.att * x.ppa_pass, 0) / n * LVF[lvOf(h)], n } : { v: null, n: 0 }; } },
      { k: "aya", label: "Adjusted yards per attempt", what: "(yards + 20×TD − 45×INT) ÷ attempts, 2024–25", w: 10, ks: 150,
        fn: (h) => { const a = [h.pre24, h.pre25].filter(Boolean); const att = a.reduce((s, x) => s + (x.att || 0), 0); if (!att) return { v: null, n: 0 }; const y = a.reduce((s, x) => s + (x.yds || 0) + 20 * (x.td || 0) - 45 * (x.int || 0), 0); return { v: (y / att) * LVF[lvOf(h)], n: att }; } },
      { k: "tov", label: "Turnover rate", what: "Interceptions per attempt, 2024–25 (lower is better)", w: 10, ks: 200, dir: -1,
        fn: (h) => { const a = [h.pre24, h.pre25].filter(Boolean); const att = a.reduce((s, x) => s + (x.att || 0), 0); return att ? { v: a.reduce((s, x) => s + (x.int || 0), 0) / att, n: att } : { v: null, n: 0 }; } },
      { k: "exp", label: "Starting experience", what: "Seasons as the primary passer (≥ 50% of team pass plays) plus total attempts ÷ 400. Game starts are not in the public feed.", w: 10, ks: 0,
        fn: (h) => { const a = [h.pre24, h.pre25].filter(Boolean); const st = a.filter((x) => (x.usage || 0) >= 0.5 && (x.att || 0) >= 100).length; const att = a.reduce((s, x) => s + (x.att || 0), 0); return { v: st + att / 400, n: 999 }; } },
      { k: "mob", label: "Mobility", what: "PPA per rush, 2024–25, carry-weighted", w: 10, ks: 60,
        fn: (h) => { const a = [h.pre24, h.pre25].filter((x) => x && x.car && num(x.ppa_rush) !== null); const n = a.reduce((s, x) => s + x.car, 0); return n ? { v: a.reduce((s, x) => s + x.car * x.ppa_rush, 0) / n, n } : { v: null, n: 0 }; } },
      { k: "opp", label: "Opponent strength", what: "Opponent-adjusted passing value (2025, else 2024): PPA per pass relative to what each defense allowed", w: 15, ks: 150,
        fn: (h) => { const x = num(h.pre25?.adj) !== null ? h.pre25 : num(h.pre24?.adj) !== null ? h.pre24 : null; return x ? { v: x.adj, n: x.att || 0 } : { v: null, n: 0 }; } },
      { k: "ready", label: "Immediate readiness", what: "Level-weighted attempts in 2024–25 (P4 1.0, G5 0.85, FCS 0.7)", w: 5, ks: 0,
        fn: (h) => { const a = [h.pre24, h.pre25].filter(Boolean); return { v: a.reduce((s, x) => s + (x.att || 0), 0) * LVF[lvOf(h)], n: 999 }; } },
      { k: "dev", label: "Development potential", what: "Mean of high-school recruiting composite and portal rating (247Sports via CFBD)", w: 20, ks: 0,
        fn: (h) => { const v = [h.hs?.rating, h.rating].filter((x) => num(x) !== null); return v.length ? { v: v.reduce((a, b) => a + b, 0) / v.length, n: 999 } : { v: null, n: 0 }; } },
    ],
    NA: [["Scheme compatibility", "Needs the staff's offensive scheme evaluation. Searched: public reporting, CFBD. NOT AVAILABLE."], ["Game starts", "CFBD does not publish starts. NOT AVAILABLE."], ["EPA per dropback (sacks and scrambles included)", "Not in the public feed. PPA per pass is shown instead."]],
  },
  dl: {
    label: "Defensive line and edge", short: "DL/EDGE",
    metrics: [
      { k: "pr", label: "Pass-rush productivity", what: "(Sacks + QB hurries) per team game, 2024–25, level-weighted. Hurries stand in for pressures.", w: 25, ks: 20, fn: (h) => { const p = pool(h, ["sacks", "hur", "tot"]); return { v: p.games ? ((p.sacks + p.hur) / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "sk", label: "Sacks", what: "Sacks per team game, 2024–25, level-weighted", w: 15, ks: 20, fn: (h) => { const p = pool(h, ["sacks", "tot"]); return { v: p.games ? (p.sacks / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "share", label: "Share of team sacks", what: "Player sacks ÷ team sacks, 2025 (adjusts for how often a defense gets home)", w: 10, ks: 20, fn: (h) => { const s = h.s2025; return s && s.teamSacks ? { v: (s.sacks || 0) / s.teamSacks, n: s.tot || 0 } : { v: null, n: 0 }; } },
      { k: "run", label: "Run-defense evidence", what: "Tackles for loss per team game, 2024–25, level-weighted (a proxy; run-stop grades are not public)", w: 20, ks: 20, fn: (h) => { const p = pool(h, ["tfl", "tot"]); return { v: p.games ? (p.tfl / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "tkl", label: "Tackling volume", what: "Total tackles per team game, 2024–25, level-weighted", w: 10, ks: 20, fn: (h) => { const p = pool(h, ["tot"]); return { v: p.games ? (p.tot / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "time", label: "Playing time (proxy)", what: "Seasons with ≥ 15 tackles in 2024–25. Snap counts are not public.", w: 10, ks: 0, fn: (h) => ({ v: [h.s2024, h.s2025].filter((s) => s && (s.tot || 0) >= 15).length, n: 999 }) },
      { k: "dev", label: "Talent rating", what: "Portal rating (247Sports via CFBD)", w: 10, ks: 0, fn: (h) => (num(h.rating) !== null ? { v: h.rating, n: 999 } : { v: null, n: 0 }) },
    ],
    NA: [["Pressures (true)", "PFF / SIS pressure data not connected. QB hurries used instead."], ["Snaps and alignment by snap", "Not public. Portal listing (EDGE vs DL) shown as alignment."], ["Opponent quality beyond league level", "Level weighting only (P4 1.0, G5 0.85, FCS 0.7)."]],
  },
  wr: {
    label: "Wide receiver", short: "WR",
    metrics: [
      { k: "prod", label: "Receiving production", what: "Receiving yards per team game, 2024–25, level-weighted", w: 25, ks: 15, fn: (h) => { const p = pool(h, ["recyds", "rec"]); return { v: p.games ? (p.recyds / p.games) * LVF[lvOf(h)] : null, n: p.rec || 0 }; } },
      { k: "share", label: "Target share (proxy)", what: "Share of team completions caught, 2025. Targets are not public, so receptions stand in.", w: 25, ks: 15, fn: (h) => { const s = h.s2025; return s && s.teamCmp ? { v: (s.rec || 0) / s.teamCmp, n: s.rec || 0 } : { v: null, n: 0 }; } },
      { k: "expl", label: "Explosive plays (proxy)", what: "Yards per reception, 2024–25", w: 15, ks: 15, fn: (h) => { const p = pool(h, ["recyds", "rec"]); return p.rec ? { v: p.recyds / p.rec, n: p.rec } : { v: null, n: 0 }; } },
      { k: "eff", label: "Efficiency", what: "PPA per play involving the player, 2025 (CFBD)", w: 15, ks: 15, fn: (h) => (num(h.s2025?.ppaAll) !== null ? { v: h.s2025.ppaAll, n: h.s2025.rec || 0 } : { v: null, n: 0 }) },
      { k: "role", label: "Offensive role", what: "Usage: share of team plays involving the player, 2025", w: 10, ks: 0, fn: (h) => (num(h.s2025?.usage) !== null ? { v: h.s2025.usage, n: 999 } : { v: null, n: 0 }) },
      { k: "dev", label: "Talent rating", what: "Portal rating (247Sports via CFBD)", w: 10, ks: 0, fn: (h) => (num(h.rating) !== null ? { v: h.rating, n: 999 } : { v: null, n: 0 }) },
    ],
    NA: [["Targets and catch rate", "Not in CFBD. NOT AVAILABLE."], ["Yards per route run", "Requires charting (PFF). NOT AVAILABLE."], ["Separation", "Requires tracking or charting. NOT AVAILABLE."]],
  },
  ol: {
    label: "Offensive line", short: "OL",
    metrics: [
      { k: "dev", label: "Talent rating", what: "Portal rating (247Sports via CFBD)", w: 60, ks: 0, fn: (h) => (num(h.rating) !== null ? { v: h.rating, n: 999 } : { v: null, n: 0 }) },
      { k: "lvl", label: "Competition level", what: "League level of last school (P4 1.0, G5 0.85, FCS 0.7)", w: 40, ks: 0, fn: (h) => ({ v: LVF[lvOf(h)], n: 999 }) },
    ],
    NA: [["Starts and snaps", "Not public in a structured feed. NOT AVAILABLE."], ["Pass protection (pressures and sacks allowed)", "Requires charting (PFF / SIS). NOT AVAILABLE."], ["Run blocking", "Requires charting. NOT AVAILABLE."], ["Penalties by player", "Not in CFBD. NOT AVAILABLE."], ["Positional versatility", "Reporting only; not structured."]],
    caution: "Public data cannot evaluate offensive linemen reliably. This module ranks on rating and level only and says so. It needs charted data (PFF or the staff's grades) before it means anything.",
  },
  cb: {
    label: "Cornerback", short: "CB",
    metrics: [
      { k: "ball", label: "Ball production", what: "(Pass breakups + interceptions) per team game, 2024–25, level-weighted", w: 35, ks: 15, fn: (h) => { const p = pool(h, ["pd", "int_d", "tot"]); return { v: p.games ? ((p.pd + p.int_d) / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "pbu", label: "Pass breakups", what: "Pass breakups per team game, 2024–25", w: 15, ks: 15, fn: (h) => { const p = pool(h, ["pd", "tot"]); return { v: p.games ? p.pd / p.games : null, n: p.tot || 0 }; } },
      { k: "tkl", label: "Tackling", what: "Tackles per team game, 2024–25, level-weighted", w: 20, ks: 15, fn: (h) => { const p = pool(h, ["tot"]); return { v: p.games ? (p.tot / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "time", label: "Playing time (proxy)", what: "Seasons with ≥ 15 tackles", w: 15, ks: 0, fn: (h) => ({ v: [h.s2024, h.s2025].filter((s) => s && (s.tot || 0) >= 15).length, n: 999 }) },
      { k: "dev", label: "Talent rating", what: "Portal rating (247Sports via CFBD)", w: 15, ks: 0, fn: (h) => (num(h.rating) !== null ? { v: h.rating, n: 999 } : { v: null, n: 0 }) },
    ],
    NA: [["Targets allowed", "Requires charting (PFF). NOT AVAILABLE."], ["Completion rate allowed", "NOT AVAILABLE."], ["Explosive plays allowed", "NOT AVAILABLE."], ["Scheme compatibility", "Needs the staff's coverage evaluation. NOT AVAILABLE."]],
  },
  s: {
    label: "Safety", short: "S",
    metrics: [
      { k: "cov", label: "Coverage evidence", what: "(Pass breakups + interceptions) per team game, 2024–25, level-weighted", w: 30, ks: 20, fn: (h) => { const p = pool(h, ["pd", "int_d", "tot"]); return { v: p.games ? ((p.pd + p.int_d) / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "run", label: "Run support", what: "Tackles for loss per team game, 2024–25", w: 20, ks: 20, fn: (h) => { const p = pool(h, ["tfl", "tot"]); return { v: p.games ? p.tfl / p.games : null, n: p.tot || 0 }; } },
      { k: "tkl", label: "Tackling", what: "Tackles per team game, 2024–25, level-weighted", w: 20, ks: 20, fn: (h) => { const p = pool(h, ["tot"]); return { v: p.games ? (p.tot / p.games) * LVF[lvOf(h)] : null, n: p.tot || 0 }; } },
      { k: "exp", label: "Experience", what: "Seasons with ≥ 20 tackles in 2024–25", w: 15, ks: 0, fn: (h) => ({ v: [h.s2024, h.s2025].filter((s) => s && (s.tot || 0) >= 20).length, n: 999 }) },
      { k: "dev", label: "Talent rating", what: "Portal rating (247Sports via CFBD)", w: 15, ks: 0, fn: (h) => (num(h.rating) !== null ? { v: h.rating, n: 999 } : { v: null, n: 0 }) },
    ],
    NA: [["Coverage charting (targets, yards allowed)", "NOT AVAILABLE."], ["Alignment versatility (box / slot / deep snaps)", "Requires snap alignment data. NOT AVAILABLE."], ["Role fit", "Needs the staff's defensive plan. NOT AVAILABLE."]],
  },
};

// Outcome measures (2026), used only after REVEAL.
export const OUTCOME = {
  qb: { label: "2026 opponent-adjusted passing value", min: "60+ attempts", fn: (o) => (o?.now && (o.now.att || 0) >= 60 && num(o.now.adj) !== null ? o.now.adj : o?.now && (o.now.att || 0) >= 60 && num(o.now.ppa_pass) !== null ? o.now.ppa_pass : null), opp: (o) => (o?.now ? o.now.att || 0 : 0), oppLabel: "attempts" },
  dl: { label: "2026 (sacks + hurries + TFL) per team game", min: "10+ tackles", fn: (o) => { const s = o?.s2026; return s && (s.tot || 0) >= 10 && s.teamGames ? ((s.sacks || 0) + (s.hur || 0) + (s.tfl || 0)) / s.teamGames : null; }, opp: (o) => o?.s2026?.tot || 0, oppLabel: "tackles" },
  wr: { label: "2026 receiving yards per team game", min: "10+ catches", fn: (o) => { const s = o?.s2026; return s && (s.rec || 0) >= 10 && s.teamGames ? (s.recyds || 0) / s.teamGames : null; }, opp: (o) => o?.s2026?.rec || 0, oppLabel: "catches" },
  cb: { label: "2026 (PBU + INT) per team game", min: "10+ tackles", fn: (o) => { const s = o?.s2026; return s && (s.tot || 0) >= 10 && s.teamGames ? ((s.pd || 0) + (s.int_d || 0)) / s.teamGames : null; }, opp: (o) => o?.s2026?.tot || 0, oppLabel: "tackles" },
  s: { label: "2026 tackles + 3×(PBU + INT) per team game", min: "10+ tackles", fn: (o) => { const s = o?.s2026; return s && (s.tot || 0) >= 10 && s.teamGames ? ((s.tot || 0) + 3 * ((s.pd || 0) + (s.int_d || 0))) / s.teamGames : null; }, opp: (o) => o?.s2026?.tot || 0, oppLabel: "tackles" },
  ol: { label: "No public outcome measure for linemen", min: "—", fn: () => null, opp: () => 0, oppLabel: "—" },
};

// Deterministic PRNG for repeatable uncertainty draws.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// Score a market. rows: historical rows. w: {metricKey: weight}. Returns rows with score, z, contributions, rank, interval.
export function score(pos, rows, w, draws = 200) {
  const cfg = POS[pos]; const M = cfg.metrics;
  const vals = rows.map((h) => M.map((m) => m.fn(h)));
  const stats = M.map((m, j) => { const xs = vals.map((v) => v[j].v).filter((x) => x !== null); const mu = xs.reduce((a, b) => a + b, 0) / (xs.length || 1); const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length || 1)) || 1; return { mu, sd }; });
  const W = M.map((m) => Math.max(0, w[m.k] ?? m.w)); const Wsum = W.reduce((a, b) => a + b, 0) || 1;
  const out = rows.map((h, i) => {
    const z = [], rel = [], miss = [];
    M.forEach((m, j) => {
      const { v, n } = vals[i][j];
      if (v === null) { z.push(0); rel.push(0); miss.push(m.label); return; }
      const r = m.ks ? n / (n + m.ks) : 1; const raw = ((v - stats[j].mu) / stats[j].sd) * (m.dir || 1);
      z.push(Math.max(-3, Math.min(3, raw)) * r); rel.push(r);
    });
    const contrib = z.map((x, j) => (W[j] * x) / Wsum);
    return { h, v: vals[i].map((x) => x.v), n: vals[i].map((x) => x.n), z, rel, miss, contrib, score: contrib.reduce((a, b) => a + b, 0) };
  });
  out.sort((a, b) => b.score - a.score); out.forEach((r, i) => (r.rank = i + 1));
  // Uncertainty: perturb each z by noise proportional to (1 - reliability); missing metrics get full-width noise.
  const R = rng(20260112); const ranks = out.map(() => []);
  for (let d = 0; d < draws; d++) {
    const sc = out.map((r) => r.z.reduce((s, x, j) => s + (W[j] * (x + gauss(R) * Math.sqrt(1 - Math.min(1, r.rel[j])))) / Wsum, 0));
    const ord = sc.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
    ord.forEach(([, i], k) => ranks[i].push(k + 1));
  }
  out.forEach((r, i) => { const a = ranks[i].sort((x, y) => x - y); r.lo = a[Math.floor(a.length * 0.1)]; r.hi = a[Math.floor(a.length * 0.9)]; r.completeness = 1 - r.miss.length / M.length; });
  return { rows: out, stats, W, Wsum };
}

export function spearman(xs, ys) {
  const n = xs.length; if (n < 5) return null;
  const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = Array(n); let i = 0; while (i < n) { let j = i; while (j + 1 < n && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
  const a = rk(xs), b = rk(ys); const ma = (n + 1) / 2; let num_ = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num_ += (a[i] - ma) * (b[i] - ma); da += (a[i] - ma) ** 2; db += (b[i] - ma) ** 2; }
  return num_ / Math.sqrt(da * db);
}
// Bootstrap 80% interval for Spearman.
export function spearmanCI(xs, ys, B = 400) {
  const n = xs.length; if (n < 8) return null; const R = rng(7); const v = [];
  for (let b = 0; b < B; b++) { const ix = Array.from({ length: n }, () => Math.floor(R() * n)); const s = spearman(ix.map((i) => xs[i]), ix.map((i) => ys[i])); if (s !== null && isFinite(s)) v.push(s); }
  v.sort((a, b) => a - b); return [v[Math.floor(v.length * 0.1)], v[Math.floor(v.length * 0.9)]];
}
