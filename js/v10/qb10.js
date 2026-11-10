// Portal Lab v10 · QB Pilot three-panel view, coach's assistant (scenarios) and the co-head coach agent.
// Public data only (CollegeFootballData.com pull of 2026-11-09 plus cited reporting). Imported boards stay in tab memory.

export const V10NAV = [
  { k: "qb10", label: "QB Pilot · Three Panels" },
  { k: "whatsnew10", label: "What Changed in v10" },
];
export const V10TITLES = {
  qb10: ["QB Pilot · Three Panels", "What Ohio State did, what we would have done, and the Coach Day version (simulation)"],
  whatsnew10: ["What Changed in v10", "Three panels, scenarios and a co-head coach agent on the QB Pilot"],
};
export const V10KEYS = V10NAV.map((n) => n.k);

const ASOF = "2026-11-09";
const PARTIAL = "PARTIAL - IN PROGRESS";
const PH = "PLACEHOLDER - AWAITING OSU BOARD";

// ---------- sources (every statement links to one of these) ----------
const S = {
  cfbd: { n: "CollegeFootballData.com", u: "https://collegefootballdata.com", d: "pulled 2026-11-09" },
  cfbd27: { n: "CollegeFootballData.com 2027 portal feed", u: "https://collegefootballdata.com", d: "pulled 2026-11-10" },
  tentv: { n: "10TV", u: "https://www.10tv.com/article/sports/football/ohio-state-football/julian-sayin-injury-ohio-state-indiana-ryan-day-luke-fahey/530-04e36e58-7ee5-4143-a0fd-162622f5b0c2", d: "2026-10-17" },
  athOct20: { n: "The Athletic", u: "https://www.nytimes.com/athletic/7707857/2026/10/20/ohio-state-julian-sayin-injury-update/", d: "2026-10-20" },
  clutchOct21: { n: "ClutchPoints", u: "https://clutchpoints.com/ncaa-football/ohio-state-football-news-julian-sayin-out-indefinitely-elbow-injury-ryan-day-announces", d: "2026-10-21" },
  dispOct17: { n: "Columbus Dispatch", u: "https://www.dispatch.com/story/sports/college/football/2026/10/17/ohio-state-responds-to-luke-fahey-replacing-julian-sayin-after-indiana-injury/92231885007/", d: "2026-10-17" },
  rabin: { n: "Bill Rabinowitz (Substack)", u: "https://billrabinowitz.substack.com/p/exclusive-ive-learned-details-about", d: "Nov. 2026" },
  clutchNov6: { n: "ClutchPoints", u: "https://clutchpoints.com/ncaa-football/ohio-state-football-rumors-julian-sayin-suffered-elbow-fracture-that-required-surgery", d: "2026-11-06" },
  heavyDay: { n: "Heavy", u: "https://heavy.com/sports/college-football/ohio-state-buckeyes/julian-sayin-injury-update-ohio-state-insider-detailsnews/", d: "2026-11-09" },
  heavyFahey: { n: "Heavy", u: "https://heavy.com/sports/college-football/ohio-state-buckeyes/when-julian-sayin-coming-back-injury-return-timeline-ohio-state-qb/", d: "2026-11-10" },
  espnNov10: { n: "ESPN", u: "https://www.espn.com/college-football/story/_/id/50415666/ryan-day-disappointed-ohio-state-cfp-hopes-crumble", d: "2026-11-10" },
  cleveSep25: { n: "cleveland.com", u: "https://www.cleveland.com/osu/2026/09/why-ohio-state-football-is-considering-a-package-to-get-its-scout-team-quarterback-on-the-field.html", d: "2026-09-25" },
  day247: { n: "247Sports", u: "https://247sports.com/college/ohio-state/article/ryan-day-goes-in-depth-on-julian-sayin-tavien-st-clair-rest-of-ohio-states-qb-room-273225224/", d: "2026-02-04" },
  ewCommit: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football-recruiting/2026/01/161074/former-maryland-and-ucla-quarterback-justyn-martin-transferring-to-ohio-state", d: "2026-01-12" },
  ewTracker: { n: "Eleven Warriors portal tracker", u: "https://www.elevenwarriors.com/ohio-state-football/2026/01/160827/ohio-state-transfer-portal-tracker-quarterback-lincoln-kienholz-tight-end-jelani-thurman-and-defensive-back-bryce", d: "Jan. 2026" },
  ewNeeds: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football/2026/01/161110/transfer-needs-buckeyes-still-have-big-holes-to-fill-10-days-after-portal-opening-kicker-cornerback-defensive-end", d: "2026-01-16" },
  ewFessler: { n: "Eleven Warriors", u: "https://www.elevenwarriors.com/ohio-state-football/2026/01/161184/ohio-state-s-track-record-of-developing-nfl-quarterbacks-connection-with-billy-fessler-drew-justyn-martin-to-buckeyes", d: "2026-01-24" },
  m247: { n: "247Sports", u: "https://247sports.com/college/ohio-state/article/ohio-state-adds-quality-qb-depth-with-maryland-transfer-justyn-martin-270633634/", d: "2026-01-12" },
  bsports: { n: "Buckeye Sports Bulletin", u: "https://buckeyesports.com/former-ucla-and-maryland-quarterback-justyn-martin-reportedly-transfers-to-ohio-state/", d: "2026-01-12" },
  on3wire: { n: "On3 Ohio State portal wire", u: "https://www.on3.com/college/ohio-state-buckeyes/transfer-portal/wire/football/", d: "Jan. 2026" },
  staub247: { n: "247Sports", u: "https://247sports.com/college/tennessee/article/ryan-staub-tennessee-recruiting-colorado-qb-transfer-commits-to-ut-excited-to-be-a-vol-271511136/", d: "2026-01-18" },
  staubWire: { n: "Buffaloes Wire (USA Today)", u: "https://coloradobuffaloeswire.usatoday.com/story/sports/college/buffaloes/football/2026/01/09/ryan-staub-transfer-portal-ohio-state-kentucky-cincinnati/88102190007", d: "2026-01-09" },
  potter247: { n: "247Sports", u: "https://247sports.com/player/jaxon-potter-46102064/college-354637", d: "2026-01-09" },
  athJan21: { n: "The Athletic", u: "https://www.nytimes.com/athletic/6986974/2026/01/21/ohio-state-transfer-portal-commitments-players/", d: "2026-01-21" },
  why247: { n: "247Sports", u: "https://247sports.com/college/ohio-state/article/ohio-state-nfl-draft-jeremiah-smith-quarterback-ryan-day-283663152", d: "2026" },
  athNov10: { n: "The Athletic", u: "https://www.nytimes.com/athletic/7768863/2026/11/10/ohio-state-oregon-takeaways-ryan-day/", d: "2026-11-10" },
  ncaa: { n: "NCAA Figure 13-1, transfer windows", u: "https://ncaaorg.s3.amazonaws.com/compliance/d1/D1Comp_UndergraduateTransferWindows.pdf", d: "2026-27" },
  detroit: { n: "Detroit News portal tracker", u: "https://www.detroitnews.com/story/sports/college/football/2026/01/02/ohio-state-football-transfer-portal-tracker-2026/87998883007/", d: "Jan. 2026" },
  herald: { n: "Herald-Sun (Sports Illustrated)", u: "https://www.heraldsun.com/sports/article314296802.html", d: "Jan. 2026" },
  lghl: { n: "Land-Grant Holy Land", u: "https://www.landgrantholyland.com/ohio-state-football/109642/live-updates-ohio-state-transfer-portal-tracker", d: "Jan. 2026" },
};
let X = null;
const esc = (s) => (X ? X.esc(String(s ?? "")) : String(s ?? ""));
const src = (k, extra = "") => { const s = S[k]; return s ? `<a class="v10src" href="${s.u}" target="_blank" rel="noopener">${esc(s.n)}${extra ? " · " + esc(extra) : ""} · ${esc(s.d)}</a>` : ""; };
const NA = (searched) => `<span class="v10na" title="Searched: ${esc(searched)}">NOT AVAILABLE</span><span class="v10na-s">searched: ${esc(searched)}</span>`;
const tag = (t, cls = "") => `<span class="v8tag ${cls}">${t}</span>`;
const f2 = (v, d = 2) => (v == null || Number.isNaN(v) ? null : (+v).toFixed(d));
const sg = (v, d = 3) => (v == null ? null : (v >= 0 ? "+" : "") + (+v).toFixed(d));
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const sdv = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))) || 1; };
const rankArr = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
const pearson = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db || 1); };
const spearman = (a, b) => pearson(rankArr(a), rankArr(b));
const nowT = () => new Date().toTimeString().slice(0, 5);
const card = (h, p, body, right = "") => `<section class="card card-pad"><div class="card-h"><div><h3>${h}</h3>${p ? `<p>${p}</p>` : ""}</div><div class="sp"></div>${right}</div>${body}</section>`;
const val = (v, searched = "CollegeFootballData.com") => (v == null ? NA(searched) : esc(v));

