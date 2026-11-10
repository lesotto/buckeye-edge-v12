// Portal Lab v9 · Quarterback Pilot (2026 portal cycle).
// Step 1 models how the staff graded and chose among the QBs on its board (needs OSU's board export).
// Steps 2-4 run now on public CollegeFootballData.com data for all 267 QBs in the 2026 portal.
// Imported board data stays in this browser tab's memory only. Nothing is uploaded or saved.

export const V9NAV = [
  { k: "qp", label: "QB Pilot Overview" },
  { k: "qp1", label: "Step 1 · Staff Method" },
  { k: "qp2", label: "Step 2 · Comparable QBs" },
  { k: "qp3", label: "Step 3 · Rank Order" },
  { k: "qp4", label: "Step 4 · Where They Are Now" },
  { k: "whatsnew9", label: "What Changed in v9" },
];
export const V9TITLES = {
  qp: ["QB Pilot · 2026 Portal Cycle", "Can the system capture how this staff evaluates quarterbacks, and did those factors predict performance?"],
  qp1: ["Step 1 · Reverse-engineer the staff method", "Model the Buckeye grade and the choice from OSU's own QB board"],
  qp2: ["Step 2 · Comparable quarterbacks", "Every 2026 portal QB with a comparable profile, including players OSU did not evaluate"],
  qp3: ["Step 3 · Rank order", "Martin alongside the alternatives, with an 80% range on every grade and rank"],
  qp4: ["Step 4 · Where they are now", "Destination, role and 2026 performance from public data · through week 10"],
  whatsnew9: ["What Changed in v9", "The quarterback pilot for the GM's ecological-validity request"],
};
export const V9KEYS = V9NAV.map((n) => n.k);

let X = null;
const Q = { data: null, err: null, board: null, boardName: "", practice: false, includeUnverified: false,
  f: { minTalent: 0.85, minAtt: 150, fcs: true, signal: "either" }, wmode: "baseline", log: [], fit: null, mc: null, sort: "rank", role: "all", replay: false };

// ---------- small utils ----------
const card = (h, p, body, right = "") => `<section class="card card-pad"><div class="card-h"><div><h3>${h}</h3>${p ? `<p>${p}</p>` : ""}</div><div class="sp"></div>${right}</div>${body}</section>`;
const tag = (t, cls = "") => `<span class="v8tag ${cls}">${t}</span>`;
const f2 = (v, d = 2) => (v == null || Number.isNaN(v) ? "–" : (+v).toFixed(d));
const sgn = (v, d = 3) => (v == null ? "–" : (v >= 0 ? "+" : "") + (+v).toFixed(d));
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))) || 1; };
const qtl = (a, p) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const gammaS = (r, a) => { if (a < 1) return gammaS(r, a + 1) * Math.pow(r(), 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = gauss(r); v = 1 + c * x; } while (v <= 0); v = v ** 3; const u = r(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } };
const rankArr = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
const pearson = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db || 1); };
const spearman = (a, b) => pearson(rankArr(a), rankArr(b));
const now = () => new Date().toTimeString().slice(0, 8);
function alog(agent, msg) { Q.log.push({ t: now(), agent, msg }); if (Q.log.length > 120) Q.log.shift(); }
const STANINE = [0.04, 0.11, 0.23, 0.40, 0.60, 0.77, 0.89, 0.96]; // cumulative cut points of the 1-9 stanine scale
const toNine = (pct) => 1 + STANINE.filter((c) => pct > c).length;

// ---------- public features (Steps 2-4) ----------
// Stated, written-down rules (baseline v0, pending Dr. Rippee / Nasim review):
//   production = attempts-weighted pass PPA over 2024-25, using the 2025 opponent-adjusted value where available,
//                shrunk toward the FBS mean with k = 150 attempts
//   rushing    = rush PPA shrunk toward 0 with k = 60 carries
//   experience = log(1 + pass attempts 2024-25)
//   talent     = mean of high-school composite rating and portal rating (whichever exist)
//   level      = P4 = 1, G5 = 0.5, FCS = 0 (conference of the origin school in 2025)
//   role       = highest pass-usage share at origin, 2024-25
export const BASE_W = { prod: 0.30, talent: 0.25, exp: 0.15, level: 0.15, rush: 0.10, role: 0.05 };
const FEAT_L = { prod: "Production (pass PPA, opp-adjusted, shrunk)", talent: "Talent signal (HS + portal rating)", exp: "Experience (log attempts)", level: "Level of competition", rush: "Rushing value", role: "Role at origin (usage)" };
const LEVEL_V = { P4: 1, G5: 0.5, FCS: 0, Other: -0.5 };
function pub(r, ref) {
  const a25 = r.pre25?.att || 0, a24 = r.pre24?.att || 0, n = a25 + a24;
  const v25 = r.pre25 ? (r.pre25.games >= 3 && r.pre25.att >= 50 ? (r.pre25.adj ?? r.pre25.ppa_pass) : r.pre25.ppa_pass) : null, v24 = r.pre24?.ppa_pass ?? null;
  const raw = n ? ((v25 != null ? a25 * v25 : 0) + (v24 != null ? a24 * v24 : 0)) / ((v25 != null ? a25 : 0) + (v24 != null ? a24 : 0) || 1) : null;
  const k = 150, mu = ref.y2025.mu;
  const prod = raw == null ? mu : (n * raw + k * mu) / (n + k);
  const prodSE = ref.y2025.sd * Math.sqrt(k / (n + k)) ; // wider when fewer attempts
  const car = (r.pre25?.car || 0) + (r.pre24?.car || 0);
  const rr = [r.pre25?.ppa_rush, r.pre24?.ppa_rush].filter((x) => x != null);
  const rush = rr.length ? (car * mean(rr)) / (car + 60) : 0;
  const tal = [r.hs?.rating, r.rating].filter((x) => x != null && x > 0);
  const talent = tal.length ? mean(tal) : 0.8;
  return { n, raw, prod, prodSE, rush, exp: Math.log1p(n), talent, talentImputed: !tal.length, level: LEVEL_V[r.olv] ?? -0.5, role: Math.max(r.pre25?.usage || 0, r.pre24?.usage || 0) };
}
function outcome(r, ref) {
  const s = r.now; if (!s || !s.att) return { att: 0, games: s?.games || 0, usage: s?.usage || 0, role: r.dest ? "No recorded passes" : "No destination listed", ppa: null, shrunk: null, adj: null };
  const k = 100, mu = ref.y2026.mu, v = s.games >= 3 ? (s.adj ?? s.ppa_pass) : s.ppa_pass;
  const role = (s.usage || 0) >= 0.6 ? "Starter" : (s.usage || 0) >= 0.2 ? "Rotation / spot starter" : "Backup snaps";
  return { att: s.att, games: s.games, usage: s.usage || 0, role, ppa: s.ppa_pass, adj: s.adj, shrunk: v == null ? null : (s.att * v + k * mu) / (s.att + k) };
}
function inField(r, p) {
  if (r.elig === "Withdrawn") return false;
  if (r.name === "Justyn Martin") return true;
  if (r.olv === "Other" || (!Q.f.fcs && r.olv === "FCS")) return false;
  const t = p.talent >= Q.f.minTalent && !p.talentImputed, a = p.n >= Q.f.minAtt;
  return Q.f.signal === "both" ? t && a : t || a;
}