// ---------- state ----------
const P = { data: null, logs: null, err: null, loading: false, tab: "p1", pick: null, scen: "sayin", weeks: 4, showAll: false,
  board: null, boardName: "", fitW: null, fitInfo: null, asof: "oct17", chat: [], open: !(typeof matchMedia === "function" && matchMedia("(max-width: 900px)").matches), speaking: false, listening: false, scroll: {} };

// ---------- the eight staff criteria (Panel 2) ----------
// Weights are provisional until OSU's board replaces them (Data Intake recomputes them from Buckeye grades).
export const P2_FACTORS = [
  { k: "exp", l: "Experience", how: "Pass attempts in 2024–25, weighted by level (P4 1.0, G5 0.75, FCS 0.5), plus a bonus for a season as the primary passer (≥ 50% of team pass plays and ≥ 100 attempts)", w: 0.25 },
  { k: "arm", l: "Arm talent", how: "Proxy only: yards per attempt 2024–25, shrunk toward the field mean (k = 60 attempts). No public velocity or throw-quality data", w: 0.15 },
  { k: "mob", l: "Mobility", how: "Rush PPA 2024–25, shrunk toward 0 (k = 60 carries)", w: 0.10 },
  { k: "proc", l: "Processing", how: "Proxy only: opponent-adjusted pass PPA 2024–25, shrunk toward the FBS mean (k = 150 attempts)", w: 0.30 },
  { k: "fit", l: "Fit with the offense", how: "Needs the staff's scheme evaluation", w: 0, na: "staff evaluation (not public)" },
  { k: "dev", l: "Development track record", how: "Proxy only: mean of high-school composite and portal rating (247Sports via CFBD)", w: 0.20 },
  { k: "role", l: "Role sought", how: "Starter vs. backup intent is reported for only a few players", w: 0, na: "On3, 247Sports, Eleven Warriors reporting" },
  { k: "econ", l: "Economics", how: "NIL and revenue-share terms are not public", w: 0, na: "On3 NIL pages, team reporting" },
];
const NUMK = ["exp", "arm", "mob", "proc", "dev"];

// ---------- Panel 3 simulation factors from public statements ----------
const P3_FACTORS = [
  { k: "mob", l: "Athleticism", w: 0.25, q: "\u201cHe's a good athlete.\u201d — Ryan Day on Martin", s: "day247", q2: "Day on building a package around Martin's athleticism", s2: "cleveSep25" },
  { k: "exp", l: "Understands the position · experience", w: 0.20, q: "\u201cHe understands the position.\u201d — Ryan Day", s: "day247", q2: "\u201cI've learned plenty of offenses in the past\u201d — Justyn Martin", s2: "ewFessler" },
  { k: "fam", l: "Staff familiarity", w: 0.15, q: "\u201cJustyn Martin was a guy that (QB coach) Billy (Fessler) was aware of.\u201d — Ryan Day", s: "day247", note: "Coded 1 if the player was on UCLA's roster in 2024, when Fessler was briefly UCLA's QB coach. Otherwise 0.", ns: ["ewFessler"] },
  { k: "acc", l: "Accepts the depth role · competes for QB2", w: 0.15, q: "\u201cHe's not going to take a backseat to anybody.\u201d — Ryan Day", s: "day247", q2: "Day needed a fourth quarterback and Martin wanted to be developed at a higher level (analysis)", s2: "athJan21", note: "Reported for 2 players only: Martin (+1, said he was excited to learn from Sayin and compete the following year) and Staub (−1, reportedly looking to start). Everyone else is neutral (0).", ns: ["herald", "staubWire"] },
  { k: "dev", l: "Development upside", w: 0.15, q: "\u201cI was really sold on them being able to develop me into the quarterback that I want to be.\u201d — Justyn Martin", s: "ewFessler" },
  { k: "proc", l: "Production · processing", w: 0.10, q: "No public statement found. Kept at a low weight so the simulation is not driven by a factor the staff did not cite.", s: null },
];

// ---------- feature building ----------
const LV = { P4: 1, G5: 0.75, FCS: 0.5, Other: 0.25 };
function feats(r, ref, fieldYPA) {
  const a25 = r.pre25?.att || 0, a24 = r.pre24?.att || 0, n = a25 + a24;
  const lv = LV[r.olv] ?? 0.25;
  const starter = [r.pre25, r.pre24].some((s) => s && (s.usage || 0) >= 0.5 && (s.att || 0) >= 100);
  const exp = Math.log1p(n * lv) + (starter ? 0.75 : 0);
  const yds = (r.pre25?.yds || 0) + (r.pre24?.yds || 0);
  const arm = (yds + 60 * fieldYPA) / (n + 60);
  const car = (r.pre25?.car || 0) + (r.pre24?.car || 0);
  const rr = [r.pre25?.ppa_rush, r.pre24?.ppa_rush].filter((x) => x != null);
  const mob = rr.length ? (car * mean(rr)) / (car + 60) : 0;
  const v25 = r.pre25 ? (r.pre25.games >= 3 && r.pre25.att >= 50 ? (r.pre25.adj ?? r.pre25.ppa_pass) : r.pre25.ppa_pass) : null, v24 = r.pre24?.ppa_pass ?? null;
  const wa = (v25 != null ? a25 : 0) + (v24 != null ? a24 : 0);
  const raw = wa ? ((v25 != null ? a25 * v25 : 0) + (v24 != null ? a24 * v24 : 0)) / wa : null;
  const proc = raw == null ? ref.y2025.mu : (wa * raw + 150 * ref.y2025.mu) / (wa + 150);
  const tal = [r.hs?.rating, r.rating].filter((x) => x != null && x > 0);
  const dev = tal.length ? mean(tal) : null;
  const fam = r.origin === "UCLA" || r.pre24team === "UCLA" ? 1 : 0;
  const acc = r.name === "Justyn Martin" ? 1 : r.name === "Ryan Staub" ? -1 : 0;
  return { n, starter, exp, arm, ypa: n ? yds / n : null, mob, proc, raw, dev, devNA: dev == null, fam, acc };
}
function outcome(r, ref) {
  const s = r.now;
  if (!s || !s.att) return { att: s?.att || 0, games: s?.games ?? null, usage: s?.usage ?? null, role: r.dest ? "No recorded passes" : "No destination listed", ppa: null, adj: null, shrunk: null };
  const v = s.games >= 3 ? (s.adj ?? s.ppa_pass) : s.ppa_pass, mu = ref.y2026.mu;
  const role = (s.usage || 0) >= 0.6 ? "Starter" : (s.usage || 0) >= 0.2 ? "Rotation" : "Backup";
  return { att: s.att, games: s.games, usage: s.usage, role, ppa: s.ppa_pass, adj: s.games >= 3 ? s.adj : null, shrunk: v == null ? null : (s.att * v + 100 * mu) / (s.att + 100) };
}
function inComparable(r, f) {
  if (r.elig === "Withdrawn") return false;
  if (r.name === "Justyn Martin") return true;
  const startExp = [r.pre25, r.pre24].some((s) => s && (s.usage || 0) >= 0.5 && (s.att || 0) >= 100) && ["P4", "G5"].includes(r.olv);
  const rated = (r.rating || 0) >= 0.85 || (r.hs?.rating || 0) >= 0.88;
  return startExp || rated;
}
function compute() {
  const D = P.data, ref = D.ref;
  const pre = D.rows.filter((r) => inComparable(r));
  const ya = pre.map((r) => [(r.pre25?.yds || 0) + (r.pre24?.yds || 0), (r.pre25?.att || 0) + (r.pre24?.att || 0)]);
  const fieldYPA = ya.reduce((s, x) => s + x[0], 0) / (ya.reduce((s, x) => s + x[1], 0) || 1);
  const field = pre.map((r) => ({ r, f: feats(r, ref, fieldYPA), o: outcome(r, ref) }));
  const devMean = mean(field.filter((x) => !x.f.devNA).map((x) => x.f.dev));
  field.forEach((x) => { if (x.f.devNA) x.f.dev = devMean; });
  const keys = [...NUMK, "fam", "acc"];
  const st = Object.fromEntries(keys.map((k) => [k, { m: mean(field.map((x) => x.f[k])), s: sdv(field.map((x) => x.f[k])) }]));
  field.forEach((x) => { x.z = Object.fromEntries(keys.map((k) => [k, (x.f[k] - st[k].m) / st[k].s])); x.z.acc = x.f.acc; });
  const W2 = P.fitW || Object.fromEntries(P2_FACTORS.filter((f) => NUMK.includes(f.k)).map((f) => [f.k, f.w]));
  field.forEach((x) => { x.s2 = NUMK.reduce((s, k) => s + (W2[k] || 0) * x.z[k], 0); x.s3 = P3_FACTORS.reduce((s, f) => s + f.w * x.z[f.k], 0); });
  [...field].sort((a, b) => b.s2 - a.s2).forEach((x, i) => { x.rk2 = i + 1; });
  [...field].sort((a, b) => b.s3 - a.s3).forEach((x, i) => { x.rk3 = i + 1; });
  // performance relative to role and level of competition (destination)
  const cell = {}; field.forEach((x) => { if (x.o.shrunk == null || x.o.games < 3) return; const k = x.o.role + "|" + x.r.dlv; (cell[k] = cell[k] || []).push(x.o.shrunk); });
  field.forEach((x) => { const c = cell[x.o.role + "|" + x.r.dlv]; x.o.rel = x.o.shrunk != null && x.o.games >= 3 && c && c.length >= 3 ? x.o.shrunk - mean(c) : null; });
  // comparison strip: terciles of model rank vs terciles of 2026 results (players with ≥ 100 attempts and ≥ 3 games)
  const E = field.filter((x) => x.o.att >= 100 && x.o.games >= 3 && x.o.shrunk != null);
  const er2 = rankArr(E.map((x) => -x.s2)), eo = rankArr(E.map((x) => -x.o.shrunk));
  const t = (r) => (r <= E.length / 3 ? 1 : r <= (2 * E.length) / 3 ? 2 : 3);
  E.forEach((x, i) => { x.mt = t(er2[i]); x.ot = t(eo[i]); });
  const rho = E.length > 4 ? spearman(E.map((x) => x.s2), E.map((x) => x.o.shrunk)) : null;
  const rho3 = E.length > 4 ? spearman(E.map((x) => x.s3), E.map((x) => x.o.shrunk)) : null;
  P.mc = { field, st, W2, E, rho, rho3, fieldYPA, ref, m: field.find((x) => x.r.name === "Justyn Martin") };
}

// ---------- data intake (CSV / XLSX) ----------
export const INTAKE_COLS = ["player", "prior_school", "buckeye_grade", "one_liner", "strengths", "weaknesses", "summary", "notes", "stage_reached", "outcome", "agent", "economics"];
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const h = (rows.shift() || []).map(normH);
  return rows.filter((r) => r.some((v) => String(v).trim())).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}
const normH = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
function loadXLSXLib() { return new Promise((res, rej) => { if (window.XLSX) return res(window.XLSX); const s = document.createElement("script"); s.src = "./js/vendor/xlsx.full.min.js"; s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error("Could not load the spreadsheet reader")); document.head.appendChild(s); }); }
async function readFile(file) {
  if (/\.xlsx?$/i.test(file.name)) {
    const XL = await loadXLSXLib(); const wb = XL.read(await file.arrayBuffer(), { type: "array" });
    const raw = XL.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    return raw.map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [normH(k), String(v).trim()])));
  }
  return parseCSV(await file.text());
}
const nm = (s) => String(s || "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "").replace(/[^a-z]/g, "");
function fitFromBoard() {
  // Ridge regression of the Buckeye grade (1-9) on the z-scored public factors, for board players matched to the portal file.
  P.fitW = null; P.fitInfo = null; compute();
  const byName = new Map(P.mc.field.map((x) => [nm(x.r.name), x]));
  const M = P.board.map((b) => ({ b, x: byName.get(nm(b.player)), g: parseFloat(b.buckeye_grade) })).filter((m) => m.x && !Number.isNaN(m.g));
  if (M.length < 5) { P.fitInfo = { n: M.length, ok: false, msg: `Matched ${M.length} graded players to the portal file. At least 5 are needed to recompute weights, so the provisional weights stay in place.` }; return; }
  const k = NUMK.length, lam = 1.0, gm = mean(M.map((m) => m.g));
  const A = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => M.reduce((s, m) => s + m.x.z[NUMK[i]] * m.x.z[NUMK[j]], 0) + (i === j ? lam : 0)));
  const bv = NUMK.map((key) => M.reduce((s, m) => s + m.x.z[key] * (m.g - gm), 0));
  for (let i = 0; i < k; i++) { let p = i; for (let r = i + 1; r < k; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [bv[i], bv[p]] = [bv[p], bv[i]]; for (let r = 0; r < k; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c < k; c++) A[r][c] -= f * A[i][c]; bv[r] -= f * bv[i]; } }
  const coef = bv.map((v, i) => v / A[i][i]);
  const pos = coef.map((c) => Math.max(0, c)), tot = pos.reduce((a, b) => a + b, 0);
  if (!tot) { P.fitInfo = { n: M.length, ok: false, coef, msg: "No factor had a positive link to the Buckeye grade. The provisional weights stay in place." }; return; }
  P.fitW = Object.fromEntries(NUMK.map((key, i) => [key, pos[i] / tot]));
  P.fitInfo = { n: M.length, ok: true, coef, msg: `Weights recomputed from ${M.length} Buckeye grades (ridge regression, λ = 1, negative links set to 0).` };
}

// ---------- roster at the time of the pick (Jan. 12, 2026) ----------
const ROOM = [
  { n: "Julian Sayin", d: "Starter. 391 pass attempts in 2025", s: "cfbd" },
  { n: "Tavien St. Clair", d: "Redshirt freshman in 2026. 2 pass attempts in 2025", s: "cfbd" },
  { n: "Luke Fahey", d: "Incoming true freshman, three-star. 0 college attempts", s: "heavyFahey" },
  { n: "Justyn Martin", d: "Transfer from Maryland (and UCLA). 35 career attempts, all in 2024 at UCLA", s: "ewCommit" },
];
const careerAtt = (r) => (r.pre25?.att || 0) + (r.pre24?.att || 0);