function computeField() {
  const D = Q.data, ref = D.ref;
  const all = D.rows.map((r) => ({ r, p: pub(r, ref), o: outcome(r, ref) }));
  const field = all.filter((x) => inField(x.r, x.p));
  const keys = Object.keys(BASE_W);
  const st = Object.fromEntries(keys.map((k) => [k, { m: mean(field.map((x) => x.p[k])), s: sd(field.map((x) => x.p[k])) }]));
  field.forEach((x) => { x.z = Object.fromEntries(keys.map((k) => [k, (x.p[k] - st[k].m) / st[k].s])); });
  const W = Q.wmode === "fitted" && Q.fit?.pubW ? Q.fit.pubW : BASE_W;
  field.forEach((x) => { x.score = keys.reduce((s, k) => s + (W[k] || 0) * x.z[k], 0); });
  // Monte Carlo: perturb weights (Dirichlet, concentration 40) and production (normal, SE from attempts)
  const R = rng(20261109), N = 400, draws = field.map(() => []), rk = field.map(() => []), gr = field.map(() => []);
  const wk = keys.filter((k) => (BASE_W[k] || 0) > 0);
  for (let d = 0; d < N; d++) {
    const g = wk.map((k) => gammaS(R, Math.max(0.05, Math.abs(W[k] || BASE_W[k]) * 40))), gs = g.reduce((a, b) => a + b, 0);
    const w = Object.fromEntries(wk.map((k, i) => [k, Math.sign(W[k] || BASE_W[k] || 1) * g[i] / gs]));
    const sc = field.map((x) => wk.reduce((s, k) => s + w[k] * (k === "prod" ? (x.p.prod + gauss(R) * x.p.prodSE - st.prod.m) / st.prod.s : x.z[k]), 0));
    const order = sc.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    order.forEach(([v, i], pos) => { draws[i].push(v); rk[i].push(pos + 1); gr[i].push(toNine(1 - pos / field.length)); });
  }
  field.forEach((x, i) => { x.lo = qtl(draws[i], 0.1); x.hi = qtl(draws[i], 0.9); x.rlo = Math.round(qtl(rk[i], 0.1)); x.rhi = Math.round(qtl(rk[i], 0.9)); x.glo = Math.round(qtl(gr[i], 0.1)); x.ghi = Math.round(qtl(gr[i], 0.9)); });
  field.sort((a, b) => b.score - a.score).forEach((x, i) => { x.rank = i + 1; x.grade = toNine(1 - i / field.length); });
  if (Q.wmode === "fitted" && Q.fit?.pubModel) field.forEach((x) => { x.pred = Q.fit.pubModel(x); });
  // Martin's nearest public neighbors (distance on the z-scored profile)
  const m = field.find((x) => x.r.name === "Justyn Martin");
  field.forEach((x) => { x.dist = m ? Math.sqrt(["talent", "exp", "level", "prod", "rush"].reduce((s, k) => s + (x.z[k] - m.z[k]) ** 2, 0)) : null; });
  Q.mc = { all, field, st, W, N, m };
}

// ---------- outcome test (Step 4) ----------
function outcomeTest() {
  const F = Q.mc.field.filter((x) => x.o.att >= 100 && x.o.shrunk != null);
  const a = F.map((x) => x.score), b = F.map((x) => x.o.shrunk);
  const rho = F.length > 4 ? spearman(a, b) : null;
  const R = rng(7), bs = [];
  for (let i = 0; i < 1000 && F.length > 4; i++) { const ix = F.map(() => Math.floor(R() * F.length)); bs.push(spearman(ix.map((j) => a[j]), ix.map((j) => b[j]))); }
  const st = F.filter((x) => x.o.role === "Starter");
  const rhoS = st.length > 4 ? spearman(st.map((x) => x.score), st.map((x) => x.o.shrunk)) : null;
  // performance relative to role and destination level: residual vs. the mean of the same role x level cell
  const cell = {}; Q.mc.field.forEach((x) => { if (x.o.shrunk == null) return; const k = x.o.role + "|" + x.r.dlv; (cell[k] = cell[k] || []).push(x.o.shrunk); });
  Q.mc.field.forEach((x) => { const c = cell[x.o.role + "|" + x.r.dlv]; x.o.rel = x.o.shrunk != null && c && c.length >= 3 ? x.o.shrunk - mean(c) : null; x.o.celln = c?.length || 0; });
  return { n: F.length, rho, lo: bs.length ? qtl(bs, 0.1) : null, hi: bs.length ? qtl(bs, 0.9) : null, nS: st.length, rhoS, F };
}

// ---------- Step 1: codebook, NLP coder, kappa ----------
export const CODEBOOK = {
  arm: { l: "Arm talent", pos: ["arm strength", "arm talent", "big arm", "strong arm", "velocity", "drives the ball", "throws with zip", "deep ball", "live arm"], neg: ["weak arm", "lacks arm", "arm strength concern", "floats", "limited arm"] },
  accuracy: { l: "Accuracy / placement", pos: ["accurate", "accuracy", "ball placement", "touch", "on target", "precise"], neg: ["inaccurate", "erratic", "scattershot", "misses throws", "sails", "accuracy concern"] },
  processing: { l: "Processing / decisions", pos: ["processes", "processing", "reads the field", "progressions", "decision-making", "decision making", "anticipation", "smart"], neg: ["late reads", "holds the ball", "turnover", "forces throws", "locks onto", "poor decisions"] },
  mobility: { l: "Mobility / creation", pos: ["mobile", "athletic", "extends plays", "escapes", "run threat", "dual-threat", "creates outside"], neg: ["immobile", "statue", "limited mobility", "slow feet"] },
  pocket: { l: "Pocket presence", pos: ["pocket presence", "poise", "composed", "stands in", "under pressure", "calm"], neg: ["panics", "drops eyes", "skittish", "bails early"] },
  durability: { l: "Durability (higher = healthier)", pos: ["durable", "healthy", "never missed"], neg: ["injury", "injured", "surgery", "durability concern", "missed time", "torn"] },
  leadership: { l: "Leadership / character", pos: ["leader", "competitor", "work ethic", "high character", "film junkie", "coachable", "intangibles"], neg: ["character concern", "maturity concern", "attitude", "off-field", "coachability concern"] },
  fit: { l: "Scheme / room fit", pos: ["scheme fit", "fits our system", "fits the offense", "fit for our room", "good fit", "timing offense", "room fit"], neg: ["system mismatch", "poor fit", "scheme concern", "wrong fit"] },
};
const CB_KEYS = Object.keys(CODEBOOK);
const KAPPA_BAR = 0.7;
function codeText(fields) {
  // Field-aware lexicon coder. A codebook term found in "strengths" counts +1, in "weaknesses" -1;
  // in other fields the term's own polarity decides. "not"/"lacks"/"no" within 3 words before a term flips it.
  const out = {}, hits = {};
  for (const k of CB_KEYS) {
    let s = 0; hits[k] = [];
    for (const [fname, txt] of Object.entries(fields)) {
      const t = " " + String(txt || "").toLowerCase().replace(/[^a-z0-9\- ]/g, " ") + " ";
      for (const [list, pol] of [[CODEBOOK[k].pos, 1], [CODEBOOK[k].neg, -1]]) for (const term of list) {
        let i = t.indexOf(" " + term); while (i >= 0) {
          const pre = t.slice(Math.max(0, i - 24), i).trim().split(/\s+/).slice(-3);
          let v = pol * (pre.some((w) => ["not", "lacks", "no", "never", "without"].includes(w)) && pol > 0 ? -1 : 1);
          if (fname === "strengths") v = Math.abs(v); if (fname === "weaknesses") v = -Math.abs(v);
          s += v; hits[k].push(`${fname}: "${term}" ${v > 0 ? "+1" : "−1"}`);
          i = t.indexOf(" " + term, i + 1);
        }
      }
    }
    out[k] = s > 0 ? 1 : s < 0 ? -1 : 0;
  }
  return { codes: out, hits };
}
function kappa(a, b) {
  const cats = [-1, 0, 1], n = a.length; if (!n) return null;
  const po = a.filter((x, i) => x === b[i]).length / n;
  const pe = cats.reduce((s, c) => s + (a.filter((x) => x === c).length / n) * (b.filter((x) => x === c).length / n), 0);
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}