// ---------- scenario engine ----------
const SCEN = {
  sayin: { l: "Sayin · right elbow, Oct. 17", d: "The real event: Sayin hurt at Indiana on Oct. 17, 2026" },
  season: { l: "Starter out for the season", d: "QB1 unavailable from Oct. 17 through the postseason" },
  four: { l: "Starter out four weeks", d: "QB1 unavailable for four weeks from Oct. 17" },
  window: { l: "Backup enters the January window", d: "The 2026-27 football window is Jan. 4–13, 2027. There is no spring football window" },
  two: { l: "Two quarterbacks out", d: "QB1 and QB2 unavailable at the same time" },
};
function gamesInWindow(weeks) {
  const start = new Date("2026-10-17T12:00:00"), end = weeks == null ? null : new Date(start.getTime() + weeks * 7 * 864e5);
  return (P.logs?.osu_games || []).filter((g) => new Date(g.date + "T12:00:00") > start && (!end || new Date(g.date + "T12:00:00") <= end));
}
const res = (g) => (g.osu == null ? "not yet played" : `${g.osu > g.opp_pts ? "W" : "L"} ${g.osu}–${g.opp_pts}`);
function runScenario(key, pickName, weeks) {
  const x = P.mc.field.find((y) => y.r.name === pickName) || P.mc.m;
  const isM = x.r.name === "Justyn Martin";
  const fa = P.logs.osu2026["Luke Fahey"], sy = P.logs.osu2026["Julian Sayin"];
  const xo = x.o, xAtt = careerAtt(x.r);
  const xLine = `${esc(x.r.name)} had ${xAtt} FBS-level pass attempts in 2024–25 at the time of the pick (${src("cfbd")}).`;
  const xNow = xo.att ? `In 2026 at ${esc(x.r.dest)} (${esc(x.r.dconf || "")}): ${xo.role.toLowerCase()}, ${xo.att} attempts in ${xo.games} games, PPA per pass play ${f2(xo.ppa, 3) ?? "NOT AVAILABLE"}${xo.adj != null ? `, opponent-adjusted ${f2(xo.adj, 3)}` : ""} (${src("cfbd")}, ${PARTIAL}).` : `In 2026: no pass attempts recorded at ${esc(x.r.dest || "a listed destination")} (${src("cfbd")}).`;
  const caveat = isM ? "" : `<p class="small muted">This is evidence of readiness, not proof he would have played better at Ohio State. His role, team and level differ.</p>`;
  const B = { what: [], issue: [], other: [] };
  if (key === "sayin" || key === "season" || key === "four") {
    const wk = key === "four" ? 4 : key === "sayin" ? null : null;
    const G = gamesInWindow(key === "four" ? (weeks || 4) : null);
    const played = G.filter((g) => g.osu != null), left = G.filter((g) => g.osu == null);
    B.what.push(`Luke Fahey, a true freshman, replaced Sayin at Indiana and has started since (${src("dispOct17")}; ${src("espnNov10")}).`);
    B.what.push(`Games in this window: ${G.map((g) => `${esc(g.opp)} ${res(g)}`).join(" · ") || "none"} (${src("cfbd")}). ${played.length} played, ${left.length} still to play${key === "four" ? "" : ", plus any postseason"}.`);
    B.what.push(`Fahey in 2026: ${fa.att} attempts, ${fa.yds} yards, ${fa.td} TD, ${fa.int} INT, PPA per pass play ${fa.ppa_pass.toFixed(3)}. Sayin before the injury: ${sy.ppa_pass.toFixed(3)} on ${sy.att} attempts (${src("cfbd")}, ${PARTIAL}).`);
    if (isM) B.what.push(`Martin did not take over. No 2026 pass or rush is recorded for him (${src("cfbd")}), and The Athletic reported he fell below St. Clair and Fahey on the depth chart (${src("athOct20")}).`);
    else B.what.push(`With ${esc(x.r.name)} in Martin's place: ${xLine} ${xNow}`);
    B.issue.push(`At the time of the pick, the three quarterbacks behind Sayin had ${2 + 0 + 35} college pass attempts combined: St. Clair 2, Fahey 0, Martin 35 (${src("cfbd")}). The backup plan depended on a player with no college snaps.`);
    B.issue.push(`Ohio State hosted Martin and Ryan Staub and offered Jaxon Potter. Staub (55 attempts in 2025) and Potter (95 attempts, 3 starts in 2025) brought more recent game experience (${src("ewTracker")}; ${src("cfbd")}).`);
    B.other.push(`The timeline changed three times: \u201cseveral weeks\u201d on Oct. 17 (${src("tentv")}), out indefinitely on Oct. 20 (${src("athOct20")}), then a reported fracture with surgery (${src("rabin")}). Ohio State has not confirmed the diagnosis (${src("clutchNov6")}).`);
    B.other.push(`The veteran signed for depth ended up fourth, behind two first- and second-year players (${src("athOct20")}).`);
    if (key === "four") B.other.push(`A four-week absence would have ended before the Nebraska game. Day has since said \u201cit's not going to be next week, or next month\u201d (${src("heavyDay")}).`);
  } else if (key === "window") {
    B.what.push(`The next football window runs Jan. 4–13, 2027. There is no spring football window in 2026-27 (${src("ncaa")}).`);
    B.what.push(`If Fahey or St. Clair enters, the room drops to Sayin (status for 2027 not announced), one young quarterback and ${isM ? "Martin" : esc(x.r.name)}. Martin is in his final season unless a medical hardship waiver is granted (${src("m247")}).`);
    B.what.push(`The 2027 portal feed shows 0 quarterback entries so far (${src("cfbd27")}). The window has not opened.`);
    B.issue.push(`Day's stated target is four scholarship quarterbacks (${src("ewCommit")}). One departure in January leaves two or three.`);
    B.issue.push(`The Athletic: \u201cRegardless of Sayin's choice, Ohio State must pursue a quarterback in the portal in January\u201d (${src("athNov10")}).`);
    B.other.push(`A 10-day window gives the staff less time to replace a departure than the old 15-day window (${src("ncaa")}).`);
    B.other.push(`${isM ? "Martin's" : esc(x.r.name) + "'s"} 2027 eligibility is not confirmed from a public source: NOT CONFIRMED.`);
  } else if (key === "two") {
    B.what.push(`With Sayin and Fahey both out, the next quarterback is St. Clair: 7 attempts in 2026 and 2 in 2025 (${src("cfbd")}).`);
    B.what.push(isM ? `After him comes Martin: no 2026 snaps recorded (${src("cfbd")}). Day had discussed a package for him based on his athleticism (${src("cleveSep25")}).` : `With ${esc(x.r.name)} as QB4: ${xLine} ${xNow}`);
    B.issue.push(`The room had no quarterback with a full college season as a starter behind Sayin (${src("cfbd")}).`);
    B.other.push(`Scout-team duty limited Martin's first-team reps (${src("cleveSep25")}). A QB4 needs some first-team reps to be ready.`);
  }
  return { x, B, caveat };
}

// ---------- rendering ----------
function guard() {
  if (P.err) return card("Could not load the QB data", "", `<p class="small">${esc(P.err)}</p>`);
  if (!P.data || !P.mc) return `<div class="v10load">Loading public quarterback data…</div>`;
  return null;
}
const COPY = {
  p1: "Ohio State signed one transfer quarterback in the 2026 cycle: Justyn Martin, from Maryland. This panel shows the staff's board as the staff built it. Until Ohio State provides the board, the entries here are placeholders built from public reporting and are marked as such.",
  p2: "If we had the staff's grades and evaluations, we would score every comparable quarterback in the 2026 portal on the staff's own criteria, rank them, and track each one to where he is now. This panel does that with public data. Each quarterback shows his 2026 destination, games played, share of team dropbacks, EPA per dropback and opponent-adjusted passing value, judged against his role and level of competition. Where the ranking and the season results agree, the staff's criteria are working. Where they diverge is where the model adds value.",
  p3: "The decision algorithm for quarterbacks sits with Coach Day. With 45 minutes of his reasoning on two or three quarterbacks the staff passed on, we would code that reasoning into the model and this panel would show his method applied to the whole field. We have not had those 45 minutes. What is shown here is a simulation of that view, built from the staff's public statements and the Martin signing, and labelled as such. With Ohio State's board, Panel 2 replaces it. With Coach Day's time, Panel 3 becomes real.",
};
const TABS = [["p1", "WHAT OHIO STATE DID"], ["p2", "WHAT WE WOULD HAVE DONE"], ["p3", "THE COACH DAY VERSION (SIMULATION)"]];