// ---------- Step 1: Bayesian linear model with leave-one-out ----------
function solve(A, b) { const n = A.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-9; for (let j = c; j <= n; j++) M[c][j] /= d; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; } } return M.map((r) => r[n]); }
function inv(A) { const n = A.length; return A.map((_, j) => solve(A, A.map((__, i) => (i === j ? 1 : 0)))).reduce((acc, col, j) => { col.forEach((v, i) => { acc[i][j] = v; }); return acc; }, A.map(() => Array(n).fill(0))); }
function bayesFit(Xr, y, tau = 0.8) {
  // y = a + X b + e, b ~ N(0, tau^2), e ~ N(0, s2). s2 by two empirical-Bayes passes. X is standardized.
  const n = Xr.length, p = Xr[0]?.length || 0, ym = mean(y), yc = y.map((v) => v - ym);
  let s2 = Math.max(0.25, sd(y) ** 2 * 0.5), b = Array(p).fill(0), S = null;
  for (let it = 0; it < 3; it++) {
    const A = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => Xr.reduce((s, r) => s + r[i] * r[j], 0) / s2 + (i === j ? 1 / tau ** 2 : 0)));
    S = inv(A); const xy = Array.from({ length: p }, (_, i) => Xr.reduce((s, r, k) => s + r[i] * yc[k], 0) / s2);
    b = S.map((row) => row.reduce((s, v, j) => s + v * xy[j], 0));
    const res = Xr.map((r, k) => yc[k] - r.reduce((s, v, j) => s + v * b[j], 0));
    s2 = Math.max(0.15, res.reduce((s, v) => s + v * v, 0) / Math.max(1, n - 1));
  }
  return { a: ym, b, se: S.map((r, i) => Math.sqrt(r[i])), s2, pred: (r) => ym + r.reduce((s, v, j) => s + v * b[j], 0) };
}
function design(rows, keys) {
  const st = keys.map((k) => { const v = rows.map((r) => r.f[k]); return { m: mean(v), s: sd(v) }; });
  return { X: rows.map((r) => keys.map((k, j) => (r.f[k] - st[j].m) / st[j].s)), st, z: (f) => keys.map((k, j) => (f[k] - st[j].m) / st[j].s) };
}
function loo(rows, keys) {
  const preds = rows.map((_, i) => { const tr = rows.filter((__, j) => j !== i), d = design(tr, keys), m = bayesFit(d.X, tr.map((r) => r.grade)); return m.pred(d.z(rows[i].f)); });
  const err = preds.map((p, i) => Math.abs(p - rows[i].grade));
  return { preds, mae: mean(err), within1: err.filter((e) => e <= 1).length / err.length, rho: spearman(preds, rows.map((r) => r.grade)) };
}

// ---------- board import ----------
export const TEMPLATE_COLS = ["player", "prior_school", "buckeye_grade", "one_liner", "strengths", "weaknesses", "summary", "notes", "agent", "agent_prior_relationship", "est_cost_usd", "stage", "declined", "role_sought", "cycle", ...CB_KEYS.map((k) => "c2_" + k)];
const STAGES = ["evaluated", "contacted", "visited", "offered", "signed"];
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const h = rows.shift().map((s) => s.trim().toLowerCase());
  return rows.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}
function normName(s) { return String(s || "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "").replace(/[^a-z]/g, ""); }

// Practice board: 24 fictional quarterbacks with known (hidden) staff weights, used only to check that the
// method recovers weights it should recover. It is not OSU's data and not real players.
const TRUE_W = { talent: 0.9, prod: 0.6, exp: 0.3, level: 0.3, arm: 0.6, processing: 0.7, durability: 0.4, fit: 0.5, cost: -0.4, agent_rel: 0.2 };
const PH = {
  arm: ["big arm, drives the ball outside the numbers", "limited arm, floats the deep out"],
  accuracy: ["accurate in the short game", "erratic when he resets his feet"],
  processing: ["processes quickly and works progressions", "late reads against disguised coverage"],
  mobility: ["athletic, extends plays", "limited mobility in the pocket"],
  pocket: ["poise under pressure", "drops eyes against pressure"],
  durability: ["durable, never missed a start", "shoulder surgery last spring"],
  leadership: ["leader in the room, strong work ethic", "maturity concern noted by prior staff"],
  fit: ["scheme fit for our timing offense", "system mismatch for what we run"],
};
function practiceBoard() {
  const R = rng(4242), rows = [], L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (let i = 0; i < 24; i++) {
    const lat = Object.fromEntries(CB_KEYS.map((k) => [k, gauss(R)]));
    const f = { talent: 0.84 + 0.05 * gauss(R), prod: 0.27 + 0.12 * gauss(R), exp: Math.log1p(Math.max(0, 300 + 250 * gauss(R))), level: [1, 1, 0.5, 0.5, 0][Math.floor(R() * 5)], rush: 0.1 * gauss(R), role: Math.min(1, Math.max(0, 0.6 + 0.3 * gauss(R))) };
    const cost = Math.exp(13 + 0.6 * gauss(R)), agent_rel = R() < 0.35 ? 1 : 0;
    const strengths = [], weaknesses = [];
    for (const k of CB_KEYS) { if (lat[k] > 0.5) strengths.push(PH[k][0]); if (lat[k] < -0.5) weaknesses.push(PH[k][1]); }
    const truth = Object.fromEntries(CB_KEYS.map((k) => [k, lat[k] > 0.5 ? 1 : lat[k] < -0.5 ? -1 : 0]));
    const c2 = Object.fromEntries(CB_KEYS.map((k) => [k, R() < (k === "pocket" || k === "leadership" ? 0.32 : 0.08) ? [-1, 0, 1][Math.floor(R() * 3)] : truth[k]]));
    rows.push({ player: `Fictional QB ${L[i]}`, prior_school: "Fictional U", strengths: strengths.join("; "), weaknesses: weaknesses.join("; "), summary: "", notes: "", one_liner: strengths[0] || "Developmental option", agent: agent_rel ? "Agent with prior OSU relationship" : "Agent", agent_rel, cost, c2, lat, fPub: f });
  }
  // grade from hidden weights, using the latent (not the coded) narrative factors
  const zs = (k, get) => { const v = rows.map(get); const m = mean(v), s = sd(v); return rows.map((r, i) => (v[i] - m) / s); };
  const Z = { talent: zs("talent", (r) => r.fPub.talent), prod: zs("prod", (r) => r.fPub.prod), exp: zs("exp", (r) => r.fPub.exp), level: zs("level", (r) => r.fPub.level), cost: zs("cost", (r) => Math.log(r.cost)), agent_rel: zs("a", (r) => r.agent_rel) };
  rows.forEach((r, i) => { let g = 5; for (const k of Object.keys(TRUE_W)) g += TRUE_W[k] * (Z[k] ? Z[k][i] : r.lat[k] * 0.9); r.buckeye_grade = Math.max(1, Math.min(9, Math.round(g + 0.5 * gauss(R)))); });
  const ord = rows.map((r, i) => [r.buckeye_grade + 0.01 * i, i]).sort((a, b) => b[0] - a[0]);
  ord.forEach(([_, i], pos) => { const r = rows[i]; r.stage = pos < 4 ? "offered" : pos < 9 ? "visited" : pos < 15 ? "contacted" : "evaluated"; r.declined = pos === 0 || pos === 2 ? "Y" : "N"; });
  const signed = ord.map(([_, i]) => rows[i]).find((r) => r.stage === "offered" && r.declined === "N"); signed.stage = "signed";
  return rows.map((r) => ({ ...r, role_sought: "backup", est_cost_usd: Math.round(r.cost), agent_prior_relationship: r.agent_rel ? "Y" : "N", ...Object.fromEntries(CB_KEYS.map((k) => ["c2_" + k, String(r.c2[k])])) }));
}

function runStep1() {
  const B = Q.board; if (!B) { Q.fit = null; return; }
  const ref = Q.data.ref, byName = new Map(Q.data.rows.map((r) => [normName(r.name), r]));
  alog("Intake Agent", `Read ${B.length} rows from ${Q.practice ? "the practice board (fictional)" : Q.boardName}. Required columns checked: player, buckeye_grade, stage.`);
  const rows = B.map((b) => {
    const real = !Q.practice && byName.get(normName(b.player));
    const p = Q.practice ? { ...b.fPub } : real ? pub(real, ref) : null;
    const coded = codeText({ one_liner: b.one_liner, strengths: b.strengths, weaknesses: b.weaknesses, summary: b.summary, notes: b.notes });
    const c2 = Object.fromEntries(CB_KEYS.map((k) => [k, b["c2_" + k] === "" || b["c2_" + k] == null ? null : +b["c2_" + k]]));
    const cost = +String(b.est_cost_usd || "").replace(/[^0-9.]/g, "") || null;
    return { name: b.player, real, p, coded, c2, grade: +b.buckeye_grade, stage: String(b.stage || "evaluated").toLowerCase(), declined: /^y/i.test(b.declined || ""), role: b.role_sought || "", cost, agent_rel: /^y/i.test(b.agent_prior_relationship || "") ? 1 : 0, raw: b };
  }).filter((r) => r.grade >= 1 && r.grade <= 9);
  const matched = rows.filter((r) => r.p).length;
  alog("Intake Agent", `${rows.length} rows have a valid 1–9 Buckeye grade. ${Q.practice ? "Practice rows carry their own public profile." : `${matched} matched to CollegeFootballData by name.`}`);
  // coding reliability
  const kap = {}; for (const k of CB_KEYS) { const pr = rows.filter((r) => r.c2[k] != null); kap[k] = pr.length >= 8 ? { k: kappa(pr.map((r) => r.coded.codes[k]), pr.map((r) => r.c2[k])), n: pr.length } : { k: null, n: pr.length }; }
  const narr = CB_KEYS.filter((k) => (kap[k].k != null && kap[k].k >= KAPPA_BAR) || (Q.includeUnverified && kap[k].k == null));
  alog("Coding Agent", `Coded 5 narrative fields × ${rows.length} players against the 8-factor codebook. Agreement with coder 2 (Cohen's kappa): ${CB_KEYS.map((k) => `${k} ${kap[k].k == null ? "n/a" : kap[k].k.toFixed(2)}`).join(", ")}.`);
  alog("Coding Agent", `${narr.length} of 8 factors clear the ${KAPPA_BAR.toFixed(2)} bar and go into the model: ${narr.join(", ") || "none"}.`);
  const pubK = ["talent", "prod", "exp", "level", "rush", "role"];
  const ok = rows.filter((r) => r.p);
  ok.forEach((r) => { r.f = { ...r.p, ...Object.fromEntries(narr.map((k) => [k, r.coded.codes[k]])), cost: Math.log(r.cost || 1e5), agent_rel: r.agent_rel }; });
  const fullK = [...pubK, ...narr, ...(ok.some((r) => r.cost) ? ["cost"] : []), "agent_rel"];
  if (ok.length < 8) { Q.fit = { rows, kap, narr, err: `Only ${ok.length} rows have a public profile and a grade; at least 8 are needed.` }; alog("Modeling Agent", Q.fit.err); return; }
  const dF = design(ok, fullK), mF = bayesFit(dF.X, ok.map((r) => r.grade)), lF = loo(ok, fullK);
  const dP = design(ok, pubK), mP = bayesFit(dP.X, ok.map((r) => r.grade)), lP = loo(ok, pubK);
  alog("Modeling Agent", `Bayesian linear model of the Buckeye grade, prior b ~ N(0, 0.8²) per standardized factor. Full model: ${fullK.length} factors, leave-one-out MAE ${lF.mae.toFixed(2)}, within ±1 grade ${(lF.within1 * 100).toFixed(0)}%, Spearman ${lF.rho.toFixed(2)}.`);
  alog("Modeling Agent", `Public-data-only model: ${pubK.length} factors, LOO MAE ${lP.mae.toFixed(2)}, within ±1 ${(lP.within1 * 100).toFixed(0)}%, Spearman ${lP.rho.toFixed(2)}. Accuracy lost without staff notes: ${(lP.mae - lF.mae).toFixed(2)} grade points.`);
  // choice check: among players OSU offered who did not decline, does the model rank the signed player first?
  ok.forEach((r, i) => { r.loo = lF.preds[i]; });
  const avail = ok.filter((r) => (r.stage === "offered" || r.stage === "signed") && !r.declined).sort((a, b) => b.loo - a.loo);
  const signed = ok.find((r) => r.stage === "signed");
  const sRank = signed ? avail.indexOf(signed) + 1 : null;
  const stRho = spearman(ok.map((r) => r.loo), ok.map((r) => STAGES.indexOf(r.stage)));
  alog("Choice Check", signed ? `${signed.name} ranks #${sRank} of ${avail.length} offered-and-available quarterbacks on held-out predictions. Stage reached vs predicted grade, Spearman ${stRho.toFixed(2)}.` : "No row has stage = signed, so the choice check cannot run.");
  const gates = [
    ["Coding reliability", narr.length >= 1 && narr.every((k) => kap[k].k != null), `${narr.filter((k) => kap[k].k != null).length} factors at kappa ≥ ${KAPPA_BAR}${narr.some((k) => kap[k].k == null) ? ", plus unverified factors (fails the gate)" : ""}`],
    ["Held-out grade accuracy", lF.within1 >= 0.7, `${(lF.within1 * 100).toFixed(0)}% within ±1 (bar 70%)`],
    ["Held-out rank agreement", lF.rho >= 0.6, `Spearman ${lF.rho.toFixed(2)} (bar 0.60)`],
    ["Reproduces the signing", sRank != null && sRank <= 2, sRank != null ? `signed player #${sRank} of ${avail.length} available (bar: top 2)` : "no signed row"],
  ];
  const pass = gates.every((g) => g[1]);
  alog("Fact-Checker", `${gates.filter((g) => g[1]).length} of ${gates.length} validation gates pass. ${pass ? "Step 1 holds up on these inputs. Fitted public-only weights are available to Steps 2 and 3." : "Step 1 does not hold yet. Steps 2 and 3 stay on the written-down baseline weights."}`);
  // public-only weights rescaled to sum |w| = 1, for reuse in Steps 2-3
  const tot = mP.b.reduce((s, v) => s + Math.abs(v), 0) || 1;
  const pubW = Object.fromEntries(pubK.map((k, j) => [k, mP.b[j] / tot]));
  const pubModel = (x) => Math.max(1, Math.min(9, mP.pred(dP.z(x.p))));
  Q.fit = { rows: ok, all: rows, kap, narr, fullK, pubK, mF, mP, lF, lP, avail, signed, sRank, stRho, gates, pass, pubW, pubModel };
  if (!pass && Q.wmode === "fitted") Q.wmode = "baseline";
}

// ---------- shared renderers ----------
function logCard(filter) {
  const L = Q.log.filter((l) => !filter || filter.includes(l.agent)).slice(-14);
  return card("Agent activity", "Each agent's step, with the numbers it produced", `<div class="v9log">${L.length ? L.map((l) => `<div><span class="mono dim">${l.t}</span> <b>${l.agent}</b> ${l.msg}</div>`).join("") : `<div class="dim">No activity yet.</div>`}</div>`, `<button class="btn sm" data-v9="replay">Re-run agents</button>`);
}
const attr = () => `<p class="note">Data provided by CollegeFootballData.com · pulled ${Q.data?.pulled} · 2026 results through week ${Q.data?.through_week}. PPA is CollegeFootballData's expected-points-added measure per play.</p>`;
function bars(items, max) {
  return `<div class="v9bars">${items.map(([l, v, lo, hi, cls]) => { const sc = (x) => 50 + (x / max) * 48; return `<div class="v9bar"><span>${l}</span><div class="v9track"><i class="v9zero"></i>${lo != null ? `<i class="v9ci" style="left:${Math.min(sc(lo), sc(hi))}%;width:${Math.abs(sc(hi) - sc(lo))}%"></i>` : ""}<i class="v9pt ${cls || ""}" style="left:${sc(v)}%"></i></div><b class="mono">${sgn(v, 2)}</b></div>`; }).join("")}</div>`;
}
function scatter(F, mName) {
  const W = 560, H = 260, P = 34; if (!F.length) return "";
  const xs = F.map((x) => x.score), ys = F.map((x) => x.o.shrunk);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = qtl(ys, 0.02), y1 = qtl(ys, 0.98);
  const sx = (v) => P + ((v - x0) / (x1 - x0 || 1)) * (W - 2 * P), sy = (v) => H - P - ((Math.min(y1, Math.max(y0, v)) - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  return `<svg viewBox="0 0 ${W} ${H}" class="v9sc" role="img" aria-label="Pre-transfer baseline score against 2026 adjusted passing value">
  <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" class="ax"/><line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" class="ax"/>
  <text x="${W / 2}" y="${H - 6}" text-anchor="middle">Pre-transfer score (Step 3)</text><text x="12" y="${H / 2}" transform="rotate(-90 12 ${H / 2})" text-anchor="middle">2026 adj. PPA / pass (shrunk)</text>
  ${F.map((x) => `<circle cx="${sx(x.score).toFixed(1)}" cy="${sy(x.o.shrunk).toFixed(1)}" r="${x.o.role === "Starter" ? 4.5 : 3.2}" class="${x.o.role === "Starter" ? "st" : "ot"}"><title>${x.r.name} · ${x.r.dest} · ${x.o.role} · ${x.o.att} att · ${f2(x.o.shrunk, 3)}</title></circle>`).join("")}</svg>`;
}

// ---------- pages ----------
function guard() { if (Q.err) return `<div class="callout">Could not load the public data file: ${Q.err}</div>`; if (!Q.data) return `<div class="skeleton" style="height:240px"></div>`; return ""; }

function pageOverview() {
  const g = guard(); if (g) return g;
  const m = Q.mc.m, esc = X.esc, osu = Q.data.rows.filter((r) => r.dest === "Ohio State");
  const step = (n, h, st, cls, go) => `<button class="v9step" data-go="${go}"><span class="v9n">${n}</span><b>${h}</b>${tag(st, cls)}</button>`;
  return `<div class="callout"><b>The GM's request:</b> ecological validity, "looking at the portal board for the guys we brought in this year." Ohio State signed one transfer quarterback for 2026, Justyn Martin from Maryland. One signing cannot show a decision pattern on its own, so the pilot uses OSU's full 2026 QB board, including players it passed on.</div>
  <div class="v9steps">${step(1, "Reverse-engineer the staff method", Q.fit?.pass ? "Holds up" : Q.board ? (Q.practice ? "Practice board loaded" : "Board loaded · not validated") : "Awaiting OSU's QB board", Q.fit?.pass ? "ok" : "warn", "qp1")}
  ${step(2, "Comparable quarterbacks", `${Q.mc.field.length} QBs · public data`, "ok", "qp2")}
  ${step(3, "Rank order", Q.wmode === "fitted" ? "Fitted weights" : "Baseline weights · pending review", Q.wmode === "fitted" ? "ok" : "warn", "qp3")}
  ${step(4, "Where they are now", `Preliminary · through week ${Q.data.through_week}`, "warn", "qp4")}</div>
  ${card("Prerequisites not yet approved", "These come first. Timelines are TBD until each is approved.", `<table class="t"><tbody>
    <tr><td>${tag("Not received", "warn")}</td><td><b>OSU's full 2026 QB board</b>: every QB evaluated, with Buckeye grade, one-liner, strengths, weaknesses, summary, notes, agent, economics, stage reached, who declined, role sought</td></tr>
    <tr><td>${tag("Not approved", "warn")}</td><td><b>Handling of agent and economics fields</b>: who can see them, how long we keep them, private build only</td></tr>
    <tr><td>${tag("Not approved", "warn")}</td><td><b>Method review by Dr. Rippee and Nasim</b>: codebook, the kappa ≥ 0.70 bar, baseline weights, validation gates</td></tr>
    <tr><td>${tag("Not received", "warn")}</td><td><b>Second coder</b> for the narrative fields, independent of the first</td></tr>
    <tr><td>${tag("Requested", "warn")}</td><td><b>PFF access</b> for position-level grades in the next pass</td></tr>
    <tr><td>${tag("Optional", "")}</td><td><b>2025 QB board</b> in the same format, as a second cycle to test on</td></tr></tbody></table>`)}
  <div class="grid g2" style="margin:14px 0">
  ${card("Justyn Martin · what public data shows", "Why box scores alone cannot explain this signing", `<table class="t"><tbody>
    <tr><td>High school (${m.r.hs?.year})</td><td>${m.r.hs?.stars}-star, composite ${f2(m.r.hs?.rating, 3)}, national rank ${m.r.hs?.rank}, ${Math.floor(m.r.hs?.ht / 12)}'${m.r.hs?.ht % 12}" ${m.r.hs?.wt} lb, signed with ${esc(m.r.hs?.school)}</td></tr>
    <tr><td>2024 · ${esc(m.r.pre24team)}</td><td>${m.r.pre24?.att} attempts, ${m.r.pre24?.cmp} completions, ${m.r.pre24?.yds} yards, PPA per pass ${f2(m.r.pre24?.ppa_pass, 3)}</td></tr>
    <tr><td>2025 · Maryland</td><td>No passing attempts recorded</td></tr>
    <tr><td>Portal (Jan 12, 2026)</td><td>${m.r.stars}-star portal rating ${f2(m.r.rating, 2)}, eligibility ${esc(m.r.elig)}</td></tr>
    <tr><td>2026 · Ohio State</td><td>No passing attempts recorded through week ${Q.data.through_week}</td></tr></tbody></table>
    <p class="note">With 35 career attempts, production adds little information. His standing rests on talent signals, which is why Step 1 needs the staff's own grade and notes.</p>`)}
  ${card("Considerations built into the pilot", "", `<ul class="v9ul"><li><b>Selection vs. performance.</b> Step 1 models how the staff decides. Step 4 measures what happened. The comparison shows where judgment and results agree and where they diverge.</li><li><b>Opportunity at the destination.</b> A backup at Ohio State and a starter elsewhere are not compared directly. Step 4 groups by role and destination level.</li><li><b>Partial season.</b> 2026 results run through week ${Q.data.through_week} and are preliminary until the season closes.</li><li><b>Small samples.</b> Values are shrunk toward the average, so a few good throws do not look like a trend.</li><li><b>Two-sided market.</b> A signing needs the player to say yes. The choice check only counts players OSU offered who did not decline.</li></ul>`)}
  </div>
  ${card("Data request for Dan", "Copy and send", `<textarea id="v9-req" class="v9req" rows="6" readonly>For the QB pilot, can you send your full 2026 portal QB board: every quarterback you evaluated, with the Buckeye Grade, one-liner, strengths and weaknesses, summary, notes, agent and economics fields, how far each got with you (contacted, visited, offered), who turned you down, and whether you were filling a starter or backup role? If you have the 2025 QB board in the same format, that gives us a second cycle to test on. And who can approve how we handle the agent and economics data?</textarea>`, `<button class="btn sm" data-v9="copyreq">Copy</button> <button class="btn sm" data-v9="template">Download board template (CSV)</button>`)}
  ${card("OSU's 2026 transfer class in public data", `${osu.length} incoming transfer${osu.length === 1 ? "" : "s"} listed for Ohio State in CollegeFootballData's 2026 portal file at QB`, `<p class="small">${osu.map((r) => `${esc(r.name)} (${esc(r.origin)})`).join(", ")}. OSU QB passing in 2026 so far: ${Q.data.osuRoom || "see Step 4"}.</p>`)}
  ${logCard()}${attr()}`;
}

function pageStep1() {
  const g = guard(); if (g) return g;
  const esc = X.esc, F = Q.fit;
  const intake = `<div class="v9intake"><label class="btn primary sm">Import OSU QB board (CSV)<input type="file" id="v9-file" accept=".csv,text/csv" hidden/></label>
    <button class="btn sm" data-v9="practice">${Q.practice ? "Practice board loaded" : "Run the practice board (fictional)"}</button>
    <button class="btn sm" data-v9="template">Download template</button>${Q.board ? `<button class="btn sm" data-v9="clear">Clear board</button>` : ""}
    <label class="v9chk"><input type="checkbox" id="v9-unv" ${Q.includeUnverified ? "checked" : ""}/> Include factors with no second coder (unverified)</label></div>
    <p class="note">The file is read in this browser tab only. It is not uploaded, saved or sent anywhere, and it is cleared when the tab closes.</p>`;
  const codebook = `<table class="t small"><thead><tr><th>Factor</th><th>Positive terms</th><th>Negative terms</th></tr></thead><tbody>${CB_KEYS.map((k) => `<tr><td><b>${CODEBOOK[k].l}</b></td><td>${CODEBOOK[k].pos.join(", ")}</td><td>${CODEBOOK[k].neg.join(", ")}</td></tr>`).join("")}</tbody></table><p class="note">Rule: a term in "strengths" scores +1, in "weaknesses" −1; elsewhere the term's own direction counts, and "not / lacks / no" just before a positive term flips it. Each factor ends as −1, 0 or +1. Codebook draft pending review by Dr. Rippee and Nasim.</p>`;
  if (!F) return `${Q.practice ? "" : `<div class="callout"><b>Awaiting OSU's 2026 QB board.</b> When it arrives, import it here and every step below runs on it. Until then, the practice board shows the full method on 24 fictional quarterbacks whose true weights are known.</div>`}
    ${card("Load a board", "", intake)}${card("Narrative codebook (written before reading any OSU notes)", "8 factors coded from the one-liner, strengths, weaknesses, summary and notes", codebook)}${logCard(["Intake Agent", "Coding Agent", "Modeling Agent", "Choice Check", "Fact-Checker"])}`;
  if (F.err) return `${card("Load a board", "", intake)}<div class="callout">${esc(F.err)}</div>${logCard()}`;
  const sim = Q.practice ? `<div class="callout sim"><b>Practice board · fictional players and simulated staff grades.</b> This is a method check: the board was generated from known weights, so we can see whether the method recovers them. It is not OSU's data and says nothing about OSU's quarterbacks.</div>` : `<div class="callout"><b>OSU board loaded:</b> ${esc(Q.boardName)} · ${F.all.length} rows. Held in memory only.</div>`;
  const kapT = `<table class="t"><thead><tr><th>Factor</th><th>Pairs</th><th>Kappa</th><th>Used?</th></tr></thead><tbody>${CB_KEYS.map((k) => { const v = F.kap[k]; return `<tr><td>${CODEBOOK[k].l}</td><td class="mono">${v.n}</td><td class="mono">${v.k == null ? "–" : v.k.toFixed(2)}</td><td>${F.narr.includes(k) ? tag(v.k == null ? "Unverified" : "In model", v.k == null ? "warn" : "ok") : tag(v.k == null ? "No coder 2" : "Below 0.70", "warn")}</td></tr>`; }).join("")}</tbody></table>`;
  const wl = (k) => FEAT_L[k] || CODEBOOK[k]?.l || (k === "cost" ? "Economics (log est. cost)" : k === "agent_rel" ? "Agent: prior relationship" : k);
  const wItems = F.fullK.map((k, j) => [wl(k), F.mF.b[j], F.mF.b[j] - 1.2816 * F.mF.se[j], F.mF.b[j] + 1.2816 * F.mF.se[j], F.mF.b[j] - 1.2816 * F.mF.se[j] > 0 || F.mF.b[j] + 1.2816 * F.mF.se[j] < 0 ? "sig" : ""]);
  const mx = Math.max(1, ...wItems.map((w) => Math.max(Math.abs(w[2]), Math.abs(w[3]))));
  const rec = Q.practice ? `<table class="t small"><thead><tr><th>Factor</th><th>True weight (hidden)</th><th>Recovered (posterior mean)</th></tr></thead><tbody>${F.fullK.filter((k) => TRUE_W[k] != null).map((k) => `<tr><td>${wl(k)}</td><td class="mono">${sgn(TRUE_W[k], 2)}</td><td class="mono">${sgn(F.mF.b[F.fullK.indexOf(k)], 2)}</td></tr>`).join("")}</tbody></table><p class="note">Recovered weights will not match exactly: the prior pulls them toward zero, coding noise blurs the narrative factors, and 24 players is a small board. Read the direction and the order, not the exact size.</p>` : "";
  const choice = `<table class="t"><thead><tr><th>#</th><th>Offered and available</th><th>Buckeye grade</th><th>Held-out prediction</th><th>Stage</th></tr></thead><tbody>${F.avail.map((r, i) => `<tr class="${r === F.signed ? "v9me" : ""}"><td class="mono">${i + 1}</td><td>${esc(r.name)}</td><td class="mono">${r.grade}</td><td class="mono">${r.loo.toFixed(2)}</td><td>${r.stage === "signed" ? tag("Signed", "ok") : "Offered"}</td></tr>`).join("")}</tbody></table><p class="note">Declined offers (${F.rows.filter((r) => r.declined).length}) are shown in the full table but excluded here: OSU could not have signed them.</p>`;
  const full = `<div class="scroll-x"><table class="t small"><thead><tr><th>Player</th><th>Grade</th><th>LOO pred.</th><th>Stage</th><th>Coded factors (NLP)</th><th>Why (matched terms)</th></tr></thead><tbody>${F.rows.slice().sort((a, b) => b.grade - a.grade).map((r) => `<tr><td>${esc(r.name)}${r.declined ? " " + tag("Declined", "warn") : ""}</td><td class="mono">${r.grade}</td><td class="mono">${r.loo.toFixed(2)}</td><td>${esc(r.stage)}</td><td class="mono">${CB_KEYS.map((k) => `${k.slice(0, 4)} ${r.coded.codes[k] > 0 ? "+" : r.coded.codes[k] < 0 ? "−" : "0"}`).join(" · ")}</td><td class="dim">${esc(Object.values(r.coded.hits).flat().slice(0, 3).join("; "))}</td></tr>`).join("")}</tbody></table></div>`;
  return `${sim}${card("Load a board", "", intake)}
  ${card("Validation gates", F.pass ? "Step 1 holds up on these inputs" : "Step 1 does not hold yet", `<table class="t"><tbody>${F.gates.map(([n, ok, d]) => `<tr><td>${tag(ok ? "Pass" : "Fail", ok ? "ok" : "warn")}</td><td><b>${n}</b></td><td>${d}</td></tr>`).join("")}</tbody></table><p class="note">Bars are draft settings pending review by Dr. Rippee and Nasim.${Q.practice ? " Weights fitted on the practice board are never applied to real players in Steps 2–3." : ""}</p>`, F.pass && !Q.practice ? `<button class="btn primary sm" data-v9="usefit">${Q.wmode === "fitted" ? "Fitted weights in use" : "Use fitted weights in Steps 2–3"}</button>` : "")}
  <div class="kpis"><div class="kpi"><div class="l">Held-out MAE · full</div><div class="v mono">${F.lF.mae.toFixed(2)}</div></div><div class="kpi"><div class="l">Within ±1 grade</div><div class="v mono">${(F.lF.within1 * 100).toFixed(0)}%</div></div><div class="kpi"><div class="l">Rank agreement (Spearman)</div><div class="v mono">${F.lF.rho.toFixed(2)}</div></div><div class="kpi"><div class="l">MAE · public data only</div><div class="v mono">${F.lP.mae.toFixed(2)}</div></div><div class="kpi"><div class="l">Accuracy lost without staff notes</div><div class="v mono">${(F.lP.mae - F.lF.mae).toFixed(2)}</div></div></div>
  <div class="grid g2" style="margin:14px 0">${card("Which factors drove the grade", "Posterior mean and 80% interval, grade points per 1 SD of each factor", bars(wItems, mx) + `<p class="note">Model: grade = a + Σ bᵢ·zᵢ + e, with bᵢ ~ N(0, 0.8²), e ~ N(0, σ²), σ² by empirical Bayes (σ = ${Math.sqrt(F.mF.s2).toFixed(2)}). Red points have 80% intervals that exclude zero.</p>` + rec)}
  ${card("Does the model reproduce the signing?", F.signed ? `${esc(F.signed.name)} ranks #${F.sRank} of ${F.avail.length} on predictions made without seeing his own grade` : "No signed row", choice)}</div>
  ${card("Coding reliability · NLP vs. coder 2", `Only factors at kappa ≥ ${KAPPA_BAR} enter the model`, kapT)}
  ${card("Every player on the board", "Coded factors and the terms that produced them", full)}
  ${card("Narrative codebook", "", codebook)}
  ${logCard(["Intake Agent", "Coding Agent", "Modeling Agent", "Choice Check", "Fact-Checker"])}`;
}

function rowsFor(list, opts = {}) {
  const esc = X.esc;
  return list.map((x) => `<tr class="${x.r.name === "Justyn Martin" ? "v9me" : ""}">${opts.rank ? `<td class="mono">${x.rank}</td>` : ""}<td><b>${esc(x.r.name)}</b><div class="dim small">${esc(x.r.origin)} (${x.r.olv}) → ${esc(x.r.dest || "no destination")}</div></td>
  <td class="mono">${f2(x.p.talent, 3)}${x.p.talentImputed ? "*" : ""}</td><td class="mono">${x.p.n}</td><td class="mono">${f2(x.p.raw, 3)}</td><td class="mono">${f2(x.p.prod, 3)}</td><td class="mono">${f2(x.p.rush, 3)}</td>${opts.dist ? `<td class="mono">${f2(x.dist, 2)}</td>` : ""}
  ${opts.rank ? `<td class="mono">${sgn(x.score, 2)} <span class="dim">[${sgn(x.lo, 2)}, ${sgn(x.hi, 2)}]</span></td><td class="mono"><b>${x.grade}</b> <span class="dim">[${x.glo}–${x.ghi}]</span></td><td class="mono">${x.rlo}–${x.rhi}</td>${Q.fit?.rows ? `<td class="mono">${(() => { const b = Q.fit.all.find((r) => normName(r.name) === normName(x.r.name)); return b ? b.grade + (Math.abs(b.grade - x.grade) <= 1 ? " " + tag("Agree", "ok") : " " + tag("Differ", "warn")) : "–"; })()}</td>` : ""}` : ""}</tr>`).join("");
}
function pageStep2() {
  const g = guard(); if (g) return g;
  const F = Q.mc.field, near = F.filter((x) => x.r.name !== "Justyn Martin").sort((a, b) => a.dist - b.dist).slice(0, 12);
  const lv = (l) => F.filter((x) => x.r.olv === l).length;
  return `<div class="callout">Every quarterback in the 2026 portal file (${Q.data.n}) is screened with the same written-down rules. This includes players OSU did not evaluate. ${Q.fit?.pass && Q.wmode === "fitted" ? "Scores use the fitted public-only weights from Step 1." : "Until Step 1 holds up on OSU's board, scores use the baseline weights below, which are pending review."}</div>
  ${card("Comparable-profile screen", "Adjust and every step re-runs", `<div class="v9form">
    <div class="field"><label for="v9-mt">Talent signal at least</label><input id="v9-mt" type="range" min="0.80" max="0.95" step="0.01" value="${Q.f.minTalent}"/><span class="mono">${Q.f.minTalent.toFixed(2)}</span></div>
    <div class="field"><label for="v9-ma">Pass attempts 2024–25 at least</label><input id="v9-ma" type="range" min="0" max="600" step="25" value="${Q.f.minAtt}"/><span class="mono">${Q.f.minAtt}</span></div>
    <div class="field"><label for="v9-sig">Qualifies on</label><select id="v9-sig"><option value="either" ${Q.f.signal === "either" ? "selected" : ""}>Either signal</option><option value="both" ${Q.f.signal === "both" ? "selected" : ""}>Both signals</option></select></div>
    <label class="v9chk"><input type="checkbox" id="v9-fcs" ${Q.f.fcs ? "checked" : ""}/> Include FCS origins</label></div>
    <p class="small">Field: <b>${F.length}</b> of ${Q.data.n} portal QBs · P4 ${lv("P4")} · G5 ${lv("G5")} · FCS ${lv("FCS")}. Martin is always included as the reference. Withdrawn entries are excluded.</p>`)}
  ${card("Baseline weights v0 (written down before any OSU grades are seen)", "Pending review by Dr. Rippee and Nasim", `<table class="t small"><tbody>${Object.entries(BASE_W).map(([k, w]) => `<tr><td>${FEAT_L[k]}</td><td class="mono">${w.toFixed(2)}</td><td class="dim">${{ prod: "Attempts-weighted pass PPA 2024–25, 2025 opponent-adjusted when he played 3+ games with 50+ attempts (game PPA minus the opponent's pass-defense PPA allowed, plus the FBS average), shrunk toward the FBS mean " + Q.data.ref.y2025.mu.toFixed(3) + " with k = 150 attempts", talent: "Mean of high-school composite and portal rating; * = neither available, set to 0.80", exp: "log(1 + pass attempts 2024–25)", level: "Origin conference in 2025: P4 = 1, G5 = 0.5, FCS = 0", rush: "Rush PPA shrunk toward 0 with k = 60 carries", role: "Highest pass-usage share at origin" }[k]}</td></tr>`).join("")}</tbody></table>`)}
  ${card("Closest public profiles to Justyn Martin", "Distance on standardized talent, experience, level, production and rushing", `<div class="scroll-x"><table class="t"><thead><tr><th>Player</th><th>Talent</th><th>Att.</th><th>Raw PPA</th><th>Shrunk</th><th>Rush</th><th>Distance</th></tr></thead><tbody>${rowsFor([Q.mc.m, ...near], { dist: true })}</tbody></table></div>`)}
  ${logCard(["Field Agent"])}${attr()}`;
}
function pageStep3() {
  const g = guard(); if (g) return g;
  const F = Q.mc.field, m = Q.mc.m, top = F.slice(0, 40), inTop = top.includes(m);
  return `<div class="callout"><b>Justyn Martin ranks #${m.rank} of ${F.length}</b> in the comparable field (80% range #${m.rlo}–#${m.rhi}), 1–9 grade ${m.grade} (80% range ${m.glo}–${m.ghi}). The wide range comes from 35 career attempts: production barely moves him, talent signals carry him. ${Q.fit?.rows ? "OSU's Buckeye grades are shown alongside where the board was imported." : "OSU's Buckeye grades appear in the last column once the board is imported."}</div>
  ${card("Rank order", `${Q.wmode === "fitted" ? "Fitted public-only weights from Step 1" : "Baseline weights v0"} · 80% ranges from ${Q.mc.N} Monte Carlo draws`, `<div class="scroll-x"><table class="t"><thead><tr><th>#</th><th>Player</th><th>Talent</th><th>Att.</th><th>Raw PPA</th><th>Shrunk</th><th>Rush</th><th>Score [80%]</th><th>1–9 [80%]</th><th>Rank 80%</th>${Q.fit?.rows ? "<th>OSU grade</th>" : ""}</tr></thead><tbody>${rowsFor(inTop ? top : [...top, m], { rank: true })}</tbody></table></div>
  <p class="note">Showing the top 40${inTop ? "" : " plus Martin"}. The 1–9 grade is a stanine (4-7-12-17-20-17-12-7-4% of the field), so it has the same shape as a 1–9 grade, but it is not OSU's Buckeye grade. Each draw perturbs the weights (Dirichlet, concentration 40) and each player's production by its standard error, then re-ranks the field.</p>`)}
  ${logCard(["Field Agent", "Ranking Agent"])}${attr()}`;
}
function pageStep4() {
  const g = guard(); if (g) return g;
  const T = outcomeTest(), esc = X.esc, F = Q.mc.field;
  const roles = ["Starter", "Rotation / spot starter", "Backup snaps", "No recorded passes", "No destination listed"];
  const list = F.filter((x) => Q.role === "all" || x.o.role === Q.role).sort((a, b) => a.rank - b.rank);
  const sum = roles.map((r) => { const s = F.filter((x) => x.o.role === r); const v = s.map((x) => x.o.shrunk).filter((x) => x != null); return `<div class="kpi"><div class="l">${r}</div><div class="v mono">${s.length}</div><div class="small dim">${v.length ? "median adj. PPA " + f2(qtl(v, 0.5), 3) : "—"}</div></div>`; }).join("");
  const m = Q.mc.m;
  return `<div class="callout"><b>Preliminary, through week ${Q.data.through_week}.</b> Roles come from 2026 pass-usage share: starter ≥ 60%, rotation 20–60%, backup under 20%. Performance is compared within role and destination level, never a backup at Ohio State against a starter elsewhere. Justyn Martin: ${m.o.role.toLowerCase()} at Ohio State so far.</div>
  <div class="kpis">${sum}</div>
  <div class="grid g2" style="margin:14px 0">${card("Real-outcome test", `Did the pre-transfer score line up with 2026 results? QBs with ≥ 100 attempts (n = ${T.n})`, `${scatter(T.F)}<table class="t small"><tbody><tr><td>Spearman, score vs. 2026 adj. PPA (all with ≥ 100 att.)</td><td class="mono"><b>${f2(T.rho, 2)}</b> [80%: ${f2(T.lo, 2)}, ${f2(T.hi, 2)}]</td></tr><tr><td>Starters only (n = ${T.nS})</td><td class="mono">${f2(T.rhoS, 2)}</td></tr>${Q.fit?.rows ? `<tr><td>OSU Buckeye grade vs. 2026 result</td><td class="mono">${(() => { const pr = Q.fit.all.map((b) => [b.grade, F.find((x) => normName(x.r.name) === normName(b.name))]).filter(([, x]) => x && x.o.att >= 100); return pr.length > 4 ? f2(spearman(pr.map((p) => p[0]), pr.map((p) => p[1].o.shrunk)), 2) + ` (n = ${pr.length})` : "too few matched with ≥ 100 att."; })()}</td></tr>` : `<tr><td>OSU Buckeye grade vs. 2026 result</td><td>Needs OSU's board</td></tr>`}</tbody></table>
  <p class="note">Bootstrap of 1,000 resamples. Larger dots are starters; the few points beyond the 2nd–98th percentile are drawn at the edge. A correlation near zero this early is not evidence either way; the interval is what to watch as the season closes.</p>`)}
  ${card("How the 2026 numbers are built", "", `<ul class="v9ul small"><li><b>Games played</b>: weeks with a recorded passing PPA for the player at his 2026 team.</li><li><b>Share of team pass plays</b>: CollegeFootballData's pass-usage share, the closest public proxy for share of team dropbacks.</li><li><b>PPA per pass play</b>: CollegeFootballData's expected-points-added measure, garbage time excluded.</li><li><b>Opponent-adjusted</b>: each game's pass PPA minus the opponent's season pass-defense PPA allowed, plus the FBS average (${Q.data.ref.def_mu["2026"].toFixed(3)}); averaged over games. Used only with 3+ games, otherwise the season PPA. FCS opponents are left unadjusted.</li><li><b>Shrunk</b>: (att × value + 100 × ${Q.data.ref.y2026.mu.toFixed(3)}) ÷ (att + 100).</li><li><b>vs. role & level</b>: shrunk value minus the mean for the same role and destination level (cells with ≥ 3 players).</li></ul>`)}</div>
  ${card("Every comparable quarterback, 2026 to date", "", `<div class="v9form"><div class="field"><label for="v9-role">Role</label><select id="v9-role"><option value="all">All roles</option>${roles.map((r) => `<option ${Q.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></div></div>
  <div class="scroll-x"><table class="t"><thead><tr><th>Step 3 #</th><th>Player</th><th>2026 team (level)</th><th>Role</th><th>Games</th><th>Share of pass plays</th><th>Att.</th><th>PPA / pass</th><th>Opp-adj.</th><th>Shrunk</th><th>vs. role & level</th></tr></thead><tbody>${list.map((x) => `<tr class="${x.r.name === "Justyn Martin" ? "v9me" : ""}"><td class="mono">${x.rank}</td><td><b>${esc(x.r.name)}</b><div class="dim small">from ${esc(x.r.origin)}</div></td><td>${esc(x.r.dest || "–")} ${x.r.dlv ? `(${x.r.dlv})` : ""}</td><td>${x.o.role}</td><td class="mono">${x.o.games}</td><td class="mono">${x.o.att ? (x.o.usage * 100).toFixed(0) + "%" : "–"}</td><td class="mono">${x.o.att}</td><td class="mono">${f2(x.o.ppa, 3)}</td><td class="mono">${f2(x.o.adj, 3)}</td><td class="mono">${f2(x.o.shrunk, 3)}</td><td class="mono">${x.o.rel == null ? "–" : sgn(x.o.rel, 3)}</td></tr>`).join("")}</tbody></table></div>`)}
  ${logCard(["Outcomes Agent"])}${attr()}`;
}
function pageWhatsNew9() {
  const R = [["Ecological validity on OSU's own decisions", "GM, via Dan (text, Nov 9)", "QB Pilot Overview"], ["One grade, scaled 1–9", "Dan (text, Nov 9)", "Steps 1 and 3"], ["Full 2026 QB board, including players passed on", "Pilot plan", "Step 1 import + template"], ["Narrative fields coded reliably before modeling", "Pilot plan", "Step 1 codebook + kappa gate"], ["Which factors drove the signing, and how much", "Pilot plan", "Step 1 weights + choice check"], ["Comparable QBs OSU did not evaluate", "Pilot plan", "Step 2"], ["Rank order with ranges", "Pilot plan", "Step 3"], ["Where they landed and how they are performing", "Pilot plan", "Step 4"], ["Role and level of competition at the destination", "Pilot plan", "Step 4 role groups"], ["Partial-season caution", "Pilot plan", "Step 4 banner"], ["PFF for the next pass", "Dan (text, Nov 9)", "Prerequisites"]];
  return `${card("What changed in v9", "Everything from v8 is unchanged and still in the menu", `<table class="t"><thead><tr><th>Requirement</th><th>From</th><th>Where</th></tr></thead><tbody>${R.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>`)}
  ${card("What v9 does not do yet", "", `<ul class="v9ul"><li>No OSU board has been imported, so Step 1 has not been validated on real staff decisions.</li><li>The baseline weights in Steps 2–3 are a written-down starting point, not a validated model.</li><li>2026 results are partial. PFF grades are not connected.</li><li>Imported boards are held in memory only. School sign-in, storage and access controls are launch gates.</li></ul>`)}`;
}
export const V9PAGES = { qp: pageOverview, qp1: pageStep1, qp2: pageStep2, qp3: pageStep3, qp4: pageStep4, whatsnew9: pageWhatsNew9 };

// ---------- lifecycle ----------
function fieldLog() {
  const F = Q.mc.field, m = Q.mc.m;
  alog("Field Agent", `Screened ${Q.data.n} portal QBs: talent ≥ ${Q.f.minTalent.toFixed(2)} ${Q.f.signal === "both" ? "and" : "or"} ≥ ${Q.f.minAtt} attempts${Q.f.fcs ? "" : ", FCS excluded"}. Field = ${F.length}.`);
  alog("Ranking Agent", `Scored the field with ${Q.wmode === "fitted" ? "fitted public-only" : "baseline v0"} weights and ran ${Q.mc.N} Monte Carlo draws. Martin #${m.rank} (80% #${m.rlo}–#${m.rhi}), 1–9 grade ${m.grade} [${m.glo}–${m.ghi}].`);
  const T = outcomeTest();
  alog("Outcomes Agent", `Matched 2026 results through week ${Q.data.through_week}. ${F.filter((x) => x.o.role === "Starter").length} starters, ${F.filter((x) => x.o.att > 0).length} with any attempts. Score vs. outcome Spearman ${f2(T.rho, 2)} (n = ${T.n}).`);
}
async function load() {
  if (Q.data || Q.loading) return; Q.loading = true;
  try {
    const r = await fetch("./data/qbpilot2026.json"); if (!r.ok) throw new Error("HTTP " + r.status);
    Q.data = await r.json();
    alog("Intake Agent", `Loaded ${Q.data.n} QBs from the 2026 portal file (CollegeFootballData.com, pulled ${Q.data.pulled}).`);
    computeField(); fieldLog();
  } catch (e) { Q.err = String(e.message || e); }
  Q.loading = false; X.render();
}
function rerun() { computeField(); if (Q.board) runStep1(); computeField(); fieldLog(); X.render(); }
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
export function bindV9(ctx) {
  X = ctx; load();
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-v9]"); if (!t) return;
    const a = t.dataset.v9;
    if (a === "practice") { Q.board = practiceBoard(); Q.practice = true; Q.boardName = "Practice board (fictional)"; Q.log = Q.log.filter((l) => !["Coding Agent", "Modeling Agent", "Choice Check", "Fact-Checker"].includes(l.agent)); runStep1(); X.toast("Practice board run · fictional players"); return X.render(); }
    if (a === "clear") { Q.board = null; Q.fit = null; Q.practice = false; Q.wmode = "baseline"; alog("Intake Agent", "Board cleared from memory."); rerun(); return; }
    if (a === "usefit") { Q.wmode = Q.wmode === "fitted" ? "baseline" : "fitted"; alog("Ranking Agent", `Weights switched to ${Q.wmode}.`); rerun(); return; }
    if (a === "template") { const ex = ["Example Player", "Example U", "7", "Big arm, needs polish", "big arm; poise under pressure", "late reads", "Developmental backup with starter tools", "", "Agent name", "N", "250000", "offered", "N", "backup", "2026", ...CB_KEYS.map(() => "")]; return download("osu_qb_board_template.csv", TEMPLATE_COLS.join(",") + "\n" + ex.map((v) => `"${v}"`).join(",") + "\n"); }
    if (a === "copyreq") { const el = document.querySelector("#v9-req"); try { await navigator.clipboard.writeText(el.value); X.toast("Copied"); } catch { el.select(); X.toast("Selected · press Ctrl/Cmd+C"); } return; }
    if (a === "replay") { const saved = Q.log.slice(); Q.log = []; X.render(); for (const l of saved.slice(-14)) { await new Promise((r) => setTimeout(r, 160)); Q.log.push({ ...l, t: now() }); X.render(); } return; }
  });
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "v9-file" && t.files?.[0]) {
      const f = t.files[0], txt = await f.text();
      try { const rows = parseCSV(txt); const miss = ["player", "buckeye_grade", "stage"].filter((c) => !(c in (rows[0] || {}))); if (miss.length) throw new Error("Missing columns: " + miss.join(", "));
        Q.board = rows; Q.practice = false; Q.boardName = f.name; runStep1(); computeField(); X.toast(`Imported ${rows.length} rows · held in memory only`); }
      catch (err) { X.toast("Could not read the board: " + err.message); }
      return X.render();
    }
    if (t.id === "v9-unv") { Q.includeUnverified = t.checked; if (Q.board) runStep1(); return X.render(); }
    if (t.id === "v9-mt") { Q.f.minTalent = +t.value; return rerun(); }
    if (t.id === "v9-ma") { Q.f.minAtt = +t.value; return rerun(); }
    if (t.id === "v9-sig") { Q.f.signal = t.value; return rerun(); }
    if (t.id === "v9-fcs") { Q.f.fcs = t.checked; return rerun(); }
    if (t.id === "v9-role") { Q.role = t.value; return X.render(); }
  });
}