function intake() {
  return `<div class="v10intake"><div><b>DATA INTAKE</b> <span class="small muted">CSV or XLSX · ${INTAKE_COLS.join(", ")}</span></div>
  <div class="row-btns"><label class="btn"><input type="file" id="v10-file" accept=".csv,.xlsx,.xls" hidden>Load Ohio State board</label><button class="btn ghost" data-v10="tmpl">Download template</button>${P.board ? `<button class="btn ghost" data-v10="clear">Clear</button>` : ""}</div>
  <div class="small">${P.board ? `Loaded <b>${esc(P.boardName)}</b> · ${P.board.length} rows · held in this tab's memory only` : `<span class="v10await">Awaiting Ohio State board</span>`}</div></div>`;
}
function panel1() {
  const m = P.mc.m;
  const board = P.board ? P.board.map((b) => ({ player: b.player, prior: b.prior_school, stage: b.stage_reached, outcome: b.outcome, grade: b.buckeye_grade, one: b.one_liner, notes: [b.strengths && "Strengths: " + b.strengths, b.weaknesses && "Weaknesses: " + b.weaknesses, b.summary, b.notes].filter(Boolean).join(" · "), agent: b.agent, econ: b.economics, src: "Ohio State board (" + P.boardName + ")" })) : [
    { player: "Justyn Martin", prior: "Maryland (previously UCLA)", stage: "Signed", outcome: "Committed Jan. 12, 2026 after a Jan. 10 visit. Ohio State's fourth scholarship QB", srcs: ["ewTracker", "ewCommit", "bsports", "on3wire"] },
    { player: "Ryan Staub", prior: "Colorado", stage: "Visit", outcome: "Visited Ohio State, then committed to Tennessee on Jan. 18, 2026", srcs: ["ewTracker", "ewNeeds", "staub247"] },
    { player: "Jaxon Potter", prior: "Washington State", stage: "Offer", outcome: "Announced an Ohio State offer Jan. 5, 2026. Committed to Old Dominion on Jan. 9", srcs: ["ewTracker", "potter247"] },
  ];
  const rows = board.map((b) => { const x = P.mc.field.find((y) => nm(y.r.name) === nm(b.player)); return `<tr class="${nm(b.player) === "justynmartin" ? "v10hl" : ""} v10click" data-v10pick="${esc(x?.r.name || b.player)}"><td><b>${esc(b.player)}</b>${P.board ? "" : `<div>${tag(PH, "warn")}</div>`}</td><td>${esc(b.prior)}</td><td>${tag(esc(b.stage || "NOT AVAILABLE"))}</td>${P.board ? `<td>${esc(b.grade || "—")}</td>` : ""}<td>${esc(b.outcome)}${b.one ? `<div class="small muted">${esc(b.one)}</div>` : ""}${b.notes ? `<div class="small">${esc(b.notes)}</div>` : ""}</td><td class="small">${b.srcs ? b.srcs.map((k) => src(k)).join("<br>") : esc(b.src)}</td></tr>`; }).join("");
  return `${card("Justyn Martin · QB", "From Maryland, previously UCLA · signed January 2026 · role: fourth scholarship quarterback behind Julian Sayin", `<div class="v10kv">
    <div><span>Signed</span><b>Jan. 12, 2026</b>${src("ewCommit")}</div>
    <div><span>Career passing before OSU</span><b>24 of 35, 179 yards, 1 TD</b>${src("cfbd", "2024 at UCLA")}</div>
    <div><span>2025 at Maryland</span><b>0 pass attempts</b>${src("cfbd")}</div>
    <div><span>Recruiting</span><b>4-star, 0.902, No. 295 (2022)</b>${src("m247")}</div>
    <div><span>2026 at Ohio State</span><b>No pass or rush recorded</b>${src("cfbd", "through week 10")}</div>
    <div><span>Depth chart 2026</span><b>Behind Sayin, Fahey and St. Clair</b>${src("cleveSep25")}</div></div>`)}
  ${card("The staff's board · 2026 quarterback cycle", P.board ? "Loaded from the Ohio State file. Click a row for the coach's assistant." : "Built from public reporting until Ohio State provides the board. Click a row for the coach's assistant.", intake() + `<div class="tbl-wrap"><table class="t"><thead><tr><th>Player</th><th>Prior school</th><th>Stage reached</th>${P.board ? "<th>Buckeye grade</th>" : ""}<th>Outcome</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small muted">Stages: reported interest · contact · visit · offer · signed. Also in this cycle, Lincoln Kienholz left Ohio State for Louisville (${src("detroit")}).</p>`)}`;
}
function outCells(x) {
  const o = x.o;
  const dash = (v, d = 3, f = f2) => (v == null ? NA("CollegeFootballData.com") : f(v, d));
  if (!x.r.dest) return `<td colspan="8">${NA("CFBD 2026 portal destination")}</td>`;
  return `<td>${esc(x.r.dest)}</td><td>${esc(x.r.dconf || "")} <span class="small muted">${esc(x.r.dlv || "")}</span></td><td>${tag(o.role, o.role === "Starter" ? "ok" : "")}</td><td>${o.games ?? NA("CFBD game logs")}</td><td>${o.usage == null ? NA("CFBD usage") : Math.round(o.usage * 100) + "%"}</td><td>${dash(o.ppa)}</td><td>${o.adj == null ? (o.att ? `<span class="small">needs 3+ games</span>` : NA("CFBD")) : f2(o.adj, 3)}</td><td>${o.rel == null ? `<span class="small muted">—</span>` : sg(o.rel, 3)}</td>`;
}
function rankTable(key) {
  const F = [...P.mc.field].sort((a, b) => a[key] - b[key]);
  const show = P.showAll ? F : F.filter((x, i) => i < 40 || x.r.name === "Justyn Martin" || x.r.name === P.pick);
  const hdr = `<tr><th>#</th>${key === "rk3" ? "<th>Panel 2 #</th>" : ""}<th>Player</th><th>Prior school</th><th>Score</th><th>Destination</th><th>Conf.</th><th>Role</th><th>Games</th><th>Share of team dropbacks</th><th>EPA per dropback</th><th>Opp.-adjusted</th><th>vs. role &amp; level</th><th>As of</th></tr>`;
  const body = show.map((x) => `<tr class="v10click ${x.r.name === "Justyn Martin" ? "v10hl" : ""} ${x.r.name === P.pick ? "v10pk" : ""}" data-v10pick="${esc(x.r.name)}"><td><b>${x[key]}</b></td>${key === "rk3" ? `<td>${x.rk2}${x.rk2 !== x.rk3 ? ` <span class="small ${x.rk2 > x.rk3 ? "up" : "dn"}">${x.rk2 > x.rk3 ? "▲" : "▼"}${Math.abs(x.rk2 - x.rk3)}</span>` : ""}</td>` : ""}<td><b>${esc(x.r.name)}</b>${x.r.name === "Justyn Martin" ? " " + tag("OSU pick", "warn") : ""}</td><td>${esc(x.r.origin)} <span class="small muted">${esc(x.r.olv)}</span></td><td>${sg(key === "rk3" ? x.s3 : x.s2, 2)}</td>${outCells(x)}<td class="small">${ASOF}</td></tr>`).join("");
  return `<div class="tbl-wrap v10tbl"><table class="t"><thead>${hdr}</thead><tbody>${body}</tbody></table></div>
  <div class="row-btns"><button class="btn ghost" data-v10="all">${P.showAll ? "Show top 40 + Martin" : `Show all ${F.length}`}</button></div>
  <p class="small muted">2026 columns: ${src("cfbd")} · ${PARTIAL}. Share of team dropbacks = CFBD pass-usage share. EPA per dropback = CFBD predicted points added per pass play. Opponent-adjusted value needs 3+ games. "vs. role &amp; level" compares each QB with others in the same role at the same level (P4, G5, FCS), so a backup is not compared with a starter. Also searched for these fields: PFF grades (NOT AVAILABLE, subscription not connected); ESPN, Sports Reference and Game on Paper were not pulled in this build.</p>`;
}
function strip(key) {
  const E = P.mc.E, sk = key === "rk3" ? "s3" : "s2";
  const er = rankArr(E.map((x) => -x[sk])), eo = rankArr(E.map((x) => -x.o.shrunk));
  const t = (r) => (r <= E.length / 3 ? 1 : r <= (2 * E.length) / 3 ? 2 : 3);
  const rows = E.map((x, i) => ({ x, mt: t(er[i]), ot: t(eo[i]) }));
  const agree = rows.filter((r) => r.mt === r.ot), over = rows.filter((r) => r.mt === 1 && r.ot === 3), under = rows.filter((r) => r.mt === 3 && r.ot === 1);
  const rho = key === "rk3" ? P.mc.rho3 : P.mc.rho;
  const names = (L) => L.slice(0, 8).map((r) => `<button class="v10chip" data-v10pick="${esc(r.x.r.name)}">${esc(r.x.r.name)} <span class="muted">${esc(r.x.r.dest)}</span></button>`).join("") + (L.length > 8 ? `<span class="small muted"> +${L.length - 8} more</span>` : "");
  return card("Comparison strip · model ranking vs. 2026 results", `${E.length} QBs with 100+ attempts and 3+ games in 2026 · ${PARTIAL} · as of ${ASOF}`, `<div class="v10strip">
    <div class="v10s agree"><b>${agree.length}</b><span>Agree · same third in both</span></div>
    <div class="v10s over"><b>${over.length}</b><span>Model high, results low</span></div>
    <div class="v10s under"><b>${under.length}</b><span>Model low, results high</span></div>
    <div class="v10s"><b>${f2(rho, 2) ?? "—"}</b><span>Spearman, score vs. results</span></div></div>
    <div class="v10lists"><div><h4>Diverge · model high, results low</h4>${names(over) || '<span class="small muted">None</span>'}</div><div><h4>Diverge · model low, results high</h4>${names(under) || '<span class="small muted">None</span>'}</div></div>
    <p class="small muted">Results = shrunk 2026 pass value (opponent-adjusted with 3+ games, k = 100 attempts) from ${src("cfbd")}. Martin is not in this strip because he has no 2026 attempts.</p>`);
}
function panel2() {
  const W = P.mc.W2, m = P.mc.m;
  const ft = P2_FACTORS.map((f) => `<tr><td><b>${f.l}</b></td><td class="small">${f.how}</td><td>${f.na ? `<b>0</b>` : `<b>${Math.round((W[f.k] || 0) * 100)}%</b>`}</td><td>${f.na ? NA(f.na) : P.fitW ? tag("from OSU grades", "ok") : tag("provisional", "warn")}</td></tr>`).join("");
  return `${card("Comparable set", `${P.mc.field.length} of ${P.data.n} quarterbacks in the 2025-26 portal`, `<p class="small">Included if he had a 2024 or 2025 season as the primary passer at a Power Four or Group of Five school (at least 50% of team pass plays and 100 attempts), or a recruiting rating comparable to Martin's (portal rating 0.85+ or high-school composite 0.88+; Martin is 0.86 and 0.902). Martin is always included. Source: ${src("cfbd", "2026 portal, 2024–25 stats")}; ratings are 247Sports composite via CFBD.</p>` + intake())}
  ${card("Scoring criteria and weights", "The criteria the brief lists for transfer quarterbacks. Weights are provisional until Ohio State's board replaces them.", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Criterion</th><th>How it is measured from public data</th><th>Weight</th><th>Status</th></tr></thead><tbody>${ft}</tbody></table></div>${P.fitInfo ? `<p class="small ${P.fitInfo.ok ? "" : "warn"}">${esc(P.fitInfo.msg)}</p>` : ""}<p class="small muted">Each measure is converted to a z-score within the comparable set. Score = Σ weight × z.</p>`)}
  ${card("Ranking with Martin in it", `Martin ranks <b>#${m.rk2} of ${P.mc.field.length}</b> on these weights · highlighted · click any row for the coach's assistant`, rankTable("rk2"), tag("2026 SEASON: " + PARTIAL, "warn"))}
  ${strip("rk2")}`;
}
function panel3() {
  const m = P.mc.m;
  const ft = P3_FACTORS.map((f) => `<tr><td><b>${f.l}</b></td><td><b>${Math.round(f.w * 100)}%</b></td><td class="small">${esc(f.q)} ${f.s ? src(f.s) : ""}${f.q2 ? `<br>${esc(f.q2)} ${src(f.s2)}` : ""}${f.note ? `<div class="muted">${esc(f.note)}${f.ns ? " " + f.ns.map((k) => src(k)).join(" ") : ""}</div>` : ""}</td></tr>`).join("");
  return `${card("SIMULATION · factor set from public statements", "Built from Ryan Day's public comments on Martin and the Martin signing coverage. Not Coach Day's actual criteria.", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Factor</th><th>Simulated weight</th><th>Public basis</th></tr></thead><tbody>${ft}</tbody></table></div><p class="small muted">No public Billy Fessler interview on how he evaluates transfer quarterbacks was found in this search. His role appears only through Day's comments and Martin's.</p>`, tag("SIMULATION", "warn"))}
  ${card("SIMULATION · the field re-ranked", `Martin moves from #${m.rk2} in Panel 2 to <b>#${m.rk3} of ${P.mc.field.length}</b> under the simulated factor set`, rankTable("rk3"), tag("SIMULATION", "warn"))}
  ${strip("rk3")}
  <p class="v10replace">Replaced by Coach Day's actual criteria after a 45-minute session.</p>`;
}

// ---------- coach's assistant (pick screen) ----------
function topTen() {
  return P.mc.field.filter((x) => x.o.att >= 100 && x.o.games >= 3 && x.o.shrunk != null).sort((a, b) => b.o.shrunk - a.o.shrunk).slice(0, 10);
}
function assistant() {
  if (!P.pick) return "";
  const R = runScenario(P.scen, P.pick, P.weeks), x = R.x;
  const chips = Object.entries(SCEN).map(([k, s]) => `<button class="v10chip ${P.scen === k ? "on" : ""}" data-v10scen="${k}" title="${esc(s.d)}">${s.l}</button>`).join("");
  const blk = (h, L, cls) => `<div class="v10blk ${cls}"><h4>${h}</h4><ul>${L.map((l) => `<li>${l}</li>`).join("")}</ul></div>`;
  let ten = "";
  if (P.scen === "sayin") {
    const T = topTen(), pin = [P.mc.m, x].filter((p, i, a) => a.indexOf(p) === i && !T.includes(p));
    const row = (y, i) => `<tr class="${y.r.name === "Justyn Martin" ? "v10hl" : ""}"><td>${i ?? "—"}</td><td><b>${esc(y.r.name)}</b></td><td>${esc(y.r.dest || "")}</td><td>${esc(y.r.dconf || "")}</td><td>${tag(y.o.role)}</td><td>${y.o.att ? y.o.games : NA("CFBD")}</td><td>${y.o.att ? f2(y.o.ppa, 3) : NA("CFBD")}</td><td>${y.o.shrunk != null && y.o.att ? f2(y.o.shrunk, 3) : NA("CFBD")}</td><td class="small">${src("cfbd")}</td></tr>`;
    ten = `<h4 class="v10h4">Ten 2026 portal quarterbacks rated on their actual 2026 play where they landed</h4><div class="tbl-wrap"><table class="t"><thead><tr><th>#</th><th>Player</th><th>Now at</th><th>Conf.</th><th>Role</th><th>Games</th><th>EPA per dropback</th><th>Rating (shrunk, opp.-adj.)</th><th>Source · as of</th></tr></thead><tbody>${T.map((y, i) => row(y, i + 1)).join("")}${pin.map((y) => row(y, null)).join("")}</tbody></table></div><p class="small muted">Players with 100+ attempts and 3+ games · ${PARTIAL}. Martin's row stays visible.</p>`;
  }
  const facts = `<div class="v10facts"><div><span>Sayin</span><b>Injured Oct. 17 at Indiana, right arm</b> ${src("tentv")}. Fracture and surgery reported by ${src("rabin")}, not confirmed by Ohio State ${src("clutchNov6")}. Day: \u201cIt's not going to be next week, or next month\u201d ${src("heavyDay")}</div>
    <div><span>Fahey</span><b>Three-star true freshman, starting</b> ${src("heavyFahey")} · ${src("espnNov10")}</div>
    <div><span>Martin</span><b>Not playing at QB: no 2026 pass or rush recorded</b> ${src("cfbd", "through week 10")}. Game appearances: <b>NOT CONFIRMED</b></div></div>`;
  return `<div class="v10asst" role="dialog" aria-label="Coach's assistant"><div class="v10asst-h"><div><div class="v10eyebrow">COACH'S ASSISTANT · ${esc(x.r.name)}</div><h3>${esc(x.r.name)} · ${esc(x.r.origin)} → ${esc(x.r.dest || "no destination listed")}</h3><p class="small muted">Panel 2 #${x.rk2} · Panel 3 (simulation) #${x.rk3} · ${careerAtt(x.r)} attempts in 2024–25 · as of ${ASOF}</p></div><div class="sp"></div><button class="btn" data-v10="scen-toggle">SCENARIOS</button><button class="btn ghost" data-v10="close">Close</button></div>
    <div class="v10roster"><b>Roster at the time of the pick · Jan. 12, 2026</b>${ROOM.map((r) => `<span>${esc(r.n === "Justyn Martin" && x.r.name !== "Justyn Martin" ? x.r.name + " (in Martin's place)" : r.n)}: ${esc(r.n === "Justyn Martin" && x.r.name !== "Justyn Martin" ? careerAtt(x.r) + " attempts in 2024–25" : r.d)} ${src(r.n === "Justyn Martin" && x.r.name !== "Justyn Martin" ? "cfbd" : r.s)}</span>`).join("")}</div>
    <div class="v10chips" id="v10-scen">${chips}${P.scen === "four" ? `<label class="small">weeks <input id="v10-weeks" type="number" min="1" max="12" value="${P.weeks}" style="width:56px"></label>` : ""}</div>
    ${facts}
    <div class="v10blks">${blk("What would have happened", R.B.what, "a")}${blk("The issue to have thought about in advance", R.B.issue, "b")}${blk("Other problems not expected", R.B.other, "c")}</div>${R.caveat}
    ${ten}</div>`;
}

// ---------- co-head coach agent ----------
function cards() {
  const D = P.mc, L = P.logs;
  const fw7 = (L.logs["Luke Fahey|Ohio State"] || []).find((g) => g.w === 7);
  const pot = D.field.find((x) => x.r.name === "Jaxon Potter"), stb = D.field.find((x) => x.r.name === "Ryan Staub");
  const fa = L.osu2026["Luke Fahey"];
  return {
    oct17: { when: "Week of Oct. 17, 2026", intro: "I saw three changes this week.", items: [
      `Julian Sayin left the Indiana game in the fourth quarter with a right-arm injury. Coach Day said Sayin will \u201cprobably be out for several weeks\u201d (${src("tentv")}). On Oct. 20 he said Sayin is out indefinitely (${src("athOct20")}) and that the staff is planning for him to be unavailable for the regular season and the postseason (${src("clutchOct21")}).`,
      `Your backup is now Luke Fahey. Before Oct. 17 he had about two quarters of college snaps (${src("dispOct17")}). At Indiana his PPA per pass play was ${fw7 ? fw7.pass.toFixed(3) : "NOT AVAILABLE"} (${src("cfbd", "week 7 game log")}).`,
      `Justyn Martin has taken 0 dropbacks: no 2026 pass is recorded for him (${src("cfbd")}). The Athletic reports he is below St. Clair and Fahey on the depth chart (${src("athOct20")}).`],
      scen: [
        { k: "season", t: "Starter out for the season", why: "Five regular-season games and any postseason with a true freshman at quarterback." },
        { k: "two", t: "Two quarterbacks out", why: "If Fahey goes down, the next quarterback has 7 attempts this season." },
        { k: "sayin", t: "A quarterback the staff passed on", why: `Jaxon Potter (offered) is ${pot?.o.role === "Starter" ? "starting" : "playing"} at Old Dominion: ${pot?.o.att ?? "NOT AVAILABLE"} attempts as of ${ASOF}. Ryan Staub (visited) has ${stb?.o.att ?? "NOT AVAILABLE"} at Tennessee.`, pick: "Jaxon Potter" }],
      cant: "This is a replay. It uses the data pulled on 2026-11-09, limited to games on or before Oct. 17 where game logs allow. Injury reports come from the sources linked." },
    today: { when: "Today · Nov. 10, 2026", intro: "I saw three changes since the Indiana game.", items: [
      `Sayin's injury was reported as a fractured right elbow repaired with plates and screws (${src("rabin")}). Ohio State has not confirmed it (${src("clutchNov6")}). Coach Day: \u201cIt's not going to be next week, or next month\u201d (${src("heavyDay")}).`,
      `Fahey has made two starts: USC L 18–30 and Oregon L 28–41 (${src("cfbd")}). Season line: ${fa.att} attempts, ${fa.td} TD, ${fa.int} INT, PPA per pass play ${fa.ppa_pass.toFixed(3)} vs. a 2026 FBS mean of ${P.data.ref.y2026.mu.toFixed(3)} (${src("cfbd")}).`,
      `The 2027 portal feed shows 0 quarterback entries (${src("cfbd27")}). The window opens Jan. 4 and closes Jan. 13, 2027, with no spring football window (${src("ncaa")}).`],
      scen: [
        { k: "window", t: "Backup enters the January window", why: "A 10-day window. One departure leaves two or three scholarship quarterbacks." },
        { k: "season", t: "A quarterback on the roster not performing", why: `Fahey's pass value is ${(fa.ppa_pass - P.data.ref.y2026.mu).toFixed(3)} below the FBS mean with three regular-season games left.` },
        { k: "sayin", t: "Comparable list: who is performing now", why: "Ten 2026 portal quarterbacks rated on their actual play, with Martin's row kept." }],
      cant: "I could not check On3 and 247Sports intent-to-transfer trackers in this run. No new portal entry can be confirmed until the window opens on Jan. 4." },
  };
}
function agentDock() {
  if (!P.mc) return "";
  const C = cards()[P.asof];
  const items = C.items.map((t) => `<li>${t}</li>`).join("");
  const sc = C.scen.map((s, i) => `<div class="v10sc"><div><b>${i + 1}. ${esc(s.t)}</b><div class="small">${esc(s.why)}</div></div><button class="btn sm" data-v10inv="${i}">INVESTIGATE</button></div>`).join("");
  const chat = P.chat.slice(-6).map((m) => `<div class="v10msg ${m.who}"><span>${m.who === "coach" ? "Coach" : "Chief of staff"}</span>${m.html}</div>`).join("");
  return `<aside class="v10agent ${P.open ? "open" : ""}" aria-label="QB chief of staff agent">
    <button class="v10agent-tab" data-v10="agent-toggle">${P.open ? "Hide" : "QB chief of staff"}</button>
    <div class="v10agent-body">
      <div class="v10agent-h"><b>QB Chief of Staff</b> ${tag("AI-GENERATED", "warn")}<div class="sp"></div>
        <div class="v10seg"><button class="${P.asof === "oct17" ? "on" : ""}" data-v10asof="oct17">Oct. 17 week</button><button class="${P.asof === "today" ? "on" : ""}" data-v10asof="today">Today</button></div></div>
      <div class="v10card"><div class="small muted">${esc(C.when)} · AI-generated · it prompts you to think; it does not decide</div>
        <p><b>${esc(C.intro)}</b></p><ol>${items}</ol>
        <p><b>Here are the three scenarios to pay attention to.</b></p>${sc}
        <p>Want me to investigate any of them further?</p>
        <p class="small muted">What I could not check: ${esc(C.cant)}</p></div>
      <div class="v10chat">${chat}</div>
      <form class="v10say" id="v10-say"><input id="v10-in" placeholder="Answer: \u201clook into the second one\u201d or \u201cwhat if he's out six weeks\u201d" autocomplete="off"><button class="btn sm" type="button" data-v10="mic" title="Speak">${P.listening ? "Listening…" : "Speak"}</button><button class="btn sm" type="submit">Send</button><button class="btn sm ghost" type="button" data-v10="read">${P.speaking ? "Stop" : "Read aloud"}</button></form>
      <div class="small muted v10watch">Watching: injury reports · depth chart · portal entries and commitments at QB · weekly play of every QB on the comparable list · the roster today</div>
    </div></aside>`;
}
const WORDN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
function say(html) { P.chat.push({ who: "agent", html: html + ` <span class="v10ai">AI-generated</span>` }); }
function investigate(i) {
  const C = cards()[P.asof], s = C.scen[i]; if (!s) return say("There are only three scenarios on this card.");
  P.scen = s.k; P.pick = s.pick || P.pick || "Justyn Martin";
  const R = runScenario(P.scen, P.pick, P.weeks);
  say(`I ran <b>${esc(SCEN[s.k].l)}</b> for ${esc(R.x.r.name)}. The main issue: ${R.B.issue[0]} The full analysis is open on the page.`);
}
function handle(text) {
  const t = text.toLowerCase().trim(); if (!t) return;
  P.chat.push({ who: "coach", html: esc(text) });
  const ord = /\b(first|1st|one|#1)\b/.test(t) ? 0 : /\b(second|2nd|#2)\b/.test(t) ? 1 : /\b(third|3rd|#3|last)\b/.test(t) ? 2 : null;
  const wk = t.match(/out (?:for )?(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve) weeks?/);
  const name = P.mc.field.find((x) => t.includes(x.r.name.toLowerCase()) || (x.r.name.split(" ").slice(-1)[0].length > 3 && t.includes(x.r.name.split(" ").slice(-1)[0].toLowerCase())));
  if (wk) { const n = /\d/.test(wk[1]) ? +wk[1] : WORDN[wk[1]]; P.weeks = n; P.scen = "four"; P.pick = P.pick || "Justyn Martin"; const G = gamesInWindow(n);
    return say(`If he's out ${n} weeks from Oct. 17, that covers ${G.length} game${G.length === 1 ? "" : "s"}: ${G.map((g) => esc(g.opp) + " (" + res(g) + ")").join(", ") || "none"} (${src("cfbd")}). I opened that scenario.`); }
  if (/(look|investigate|dig|run|open|check)/.test(t) && ord != null) return investigate(ord);
  if (name) { P.pick = name.r.name; return say(`Opened the coach's assistant for ${esc(name.r.name)}: Panel 2 #${name.rk2}, simulation #${name.rk3}. ${name.o.att ? `${name.o.att} attempts in 2026 at ${esc(name.r.dest)} as of ${ASOF}.` : "No 2026 attempts recorded."}`); }
  if (/two (qbs|quarterbacks)|both/.test(t)) { P.scen = "two"; P.pick = P.pick || "Justyn Martin"; return say("I opened the two-quarterbacks-out scenario."); }
  if (/season/.test(t)) { P.scen = "season"; P.pick = P.pick || "Justyn Martin"; return say("I opened the starter-out-for-the-season scenario."); }
  if (/portal|window|transfer|spring/.test(t)) { P.scen = "window"; P.pick = P.pick || "Justyn Martin"; return say(`I opened the January window scenario. There is no spring football window in 2026-27 (${src("ncaa")}).`); }
  if (/today|now|latest/.test(t)) { P.asof = "today"; return say("Here is today's card."); }
  if (/oct|indiana|injury week/.test(t)) { P.asof = "oct17"; return say("Here is the card from the week of Oct. 17."); }
  if (/panel ?1|ohio state did/.test(t)) { P.tab = "p1"; return say("Switched to What Ohio State did."); }
  if (/panel ?2|we would/.test(t)) { P.tab = "p2"; return say("Switched to What we would have done."); }
  if (/panel ?3|coach day|simulation/.test(t)) { P.tab = "p3"; return say("Switched to the Coach Day version (simulation)."); }
  say("I can run these now: \u201clook into the first, second or third one\u201d, \u201cwhat if he's out N weeks\u201d, \u201ctwo quarterbacks out\u201d, \u201cthe January window\u201d, a player's name, \u201ctoday\u201d or \u201cOct. 17\u201d. This demo matches a fixed set of requests; a production version would use a language model over the same cited sources.");
}
function speak() {
  try {
    const ss = window.speechSynthesis; if (!ss) return X.toast("Read-aloud is not available in this browser");
    if (P.speaking) { ss.cancel(); P.speaking = false; return X.render(); }
    const el = document.querySelector(".v10card"); const u = new SpeechSynthesisUtterance(el ? el.innerText.replace(/·/g, ",") : "");
    u.rate = 1.02; u.onend = () => { P.speaking = false; X.render(); }; P.speaking = true; ss.speak(u); X.render();
  } catch { X.toast("Read-aloud is not available here"); }
}
function listen() {
  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return X.toast("Voice input is not available in this browser. Type instead.");
    const r = new SR(); r.lang = "en-US"; r.interimResults = false; P.listening = true; X.render();
    r.onresult = (e) => { const txt = e.results[0][0].transcript; P.listening = false; handle(txt); X.render(); };
    r.onerror = () => { P.listening = false; X.toast("Voice input was blocked or unavailable. Type instead."); X.render(); };
    r.onend = () => { if (P.listening) { P.listening = false; X.render(); } };
    r.start();
  } catch { P.listening = false; X.toast("Voice input is not available here. Type instead."); }
}

// ---------- pages ----------
function pageQB10() {
  const g = guard(); if (g) return g;
  const tabs = TABS.map(([k, l]) => `<button class="v10tab ${P.tab === k ? "on" : ""}" data-v10tab="${k}" aria-pressed="${P.tab === k}">${l}</button>`).join("");
  const heads = { p1: "WHAT OHIO STATE DID", p2: "WHAT WE WOULD HAVE DONE", p3: "THE COACH DAY VERSION · SIMULATION" };
  const body = P.tab === "p1" ? panel1() : P.tab === "p2" ? panel2() : panel3();
  return `<div class="v10">
    <div class="v10tabs" role="tablist">${tabs}</div>
    <div class="v10panels">${TABS.map(([k]) => `<div class="v10mini ${P.tab === k ? "on" : ""}" data-v10tab="${k}"><div class="v10eyebrow">${heads[k]}</div><p>${esc(COPY[k])}</p></div>`).join("")}</div>
    <section class="card card-pad v10copy ${P.tab === "p3" ? "sim" : ""}"><div class="v10eyebrow">${heads[P.tab]}${P.tab === "p3" ? " " + tag("SIMULATION", "warn") : ""}</div><p>${esc(COPY[P.tab])}</p></section>
    ${assistant()}
    ${body}
  </div>${agentDock()}`;
}
function pageWhatsNew10() {
  const R = [
    ["Three side-by-side panels selected by buttons", "QB Pilot · Three Panels"],
    ["Panel 1 · Martin profile and placeholder board (Martin, Staub, Potter) with sources", "Panel 1"],
    ["Panel 2 · comparable set, eight criteria with provisional weights, ranking with Martin highlighted, 2026 outcomes judged against role and level, comparison strip", "Panel 2"],
    ["Panel 3 · simulated Coach Day factor set from public statements, re-ranked field", "Panel 3"],
    ["Coach's assistant with SCENARIOS on every pick, Sayin scenario by default", "Click any quarterback"],
    ["QB chief of staff agent: Oct. 17 card and today's card, INVESTIGATE buttons, typed or spoken replies", "Right side of every QB Pilot page"],
    ["DATA INTAKE for CSV or XLSX on Panels 1 and 2", "Panels 1 and 2"],
  ];
  return `${card("What changed in v10", "v9 Steps 1–4 and all earlier pages are unchanged", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Added</th><th>Where</th></tr></thead><tbody>${R.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody></table></div>`)}
  ${card("Limits", "", `<ul class="v9ul"><li>Panel 1 is a placeholder until Ohio State provides its board.</li><li>Arm talent, processing and development are public-data proxies. Fit, role sought and economics are NOT AVAILABLE without the staff.</li><li>Panel 3 is a simulation, not Coach Day's criteria.</li><li>The agent replays the Oct. 17 week from the Nov. 9 data pull. It understands a fixed set of requests.</li><li>2026 results are ${PARTIAL}. PFF grades are not connected.</li></ul>`)}`;
}
export const V10PAGES = { qb10: pageQB10, whatsnew10: pageWhatsNew10 };
export const agentDockFor = (screen) => (screen && screen.startsWith("qp") && P.mc ? agentDock() : "");

// ---------- lifecycle ----------
async function load() {
  if (P.data || P.loading) return; P.loading = true;
  try {
    const [a, b] = await Promise.all([fetch("./data/qbpilot2026.json"), fetch("./data/qb10logs.json")]);
    if (!a.ok || !b.ok) throw new Error("HTTP " + (a.ok ? b.status : a.status));
    P.data = await a.json(); P.logs = await b.json(); compute();
    P.chat.push({ who: "agent", html: `I'm watching the quarterback room. This replay starts the week of Oct. 17, 2026. <span class="v10ai">AI-generated</span>` });
  } catch (e) { P.err = String(e.message || e); }
  P.loading = false; X.render();
}
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
export function bindV10(ctx) {
  X = ctx; load();
  document.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-v10tab]"); if (tb) { P.scroll[P.tab] = window.scrollY; P.tab = tb.dataset.v10tab; X.render(); return; }
    const pk = e.target.closest("[data-v10pick]"); if (pk && !e.target.closest("a")) { P.pick = pk.dataset.v10pick; P.scen = "sayin"; X.render(); setTimeout(() => document.querySelector(".v10asst")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); return; }
    const sc = e.target.closest("[data-v10scen]"); if (sc) { P.scen = sc.dataset.v10scen; X.render(); return; }
    const inv = e.target.closest("[data-v10inv]"); if (inv) { investigate(+inv.dataset.v10inv); if (!location.hash.startsWith("#qb10")) X.go("qb10"); X.render(); setTimeout(() => document.querySelector(".v10asst")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); return; }
    const ao = e.target.closest("[data-v10asof]"); if (ao) { P.asof = ao.dataset.v10asof; X.render(); return; }
    const t = e.target.closest("[data-v10]"); if (!t) return;
    const a = t.dataset.v10;
    if (a === "close") { P.pick = null; return X.render(); }
    if (a === "scen-toggle") { document.querySelector("#v10-scen")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (a === "all") { P.showAll = !P.showAll; return X.render(); }
    if (a === "agent-toggle") { P.open = !P.open; return X.render(); }
    if (a === "read") return speak();
    if (a === "mic") return listen();
    if (a === "clear") { P.board = null; P.boardName = ""; P.fitW = null; P.fitInfo = null; compute(); X.toast("Board cleared from memory"); return X.render(); }
    if (a === "tmpl") { const ex = ["Example Player", "Example University", "6", "Experienced backup", "poise; quick release", "late reads", "Depth option with starts", "", "visit", "signed elsewhere", "Agent name", "NOT AVAILABLE"]; return download("osu_qb_board_template.csv", INTAKE_COLS.join(",") + "\n" + ex.map((v) => `"${v}"`).join(",") + "\n"); }
  });
  document.addEventListener("submit", (e) => { if (e.target.id !== "v10-say") return; e.preventDefault(); const i = document.querySelector("#v10-in"); const v = i?.value || ""; handle(v); X.render(); setTimeout(() => { const n = document.querySelector("#v10-in"); n?.focus(); const c = document.querySelector(".v10chat"); if (c) c.scrollTop = c.scrollHeight; }, 20); });
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "v10-weeks") { P.weeks = Math.max(1, Math.min(12, +t.value || 4)); return X.render(); }
    if (t.id === "v10-file" && t.files?.[0]) {
      const f = t.files[0];
      try { const rows = await readFile(f); if (!rows.length) throw new Error("The file has no rows"); if (!("player" in rows[0])) throw new Error("Missing the 'player' column");
        P.board = rows; P.boardName = f.name; fitFromBoard(); compute(); X.toast(`Loaded ${rows.length} rows · held in memory only`); }
      catch (err) { X.toast("Could not read the board: " + err.message); }
      return X.render();
    }
  });
}
export function afterRenderV10() { const s = P.scroll[P.tab]; if (s != null) { window.scrollTo(0, s); P.scroll[P.tab] = null; } }
