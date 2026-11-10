// Portal Lab v11 · Ohio State Football Intelligence (historical replay).
// Integrity rule: before REVEAL only data/fi_hist.json (2024-25 seasons, portal records, January 2026 reporting) is loaded.
// data/fi_out.json (2026 results through Nov. 10, 2026) is fetched only when the user presses REVEAL 2026 RESULTS.
import { POS, OUTCOME, LVF, GAP_REL, score, spearman, spearmanCI } from "./engine.js";
import { SRC, NOTES, PURSUIT } from "./facts.js";

export const V11NAV = [
  { k: "fi_bot", label: "Ask Edge · Analyst" },
  { k: "fi_tour", label: "Guided Demo · 12 min" },
  { k: "fi_class", label: "1 · 2026 Transfer Class" },
  { k: "fi_qb", label: "2 · QB Decision Replay" },
  { k: "fi_dl", label: "3 · DL Decision Replay" },
  { k: "fi_scen", label: "4 · Roster Scenarios" },
  { k: "fi_learn", label: "5 · Algorithm Learning · 2027" },
  { k: "fi_pos", label: "Position Modules (6)" },
  { k: "fi_board", label: "Import Ohio State Board" },
  { k: "fi_evidence", label: "Evidence & Data Request" },
];
export const V11TITLES = {
  fi_bot: ["Ask Edge", "Football intelligence analyst · answers from the data loaded in this tab, with working and sources"],
  fi_tour: ["Guided Demo", "A 12-minute walkthrough of the historical replay"],
  fi_class: ["2026 Transfer Class Overview", "All 19 incoming transfers · historical replay"],
  fi_qb: ["Quarterback Decision Replay", "The January 2026 quarterback decision, rebuilt from data available at the time"],
  fi_dl: ["Defensive Line Decision Replay", "Russaw, Smith and Walker against the January 2026 market"],
  fi_scen: ["Roster Scenarios", "Stress-test the room: unavailable starters, departures and alternative acquisitions"],
  fi_cos: ["Chief of Staff Assistant", "Answers grounded in the data loaded in this app"],
  fi_learn: ["Algorithm Learning", "Every coach instruction makes the algorithm smarter for this season and the 2027 portal window"],
  fi_pos: ["Position Modules", "Six position-specific evaluation modules"],
  fi_board: ["Import Ohio State Board", "Compare the staff board with the model · held in this tab only"],
  fi_evidence: ["Evidence & Data Request", "Sources, methods, validation and what Ohio State would need to provide"],
};
export const V11KEYS = [...V11NAV.map((n) => n.k), "fi_cos"];

const OUT_SRC = new Set(["cleMoore", "cleScout", "bsbDiomede", "osuMoore", "tentv", "athOct20", "rabin", "clutch", "heavyFahey", "dispatch", "athNov10"]);
const MOD = { QB: "qb", WR: "wr", OT: "ol", OG: "ol", C: "ol", OL: "ol", IOL: "ol", DE: "dl", DT: "dl", DL: "dl", EDGE: "dl", CB: "cb", S: "s" };
const DEC = { qb: "2026-01-12", dl: "2026-01-12", wr: "2026-01-16", ol: "2026-01-28", cb: "2026-01-15", s: "2026-01-12" };
const PRESETS = {
  qb: { "Analyst default": null, "Readiness first": { eff: 20, aya: 10, tov: 10, exp: 25, mob: 5, opp: 10, ready: 15, dev: 5 }, "Upside first": { eff: 10, aya: 5, tov: 5, exp: 0, mob: 10, opp: 10, ready: 0, dev: 60 } },
  dl: { "Analyst default": null, "Pass rush first": { pr: 40, sk: 20, share: 15, run: 10, tkl: 5, time: 5, dev: 5 }, "Run defense first": { pr: 10, sk: 5, share: 5, run: 40, tkl: 25, time: 10, dev: 5 } },
};

let X = null;
const F = { H: null, O: null, err: null, loading: true, reveal: false, revealing: false, w: {}, cache: {}, cmp: {}, realOnly: { qb: false, dl: false }, posTab: "wr", prof: null,
  scen: { mode: "qb", out: "Julian Sayin", dur: "4", start: 7, gone: [], alt: "", dlOut: [], dlAlt: "", dlSwap: "John Walker", ready: 300 },
  chat: [], board: null, boardName: "", boardIssues: [], boardRaw: false, boardPos: "qb" };

// ---------------- helpers ----------------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "").replace(/(jr|sr|ii|iii|iv)$/, "");
const f = (v, d = 2) => (typeof v === "number" && isFinite(v) ? v.toFixed(d) : "—");
const i0 = (v) => (typeof v === "number" && isFinite(v) ? String(Math.round(v * 10) / 10) : "—");
const pct = (v) => (typeof v === "number" && isFinite(v) ? Math.round(v * 100) + "%" : "—");
const src = (keys) => (keys || []).filter((k) => SRC[k]).map((k) => `<a href="${SRC[k].u}" target="_blank" rel="noopener">${esc(SRC[k].n)}</a> <span class="fi-dt">${esc(SRC[k].d)}</span>`).join(" · ");
const tag = (t, cls = "") => `<span class="fi-tag ${cls}">${esc(t)}</span>`;
const FACT = tag("VERIFIED FACT", "fact"), MODEL = tag("MODELED", "model"), ILL = tag("ILLUSTRATIVE ASSUMPTION", "ill"), NA = tag("NOT AVAILABLE", "na");
const tbl = (head, rows, cls = "") => `<div class="fi-tw"><table class="fi-t ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
const notesFor = (name, revealed) => (NOTES[name] || []).filter(([, s]) => revealed || !s.some((k) => OUT_SRC.has(k)));

function prodLine(s, pos) {
  if (!s) return "no recorded stats";
  const P = String(pos || s.pos || "").toUpperCase();
  const parts = [];
  if (s.att) parts.push(`${i0(s.cmp)}/${i0(s.att)} passing, ${i0(s.pyds)} yds, ${i0(s.ptd)} TD, ${i0(s.pint)} INT`);
  if (s.car && (P === "RB" || P === "QB")) parts.push(`${i0(s.car)} car, ${i0(s.rushyds)} rush yds`);
  if (s.rec) parts.push(`${i0(s.rec)} rec, ${i0(s.recyds)} yds`);
  if (s.tot) parts.push(`${i0(s.tot)} tkl, ${i0(s.tfl)} TFL, ${i0(s.sacks)} sk${s.hur ? `, ${i0(s.hur)} hur` : ""}${s.pd ? `, ${i0(s.pd)} PBU` : ""}${s.int_d ? `, ${i0(s.int_d)} INT` : ""}`);
  if (s.fga) parts.push(`${i0(s.fgm)}/${i0(s.fga)} FG, ${i0(s.xpm)}/${i0(s.xpa)} XP`);
  if (s.punts) parts.push(`${i0(s.punts)} punts, ${f(s.ypp, 1)} avg`);
  return parts.join(" · ") || "no recorded stats";
}

// ---------------- data ----------------
async function load() {
  try { const r = await fetch("./data/fi_hist.json", { cache: "no-cache" }); if (!r.ok) throw new Error("HTTP " + r.status); F.H = await r.json(); }
  catch (e) { F.err = String(e.message || e); }
  F.loading = false;
  if (!F.chat.length) F.chat.push({ who: "a", html: briefingHTML(true) });
  X && X.render();
}
async function reveal() {
  if (F.O) { F.reveal = true; return; }
  F.revealing = true; X.render();
  try { const r = await fetch("./data/fi_out.json", { cache: "no-cache" }); if (!r.ok) throw new Error("HTTP " + r.status); const O = await r.json();
    const idx = (a) => Object.fromEntries((a || []).map((x) => [nm(x.name), x]));
    F.O = { raw: O, cls: idx(O.cls), qb: idx(O.qb), dl: idx(O.dl), wr: idx(O.wr), cb: idx(O.cb), s: idx(O.s), ol: idx(O.ol), roomDL: idx(O.roomDL), roomQB: idx(O.roomQB) };
    F.reveal = true; X.toast("2026 results loaded (through Nov. 10, 2026)");
  } catch (e) { X.toast("Could not load 2026 results: " + e.message); }
  F.revealing = false;
}
const market = (pos) => F.H[pos] || [];
function weights(pos) { const d = Object.fromEntries(POS[pos].metrics.map((m) => [m.k, m.w])); return { ...d, ...(F.w[pos] || {}) }; }
function scored(pos) {
  const w = weights(pos); const key = pos + JSON.stringify(w);
  if (!F.cache[key]) F.cache[key] = score(pos, pool(pos), w);
  return F.cache[key];
}
// Screening step: drop players with no meaningful college sample, keep anyone Ohio State pursued or signed.
function pool(pos) {
  const P = PURSUIT[pos] || {};
  return market(pos).filter((h) => {
    if (P[h.name] || isSignee(h.name)) return true;
    if (pos === "qb") return ((h.pre24?.att || 0) + (h.pre25?.att || 0)) >= 50;
    if (pos === "ol") return h.rating != null;
    if (pos === "wr") return [h.s2024, h.s2025].some((s) => s && (s.rec || 0) >= 10);
    return [h.s2024, h.s2025].some((s) => s && (s.tot || 0) >= 10);
  });
}
const isSignee = (name) => !!F.H?.cls.some((c) => nm(c.name) === nm(name));
function starterSeeking(h) { const a = [h.pre24, h.pre25].filter(Boolean); return a.some((x) => (x.usage || 0) >= 0.5 && (x.att || 0) >= 100) || /looking to start/i.test(PURSUIT.qb?.[h.name]?.[1] || ""); }
function feas(pos, h) {
  const p = (PURSUIT[pos] || {})[h.name];
  if (isSignee(h.name)) return { t: "Signed with Ohio State", c: "ok", real: true, why: "Actual signee", s: p?.[2] || ["ewTracker"] };
  if (pos === "qb") {
    if (starterSeeking(h)) return { t: "Unlikely: starter-seeking", c: "bad", real: false, why: p ? p[1] : "Primary passer in 2024 or 2025 (≥ 50% of team pass plays and ≥ 100 attempts); unlikely to accept a backup role behind Julian Sayin", s: p?.[2] || ["cfbd"] };
    if (p) return { t: `Reported contact: ${p[0]}`, c: "ok", real: true, why: p[1], s: p[2] };
    return { t: "Possible: backup-profile", c: "mid", real: true, why: "Not a primary passer in 2024–25, so a backup role is plausible. No reported Ohio State contact.", s: ["cfbd"] };
  }
  if (p) return { t: `Reported contact: ${p[0]}`, c: p[0] === "Loose link" ? "mid" : "ok", real: true, why: p[1], s: p[2] };
  return { t: "No reported contact", c: "mid", real: false, why: "Feasibility unknown. No public report links this player to Ohio State.", s: [] };
}
const timing = (pos, h) => (h.date && h.date < DEC[pos] && !isSignee(h.name) ? `CFBD record dated ${h.date}, before the ${DEC[pos]} decision. CFBD does not say whether the date is portal entry or commitment.` : "");

// ---------------- shared chrome ----------------
function bar() {
  const m = F.H?.meta;
  return `<div class="fi-bar ${F.reveal ? "rev" : ""}" role="region" aria-label="Data view">
    <div><b>${F.reveal ? "2026 RESULTS SHOWN" : "HISTORICAL VIEW"}</b> · ${F.reveal ? "Outcomes through Nov. 10, 2026 are loaded from a separate file. Historical rankings below are unchanged." : `Only data available by ${esc(m?.cutoff || "2026-01-31")} is loaded (2024–25 seasons, portal records, January reporting). 2026 outcomes are not in this browser yet.`}
    <span class="fi-dt">Historical replay built in Nov. 2026 · ${esc(m?.model || "")}</span></div>
    <button class="fi-btn ${F.reveal ? "ghost" : "scarlet"}" data-fi="${F.reveal ? "hide" : "reveal"}">${F.revealing ? "Loading…" : F.reveal ? "Hide 2026 results" : "REVEAL 2026 RESULTS"}</button></div>`;
}
const wrap = (inner) => (F.loading ? `<div class="fi"><p>Loading historical data…</p></div>` : F.err ? `<div class="fi"><p>Could not load data: ${esc(F.err)}</p></div>` : `<div class="fi">${bar()}${inner}</div>`);
const card = (h, body, cls = "") => `<section class="fi-card ${cls}">${h ? `<h3>${h}</h3>` : ""}${body}</section>`;
const askBtn = (q) => `<button class="fi-chip" data-fiask="${esc(q)}">${esc(q)}</button>`;

// ---------------- Screen 1: transfer class ----------------
function completeness(c) {
  const o = F.O?.cls[nm(c.name)];
  const items = [["Prior school", !!c.origin], ["Most recent season (2025) played", !!c.seasons?.["2025"]], ["Transfer timing", !!c.portal?.date || !!(NOTES[c.name] || []).length], ["Eligibility", !!c.portal?.elig], ["Portal rating", c.portal?.rating != null], ["2024–25 production", !!Object.keys(c.seasons || {}).length], ["Verified notes", !!(NOTES[c.name] || []).length], ["Staff role definition", false], ["Snap counts", false]];
  if (F.reveal) items.push(["2026 production", !!o?.s2026]);
  return { items, v: items.filter((x) => x[1]).length / items.length };
}
function confidence(c) {
  const s = Object.values(c.seasons || {}); const vol = s.reduce((a, x) => a + (x.att || 0) + (x.tot || 0) * 4 + (x.rec || 0) * 6 + (x.car || 0) + (x.fga || 0) * 10 + (x.punts || 0) * 3, 0);
  if (Object.keys(c.seasons || {}).length && !c.seasons["2025"]) return vol >= 60 ? ["Low", "No 2025 season on record. Older production may not carry forward (injury, role change), so the range is wider"] : ["Very low", "No 2025 season and little earlier production"];
  return vol >= 300 ? ["Medium", "Two seasons of public production; still no snap counts or charting"] : vol >= 60 ? ["Low", "Limited public production"] : ["Very low", "Little or no public production in 2024–25"];
}
function opportunity(c) {
  const o = F.O?.cls[nm(c.name)]; const g = (F.O?.raw.osuGames || []).length;
  const wk = o?.boxWeeks?.length || 0;
  const extra = c.name === "Marcello Diomede" ? " Kickoffs are not in the box-score feed; reporting shows 48 kickoffs through seven games." : "";
  return { wk, g, t: `${wk} of ${g} games with a recorded box-score stat.${extra} Box presence is not snaps; it undercounts linemen, blockers and special teams.` };
}
function pageClass() {
  const C = F.H.cls; const units = [["O", "Offense"], ["D", "Defense"], ["ST", "Special teams"]];
  const posCount = {}; C.forEach((c) => (posCount[c.pos] = (posCount[c.pos] || 0) + 1));
  const order = ["QB", "RB", "WR", "TE", "OT", "DE", "DT", "LB", "CB", "S", "K", "P", "LS"];
  const maxc = Math.max(...Object.values(posCount));
  const chart = `<svg class="fi-chart" viewBox="0 0 ${order.length * 46 + 10} 150" role="img" aria-label="Transfers by position">${order.map((p, i) => { const n = posCount[p] || 0; const hgt = (n / maxc) * 100; const u = C.find((c) => c.pos === p)?.unit; return `<g><rect x="${10 + i * 46}" y="${115 - hgt}" width="32" height="${hgt}" rx="3" class="u-${u}"/><text x="${26 + i * 46}" y="${110 - hgt}" text-anchor="middle" class="v">${n}</text><text x="${26 + i * 46}" y="135" text-anchor="middle">${p}</text></g>`; }).join("")}</svg>`;
  const kp = [["19", "incoming transfers"], [String(C.filter((c) => c.unit === "O").length), "offense"], [String(C.filter((c) => c.unit === "D").length), "defense"], [String(C.filter((c) => c.unit === "ST").length), "special teams"], [String(C.filter((c) => c.portal?.elig === "Immediate").length), `of ${C.filter((c) => c.portal).length} in the CFBD portal feed listed with immediate eligibility`]];
  const rows = (u) => C.filter((c) => c.unit === u).map((c) => {
    const cp = completeness(c); const cf = confidence(c); const o = F.O?.cls[nm(c.name)]; const op = F.reveal ? opportunity(c) : null; const mod = MOD[c.pos];
    const last = c.seasons?.["2025"] || c.seasons?.["2024"];
    return `<tr data-fiprof="${esc(c.name)}" tabindex="0"><td><b>${esc(c.name)}</b><div class="fi-sub">${esc(c.pos)}${mod ? ` · ${POS[mod].short} module` : " · profile only"}</div></td><td>${esc(c.origin || c.listedPrev)}</td><td>${esc(c.portal?.date || (c.name === "Marcello Diomede" ? "Feb. 10 (commit, reported)" : c.name === "Brady Young" ? "Jan. 21 (commit, reported)" : "—"))}</td><td>${esc(c.portal?.elig || "Not in feed")}</td><td>${c.portal?.rating != null ? f(c.portal.rating, 2) : "—"}</td><td class="fi-sm">${esc(last ? `${c.seasons["2025"] ? "2025" : "2024"} ${last.team}: ${prodLine(last, c.pos)}` : "No 2024–25 stats in CFBD")}</td><td>${pct(cp.v)}</td><td>${cf[0]}</td>${F.reveal ? `<td class="fi-sm">${esc(prodLine(o?.s2026, c.pos))}</td><td>${op.wk} / ${op.g}</td>` : ""}</tr>`;
  }).join("");
  const head = ["Player", "Prior school", "Transfer date (CFBD)", "Eligibility", "Portal rating", "Historical production", "Data complete", "Confidence", ...(F.reveal ? ["2026 production", "Games with a recorded stat"] : [])];
  return wrap(`
    <div class="fi-kpis">${kp.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>
    <div class="fi-grid2">${card("Transfers by position", chart + `<p class="fi-sub">Scarlet: offense · charcoal: defense · silver: special teams.</p>`)}
    ${card("How to read this screen", `<p>Each row opens a full profile. Rankings and fit come from the position modules (QB, WR, OL, DL/edge, CB, S); running back, tight end, linebacker and specialists get profiles but no module.</p><p>${F.reveal ? "2026 columns show opportunity (games with a recorded stat), not success. No player is labeled a success or failure from playing time alone." : "Press REVEAL 2026 RESULTS to add 2026 production. Until then, nothing here reflects what happened in 2026."}</p><p class="fi-sub">Diomede and Brady Young are walk-ons not in the CFBD portal feed. ${src(["ewTracker", "ewDiomede", "cfbd"])}</p>`)}</div>
    ${units.map(([u, l]) => card(`${l} · ${C.filter((c) => c.unit === u).length}`, tbl(head, [rows(u)], "fi-click"))).join("")}
    ${F.prof ? profileHTML(F.prof) : ""}`);
}
function profileHTML(name) {
  const c = F.H.cls.find((x) => x.name === name); if (!c) return "";
  const cp = completeness(c); const cf = confidence(c); const mod = MOD[c.pos]; const o = F.O?.cls[nm(c.name)];
  const notes = notesFor(c.name, F.reveal);
  const inj = notes.filter(([t]) => /injur|ACL|questionable/i.test(t));
  let alt = `<p class="fi-sub">No position module for ${esc(c.pos)}. Alternatives not ranked.</p>`, fit = "";
  if (mod) {
    const S = scored(mod); const me = S.rows.find((r) => nm(r.h.name) === nm(c.name));
    const alts = S.rows.filter((r) => !isSignee(r.h.name) && feas(mod, r.h).real).slice(0, 3);
    fit = me ? `<p>${MODEL} Ranked <b>${me.rank}</b> of ${S.rows.length} screened ${POS[mod].short} transfers (80% range ${me.lo}–${me.hi}). Largest drivers: ${me.contrib.map((v, j) => [v, POS[mod].metrics[j].label]).sort((a, b) => Math.abs(b[0]) - Math.abs(a[0])).slice(0, 2).map(([v, l]) => `${esc(l)} (${v >= 0 ? "+" : ""}${v.toFixed(2)})`).join(", ")}.${me.miss.length ? ` Missing: ${esc(me.miss.join(", "))}.` : ""}</p>${me && noRecent(mod, me.h) ? `<p class="fi-warn">No 2025 season on record. His production metrics count at ${Math.round(GAP_REL * 100)}% reliability, so his rank is pulled toward average and his 80% range is wider. The model does not know why he missed the season (for example, injury), so staff medical and film review still decide whether he returns to that level.</p>` : ""}${POS[mod].caution ? `<p class="fi-warn">${esc(POS[mod].caution)}</p>` : ""}` : `<p>${NA} Not enough public production to rank.</p>`;
    alt = alts.length ? `<ul>${alts.map((r) => `<li>${esc(r.h.name)} (${esc(r.h.origin)}) · rank ${r.rank} · ${esc(feas(mod, r.h).t)}</li>`).join("")}</ul>` : "<p>None with feasibility evidence.</p>";
  }
  const seas = Object.entries(c.seasons || {}).map(([y, s]) => `<li><b>${y}</b> ${esc(s.team)} (${esc(s.lv)}, ${s.teamGames || "?"} team games): ${esc(prodLine(s, c.pos))}</li>`).join("") || "<li>No 2024–25 stats in CFBD</li>";
  const op = F.reveal ? opportunity(c) : null;
  return `<div class="fi-drawer" role="dialog" aria-label="${esc(c.name)} profile"><div class="fi-drawer-in">
    <div class="fi-dh"><div><h2>${esc(c.name)}</h2><div class="fi-sub">${esc(c.pos)} · from ${esc(c.origin || c.listedPrev)}${c.roster?.ht ? ` · ${Math.floor(c.roster.ht / 12)}'${c.roster.ht % 12}" ${c.roster.wt} lb` : ""}${c.roster?.home ? ` · ${esc(c.roster.home)}` : ""}</div></div><button class="fi-btn ghost" data-fi="close">Close</button></div>
    <div class="fi-grid2">
      ${card("Prior school and history", `<ul>${seas}</ul><p class="fi-sub">${src(["cfbd"])}</p>`)}
      ${card("Transfer timing and eligibility", `<p>CFBD date: ${esc(c.portal?.date || "not in feed")} · eligibility: ${esc(c.portal?.elig || "not in feed")} · rating ${c.portal?.rating != null ? f(c.portal.rating, 2) : "—"} (${c.portal?.stars || "—"}★)</p><p class="fi-sub">The CFBD date does not distinguish portal entry from commitment.</p>`)}
      ${card("Role and fit", fit + `<p>${NA} Projected Ohio State role: needs the staff's depth chart and role definitions.</p>`)}
      ${card("Verified notes", notes.length ? `<ul>${notes.map(([t, s]) => `<li>${FACT} ${esc(t)} <span class="fi-sub">${src(s)}</span></li>`).join("")}</ul>` : "<p>None.</p>")}
      ${card("Verified injury history", inj.length ? `<ul>${inj.map(([t, s]) => `<li>${esc(t)} <span class="fi-sub">${src(s)}</span></li>`).join("")}</ul>` : `<p>None found in the sources checked. That is not proof there was none.</p>`)}
      ${card("2026 performance and opportunity", F.reveal ? `<p>${esc(prodLine(o?.s2026, c.pos))}</p><p>${esc(op.t)}</p><p class="fi-sub">Opportunity and performance are reported separately; role success needs the staff's definition of the intended role. ${src(["cfbd"])}</p>` : `<p>Hidden. Press REVEAL 2026 RESULTS.</p>`)}
      ${card("Confidence and completeness", `<p>Confidence: <b>${cf[0]}</b> · ${esc(cf[1])}</p><p>Data complete: <b>${pct(cp.v)}</b></p><ul class="fi-chk">${cp.items.map(([l, ok]) => `<li class="${ok ? "ok" : "no"}">${ok ? "Have" : "Missing"} · ${esc(l)}</li>`).join("")}</ul>`)}
      ${card("Realistic alternatives (same module)", alt)}
    </div><p class="fi-sub">Sources and timestamps: ${src(["cfbd", "ewTracker"])}</p></div></div>`;
}

// ---------------- Screens 2 & 3: decision replays ----------------
function sliders(pos) {
  const w = weights(pos); const tot = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return `<div class="fi-sl">${POS[pos].metrics.map((m) => `<label class="${m.staff ? "staff" : ""}"><span>${esc(m.label)}${m.staff ? ` <i class="fi-tag osu">STAFF · ${esc((m.what.match(/· (.*?) ·/) || [])[1] || "")}</i>` : ""} <b data-fiwv="${pos}:${m.k}">${Math.round((w[m.k] / tot) * 100)}%</b></span><input type="range" min="0" max="60" step="1" value="${w[m.k]}" data-fiw="${pos}:${m.k}" aria-label="${esc(m.label)} weight"><small>${esc(m.what)}</small></label>`).join("")}</div>
  <div class="fi-row">${Object.keys(PRESETS[pos] || { "Analyst default": null }).map((p) => `<button class="fi-chip" data-fipre="${pos}:${esc(p)}">${esc(p)}</button>`).join("")}</div>
  <p class="fi-sub">Weights are analyst defaults for this demo. They are not Ohio State's scouting weights, which are private and not inferred from public statements.</p>`;
}
function outVal(pos, name) { const o = F.O?.[pos]?.[nm(name)]; return o ? { v: OUTCOME[pos].fn(o), opp: OUTCOME[pos].opp(o), o } : null; }
function outCell(pos, name) {
  if (!F.reveal) return "";
  const r = outVal(pos, name); if (!r) return `<td>—</td><td>—</td>`;
  const dest = r.o.dest ? `${esc(r.o.dest)}${r.o.dlv ? ` (${esc(r.o.dlv)})` : ""}` : "—";
  return `<td>${dest}</td><td>${r.opp ? `${i0(r.opp)} ${esc(OUTCOME[pos].oppLabel)}` : "0"}${r.v != null ? ` · <b>${f(r.v, 2)}</b>` : ` · <span class="fi-sub">below ${esc(OUTCOME[pos].min)}</span>`}</td>`;
}
function rankTable(pos, S, list) {
  const M = POS[pos].metrics.slice(0, 3);
  const head = ["Rank", "Player", "From", ...M.map((m) => esc(m.label)), "Score", "80% rank range", "Data complete", "Feasibility", ...(F.reveal ? ["2026 school", "2026 opportunity · outcome"] : [])];
  const rows = list.map((r) => { const fe = feas(pos, r.h); const tm = timing(pos, r.h); const sel = (F.cmp[pos] || []).includes(r.h.name);
    return `<tr class="${isSignee(r.h.name) ? "fi-osu" : ""} ${sel ? "fi-sel" : ""}" data-ficmp="${pos}:${esc(r.h.name)}" tabindex="0"><td>${r.rank}</td><td><b>${esc(r.h.name)}</b>${isSignee(r.h.name) ? " " + tag("OSU", "osu") : ""}${r.gap ? `<div><span class="fi-tag na" title="No 2025 season on record. Production metrics count at ${Math.round(GAP_REL * 100)}% reliability, so the score is pulled toward average and the 80% rank range is wider.">NO 2025 SEASON · WIDER RANGE</span></div>` : ""}</td><td>${esc(r.h.origin)}${jumpTag(r.h)}</td>${M.map((m, j) => { const ix = POS[pos].metrics.indexOf(m); return `<td>${r.v[ix] == null ? "—" : f(r.v[ix], m.k === "exp" || m.k === "time" ? 1 : m.k === "ready" ? 0 : 3)}</td>`; }).join("")}<td><b>${f(r.score, 2)}</b></td><td>${r.lo}–${r.hi}</td><td>${pct(r.completeness)}</td><td class="fi-fcol"><span class="fi-fe ${fe.c}">${esc(fe.t)}</span>${tm ? `<div><span class="fi-tag na" title="${esc(tm)}">DATED BEFORE ${esc(DEC[pos].slice(5).replace("-", "/"))}</span></div>` : ""}</td>${outCell(pos, r.h.name)}</tr>`; });
  return tbl(head, rows, "fi-click");
}
function cmpCards(pos, S) {
  const names = (F.cmp[pos] || []).slice(0, 3); const rows = names.map((n) => S.rows.find((r) => r.h.name === n)).filter(Boolean);
  if (!rows.length) return "<p>Select up to three rows to compare.</p>";
  const M = POS[pos].metrics;
  return `<div class="fi-cmp">${rows.map((r) => `<div class="fi-cc"><h4>${esc(r.h.name)} <span class="fi-sub">#${r.rank} · range ${r.lo}–${r.hi}</span></h4>${M.map((m, j) => { const c = r.contrib[j]; const wdt = Math.min(50, Math.abs(c) * 60); return `<div class="fi-bar2"><span>${esc(m.label)}</span><span class="fi-track"><i class="${c >= 0 ? "pos" : "neg"}" style="${c >= 0 ? "left:50%" : `left:${50 - wdt}%`};width:${wdt}%"></i></span><span class="fi-num">${r.v[j] == null ? "missing" : f(r.v[j], 3)} · rel ${f(r.rel[j], 2)}</span></div>`; }).join("")}<p class="fi-sub">Score = Σ weight × shrunk z-score ÷ Σ weights = ${f(r.score, 3)}. Reliability shrinkage = n ÷ (n + k) pulls small samples toward average.</p></div>`).join("")}</div>`;
}
function cohortTest(pos) { return cohortTestW(pos, weights(pos)); }
function cohortTestW(pos, w) {
  const C = F.H.cohort[pos] || [];
  const rows = C.map((c) => pos === "qb"
    ? { h: { name: c.name, origin: c.origin, olv: c.pre?.lv, rating: c.rating, pre25: c.pre ? { att: c.pre.att || 0, cmp: c.pre.cmp, yds: c.pre.pyds, td: c.pre.ptd, int: c.pre.pint, car: c.pre.car, ryds: c.pre.rushyds, ppa_pass: c.pre.ppaPass, ppa_rush: c.pre.ppaRush, usage: c.pre.usage, adj: null } : null }, o: { now: c.out ? { att: c.out.att || 0, ppa_pass: c.out.ppaPass, adj: null } : null }, base: c.pre?.ppaPass }
    : { h: { name: c.name, origin: c.origin, olv: c.pre?.lv, rating: c.rating, s2025: c.pre }, o: { s2026: c.out }, base: c.pre && c.pre.teamGames ? ((c.pre.sacks || 0) + (c.pre.hur || 0)) / c.pre.teamGames : null });
  const elig = rows.filter((r) => (pos === "qb" ? (r.h.pre25?.att || 0) >= 50 : (r.h.s2025?.tot || 0) >= 10));
  const S = score(pos, elig.map((r) => r.h), w, 0);
  const byN = new Map(S.rows.map((r) => [r.h, r.score]));
  return compare(elig.map((r) => ({ m: byN.get(r.h), rt: r.h.rating, b: r.base, y: OUTCOME[pos].fn(r.o) })), pos === "qb" ? "prior-season PPA per pass" : "prior-season (sacks + hurries) per game", C.length);
}
function compare(xs, baseLabel, total) {
  const ok = xs.filter((x) => x.y != null && x.m != null && x.rt != null && x.b != null);
  if (ok.length < 8) return { n: ok.length, total, thin: true };
  const y = ok.map((x) => x.y);
  const r = { n: ok.length, total, baseLabel, model: spearman(ok.map((x) => x.m), y), modelCI: spearmanCI(ok.map((x) => x.m), y), rating: spearman(ok.map((x) => x.rt), y), ratingCI: spearmanCI(ok.map((x) => x.rt), y), base: spearman(ok.map((x) => x.b), y), baseCI: spearmanCI(ok.map((x) => x.b), y) };
  // Paired bootstrap of the model-minus-baseline difference.
  let s = 11; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const d1 = [], d2 = [];
  for (let b = 0; b < 300; b++) { const ix = ok.map(() => Math.floor(R() * ok.length)); const yy = ix.map((i) => y[i]); const m = spearman(ix.map((i) => ok[i].m), yy); d1.push(m - spearman(ix.map((i) => ok[i].rt), yy)); d2.push(m - spearman(ix.map((i) => ok[i].b), yy)); }
  const q = (a) => { const v = a.filter(isFinite).sort((p, q2) => p - q2); return [v[Math.floor(v.length * 0.1)], v[Math.floor(v.length * 0.9)]]; };
  r.dRating = q(d1); r.dBase = q(d2);
  return r;
}
const verdict = (d) => (d[0] > 0 ? "Model better on this sample" : d[1] < 0 ? "Model worse on this sample" : "No clear difference: do not claim superiority");
function testHTML(r, title, note) {
  if (r.thin) return card(title, `<p>Only ${r.n} players had both prior data and an outcome measure. Too few to test.</p>`);
  const row = (l, v, ci, d) => `<tr><td>${l}</td><td><b>${f(v, 2)}</b></td><td>${ci ? `${f(ci[0], 2)} to ${f(ci[1], 2)}` : "—"}</td><td>${d ? `${f(d[0], 2)} to ${f(d[1], 2)} · ${verdict(d)}` : "—"}</td></tr>`;
  return card(title, `<p>${note} Rank correlation (Spearman ρ) between each method's pre-transfer ranking and the outcome, on ${r.n} of ${r.total} players with complete data.</p>
    ${tbl(["Method", "ρ", "80% interval", "Model minus this baseline (80% interval)"], [row("This model (current weights)", r.model, r.modelCI), row("Baseline: portal rating only", r.rating, r.ratingCI, r.dRating), row(`Baseline: ${r.baseLabel}`, r.base, r.baseCI, r.dBase)])}
    <p class="fi-sub">Positive ρ means the ranking ordered players roughly like their later production. Intervals from 300 bootstrap resamples.</p>`);
}
function jumpTag(h) { const lv = h.olv || "Other"; const fx = LVF[lv] ?? LVF.Other; return `<div class="fi-jump ${lv === "P4" ? "" : "up"}" title="Production from the last school is multiplied by ${fx.toFixed(2)} for the move to Ohio State (P4).">${esc(lv)} → P4 · ×${fx.toFixed(2)}</div>`; }
const noRecent = (pos, h) => (pos === "qb" ? !(h.pre25?.att || h.pre25?.car) : !h.s2025);
function realNote(pos, S) {
  const best = S.rows[0]; const real = S.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name));
  const signed = S.rows.filter((r) => isSignee(r.h.name));
  const bestReal = real[0];
  return `<div class="fi-grid3">
    ${card("Best overall", best ? `<p class="fi-big">${esc(best.h.name)}</p><p>${esc(best.h.origin)} · rank 1 (range ${best.lo}–${best.hi})</p><p><span class="fi-fe ${feas(pos, best.h).c}">${esc(feas(pos, best.h).t)}</span></p><p class="fi-sub">${esc(feas(pos, best.h).why)}</p>` : "", "best")}
    ${card("Best realistically obtainable", bestReal ? `<p class="fi-big">${esc(bestReal.h.name)}</p><p>${esc(bestReal.h.origin)} · rank ${bestReal.rank} (range ${bestReal.lo}–${bestReal.hi})</p><p><span class="fi-fe ${feas(pos, bestReal.h).c}">${esc(feas(pos, bestReal.h).t)}</span></p><p class="fi-sub">${esc(feas(pos, bestReal.h).why)} ${src(feas(pos, bestReal.h).s)}</p>` : "<p>None.</p>", "real")}
    ${card(signed.length > 1 ? "Ohio State's signees" : "Ohio State's signee", signed.map((r) => `<p class="fi-big">${esc(r.h.name)}</p><p>rank ${r.rank} of ${S.rows.length} (range ${r.lo}–${r.hi})</p>`).join("") + `<p class="fi-sub">${src(["ewTracker"])}</p>`, "osu")}
  </div>`;
}
function funnelHTML(pos) {
  const S = scored(pos); const list0 = F.realOnly[pos] ? S.rows.filter((r) => feas(pos, r.h).real) : S.rows; const top = list0;
  const totalM = market(pos).length;
  const funnel = `<div class="fi-funnel" id="fi-funnel-${pos}"><div><b>${totalM}</b><span>${POS[pos].short} records in the 2026 CFBD portal feed</span></div><div><b>${S.rows.length}</b><span>screened: ${pos === "qb" ? "≥ 50 attempts in 2024–25" : "≥ 10 tackles in a 2024–25 season"}, plus anyone Ohio State signed or pursued</span></div><div><b>${S.rows.filter((r) => (r.h.olv || "Other") !== "P4").length}</b><span>moving up from G5 or FCS (production discounted)</span></div><div><b>${S.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name)).length}</b><span>${pos === "qb" ? "realistic for a backup role" : "with reported Ohio State contact"}</span></div></div>`;
  return funnel;
}
function liveBlock(pos) {
  const S = scored(pos);
  const list0 = F.realOnly[pos] ? S.rows.filter((r) => feas(pos, r.h).real) : S.rows;
  const top = list0; const extra = [];
  if (!F.cmp[pos]) { const real = S.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name)); F.cmp[pos] = [...new Set([S.rows.find((r) => isSignee(r.h.name))?.h.name, S.rows[0]?.h.name, real[0]?.h.name].filter(Boolean))].slice(0, 3); }
  let acc = "";
  if (F.reveal) {
    const xs = S.rows.map((r) => ({ m: r.score, rt: r.h.rating, b: pos === "qb" ? (r.h.pre25?.ppa_pass ?? r.h.pre24?.ppa_pass) : r.h.s2025?.teamGames ? ((r.h.s2025.sacks || 0) + (r.h.s2025.hur || 0)) / r.h.s2025.teamGames : null, y: outVal(pos, r.h.name)?.v ?? null }));
    acc = testHTML(compare(xs, pos === "qb" ? "2025 PPA per pass" : "2025 (sacks + hurries) per game", S.rows.length), "Prediction accuracy · 2026 partial season", `2026 outcome measure: ${OUTCOME[pos].label} (${OUTCOME[pos].min}), through Nov. 10, 2026. Only players who earned enough opportunity are scored, so this tests performance given opportunity, not who would play.`);
  }
  return `${realNote(pos, S)}
    ${card(`Ranking at the decision date · ${F.realOnly[pos] ? "realistic only" : "all screened"}`, `<div class="fi-row"><button class="fi-chip ${F.realOnly[pos] ? "" : "on"}" data-fireal="${pos}:0">All screened</button><button class="fi-chip ${F.realOnly[pos] ? "on" : ""}" data-fireal="${pos}:1">Realistic only</button><span class="fi-sub">Showing all ${top.length} ${F.realOnly[pos] ? "realistic" : "screened"} players. Tap a row to compare (up to three).</span></div><div class="fi-long">${rankTable(pos, S, [...top, ...extra])}</div><p class="fi-sub">LEVEL MOVE (under each school): production from a G5 school counts at ×${LVF.G5}, FCS at ×${LVF.FCS}, P4 at ×${LVF.P4} for the move to Ohio State. This is a fixed league discount, not a learned jump effect, and it does not separate strong and weak P4 teams. NO 2025 SEASON: production metrics count at ${Math.round(GAP_REL * 100)}% reliability, which pulls the score toward average and widens the 80% range. DATED BEFORE: the player's CFBD portal record is dated before Ohio State's decision. CFBD does not say whether that date is portal entry or commitment, so it may mean he was already committed elsewhere. Score columns show the first three metrics; the comparison panel shows all of them.</p>`)}
    ${card("Compare", cmpCards(pos, S))}
    ${acc}`;
}
function replayPage(pos) {
  const intro = pos === "qb" ? qbContext() : dlContext();
  const ct = cohortTest(pos);
  return wrap(`${funnelHTML(pos)}${intro}
    ${coachBox(pos)}
    <div class="fi-split"><div>${card("Criteria and weights", sliders(pos))}${card("What public data cannot measure", `<ul>${POS[pos].NA.map(([a, b]) => `<li>${NA} <b>${esc(a)}</b> · ${esc(b)}</li>`).join("")}</ul>`)}</div>
    <div id="fi-live-${pos}">${liveBlock(pos)}</div></div>
    ${testHTML(ct, "Held-out test on an earlier cohort · 2025 transfer class", `Same method, same weights, applied to the 2025 class: 2024 production in, 2025 production out (${OUTCOME[pos].label.replace("2026", "next-season")}). Both seasons were complete before January 2026, so this test was possible at the decision date.`)}
    ${pos === "dl" ? dlScenarioTeaser() : ""}
    <div class="fi-row">${askBtn(pos === "qb" ? "Why was Martin ranked where he was?" : "Which DL alternatives were realistically obtainable?")}${askBtn("Where is uncertainty greatest?")}<button class="fi-btn ghost" data-figo="fi_board">Compare with the Ohio State board</button></div>`);
}
function qbContext() {
  const room = F.H.roomQB;
  const rows = room.map((q) => { const s = q.seasons; const att = Object.values(s).reduce((a, x) => a + (x.att || 0), 0); return `<tr><td><b>${esc(q.name)}</b></td><td>${esc(q.note)}</td><td>${Object.entries(s).map(([y, x]) => `${y} ${esc(x.team)}: ${i0(x.cmp)}/${i0(x.att)}, ${i0(x.yds)} yds, ${i0(x.td)} TD, ${i0(x.int)} INT${x.ppa != null ? `, PPA/pass ${f(x.ppa, 2)}` : ""}`).join("<br>") || "No college attempts"}</td><td>${att}</td></tr>`; });
  return `<div class="fi-grid2">${card("The decision · Jan. 12, 2026", `<p>${FACT} Ohio State signed Justyn Martin (Maryland, previously UCLA) on Jan. 12 after a Jan. 10 visit. Coach Day wanted four scholarship quarterbacks; Martin filled the fourth spot. ${src(["ewTracker", "ewMartin"])}</p><p>${FACT} Ohio State also had reported contact with Ryan Staub (visit; chose Tennessee) and Jaxon Potter (offer; chose Old Dominion). ${src(["staubWire", "staub247", "potter247"])}</p><p class="fi-sub">The need, as reported: a backup who would accept a non-starting role behind Julian Sayin. That is why the best overall quarterback and the best obtainable one differ.</p>`)}
  ${card("Quarterback room at the decision date", tbl(["Player", "Status", "2024–25 passing (CFBD)", "Attempts"], rows) + `<p class="fi-sub">${src(["cfbd"])}</p>`)}</div>`;
}
function dlContext() {
  const P = PURSUIT.dl; const rows = Object.entries(P).map(([n, [st, why, s]]) => { const inM = market("dl").some((h) => h.name === n); return `<tr><td><b>${esc(n)}</b></td><td>${esc(st)}</td><td>${esc(why)}</td><td>${inM ? "Yes" : "Not in feed"}</td><td class="fi-sm">${src(s)}</td></tr>`; });
  return `<div class="fi-grid2">${card("The decision · Jan. 6–12, 2026", `<p>${FACT} Ohio State signed John Walker (UCF, Jan. 6), then Qua Russaw (Alabama, EDGE) and James Smith (Alabama, DL) on Jan. 12 after their Jan. 8 visit. ${src(["ewTracker"])}</p><p>${FACT} Ohio State lost out on Chaz Coleman (Tennessee) and Francis Brewu (Notre Dame) after visits. ${src(["ewTracker"])}</p>`)}
  ${card("Reported Ohio State pursuit board", tbl(["Player", "Stage", "What was reported", "In CFBD market", "Source"], rows))}</div>`;
}
function dlScenarioTeaser() { return card("What happens if a starting defensive lineman is unavailable?", `<p>Run it on the Roster Scenarios screen: it counts experienced rotation players, the share of 2025 room production that leaves with the player and the next experienced lineman at the same spot. It does not invent sack or tackle totals for hypothetical rosters.</p><button class="fi-btn" data-fiscen="dl">Open the DL scenario</button>`); }

// ---------------- Position modules ----------------
function pagePos() {
  const tabs = ["qb", "wr", "ol", "dl", "cb", "s"];
  const p = F.posTab; const S = scored(p);
  const signed = S.rows.filter((r) => isSignee(r.h.name));
  return wrap(`<div class="fi-tabs" role="tablist">${tabs.map((t) => `<button role="tab" aria-selected="${t === p}" class="${t === p ? "on" : ""}" data-fipos="${t}">${POS[t].short}</button>`).join("")}</div>
    ${POS[p].caution ? `<p class="fi-warn">${esc(POS[p].caution)}</p>` : ""}
    <div class="fi-split"><div>${card(`${esc(POS[p].label)} · metrics`, `<ul>${POS[p].metrics.map((m) => `<li><b>${esc(m.label)}</b> (default ${m.w}) · ${esc(m.what)}${m.ks ? ` · shrinkage k = ${m.ks}` : ""}</li>`).join("")}</ul><p class="fi-sub">Each module uses its own metrics. There is no universal player score. Production is per team game and weighted by league level (P4 ${LVF.P4}, G5 ${LVF.G5}, FCS ${LVF.FCS}) to adjust for opponent strength; reliability shrinkage adjusts for sample size; share-of-team metrics adjust for role. A player with no 2025 season has his production metrics counted at ${Math.round(GAP_REL * 100)}% reliability, which pulls him toward average and widens his range.</p>`)}
      ${card("Not measurable from public data", `<ul>${POS[p].NA.map(([a, b]) => `<li>${NA} <b>${esc(a)}</b> · ${esc(b)}</li>`).join("")}</ul>`)}
      ${card("Ohio State signees in this module", signed.map((r) => `<p><b>${esc(r.h.name)}</b> · rank ${r.rank} of ${S.rows.length} (80% range ${r.lo}–${r.hi}) · data ${pct(r.completeness)}</p>`).join("") || "<p>None ranked.</p>")}</div>
      <div>${card(`Top 15 of ${S.rows.length} screened`, rankTable(p, S, [...S.rows.slice(0, 15), ...signed.filter((r) => r.rank > 15)]))}</div></div>`);
}

// ---------------- Screen 4: scenarios ----------------
function schedGames(start, dur) {
  const sch = F.H.sched; const i = Math.max(0, sch.findIndex((g) => g.week >= start));
  const n = dur === "season" ? sch.length - i : +dur;
  return sch.slice(i, i + n);
}
function qbExp(q) { const s = q.seasons || {}; return Object.values(s).reduce((a, x) => a + (x.att || 0) * (LVF[x.lv] || 0.6), 0); }
function scenQB() {
  const sc = F.scen; const games = schedGames(sc.start, sc.dur);
  const S = scored("qb");
  let room = F.H.roomQB.map((q) => ({ ...q, exp: qbExp(q) }));
  if (sc.alt) { const a = S.rows.find((r) => r.h.name === sc.alt); if (a) { const seasons = {}; ["pre24", "pre25"].forEach((k, j) => { if (a.h[k]?.att) seasons[2024 + j] = { team: k === "pre24" ? a.h.pre24team || a.h.origin : a.h.origin, lv: a.h.olv, att: a.h[k].att }; }); room = room.filter((q) => q.name !== "Justyn Martin"); room.push({ name: a.h.name, note: `Alternative acquisition instead of Martin (rank ${a.rank})`, seasons, exp: qbExp({ seasons }), alt: true }); } }
  const avail = room.filter((q) => q.name !== sc.out && !sc.gone.includes(q.name)).sort((a, b) => b.exp - a.exp);
  const next = avail[0]; const rd = (q) => (q ? Math.min(1, q.exp / sc.ready) : 0);
  const expo = games.length * (1 - rd(next));
  const base = (() => { const r0 = F.H.roomQB.map((q) => ({ ...q, exp: qbExp(q) })).filter((q) => q.name !== sc.out && !sc.gone.includes(q.name)).sort((a, b) => b.exp - a.exp); return games.length * (1 - rd(r0[0])); })();
  const exper = avail.filter((q) => q.exp >= 100).length;
  const opts = F.H.roomQB.map((q) => q.name);
  const altOpts = S.rows.filter((r) => feas("qb", r.h).real && !isSignee(r.h.name)).slice(0, 12);
  const O = F.reveal ? F.O : null;
  return `<div class="fi-split"><div>${card("Controls", `
      <label class="fi-f">Unavailable quarterback<select data-fis="out">${opts.map((o) => `<option ${o === sc.out ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>
      <label class="fi-f">Duration<select data-fis="dur">${[["1", "1 game"], ["4", "4 games"], ["season", "Rest of season"]].map(([v, l]) => `<option value="${v}" ${v === sc.dur ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="fi-f">Starting week<select data-fis="start">${F.H.sched.map((g) => `<option value="${g.week}" ${g.week === +sc.start ? "selected" : ""}>Week ${g.week} · ${esc(g.opp)} (${g.date})</option>`).join("")}</select></label>
      <fieldset class="fi-f"><legend>Backup transfers out</legend>${opts.filter((o) => o !== sc.out).map((o) => `<label class="fi-ck"><input type="checkbox" data-figone="${esc(o)}" ${sc.gone.includes(o) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</fieldset>
      <label class="fi-f">Alternative acquisition (replaces Martin)<select data-fis="alt"><option value="">Martin (actual)</option>${altOpts.map((r) => `<option ${r.h.name === sc.alt ? "selected" : ""} value="${esc(r.h.name)}">${esc(r.h.name)} · ${esc(r.h.origin)} · rank ${r.rank}</option>`).join("")}</select></label>
      <label class="fi-f">Attempts that count as "ready" ${ILL}<input type="number" min="50" max="800" step="50" value="${sc.ready}" data-fis="ready"></label>`)}</div>
    <div>${card("Result", `
      <div class="fi-kpis sm"><div><b>${games.length}</b><span>games affected</span></div><div><b>${esc(next?.name || "Nobody")}</b><span>next man up (most experience, not the staff depth chart)</span></div><div><b>${pct(rd(next))}</b><span>readiness</span></div><div><b>${f(expo, 1)}</b><span>exposure (game-equivalents)</span></div><div><b>${exper}</b><span>QBs left with ≥ 100 weighted attempts</span></div></div>
      <p class="fi-calc">${MODEL} readiness = min(1, level-weighted 2024–25 attempts ÷ ${sc.ready}) = min(1, ${f(next?.exp || 0, 0)} ÷ ${sc.ready}) = ${f(rd(next), 2)}<br>exposure = games × (1 − readiness) = ${games.length} × (1 − ${f(rd(next), 2)}) = <b>${f(expo, 2)}</b>${sc.alt ? `<br>with Martin instead: ${f(base, 2)} · difference ${f(expo - base, 2)}` : ""}</p>
      <p>${ILL} The ${sc.ready}-attempt threshold and the level weights are assumptions, not findings. Exposure is a relative risk index, not a forecast of wins or points.</p>
      <p><b>Games affected:</b> ${games.map((g) => `Wk ${g.week} ${g.home ? "vs" : "at"} ${esc(g.opp)}`).join(" · ") || "none"}</p>
      ${tbl(["Room after the scenario", "Weighted attempts", "Readiness"], avail.map((q) => `<tr><td>${esc(q.name)}${q.alt ? " " + tag("ALT", "ill") : ""}</td><td>${f(q.exp, 0)}</td><td>${pct(rd(q))}</td></tr>`))}
      <p class="fi-sub">This screen does not predict or claim it could have prevented an injury. It measures how exposed the room is if one happens.</p>`)}
    ${card("What actually happened", O ? `<p>${FACT} Julian Sayin was injured on Oct. 17, 2026 at Indiana; Luke Fahey, a three-star true freshman, replaced him and has started since. ${src(["tentv", "athOct20", "dispatch"])}</p><p>${FACT} An elbow fracture has been reported but not confirmed by Ohio State. ${src(["rabin", "clutch"])}</p><p>${FACT} Martin was the scout-team quarterback in September. ${src(["cleScout"])}</p>${tbl(["QB", "2026 passing through Nov. 10"], F.H.roomQB.map((q) => { const s = O.roomQB[nm(q.name)]?.s2026; return `<tr><td>${esc(q.name)}</td><td>${s ? `${i0(s.cmp)}/${i0(s.att)}, ${i0(s.yds)} yds, ${i0(s.td)} TD, ${i0(s.int)} INT${s.ppa != null ? `, PPA/pass ${f(s.ppa, 2)}` : ""}` : "no attempts"}</td></tr>`; }))}<p>Results after Oct. 17: ${(O.raw.results || []).filter((r) => r.week >= 9 && r.osu != null).map((r) => { const g = O.raw.osuGames.find((x) => x.week === r.week); return `${esc(g?.opp)} ${r.osu}-${r.opp_pts}`; }).join(" · ")}. ${src(["cfbd"])}</p><p class="fi-sub">Facts above are separate from the modeled exposure. The model does not explain the losses.</p>` : `<p>Hidden until REVEAL 2026 RESULTS.</p>`)}</div></div>`;
}
function dlProd(s) { return s ? (s.sacks || 0) + (s.hur || 0) + (s.tfl || 0) : 0; }
function scenDL() {
  const sc = F.scen; const games = schedGames(sc.start, sc.dur);
  let room = F.H.roomDL.map((p) => ({ ...p }));
  if (sc.dlAlt) { const a = market("dl").find((h) => h.name === sc.dlAlt); if (a) { room = room.filter((p) => p.name !== sc.dlSwap); room.push({ name: a.name, pos: a.pos, s2025: a.s2025, s2024: a.s2024, alt: true }); } }
  const grp = (p) => (/T/.test(p.pos) && !/EDGE/.test(p.pos) ? "Interior (DT)" : "Edge (DE/EDGE)");
  const expd = (p) => [p.s2024, p.s2025].some((s) => s && s.lv !== "FCS" && (s.tot || 0) >= 15);
  const tot = room.reduce((a, p) => a + dlProd(p.s2025), 0) || 1;
  const outs = room.filter((p) => sc.dlOut.includes(p.name));
  const lost = outs.reduce((a, p) => a + dlProd(p.s2025), 0);
  const left = room.filter((p) => !sc.dlOut.includes(p.name));
  const by = {}; left.forEach((p) => { const g = grp(p); (by[g] = by[g] || []).push(p); });
  const nextUp = outs.map((p) => { const g = grp(p); const c = (by[g] || []).filter(expd).sort((a, b) => dlProd(b.s2025) - dlProd(a.s2025)); return `${esc(p.name)} → ${c.length ? esc(c[0].name) : "no experienced player at this spot"}`; });
  const cand = Object.keys(PURSUIT.dl).filter((n) => market("dl").some((h) => h.name === n) && !isSignee(n));
  return `<div class="fi-split"><div>${card("Controls", `
      <fieldset class="fi-f"><legend>Unavailable linemen</legend><div class="fi-ckgrid">${F.H.roomDL.map((p) => `<label class="fi-ck"><input type="checkbox" data-fidlout="${esc(p.name)}" ${sc.dlOut.includes(p.name) ? "checked" : ""}> ${esc(p.name)} <span class="fi-sub">${esc(p.pos)}</span></label>`).join("")}</div></fieldset>
      <label class="fi-f">Duration<select data-fis="dur">${[["1", "1 game"], ["4", "4 games"], ["season", "Rest of season"]].map(([v, l]) => `<option value="${v}" ${v === sc.dur ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="fi-f">Alternative acquisition<select data-fis="dlAlt"><option value="">None (actual room)</option>${cand.map((n) => `<option ${n === sc.dlAlt ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      <label class="fi-f">…in place of<select data-fis="dlSwap">${["Qua Russaw", "James Smith", "John Walker"].map((n) => `<option ${n === sc.dlSwap ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`)}</div>
    <div>${card("Result", `
      <div class="fi-kpis sm"><div><b>${outs.length}</b><span>linemen out</span></div><div><b>${games.length}</b><span>games affected</span></div><div><b>${pct(lost / tot)}</b><span>of the room's 2025 (sacks + hurries + TFL) leaves</span></div><div><b>${left.filter(expd).length}</b><span>experienced linemen left (≥ 15 FBS tackles in a 2024–25 season)</span></div></div>
      <p class="fi-calc">${MODEL} share lost = Σ 2025 (sacks + hurries + TFL) of unavailable players ÷ room total = ${f(lost, 1)} ÷ ${f(tot, 1)} = ${pct(lost / tot)}</p>
      <p><b>Next experienced player at the same spot:</b> ${nextUp.join(" · ") || "select a player"}</p>
      ${tbl(["Group", "Available", "Experienced", "2025 production (sum)"], Object.entries(by).map(([g, ps]) => `<tr><td>${g}</td><td>${ps.length}</td><td>${ps.filter(expd).length}</td><td>${f(ps.reduce((a, p) => a + dlProd(p.s2025), 0), 1)}</td></tr>`))}
      <p>${ILL} Grouping uses roster position labels, not snap alignment. "Experienced" uses a 15-tackle threshold. 2025 production may come from another school.</p>
      <p class="fi-sub">This screen does not invent sack or tackle totals for hypothetical rosters. It reports inventory and share of past production only. ${src(["cfbd"])}</p>`)}
    ${card("What actually happened", F.reveal ? tbl(["Lineman", "2026 through Nov. 10"], F.H.roomDL.map((p) => `<tr><td>${esc(p.name)}</td><td class="fi-sm">${esc(prodLine(F.O.roomDL[nm(p.name)]?.s2026, "DL"))}</td></tr>`)) + `<p class="fi-sub">${src(["cfbd"])}</p>` : "<p>Hidden until REVEAL 2026 RESULTS.</p>")}</div></div>`;
}
function pageScen() {
  return wrap(`<div class="fi-tabs" role="tablist"><button role="tab" class="${F.scen.mode === "qb" ? "on" : ""}" data-fiscen="qb">Quarterback</button><button role="tab" class="${F.scen.mode === "dl" ? "on" : ""}" data-fiscen="dl">Defensive line</button></div>
    <p class="fi-legend">${FACT} reported or recorded · ${MODEL} computed here from the data · ${ILL} an assumption you can change</p>
    ${F.scen.mode === "qb" ? scenQB() : scenDL()}
    <div class="fi-row">${askBtn("What happens if the starter is unavailable?")}${askBtn("What roster risks should we address before the next portal window?")}</div>`);
}

// ---------------- Chief of staff ----------------
function briefingHTML(first) {
  return `<div class="fi-brief">${tag("ILLUSTRATIVE BRIEFING", "ill")} <b>Monitoring is not live in this demo.</b> This is the kind of note the assistant would send each morning once connected to live feeds.<ul>
    <li>Quarterback depth: no quarterback behind the starter had 100 or more college attempts in 2024–25. ${MODEL}</li>
    <li>Next portal window: Jan. 4–13, 2027. ${src(["ncaaWin"])}</li>
    <li>CFBD's 2027 portal feed had 0 entries when checked Nov. 10, 2026. ${src(["cfbd"])}</li></ul>${first ? "Ask me anything below, or tap a question." : ""}</div>`;
}
const QS = ["Why was Martin ranked where he was?", "What was known in January 2026?", "Which alternatives were realistically obtainable?", "What did we get right or wrong?", "Which transfers contributed most?", "Where is uncertainty greatest?", "What happens if the starter is unavailable?", "What roster risks should we address before the next portal window?", "What changed in the market this week?"];
function answer(q) {
  const t = q.toLowerCase(); const out = { q, body: "", calc: [], src: [], cant: [], next: [] };
  const S = scored("qb"); const D = scored("dl");
  const named = [...S.rows, ...D.rows].find((r) => t.includes(r.h.name.toLowerCase()) || t.includes(r.h.name.split(" ").slice(-1)[0].toLowerCase()) && r.h.name.split(" ").slice(-1)[0].length > 4 && isSignee(r.h.name));
  if (/why|ranked|rank/.test(t)) {
    const pos = named && D.rows.includes(named) ? "dl" : "qb"; const SS = pos === "dl" ? D : S;
    const r = named || SS.rows.find((x) => x.h.name === "Justyn Martin"); const top = SS.rows[0];
    const M = POS[pos].metrics;
    out.body = `${r.h.name} ranks ${r.rank} of ${SS.rows.length} screened ${POS[pos].short} transfers (80% range ${r.lo}–${r.hi}) under the current weights. ${top.h.name} is first.`;
    out.calc = M.map((m, j) => `${m.label}: ${r.h.name} ${r.v[j] == null ? "missing" : f(r.v[j], 3)} (contribution ${f(r.contrib[j], 3)}) vs ${top.h.name} ${top.v[j] == null ? "missing" : f(top.v[j], 3)} (${f(top.contrib[j], 3)})`);
    out.calc.push(`Score: ${f(r.score, 3)} vs ${f(top.score, 3)}. Reliability shrinkage n ÷ (n + k) reduces small samples${r.h.name === "Justyn Martin" ? "; Martin had 35 attempts in 2024–25, so most metrics are shrunk toward average" : ""}.`);
    out.src = ["cfbd"]; out.cant = ["Ohio State's own grades and scheme fit", "Practice and film evaluation"]; out.next = ["Import the Ohio State board to compare staff and model ranks", "Change the weights on the replay screen and watch the rank move"];
  } else if (/january|known|at the time/.test(t)) {
    out.body = `Before Jan. 31, 2026 the app uses only: 2024 and 2025 season statistics, the 2026 portal records (school, rating, eligibility), Ohio State's 2025 roster and January reporting on visits and offers. 2026 results sit in a separate file that loads only when you press REVEAL.`;
    out.calc = [`QB market: ${market("qb").length} records, ${S.rows.length} screened`, `DL market: ${market("dl").length} records, ${D.rows.length} screened`, `Earlier cohort for testing: ${F.H.cohort.qb.length} QBs and ${F.H.cohort.dl.length} DL from the 2025 class`];
    out.src = ["cfbd", "ewTracker"]; out.cant = ["Which players had already committed elsewhere on each date (CFBD dates do not say entry vs commitment)", "Private conversations, NIL terms"]; out.next = ["Ask Ohio State for its dated contact log"];
  } else if (/realistic|obtainable|alternative/.test(t)) {
    const pos = /dl|defens|line/.test(t) ? "dl" : "qb"; const SS = pos === "dl" ? D : S;
    const real = SS.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name)).slice(0, 6);
    out.body = pos === "qb" ? `For a backup role behind Julian Sayin, "realistic" means not a primary passer in 2024–25, or reported Ohio State contact without a reported demand to start. Top realistic alternatives:` : `For defensive line, "realistic" means reported Ohio State contact (visit, offer or interest). Others may have been obtainable; there is no evidence either way.`;
    out.calc = real.map((r) => `${r.h.name} (${r.h.origin}) · rank ${r.rank}, range ${r.lo}–${r.hi} · ${feas(pos, r.h).t}`);
    out.src = ["cfbd", "ewTracker"]; out.cant = ["NIL budgets and player asks", "Whether players would accept Ohio State's role"]; out.next = ["Import the Ohio State board, which has offer status and constraints"];
  } else if (/right|wrong|accura/.test(t)) {
    if (!F.reveal) { out.body = "That needs the 2026 results, which are not loaded. Press REVEAL 2026 RESULTS at the top, then ask again."; out.next = ["Press REVEAL 2026 RESULTS"]; }
    else {
      const xs = (SS, pos) => compare(SS.rows.map((r) => ({ m: r.score, rt: r.h.rating, b: pos === "qb" ? (r.h.pre25?.ppa_pass ?? r.h.pre24?.ppa_pass) : r.h.s2025?.teamGames ? ((r.h.s2025.sacks || 0) + (r.h.s2025.hur || 0)) / r.h.s2025.teamGames : null, y: outVal(pos, r.h.name)?.v ?? null })), "prior single metric", SS.rows.length);
      const a = xs(S, "qb"), b = xs(D, "dl");
      out.body = `On the partial 2026 season, among players who earned enough opportunity: quarterback ρ ${a.thin ? "n/a" : f(a.model, 2)} (rating-only ${a.thin ? "n/a" : f(a.rating, 2)}); defensive line ρ ${b.thin ? "n/a" : f(b.model, 2)} (rating-only ${b.thin ? "n/a" : f(b.rating, 2)}).`;
      out.calc = [a.thin ? "QB: too few players for a test" : `QB vs rating-only: ${verdict(a.dRating)} (n = ${a.n})`, b.thin ? "DL: too few players" : `DL vs rating-only: ${verdict(b.dRating)} (n = ${b.n})`, "Martin has no 2026 passing attempts, so his pick cannot be scored on performance. He was signed as a fourth quarterback."];
      out.src = ["cfbd"]; out.cant = ["Role success (needs staff role definitions)", "Practice value of scout-team quarterbacks"]; out.next = ["Score role success once Ohio State defines each transfer's intended role"];
    }
  } else if (/contribut/.test(t)) {
    if (!F.reveal) { out.body = "That needs 2026 results. Press REVEAL 2026 RESULTS, then ask again."; }
    else { const L = F.H.cls.map((c) => ({ c, op: opportunity(c), s: F.O.cls[nm(c.name)]?.s2026 })).sort((a, b) => b.op.wk - a.op.wk);
      out.body = "By opportunity (games with a recorded box-score stat), with production alongside. This is not a success ranking."; out.calc = L.slice(0, 8).map((x) => `${x.c.name} (${x.c.pos}): ${x.op.wk} of ${x.op.g} games · ${prodLine(x.s, x.c.pos)}`); out.src = ["cfbd"]; out.cant = ["Snap counts", "Blocking and special-teams play without box-score stats"]; }
  } else if (/uncertain/.test(t)) {
    const wide = [...S.rows.filter((r) => isSignee(r.h.name) || r.rank <= 10).map((r) => ["QB", r]), ...D.rows.filter((r) => isSignee(r.h.name) || r.rank <= 10).map((r) => ["DL", r])].sort((a, b) => (b[1].hi - b[1].lo) - (a[1].hi - a[1].lo)).slice(0, 6);
    out.body = "Uncertainty is greatest where samples are small or data is missing. Widest 80% rank ranges among top-10 and signed players:"; out.calc = wide.map(([p, r]) => `${p} · ${r.h.name}: rank ${r.rank}, range ${r.lo}–${r.hi}, data ${pct(r.completeness)}`);
    out.calc.push("Offensive line: no public performance data at all (rating and level only).", "Specialists, running back, tight end and linebacker: no module.");
    out.src = ["cfbd"]; out.next = ["Charted data (PFF or Ohio State grades) would narrow these ranges most"];
  } else if (/starter|unavailable|injur|out for/.test(t)) {
    const sc = F.scen; const games = schedGames(sc.start, sc.dur); const room = F.H.roomQB.map((q) => ({ ...q, exp: qbExp(q) })).filter((q) => q.name !== sc.out).sort((a, b) => b.exp - a.exp); const rd = Math.min(1, (room[0]?.exp || 0) / sc.ready);
    out.body = `Quarterback scenario (current controls): ${sc.out} out for ${games.length} game(s) from week ${sc.start}. Next man up by experience: ${room[0]?.name}. Readiness ${pct(rd)}, exposure ${f(games.length * (1 - rd), 2)} game-equivalents.`;
    out.calc = [`readiness = min(1, ${f(room[0]?.exp || 0, 0)} ÷ ${sc.ready})`, `exposure = ${games.length} × (1 − ${f(rd, 2)})`, "The attempts threshold is an illustrative assumption."];
    out.src = ["cfbd"]; out.cant = ["Whether an injury could have been predicted (it cannot be claimed)", "Practice reps and staff readiness grades"]; out.next = ["Open Roster Scenarios to change the player, duration or acquisition"];
  } else if (/risk|next portal|window/.test(t)) {
    out.body = "Risks to address before the Jan. 4–13, 2027 window, from data in this app:";
    out.calc = [`Quarterback: ${F.H.roomQB.filter((q) => qbExp(q) >= 100).length} of ${F.H.roomQB.length} scholarship quarterbacks in the January room had 100+ level-weighted college attempts; experienced depth behind the starter is thin.`, `Defensive line: ${F.H.roomDL.filter((p) => [p.s2024, p.s2025].some((s) => s && (s.tot || 0) >= 15)).length} of ${F.H.roomDL.length} linemen had a 15-tackle season in 2024–25.`, "Eligibility: several transfers were fifth-, sixth- or seventh-year players with one year left (Martin, Jackson, Welcing, Washington, Moore)."];
    out.src = ["ncaaWin", "ewTracker", "cfbd"]; out.cant = ["Ohio State's internal roster plan and NIL budget", "Which current players plan to enter the portal"]; out.next = ["Load the Ohio State board and depth chart", "Turn on live portal monitoring"];
  } else if (/changed|this week|market/.test(t)) {
    out.body = "Live monitoring is not connected in this demo, so I cannot report what changed this week. What I could check on Nov. 10, 2026:"; out.calc = ["CFBD 2027 portal feed: 0 entries.", "Next window opens Jan. 4, 2027."]; out.src = ["cfbd", "ncaaWin"]; out.cant = ["Daily portal entries, visits and offers (needs a live feed)"]; out.next = ["Connect a live portal feed to turn the illustrative briefing into a real one"];
  } else {
    out.body = "I answer from the data loaded in this app. Try one of these:"; out.calc = QS;
  }
  return out;
}
function ansHTML(a) {
  return `<div class="fi-ans"><p>${esc(a.body)}</p>${a.calc.length ? `<div class="fi-calc"><b>Working</b><ul>${a.calc.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}${a.src.length ? `<p class="fi-sub">Sources: ${src(a.src)}</p>` : ""}${a.cant.length ? `<p class="fi-sub"><b>Could not check:</b> ${esc(a.cant.join("; "))}</p>` : ""}${a.next.length ? `<p class="fi-sub"><b>Next investigation:</b> ${esc(a.next.join("; "))}</p>` : ""}</div>`;
}
function ask(q) { if (!q.trim()) return; F.chat.push({ who: "u", html: esc(q) }); F.chat.push({ who: "a", html: ansHTML(answer(q)) }); }
function pageCos() {
  return wrap(`<div class="fi-split"><div>${card("Ask", `<div class="fi-chips">${QS.map(askBtn).join("")}</div><form id="fi-say" class="fi-say"><input id="fi-in" placeholder="Ask about the class, a replay or a scenario" aria-label="Question"><button class="fi-btn scarlet">Ask</button></form><p class="fi-sub">Answers come only from data loaded in this tab. Each answer shows its working, sources, what could not be checked and the next investigation.</p>`)}</div>
    <div>${card("Conversation", `<div class="fi-chat" id="fi-chat">${F.chat.map((m) => `<div class="fi-m ${m.who}">${m.html}</div>`).join("")}</div>`)}</div></div>`);
}

// ---------------- Board import ----------------
const BOARD_COLS = ["name", "position", "evaluation_date", "scouting_grade", "strengths", "weaknesses", "staff_notes", "projected_role", "recruiting_stage", "offer_status", "availability", "acquisition_constraints", "final_decision"];
const ALIAS = { player: "name", player_name: "name", pos: "position", date: "evaluation_date", eval_date: "evaluation_date", grade: "scouting_grade", staff_grade: "scouting_grade", notes: "staff_notes", role: "projected_role", stage: "recruiting_stage", offer: "offer_status", constraints: "acquisition_constraints", decision: "final_decision" };
const normH = (k) => { const s = String(k).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); return ALIAS[s] || s; };
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const raw = (rows.shift() || []); const h = raw.map(normH);
  return { headers: raw, rows: rows.filter((r) => r.some((x) => String(x).trim())).map((r) => Object.fromEntries(h.map((k, i) => [k, String(r[i] ?? "").trim()]))), raw: rows };
}
function loadXLSX() { return new Promise((res, rej) => { if (window.XLSX) return res(window.XLSX); const s = document.createElement("script"); s.src = "./js/vendor/xlsx.full.min.js"; s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error("Could not load the spreadsheet reader")); document.head.appendChild(s); }); }
async function readBoard(file) {
  if (/\.xlsx?$/i.test(file.name)) { const XL = await loadXLSX(); const wb = XL.read(await file.arrayBuffer(), { type: "array" }); const raw = XL.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); return { headers: Object.keys(raw[0] || {}), rows: raw.map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [normH(k), String(v).trim()]))) }; }
  return parseCSV(await file.text());
}
function validate(rows) {
  const iss = []; const seen = new Set();
  if (!rows.length) iss.push(["error", 0, "The file has no data rows"]);
  const cols = new Set(Object.keys(rows[0] || {}));
  ["name", "position"].forEach((c) => { if (!cols.has(c)) iss.push(["error", 0, `Missing required column '${c}'`]); });
  BOARD_COLS.filter((c) => !cols.has(c) && !["name", "position"].includes(c)).forEach((c) => iss.push(["warn", 0, `Optional column '${c}' not found`]));
  rows.forEach((r, i) => { const n = i + 2;
    if (!r.name) iss.push(["error", n, "Blank name"]);
    if (r.name && seen.has(nm(r.name) + r.position)) iss.push(["warn", n, `Duplicate row for ${r.name}`]); seen.add(nm(r.name) + r.position);
    if (r.scouting_grade && isNaN(+r.scouting_grade)) iss.push(["warn", n, `Grade '${r.scouting_grade}' is not a number`]);
    if (r.evaluation_date && isNaN(Date.parse(r.evaluation_date))) iss.push(["warn", n, `Date '${r.evaluation_date}' not recognized`]);
    if (r.position && !MOD[String(r.position).toUpperCase()]) iss.push(["info", n, `Position '${r.position}' has no module; row kept but not compared`]);
  });
  return iss;
}
function boardCompare(pos) {
  const B = (F.board || []).map((r, i) => ({ ...r, _row: i + 2 })).filter((r) => MOD[String(r.position).toUpperCase()] === pos);
  const S = scored(pos); const by = new Map(S.rows.map((r) => [nm(r.h.name), r]));
  const matched = B.filter((r) => by.has(nm(r.name)) && r.scouting_grade !== "" && !isNaN(+r.scouting_grade));
  const staffOrder = [...matched].sort((a, b) => +b.scouting_grade - +a.scouting_grade); const modelOrder = [...matched].sort((a, b) => by.get(nm(b.name)).score - by.get(nm(a.name)).score);
  const sr = new Map(staffOrder.map((r, i) => [r, i + 1])); const mr = new Map(modelOrder.map((r, i) => [r, i + 1]));
  const rho = matched.length >= 5 ? spearman(matched.map((r) => +r.scouting_grade), matched.map((r) => by.get(nm(r.name)).score)) : null;
  const onBoard = new Set(B.map((r) => nm(r.name)));
  const missing = S.rows.filter((r) => !onBoard.has(nm(r.h.name))).slice(0, 8);
  const notInData = B.filter((r) => !by.has(nm(r.name)));
  const M = POS[pos].metrics;
  const rows = staffOrder.map((r) => { const m = by.get(nm(r.name)); const gap = sr.get(r) - mr.get(r); const top = m.contrib.map((v, j) => [v, M[j].label]).sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]))[0];
    const o = F.reveal ? outVal(pos, m.h.name) : null;
    return `<tr><td>${r._row}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.scouting_grade)}</td><td>${sr.get(r)}</td><td>${mr.get(r)}</td><td>${gap > 0 ? "+" : ""}${gap}</td><td class="fi-sm">${Math.abs(gap) >= 2 ? `Model driven by ${esc(top[1])} (${f(top[0], 2)}). Staff notes: ${esc(r.strengths || r.staff_notes || "—")}` : "Agree"}</td><td>${esc(r.final_decision || "—")}</td>${F.reveal ? `<td>${o ? (o.v != null ? f(o.v, 2) : `below ${OUTCOME[pos].min}`) : "—"}</td>` : ""}</tr>`; });
  return card(`${POS[pos].label}: staff vs model`, `<div class="fi-kpis sm"><div><b>${B.length}</b><span>board rows at this position</span></div><div><b>${matched.length}</b><span>matched to market data with a grade</span></div><div><b>${rho == null ? "n/a" : f(rho, 2)}</b><span>agreement (Spearman, staff grade vs model score)</span></div><div><b>${notInData.length}</b><span>board players not in the CFBD market</span></div></div>
    ${rows.length ? tbl(["Row", "Player", "Staff grade", "Staff rank", "Model rank", "Gap", "Factors behind the difference", "Final decision", ...(F.reveal ? ["2026 outcome"] : [])], rows) : "<p>No matched rows at this position.</p>"}
    <p><b>Model top candidates missing from the board:</b> ${missing.map((r) => `${esc(r.h.name)} (#${r.rank})`).join(", ") || "none"}</p>${notInData.length ? `<p class="fi-sub">Not found in market data: ${notInData.map((r) => esc(r.name)).join(", ")}</p>` : ""}`);
}
function pageBoard() {
  const iss = F.boardIssues;
  const sample = BOARD_COLS.join(",") + "\nJustyn Martin,QB,2026-01-10,,,,,QB4 depth,visited,offered,committed,,signed\n";
  return wrap(`<div class="fi-split"><div>${card("Import", `<p>Upload the staff board as CSV or XLSX. The file is read in this browser tab only. Nothing is uploaded, stored or sent, and it disappears when the tab closes.</p>
      <label class="fi-btn scarlet fi-file">Choose CSV or XLSX<input type="file" id="fi-file" accept=".csv,.xlsx,.xls" hidden></label>
      <a class="fi-btn ghost" download="ohio-state-board-template.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(sample)}">Download template</a>
      ${F.board ? `<button class="fi-btn ghost" data-fi="bclear">Clear from memory</button>` : ""}
      <p class="fi-sub">Fields: ${BOARD_COLS.map((c) => c.replace(/_/g, " ")).join(", ")}.</p>`)}
      ${F.board ? card(`Validation · ${esc(F.boardName)}`, `<p>${F.board.length} rows read · ${iss.filter((x) => x[0] === "error").length} errors · ${iss.filter((x) => x[0] === "warn").length} warnings</p><ul class="fi-iss">${iss.slice(0, 40).map(([l, r, m]) => `<li class="${l}">${l.toUpperCase()}${r ? ` · row ${r}` : ""} · ${esc(m)}</li>`).join("")}</ul>`) : ""}</div>
    <div>${F.board ? `<div class="fi-tabs">${["qb", "dl", "wr", "ol", "cb", "s"].map((p) => `<button class="${F.boardPos === p ? "on" : ""}" data-fibpos="${p}">${POS[p].short}</button>`).join("")}</div>${boardCompare(F.boardPos)}
      ${card("Original rows (unchanged)", `<button class="fi-chip" data-fi="braw">${F.boardRaw ? "Hide" : "Show"} original rows</button>${F.boardRaw ? tbl(Object.keys(F.board[0] || {}).map(esc), F.board.map((r) => `<tr>${Object.values(r).map((v) => `<td class="fi-sm">${esc(v)}</td>`).join("")}</tr>`)) : ""}`)}` : card("No board loaded", `<p>Once loaded, this screen shows staff rank vs model rank, agreement, model candidates missing from the board, the factors behind each difference and, after REVEAL, outcomes.</p>`)}</div></div>`);
}

// ---------------- Tour ----------------
const TOUR = [
  ["0:00–0:30", "Opening", "fi_class", "", "This is a historical replay of Ohio State's 2026 transfer class, rebuilt in November 2026 from data that existed in January. Nineteen transfers, grouped by unit. Nothing on screen yet reflects the 2026 season.", ["Open the 2026 Transfer Class", "Point to the HISTORICAL VIEW bar"]],
  ["0:30–4:30", "Quarterback decision", "fi_qb", "", "Ohio State needed a fourth scholarship quarterback who would back up Julian Sayin. The model screens the market, ranks it on quarterback-specific metrics, then separates the best quarterback overall from the best one Ohio State could realistically get. Move a weight and the ranking recalculates. Then press REVEAL to see what happened, and how the model compares with simple baselines.", ["Show the room and the decision card", "Move 'Development potential' or pick 'Readiness first'", "Point to best overall vs best realistic", "Tap Martin and the realistic leader to compare", "Scroll to the held-out 2025 cohort test", "Press REVEAL 2026 RESULTS"]],
  ["4:30–7:30", "Starter loss", "fi_scen", "qb", "What if the starter is unavailable? Pick the player, duration and week, and the app shows who is next, how ready he is and the exposure. Swap in an alternative acquisition to see the difference. It separates verified facts from modeled numbers and assumptions, and it never claims an injury could have been predicted.", ["Set Julian Sayin, 4 games, Week 7", "Read the calculation line", "Pick an alternative acquisition", "Point to What actually happened (after REVEAL)"]],
  ["7:30–9:30", "Defensive line", "fi_dl", "", "Russaw, Smith and Walker against the January defensive-line market and Ohio State's reported pursuit board, then the unavailable-lineman scenario.", ["Show the pursuit board", "Point to the signees' ranks and ranges", "Open the DL scenario and mark a lineman out"]],
  ["9:30–11:00", "Talk to Edge", "fi_bot", "", "The assistant answers from the data in the app and shows its working, sources and what it could not check. The briefing is labeled illustrative because live monitoring is not connected.", ["Tap 'What did we get right or wrong?'", "Tap 'Where is uncertainty greatest?'"]],
  ["11:00–12:00", "Closing", "fi_evidence", "", "Imagine having this intelligence continuously available across every position, every transfer window, and every roster decision.", ["Show the data request", "Ask for the board and grades"]],
];
function pageTour() {
  return wrap(`${card("How to run the demo", `<p>Six steps, about 12 minutes. Each Go button opens the right screen. Talking points are written to be read aloud.</p>`)}
    ${TOUR.map(([tm, h, k, mode, talk, steps], i) => card(`${tm} · ${h}`, `<p class="fi-talk">${esc(talk)}</p><ol>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><button class="fi-btn scarlet" data-figo="${k}" data-fimode="${mode}">Go to step ${i + 1}</button>`)).join("")}`);
}

// ---------------- Evidence ----------------
function pageEvidence() {
  const q = cohortTest("qb"), d = cohortTest("dl");
  const line = (r, l) => (r.thin ? `${l}: too few players to test (${r.n}).` : `${l}: model ρ ${f(r.model, 2)} vs rating-only ${f(r.rating, 2)} (${verdict(r.dRating)}) and vs ${r.baseLabel} ${f(r.base, 2)} (${verdict(r.dBase)}); n = ${r.n}.`);
  const QC = [["Every number traces to a dataset or a cited article", "Yes: CFBD pull of 2026-11-10 and linked reporting"], ["2026 outcomes are kept out of the historical view", "Yes: separate file, loaded only on REVEAL"], ["No universal player score", "Yes: six modules, each with its own metrics"], ["Sample size, opponent strength and role are normalized", "Partly: shrinkage, league level and share-of-team; no opponent-by-opponent adjustment outside QB"], ["Ohio State's private weights are not inferred", "Yes: analyst defaults, labeled"], ["Best overall vs best obtainable kept separate", "Yes"], ["No success/failure label from playing time", "Yes: opportunity and performance shown separately; role success needs staff definitions"], ["No claim of predicting or preventing injury", "Yes"], ["Hypothetical rosters get no invented performance", "Yes: inventory and share of past production only"], ["Claims of predictive superiority are tested", line(q, "QB 2025 cohort") + " " + line(d, "DL 2025 cohort")], ["Offensive line evaluation", "Not reliable from public data; flagged on screen"], ["Imported board stays private", "Yes: parsed in the tab, never sent"]];
  const REQ = [["1", "Full evaluated board for January 2026 (all positions), including players passed on", "Tests staff vs model; reveals real feasibility"], ["2", "Staff scouting grades and the grading scale", "Replaces analyst default weights"], ["3", "Dated contact log: visits, offers, declines", "Fixes the entry vs commitment ambiguity"], ["4", "Intended role per transfer (starter, rotation, depth, specialist)", "Lets the app score role success instead of opportunity"], ["5", "Snap counts and depth charts by game, 2026", "Replaces box-score presence"], ["6", "Charted data (PFF or internal): pressures, coverage, blocking grades", "Makes the OL module meaningful; narrows DL/DB ranges"], ["7", "Medical availability history (aggregated, de-identified)", "Readiness assumptions for scenarios"], ["8", "NIL ranges and acquisition constraints (aggregated)", "Feasibility beyond reported contact"]];
  return wrap(`<div class="fi-grid2">${card("Datasets", `<ul><li><b>Historical</b> (data/fi_hist.json): 2024–25 season stats, 2026 portal records, 2025 Ohio State roster, January 2026 reporting. Cutoff ${esc(F.H.meta.cutoff)}.</li><li><b>Outcomes</b> (data/fi_out.json): 2026 season through Nov. 10, 2026. Loaded only on REVEAL.</li><li><b>Earlier cohort</b>: 2025 transfer class (${F.H.cohort.qb.length} QBs, ${F.H.cohort.dl.length} DL), 2024 in, 2025 out.</li></ul><p class="fi-sub">Model ${esc(F.H.meta.model)}. ${esc(F.H.meta.note)}</p>`)}
    ${card("Validation", `<p>${esc(line(q, "Quarterback, 2025 cohort"))}</p><p>${esc(line(d, "Defensive line, 2025 cohort"))}</p><p class="fi-sub">Results recompute with the current weights. If the interval for the difference crosses zero, the app does not claim the model beats the baseline.</p>`)}
    ${card("Methods", `<ul><li>z-score each metric within the screened market, clip to ±3, multiply by reliability n ÷ (n + k)</li><li>Weighted average of shrunk z-scores = score</li><li>200 random draws with noise scaled by (1 − reliability) give the 80% rank range</li><li>Production per team game, weighted by league level (P4 1.0, G5 0.85, FCS 0.7)</li><li>Accuracy: Spearman rank correlation with paired bootstrap intervals</li></ul>`)}
    ${card("Assumptions", `<ul><li>${ILL} League-level weights</li><li>${ILL} Default metric weights</li><li>${ILL} "Realistic" QB = not a primary passer, or reported contact without a reported demand to start</li><li>${ILL} Scenario readiness threshold (300 attempts) and 15-tackle experience threshold</li></ul>`)}
    ${card("Missing information", `<ul><li>${NA} Ohio State's board, grades and weights</li><li>${NA} Snap counts, starts, charting</li><li>${NA} Whether CFBD dates are entry or commitment</li><li>${NA} Medical details beyond public reporting</li><li>${NA} Live portal monitoring</li><li>${NA} Injury and availability are not modeled; players with no 2025 season are flagged on the ranking tables</li><li>Walk-ons Diomede and Brady Young are not in the CFBD portal feed; walk-on long snapper Landon Beal (Maine) appears in reporting but not in the 19-player list.</li></ul>`)}
    ${card("Sources", `<ul class="fi-src">${Object.values(SRC).map((s) => `<li><a href="${s.u}" target="_blank" rel="noopener">${esc(s.n)}</a> <span class="fi-dt">${esc(s.d)}</span></li>`).join("")}</ul>`)}</div>
    ${card("Quality challenge", tbl(["Check", "Status"], QC.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`)))}
    ${card("Prioritized data request for Ohio State", tbl(["#", "Request", "What it unlocks"], REQ.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`)))}
    <p class="fi-sub">Independent demo. Not affiliated with or endorsed by The Ohio State University.</p>`);
}


// ---------------- Coach's criteria box: talk to the algorithm ----------------
// A coach says what matters in plain English. Edge maps it to existing criteria, creates new staff
// criteria from film or notes, records staff grades, and logs every change to the learning ledger.
// Storage: this browser only (localStorage). Shared storage needs Ohio State's approved system.
const SYN = {
  qb: [["eff", /efficien|ppa|epa|accura|complet|decision.?mak|product/], ["aya", /yards per attempt|ypa|big.?play|downfield|deep ball|explosive|push the ball/], ["tov", /turnover|interception|\bints?\b|ball security|protect(s|ing)? the (ball|football)|careless/], ["exp", /experience|starts?\b|starter|starting|veteran|proven|been there/], ["mob", /mobil|scrambl|legs|dual.?threat|athlet|run(s|ning)? the ball|extend plays|rushing/], ["opp", /opponent|competition|power (4|four)|\bp4\b|\bsec\b|big ten|schedule|level of play|good defenses/], ["ready", /ready|readiness|plug.?and.?play|day one|right away|immediate/], ["dev", /develop|potential|upside|ceiling|recruit|talent|rating|young|raw|stars?\b/]],
  dl: [["pr", /pass.?rush|pressure|hurr|get after the (qb|quarterback)|get home|disrupt/], ["sk", /\bsacks?\b|finisher/], ["share", /share of|team sacks/], ["run", /run (defense|stop|stopper)|stop the run|tackles? for loss|\btfl|stout|anchor|gap control|run game/], ["tkl", /tackl|motor|effort|pursuit/], ["time", /playing time|snaps|durab|availab|experience|proven|veteran|played a lot/], ["dev", /talent|rating|upside|potential|ceiling|develop|recruit|stars?\b|young/]],
};
const DOWN = /\b(less|lower|de-?emphasi[sz]e|downplay|reduce|decrease|not (as )?(important|worried|a priority|concerned)|don'?t (need|care as much)|matters? less|secondary)\b/;
const ZERO = /\b(ignore|don'?t care|doesn'?t matter|not at all|zero|no weight|forget|take out|remove)\b/;
const STRONG = /\b(most|top priority|number one|#1|heavily|really|a lot|very|critical|must|biggest|above all|only)\b/;
const NEWC = /\b(add|new criteri(on|a)|create|track|start grading|grade (them|players|guys) on|we (need to|should) (measure|grade|track))\b/;
const SRCRE = [["Film", /\b(film|tape|cut-?ups?|all-?22|watched)\b/], ["Last season notes", /\b(last (year|season)|2025 notes|from last)\b/], ["Staff notes", /\b(notes?|meeting|staff (room|meeting)|board)\b/], ["Practice", /\b(practice|workout|camp)\b/]];
const ROLES = ["Head coach (Coach Day)", "Offensive coordinator", "Defensive coordinator", "Position coach", "General manager", "Analyst"];
const LKEY = "be-v11-learn-1";
const L = { crit: { qb: [], dl: [] }, grades: {}, log: [], w: {}, who: ROLES[0], profile: null };
const COACH = { qb: null, dl: null };
const COACHUNDO = { qb: [], dl: [] };
const COACHEX = {
  qb: ["I need a guy who protects the football and can play right away", "From film, add pocket presence as a criterion and weight it heavily", "Last year's notes: we were burned by turnovers; upside matters less"],
  dl: ["We need to stop the run first; pass rush is secondary", "From film, add hand usage as a criterion", "I want proven, durable guys; talent rating matters less"],
};
function lSave() { try { localStorage.setItem(LKEY, JSON.stringify({ ...L, w: F.w })); } catch {} }
function critMetric(pos, c) {
  return { k: c.k, label: c.label, src: c.src, what: `Staff criterion · ${c.src} · added by ${c.by}. Graded 1–5 by staff; ungraded players count as average and widen their range.`, w: c.w, ks: 0, staff: true,
    fn: (h) => { const g = L.grades[c.k]?.[nm(h.name)]; return typeof g === "number" ? { v: g, n: 999 } : { v: null, n: 0 }; } };
}
function lInstall() {
  for (const pos of ["qb", "dl"]) { POS[pos].metrics = POS[pos].metrics.filter((m) => !m.staff); for (const c of L.crit[pos]) POS[pos].metrics.push(critMetric(pos, c)); }
  F.cache = {};
}
function lLoad() {
  try { const s = JSON.parse(localStorage.getItem(LKEY) || "null"); if (s) { Object.assign(L, { crit: s.crit || { qb: [], dl: [] }, grades: s.grades || {}, log: s.log || [], who: s.who || ROLES[0], profile: s.profile || null }); if (s.w) F.w = s.w; } } catch {}
  lInstall();
}
function lClear() { localStorage.removeItem(LKEY); Object.assign(L, { crit: { qb: [], dl: [] }, grades: {}, log: [], profile: null }); F.w = {}; COACH.qb = COACH.dl = null; COACHUNDO.qb = []; COACHUNDO.dl = []; lInstall(); }
const titleCase = (s) => s.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
function critName(c) {
  let s = String(c).toLowerCase().replace(/\b(from|on|in|off)? ?(the )?(film|tape|cut-?ups?|all-?22)\b/g, " ").replace(/\b(last (year|season)'?s?|notes?|staff|meeting|(from |in |at )?(practice|workouts?|camp))\b/g, " ")
    .replace(/\b(add(ing)?|new|criteri(on|a)|create|track|start grading|grade (them|players|guys) on|we (need to|should) (measure|grade|track)|called|as an?|as|for|a|an|the|i want( to)?|please|and)\b/g, " ")
    .replace(/\b(weight(ed)? it|weight|heavily|really|very|a lot|top priority|most|important|matters?)\b/g, " ").replace(/\d{1,2}\s*(%|percent)/g, " ").replace(/[^a-z0-9' -]/g, " ");
  s = s.replace(/\s+/g, " ").trim(); return s.length >= 3 ? titleCase(s).slice(0, 40) : "";
}
function srcTag(t) { return (SRCRE.find(([, re]) => re.test(t)) || ["Coach direction"])[0]; }
function coachParse(pos, text) {
  const raw = String(text || ""); const t = raw.toLowerCase(); const ops = [], notes = [], newCrit = [], grades = [];
  if (/\b(reset|default|start over)\b/.test(t)) return { reset: true, ops, notes, newCrit, grades, src: srcTag(t) };
  const realOnly = /\b(realistic|obtainable|gettable|would come|available to us)\b/.test(t) ? true : null;
  const crits = () => POS[pos].metrics.filter((m) => m.staff);
  const clauses = t.split(/[,.;]| but | while | though | plus |\band\b(?! (?:can|has|is|will))/).map((s) => s.trim()).filter(Boolean);
  for (const c of clauses) {
    const pctM = c.match(/(\d{1,2})\s*(%|percent)/);
    // Staff grade: "<player> <criterion> 4" or "give <player> a 4 on <criterion>"
    const gN = c.match(/\b([1-5])(\s*(\/|out of)\s*5)?\b/);
    if (gN && !pctM) { const S = scored(pos); const pl = S.rows.find((r) => { const n = r.h.name.toLowerCase(); const last = n.split(" ").slice(-1)[0]; return c.includes(n) || (last.length > 3 && new RegExp(`\\b${last}\\b`).test(c)); });
      const cr = crits().find((m) => c.includes(m.label.toLowerCase())) || (crits().length === 1 ? crits()[0] : null);
      if (pl && cr) { grades.push({ k: cr.k, label: cr.label, name: pl.h.name, g: +gN[1] }); continue; } }
    const hitsStaff = crits().filter((m) => c.includes(m.label.toLowerCase())).map((m) => m.k);
    const hits = [...SYN[pos].filter(([, re]) => re.test(c)).map(([k]) => k), ...hitsStaff];
    if (NEWC.test(c) && !hitsStaff.length) { const name = critName(c); if (name) { newCrit.push({ label: name, w: pctM ? Math.min(60, +pctM[1]) : STRONG.test(c) ? 20 : 12, src: srcTag(t) }); continue; } }
    if (!hits.length && /\bweight (it|that|this)\b/.test(c) && newCrit.length) { const nc = newCrit[newCrit.length - 1]; nc.w = pctM ? Math.min(60, +pctM[1]) : STRONG.test(c) ? 25 : DOWN.test(c) ? 6 : 15; continue; }
    if (!hits.length && /^(from |on |in |per |based on )?(the |our |my )?(film|tape|cut-?ups?|all-?22|last (year|season)'?s? notes?|notes?|practice)( i watched| we watched)?:?$/.test(c)) continue;
    if (!hits.length) { if (c.length > 3 && !/realistic|obtainable|gettable|^(i|we) (need|want) a (guy|backup|player)$/.test(c)) notes.push(raw.slice(t.indexOf(c), t.indexOf(c) + c.length) || c); continue; }
    for (const k of hits) {
      if (pctM) ops.push({ k, set: Math.min(60, +pctM[1]) });
      else if (ZERO.test(c)) ops.push({ k, mul: 0 });
      else if (DOWN.test(c)) ops.push({ k, mul: 0.5 });
      else ops.push({ k, mul: STRONG.test(c) ? 3 : 2 });
    }
  }
  return { reset: false, ops, notes, realOnly, newCrit, grades, src: srcTag(t) };
}
function coachSnap(pos) {
  const S = scored(pos); const real = S.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name));
  return { best: S.rows[0], real: real[0], signed: S.rows.filter((r) => isSignee(r.h.name)), rank: Object.fromEntries(S.rows.map((r) => [r.h.name, r.rank])), n: S.rows.length, w: weights(pos), top: S.rows.slice(0, 20) };
}
const pctOf = (w) => { const t = Object.values(w).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round((v / t) * 100)])); };
const mLabel = (pos, k) => POS[pos].metrics.find((m) => m.k === k)?.label || k;
function addCrit(pos, label, w, src) {
  const k = "staff_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30) + "_" + pos;
  if (POS[pos].metrics.some((m) => m.k === k)) return k;
  const c = { k, label, w, src, by: L.who, at: new Date().toISOString() }; L.crit[pos].push(c); POS[pos].metrics.push(critMetric(pos, c));
  F.w[pos] = { ...weights(pos), [k]: w }; F.cache = {}; return k;
}
function coachApply(pos, text) {
  const p = coachParse(pos, text); const before = coachSnap(pos);
  const made = [];
  for (const nc of p.newCrit) made.push(addCrit(pos, nc.label, nc.w, nc.src));
  for (const g of p.grades) { L.grades[g.k] = { ...(L.grades[g.k] || {}), [nm(g.name)]: g.g }; F.cache = {}; }
  const w0 = weights(pos); const tot0 = Object.values(w0).reduce((a, b) => a + b, 0) || 1;
  const sh = Object.fromEntries(Object.entries(w0).map(([k, v]) => [k, (v / tot0) * 100]));
  if (p.reset) { delete F.w[pos]; }
  else if (p.ops.length) {
    const fixed = {};
    for (const o of p.ops) { if (o.set != null) fixed[o.k] = o.set; else sh[o.k] = Math.max(o.mul === 0 ? 0 : 2, sh[o.k] * o.mul + (o.mul > 1 ? 5 : 0)); }
    const fixedTot = Object.values(fixed).reduce((a, b) => a + b, 0);
    const free = Object.keys(sh).filter((k) => !(k in fixed)); const freeTot = free.reduce((a, k) => a + sh[k], 0) || 1; const room = Math.max(0, 100 - fixedTot);
    F.w[pos] = Object.fromEntries(Object.keys(sh).map((k) => [k, Math.min(60, Math.round(k in fixed ? fixed[k] : (sh[k] / freeTot) * room))]));
  }
  if (p.realOnly != null) F.realOnly[pos] = p.realOnly;
  F.cache = {};
  const after = coachSnap(pos);
  const b = pctOf(before.w), a = pctOf(after.w);
  const changes = Object.keys(a).filter((k) => a[k] !== (b[k] ?? 0)).map((k) => ({ k, label: mLabel(pos, k), from: b[k] ?? 0, to: a[k], staff: k.startsWith("staff_") })).sort((x, y) => Math.abs(y.to - y.from) - Math.abs(x.to - x.from));
  const movers = after.top.map((r) => ({ n: r.h.name, from: before.rank[r.h.name], to: r.rank })).filter((m) => m.from && m.from !== m.to).sort((x, y) => Math.abs(y.from - y.to) - Math.abs(x.from - x.to)).slice(0, 5);
  const did = p.reset || p.ops.length || p.newCrit.length || p.grades.length || p.realOnly != null;
  COACH[pos] = { text, p, before, after, changes, movers, made, did };
  if (did) {
    L.log.push({ at: new Date().toISOString(), who: L.who, pos, src: p.src, text: String(text).slice(0, 400), reset: p.reset, changes: changes.map(({ label, from, to }) => ({ label, from, to })), newCrit: p.newCrit.map((c) => c.label), grades: p.grades.map((g) => `${g.name}: ${g.label} ${g.g}/5`), notes: p.notes,
      best: [before.best?.h.name, after.best?.h.name], real: [before.real?.h.name, after.real?.h.name], signee: after.signed.map((r) => [r.h.name, before.rank[r.h.name], r.rank]) });
    lSave();
  }
}
function coachMove(label, b, a, n) {
  if (!a) return `<div class="cc-mv"><span class="cc-l">${label}</span><b>None</b></div>`;
  const same = b && b.h.name === a.h.name;
  return `<div class="cc-mv"><span class="cc-l">${label}</span><b>${esc(a.h.name)}</b><span class="cc-r">rank <em>${a.rank}</em> of ${n}${same ? "" : ` · was ${esc(b?.h.name || "none")}`}</span>${same ? `<span class="cc-same">Unchanged</span>` : `<span class="cc-chg">Changed</span>`}</div>`;
}
function gradePanel(pos) {
  const cs = POS[pos].metrics.filter((m) => m.staff); if (!cs.length) return "";
  const S = scored(pos); const real = S.rows.filter((r) => feas(pos, r.h).real && !isSignee(r.h.name)).slice(0, 4);
  const graded = S.rows.filter((r) => cs.some((c) => typeof L.grades[c.k]?.[nm(r.h.name)] === "number"));
  const list = [...new Map([...S.rows.slice(0, 6), ...S.rows.filter((r) => isSignee(r.h.name)), ...real, ...graded].sort((a, b) => a.rank - b.rank).map((r) => [r.h.name, r])).values()];
  return `<div class="cc-grade"><div class="cc-gh"><span class="bot-k">Staff grades from film · 1 (poor) to 5 (elite)</span><span class="fi-sub">Or say "Simmons ${esc(cs[0].label.toLowerCase())} 4". Grades take effect once two or more players are graded; ungraded players count as average with a wider range.</span></div>
    <div class="fi-tw"><table class="cc-gt"><thead><tr><th>Player</th><th>Rank</th>${cs.map((c) => `<th>${esc(c.label)}<small>${esc(c.src)} · ${Object.keys(L.grades[c.k] || {}).length} graded</small></th>`).join("")}</tr></thead><tbody>
    ${list.map((r) => `<tr><td>${esc(r.h.name)}${isSignee(r.h.name) ? ` <span class="fi-tag osu">OSU</span>` : ""}</td><td>${r.rank}</td>${cs.map((c) => { const g = L.grades[c.k]?.[nm(r.h.name)]; return `<td><select data-ccgrade="${pos}|${c.k}|${esc(r.h.name)}" aria-label="${esc(c.label)} grade for ${esc(r.h.name)}"><option value="">–</option>${[1, 2, 3, 4, 5].map((v) => `<option ${g === v ? "selected" : ""}>${v}</option>`).join("")}</select></td>`; }).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}
function coachResult(pos) {
  const C = COACH[pos];
  if (!C) return `<div class="fi-row cc-ex">${COACHEX[pos].map((x) => `<button class="cc-chip" data-coachex="${pos}:${esc(x)}">${esc(x)}</button>`).join("")}</div>${gradePanel(pos)}`;
  const { p, before, after, changes, movers, did } = C;
  if (!did) return `<div class="cc-res"><p><b>Edge could not match that to a criterion.</b> Criteria for this position: ${POS[pos].metrics.map((m) => esc(m.label)).join(", ")}.</p>${p.notes.length ? `<div class="fi-row"><button class="fi-btn scarlet" data-ccadd="${pos}|${esc(critName(p.notes[0]) || titleCase(p.notes[0]).slice(0, 40))}">Add "${esc(critName(p.notes[0]) || titleCase(p.notes[0]).slice(0, 40))}" as a staff criterion</button></div>` : ""}</div>${gradePanel(pos)}`;
  const sigs = after.signed.map((r) => { const b = before.rank[r.h.name]; return `${esc(r.h.name)} ${b === r.rank ? `<em>${r.rank}</em> (unchanged)` : `<em>${b} → ${r.rank}</em>`}`; }).join("<br>");
  return `<div class="cc-res">
    <div class="cc-said"><span class="bot-k">Edge understood · ${esc(p.src)} · ${esc(L.who)}</span>${p.reset ? `<span class="cc-w">Reset to analyst default weights</span>` : ""}${p.newCrit.map((c) => `<span class="cc-w new">New staff criterion <b>${esc(c.label)}</b></span>`).join("")}${p.grades.map((g) => `<span class="cc-w">${esc(g.name)} · ${esc(g.label)} <b>${g.g}/5</b></span>`).join("")}${changes.map((c) => `<span class="cc-w">${esc(c.label)} <b>${c.from}% → ${c.to}%</b></span>`).join("")}${p.realOnly ? `<span class="cc-w">Ranking filter <b>realistic only</b></span>` : ""}</div>
    ${p.notes.length ? `<p class="cc-note">Not mapped: "${esc(p.notes.join('", "'))}". <button class="cc-link" data-ccadd="${pos}|${esc(critName(p.notes[0]) || titleCase(p.notes[0]).slice(0, 40))}">Add as a staff criterion</button></p>` : ""}
    <div class="cc-grid">${coachMove("Best overall", before.best, after.best, after.n)}${coachMove("Best realistically obtainable", before.real, after.real, after.n)}<div class="cc-mv"><span class="cc-l">${after.signed.length > 1 ? "Ohio State's signees" : "Ohio State's signee"}</span><span class="cc-r cc-sig">${sigs}</span></div></div>
    ${movers.length ? `<p class="cc-note"><b>Biggest moves in the top 20:</b> ${movers.map((m) => `${esc(m.n)} ${m.from} → ${m.to}`).join(" · ")}</p>` : ""}
    <div class="fi-row"><button class="fi-btn ghost" data-coachundo="${pos}">Undo</button><button class="fi-btn ghost" data-figo="fi_learn">Saved to Algorithm Learning · ${L.log.length} changes</button></div></div>${gradePanel(pos)}`;
}
function coachBox(pos) {
  const sr = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  return `<section class="cc" id="cc-${pos}"><div class="cc-head"><h3>Tell Edge what you are looking for</h3>
      <label class="cc-who">Speaking as <select data-ccwho="1">${ROLES.map((r) => `<option ${r === L.who ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label></div>
    <p class="cc-lead">Talk to the algorithm. Change weights, add criteria from film or last year's notes, or grade players. Every change re-ranks the board below and is saved to Algorithm Learning for the next portal window.</p>
    <form class="cc-form" data-coachform="${pos}"><input id="cc-in-${pos}" placeholder="${pos === "qb" ? "e.g. From film, add pocket presence and weight it heavily; turnovers matter most" : "e.g. Stop the run first; from film, add hand usage as a criterion"}" aria-label="Describe what you are looking for">
      <button type="button" class="bot-mic cc-mic" data-coachmic="${pos}" aria-label="Speak" title="${sr ? "Speak" : "Voice input not available in this browser"}" ${sr ? "" : "disabled"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"/></svg></button>
      <button class="fi-btn scarlet">Apply</button></form>
    <div id="cc-res-${pos}">${coachResult(pos)}</div></section>`;
}
function coachRun(pos, text) {
  if (!String(text || "").trim()) return;
  COACHUNDO[pos].push({ w: F.w[pos] ? { ...F.w[pos] } : null, real: F.realOnly[pos], c: COACH[pos], crit: L.crit[pos].map((c) => c.k), grades: JSON.stringify(L.grades), logN: L.log.length });
  coachApply(pos, text); if (!COACH[pos].did) COACHUNDO[pos].pop();
  X.render(); setTimeout(() => document.querySelector(`#cc-${pos}`)?.scrollIntoView({ block: "nearest" }), 30);
}
function coachUndo(pos) {
  const s = COACHUNDO[pos].pop();
  if (!s) { delete F.w[pos]; COACH[pos] = null; }
  else { if (s.w) F.w[pos] = s.w; else delete F.w[pos]; F.realOnly[pos] = s.real; COACH[pos] = s.c; L.crit[pos] = L.crit[pos].filter((c) => s.crit.includes(c.k)); L.grades = JSON.parse(s.grades); L.log = L.log.slice(0, s.logN); }
  lInstall(); lSave(); X.render();
}

// ---------------- Algorithm Learning screen ----------------
function cohortRho(pos, w) { const r = cohortTestW(pos, w); return r.thin ? null : r.model; }
function learnGraph() {
  return `<div class="fi-grid2">${["qb", "dl"].map((pos) => {
    const ms = POS[pos].metrics; const w = pctOf(weights(pos)); const gap = 34; const H = Math.max(ms.length * gap + 30, 200); const W = 700;
    const coaches = [...new Set(L.log.filter((l) => l.pos === pos).map((l) => l.who))];
    const px = coaches.length ? 290 : 120, py = H / 2, mx = px + 110;
    const cy = (i) => H / 2 + (i - (coaches.length - 1) / 2) * 40;
    const my = (i) => 20 + i * gap;
    return `<svg class="lg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${POS[pos].label} knowledge graph">
      ${coaches.map((c, i) => `<line x1="158" y1="${cy(i)}" x2="${px}" y2="${py}" class="e-coach" stroke-width="2"/>`).join("")}
      ${ms.map((m, i) => `<line x1="${px}" y1="${py}" x2="${mx}" y2="${my(i)}" class="${m.staff ? "e-staff" : "e-pub"}" stroke-width="${Math.max(1, (w[m.k] || 0) / 4)}"/>`).join("")}
      ${coaches.map((c, i) => `<g class="n-coach"><circle cx="150" cy="${cy(i)}" r="8"/><text x="136" y="${cy(i) + 4}" text-anchor="end">${esc(c.replace(/ \(.*\)/, ""))}</text></g>`).join("")}
      <g class="n-pos"><circle cx="${px}" cy="${py}" r="28"/><text x="${px}" y="${py + 5}" text-anchor="middle">${POS[pos].short}</text></g>
      ${ms.map((m, i) => { const g = m.staff ? Object.keys(L.grades[m.k] || {}).length : 0; return `<g class="${m.staff ? "n-staff" : "n-pub"}"><circle cx="${mx}" cy="${my(i)}" r="${4 + (w[m.k] || 0) / 5}"/><text x="${mx + 16}" y="${my(i) + 4}">${esc(m.label)} · ${w[m.k] || 0}%${m.staff ? ` · ${esc(m.src || "staff")}${g ? ` · ${g} graded` : ""}` : ""}</text></g>`; }).join("")}
    </svg>`; }).join("")}</div>`;
}
function pageLearn() {
  const rows = ["qb", "dl"].map((pos) => {
    const d = Object.fromEntries(POS[pos].metrics.filter((m) => !m.staff).map((m) => [m.k, m.w])); const cur = weights(pos);
    const pubOnly = Object.fromEntries(Object.entries(cur).filter(([k]) => !k.startsWith("staff_")));
    const r0 = cohortRho(pos, d), r1 = cohortRho(pos, pubOnly); const a = pctOf(cur);
    return { pos, r0, r1, a, d: pctOf(d) };
  });
  const logRows = L.log.slice().reverse().map((l) => `<tr><td class="fi-dt">${esc(l.at.slice(0, 16).replace("T", " "))}</td><td>${esc(l.who)}</td><td>${POS[l.pos].short}</td><td>${tag(l.src.toUpperCase(), "model")}</td><td class="fi-sm">“${esc(l.text)}”</td><td class="fi-sm">${l.reset ? "Reset to default. " : ""}${l.newCrit.map((c) => `New criterion: ${esc(c)}. `).join("")}${l.grades.map((g) => `${esc(g)}. `).join("")}${l.changes.slice(0, 4).map((c) => `${esc(c.label)} ${c.from}→${c.to}%`).join("; ")}</td><td class="fi-sm">Best: ${esc(l.best[1] || "")}${l.best[0] !== l.best[1] ? ` (was ${esc(l.best[0] || "")})` : ""}<br>Realistic: ${esc(l.real[1] || "")}${l.real[0] !== l.real[1] ? ` (was ${esc(l.real[0] || "")})` : ""}</td></tr>`);
  const prof = L.profile;
  return wrap(`<div class="fi-kpis"><div><b>${L.log.length}</b><span>coach instructions learned</span></div><div><b>${L.crit.qb.length + L.crit.dl.length}</b><span>staff criteria added from film and notes</span></div><div><b>${Object.values(L.grades).reduce((a, g) => a + Object.keys(g).length, 0)}</b><span>staff grades recorded</span></div><div><b>${new Set(L.log.map((l) => l.who)).size}</b><span>coaches contributing</span></div><div><b>Jan. 4</b><span>2027 portal window opens</span></div></div>
    ${card("How the algorithm gets smarter", `<ol class="lr-steps"><li><b>Coaches talk to it.</b> On the QB and DL replays, any coach says what matters, adds criteria from film or last year's notes and grades players. ${tag("LIVE IN THIS DEMO", "fact")}</li><li><b>It records the context.</b> Every instruction is saved with who said it, the source (film, notes, practice) and what it changed, and becomes part of the knowledge graph below. ${tag("LIVE IN THIS DEMO", "fact")}</li><li><b>It checks itself against results.</b> Each version of the weights is scored against the held-out 2025 class, and against 2026 results once they are revealed, so the staff sees whether a change made predictions better or worse. ${tag("LIVE IN THIS DEMO", "fact")}</li><li><b>It carries forward.</b> The current profile becomes the starting algorithm for the Jan. 4–13, 2027 window, and each season's outcomes feed the next check. ${tag("SAVE BELOW", "model")}</li><li><b>Shared across the staff.</b> Today this learning is stored in this browser only. Sharing it across the staff needs Ohio State's approved storage and access rules. ${tag("NOT YET CONNECTED", "na")}</li></ol>`)}
    <div class="fi-grid2">${rows.map((r) => card(`${POS[r.pos].label} · current profile`, `<div class="lr-bars">${POS[r.pos].metrics.map((m) => `<div class="lr-b"><span>${esc(m.label)}${m.staff ? ` ${tag("STAFF", "osu")}` : ""}</span><i><u style="width:${Math.min(100, (r.a[m.k] || 0) * 2)}%"></u></i><b>${r.a[m.k] || 0}%</b><small>${m.staff ? "new" : `default ${r.d[m.k]}%`}</small></div>`).join("")}</div>
      <p class="lr-chk"><b>Self-check · held-out 2025 class:</b> analyst default ρ ${r.r0 == null ? "n/a" : f(r.r0, 2)} → current public-data weights ρ ${r.r1 == null ? "n/a" : f(r.r1, 2)} ${r.r0 != null && r.r1 != null ? (r.r1 - r.r0 > 0.05 ? tag("BETTER", "fact") : r.r1 - r.r0 < -0.05 ? tag("WORSE", "ill") : tag("NO CLEAR CHANGE", "na")) : ""}</p>
      <p class="fi-sub">ρ is the rank correlation between the January ranking and next-season production. Staff criteria cannot be tested on the 2025 class until staff grade those players. One season of results is a small sample; treat this as a warning light, not proof.</p>
      <div class="fi-row"><button class="fi-btn" data-figo="fi_${r.pos}">Talk to the ${POS[r.pos].short} algorithm</button></div>`)).join("")}</div>
    ${card("Knowledge graph · what the system has learned", `${learnGraph()}<p class="fi-sub">Positions link to their criteria; line width is the current weight. Red dashed lines are staff criteria added from film or notes. Coach nodes appear as coaches contribute.</p>`)}
    ${card("2027 starting profile", `${prof ? `<p>${tag("SAVED", "fact")} Saved ${esc(prof.at.slice(0, 10))} by ${esc(prof.who)} with ${prof.n} learned instructions. When the Jan. 4–13, 2027 window opens, the board starts from these weights and criteria instead of the analyst default.</p>` : `<p>No 2027 profile saved yet. Saving stores the current weights, staff criteria and grades as the starting algorithm for the next portal window.</p>`}<div class="fi-row"><button class="fi-btn scarlet" data-lr="save">Save current profile for 2027</button><button class="fi-btn ghost" data-lr="clear">Clear learning in this browser</button></div>`)}
    ${card(`Learning log · ${L.log.length} instructions`, L.log.length ? tbl(["When", "Who", "Pos", "Source", "What they said", "What changed", "Effect"], logRows) : `<p>Nothing learned yet. Open the QB or DL replay and tell Edge what you are looking for.</p><div class="fi-row"><button class="fi-btn scarlet" data-figo="fi_qb">Open QB replay</button><button class="fi-btn" data-figo="fi_dl">Open DL replay</button></div>`)}`);
}
function bindCoach() {
  lLoad();
  document.addEventListener("submit", (e) => { const fm = e.target.closest?.("[data-coachform]"); if (!fm) return; e.preventDefault(); coachRun(fm.dataset.coachform, fm.querySelector("input")?.value); });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset?.ccwho) { L.who = t.value; lSave(); return; }
    if (t.dataset?.ccgrade) { const [pos, k, name] = t.dataset.ccgrade.split("|"); const before = coachSnap(pos);
      const g = { ...(L.grades[k] || {}) }; if (t.value) g[nm(name)] = +t.value; else delete g[nm(name)]; L.grades[k] = g; F.cache = {};
      const after = coachSnap(pos); L.log.push({ at: new Date().toISOString(), who: L.who, pos, src: "Film", text: `${name}: ${mLabel(pos, k)} ${t.value || "cleared"}${t.value ? "/5" : ""}`, reset: false, changes: [], newCrit: [], grades: [`${name}: ${mLabel(pos, k)} ${t.value || "–"}/5`], notes: [], best: [before.best?.h.name, after.best?.h.name], real: [before.real?.h.name, after.real?.h.name], signee: [] });
      lSave(); X.render(); }
  });
  document.addEventListener("click", (e) => {
    const ex = e.target.closest("[data-coachex]"); if (ex) { const [pos, q] = ex.dataset.coachex.split(/:(.+)/); return coachRun(pos, q); }
    const u = e.target.closest("[data-coachundo]"); if (u) return coachUndo(u.dataset.coachundo);
    const ad = e.target.closest("[data-ccadd]"); if (ad) { const [pos, label] = ad.dataset.ccadd.split("|"); return coachRun(pos, `Add ${label} as a criterion`); }
    const lr = e.target.closest("[data-lr]"); if (lr) { if (lr.dataset.lr === "save") { L.profile = { at: new Date().toISOString(), who: L.who, n: L.log.length, w: JSON.parse(JSON.stringify(F.w)), crit: JSON.parse(JSON.stringify(L.crit)) }; lSave(); X.toast("Saved as the 2027 starting profile"); }
      else if (confirm("Clear all learned instructions, staff criteria and grades in this browser?")) { lClear(); X.toast("Learning cleared"); } return X.render(); }
    const m = e.target.closest("[data-coachmic]"); if (m) { const pos = m.dataset.coachmic; const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
      const r = new SR(); r.lang = "en-US"; r.interimResults = true; const inp = document.querySelector(`#cc-in-${pos}`); m.classList.add("on"); let said = "";
      r.onresult = (ev) => { said = Array.from(ev.results).map((x) => x[0].transcript).join(" "); if (inp) inp.value = said; };
      r.onerror = () => { m.classList.remove("on"); X.toast("Did not catch that. Try again or type it"); };
      r.onend = () => { m.classList.remove("on"); if (said.trim()) coachRun(pos, said); };
      try { r.start(); } catch { m.classList.remove("on"); } }
  });
}

// ---------------- Edge · talk-to bot (v11) ----------------
// An embodied assistant: animated avatar, voice in and out, visible working steps and answer cards.
// It reuses answer() above, so every reply comes only from data loaded in this tab.
const BOT = { state: "idle", q: "", a: null, steps: [], stepOn: -1, hist: [], muted: false, rec: null, heard: "", spot: null, go: null, voiceOK: null };
const BOTQ = ["Why was Martin ranked where he was?", "Which alternatives were realistically obtainable?", "Where is uncertainty greatest?", "What happens if the starter is unavailable?", "What roster risks should we address before the next portal window?", "What did we get right or wrong?", "Why was James Smith ranked where he was?", "What was known in January 2026?"];
const BOTSTATE = { idle: "Ready", listening: "Listening", thinking: "Working", speaking: "Speaking", answered: "Ready" };
function botRoute(q) {
  const t = q.toLowerCase(); const dl = /dl|defens|line|smith|walker|russaw|brewu|coleman/.test(t);
  if (/why|rank/.test(t)) return dl ? ["fi_dl", "Open DL replay"] : ["fi_qb", "Open QB replay"];
  if (/realistic|obtainable|alternative/.test(t)) return dl ? ["fi_dl", "Open DL replay"] : ["fi_qb", "Open QB replay"];
  if (/starter|unavailable|injur|risk|window/.test(t)) return ["fi_scen", "Open roster scenarios"];
  if (/contribut/.test(t)) return ["fi_class", "Open transfer class"];
  return ["fi_evidence", "Open evidence"];
}
function botSpot(q) {
  const t = q.toLowerCase(); let best = null;
  for (const pos of ["qb", "dl"]) { const S = scored(pos);
    for (const r of S.rows) { const full = r.h.name.toLowerCase(), last = full.split(" ").slice(-1)[0];
      if (t.includes(full) || (last.length > 4 && t.includes(last) && isSignee(r.h.name))) { best = { pos, r, n: S.rows.length }; break; } }
    if (best) break; }
  if (!best && /why|rank/.test(t)) { const S = scored("qb"); const r = S.rows.find((x) => x.h.name === "Justyn Martin"); if (r) best = { pos: "qb", r, n: S.rows.length }; }
  return best;
}
function botSteps(q) {
  const t = q.toLowerCase(); const S = scored("qb"), D = scored("dl");
  const s = [`Heard: "${q}"`, `Loaded January 2026 data only (2024–25 seasons, portal records, reporting)${F.reveal ? " plus 2026 results (revealed)" : ""}`];
  if (/dl|defens|line|smith|walker|russaw/.test(t)) s.push(`Scored ${D.rows.length} defensive line transfers with the current weights`);
  else s.push(`Scored ${S.rows.length} quarterback and ${D.rows.length} defensive line transfers with the current weights`);
  if (/rank|uncertain|realistic|obtainable/.test(t)) s.push("Computed 80% rank ranges with reliability shrinkage");
  if (/starter|unavailable|risk|window/.test(t)) s.push("Ran the roster scenario with the current controls");
  if (/right|wrong|contribut/.test(t)) s.push(F.reveal ? "Compared January ranks with 2026 results" : "Checked for 2026 results: not loaded");
  s.push("Attached sources and listed what could not be checked");
  return s;
}
function botFace() {
  return `<div class="bot-emb" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="bot-ring" cx="24" cy="24" r="22"/><circle class="bot-arc" cx="24" cy="24" r="22"/></svg><span>E</span></div>`;
}
const botWave = () => `<span class="bot-wave" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i style="animation-delay:${(i * 70) % 300}ms"></i>`).join("")}</span>`;
function botSpotHTML(sp) {
  if (!sp) return "";
  const { r, n, pos } = sp; const L = (v) => ((v - 1) / Math.max(1, n - 1)) * 100;
  return `<div class="bot-spot"><div class="bot-spot-h"><b>${esc(r.h.name)}</b><span>${esc(r.h.origin || "")} · ${POS[pos].short}${r.h.rating != null ? ` · portal rating ${f(r.h.rating, 2)}` : ""}</span></div>
    <div class="bot-rank"><b>${r.rank}</b><span>of ${n}</span></div>
    <div class="bot-rbar" role="img" aria-label="Rank ${r.rank} of ${n}, 80% range ${r.lo} to ${r.hi}"><i class="rng" style="left:${L(r.lo)}%;width:${Math.max(1.5, L(r.hi) - L(r.lo))}%"></i><i class="pt" style="left:${L(r.rank)}%"></i></div>
    <div class="bot-rlab"><span>1 · best</span><span>80% range ${r.lo}–${r.hi}</span><span>${n}</span></div>
    <button class="fi-btn ghost" data-fiprof="${esc(r.h.name)}">Full profile</button></div>`;
}
function botPanel() {
  if (BOT.state === "idle" && !BOT.a) return `<div class="bot-hello"><div class="bot-k">Morning briefing</div><p class="bot-lead">Edge answers questions about the 2026 transfer class from the data available in January 2026, and shows its working, sources and gaps with every answer.</p>${briefingHTML(false)}</div>`;
  const steps = `<ol class="bot-steps">${BOT.steps.map((s, i) => `<li class="${i < BOT.stepOn ? "done" : i === BOT.stepOn ? "now" : "wait"}">${esc(s)}</li>`).join("")}</ol>`;
  if (!BOT.a) return `<div class="bot-k">Question</div><div class="bot-q">${esc(BOT.q)}</div>${steps}`;
  const a = BOT.a;
  return `<div class="bot-k">Question</div><div class="bot-q">${esc(BOT.q)}</div>
    <div class="bot-k">Answer</div><div class="bot-say">${esc(a.body)}</div>${botSpotHTML(BOT.spot)}
    ${a.calc.length ? `<div class="bot-work"><b>Working</b><ul>${a.calc.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
    <details class="bot-steps-d"><summary>Process log · ${BOT.steps.length} steps</summary>${steps}</details>
    ${a.src.length ? `<p class="fi-sub">Sources: ${src(a.src)}</p>` : ""}
    ${a.cant.length ? `<p class="fi-sub"><b>Could not check:</b> ${esc(a.cant.join("; "))}</p>` : ""}
    ${a.next.length ? `<p class="fi-sub"><b>Next investigation:</b> ${esc(a.next.join("; "))}</p>` : ""}
    <div class="fi-row">${BOT.go ? `<button class="fi-btn scarlet" data-figo="${BOT.go[0]}">${esc(BOT.go[1])}</button>` : ""}<button class="fi-btn" data-bot="replay">Say it again</button></div>`;
}
function botStage() {
  const sr = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  return `<div class="bot-stage ${BOT.state}" id="bot-stage">
    <div class="bot-con">
      <div class="bot-id">${botFace()}<div><div class="bot-nm">Edge <span>Football Intelligence Analyst</span></div><div class="bot-st" id="bot-st"><i></i>${BOTSTATE[BOT.state]}${botWave()}</div></div></div>
      <form id="bot-say" class="bot-type"><input id="bot-in" placeholder="Ask about the class, a replay or a scenario" aria-label="Question for Edge"><button class="fi-btn scarlet">Ask</button></form>
      <div class="bot-ctl">
        <button class="bot-mic ${BOT.state === "listening" ? "on" : ""}" data-bot="mic" title="${sr ? "Speak a question" : "Voice input not available in this browser"}" aria-label="${BOT.state === "listening" ? "Stop listening" : "Speak a question"}" ${sr ? "" : "disabled"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"/></svg></button>
        <button class="fi-btn ghost" data-bot="mute" aria-pressed="${BOT.muted}">${BOT.muted ? "Voice off" : "Voice on"}</button>
        ${BOT.state === "speaking" ? `<button class="fi-btn ghost" data-bot="stop">Stop</button>` : ""}
      </div>
      <div class="bot-heard" id="bot-heard">${BOT.state === "listening" ? esc(BOT.heard || "Listening…") : ""}</div>
    </div>
    <div class="bot-panel" id="bot-panel" aria-live="polite">${botPanel()}</div>
    <div class="bot-q-sec"><span class="fi-sub">Suggested questions</span><div class="bot-orbitq">${BOTQ.map((q) => `<button class="fi-chip" data-botask="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>
    ${BOT.hist.length ? `<div class="bot-hist"><span class="fi-sub">Earlier</span>${BOT.hist.slice(-5).reverse().map((q) => `<button class="bot-pill" data-botask="${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
  </div>`;
}
function pageBot() { return wrap(botStage()); }
function botPaint() {
  const st = document.querySelector("#bot-stage"); if (!st) return;
  st.className = `bot-stage ${BOT.state}`;
  const s = document.querySelector("#bot-st"); if (s) s.innerHTML = `<i></i>${BOTSTATE[BOT.state]}${botWave()}`;
  const p = document.querySelector("#bot-panel"); if (p) p.innerHTML = botPanel();
  const h = document.querySelector("#bot-heard"); if (h) h.textContent = BOT.state === "listening" ? BOT.heard || "Listening…" : "";
}
function botSpeak(text) {
  const ss = window.speechSynthesis;
  if (BOT.muted || !ss || typeof SpeechSynthesisUtterance === "undefined") { BOT.state = "answered"; return botPaint(); }
  try { ss.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.03; u.pitch = 1;
    const v = ss.getVoices().find((x) => /en-US/i.test(x.lang) && /Google|Samantha|Aaron|Daniel|Natural/i.test(x.name)) || ss.getVoices().find((x) => /^en/i.test(x.lang)); if (v) u.voice = v;
    u.onend = u.onerror = () => { if (BOT.state === "speaking") { BOT.state = "answered"; botPaint(); X && X.rerenderBot?.(); } };
    BOT.state = "speaking"; botPaint(); ss.speak(u);
    setTimeout(() => { if (BOT.state === "speaking" && !ss.speaking && !ss.pending) { BOT.state = "answered"; botPaint(); } }, 2500);
  } catch { BOT.state = "answered"; botPaint(); }
}
let botRun = 0;
function botAsk(q) {
  q = String(q || "").trim(); if (!q || !F.H) return;
  const run = ++botRun; window.speechSynthesis?.cancel();
  if (BOT.q && BOT.a) BOT.hist = [...BOT.hist.filter((x) => x !== BOT.q), BOT.q];
  BOT.q = q; BOT.a = null; BOT.spot = null; BOT.go = null; BOT.steps = botSteps(q); BOT.stepOn = 0; BOT.state = "thinking";
  if (!document.querySelector("#bot-stage")) { X.go("fi_bot"); } else X.render();
  const res = answer(q); const sp = botSpot(q); const go = botRoute(q);
  const tick = () => { if (run !== botRun) return; BOT.stepOn++; if (BOT.stepOn < BOT.steps.length) { botPaint(); setTimeout(tick, 380); }
    else { BOT.a = res; BOT.spot = sp; BOT.go = go; botPaint(); botSpeak(res.body); } };
  botPaint(); setTimeout(tick, 380);
  if (innerWidth < 860) setTimeout(() => document.querySelector("#bot-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
}
function botMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  if (BOT.rec) { try { BOT.rec.stop(); } catch {} return; }
  window.speechSynthesis?.cancel();
  const r = new SR(); r.lang = "en-US"; r.interimResults = true; r.maxAlternatives = 1; BOT.rec = r; BOT.heard = ""; BOT.state = "listening"; botPaint();
  r.onresult = (e) => { BOT.heard = Array.from(e.results).map((x) => x[0].transcript).join(" "); botPaint(); };
  r.onerror = (e) => { BOT.rec = null; BOT.state = BOT.a ? "answered" : "idle"; botPaint(); X.toast(e.error === "not-allowed" ? "Microphone permission was blocked" : "Did not catch that. Try again or tap a question"); };
  r.onend = () => { const said = BOT.heard; BOT.rec = null; if (said.trim()) botAsk(said); else { BOT.state = BOT.a ? "answered" : "idle"; botPaint(); } };
  try { r.start(); } catch { BOT.rec = null; BOT.state = "idle"; botPaint(); }
}
function bindBot() {
  document.addEventListener("click", (e) => {
    const t = e.target; const b = t.closest("[data-bot]"); const q = t.closest("[data-botask]");
    if (q) { e.preventDefault(); return botAsk(q.dataset.botask); }
    if (!b) return; const a = b.dataset.bot;
    if (a === "mic") return botMic();
    if (a === "mute") { BOT.muted = !BOT.muted; if (BOT.muted) { window.speechSynthesis?.cancel(); if (BOT.state === "speaking") BOT.state = "answered"; } return X.render(); }
    if (a === "stop") { window.speechSynthesis?.cancel(); BOT.state = "answered"; return botPaint(); }
    if (a === "replay" && BOT.a) return botSpeak(BOT.a.body);
  });
  document.addEventListener("submit", (e) => { if (e.target.id !== "bot-say") return; e.preventDefault(); const i = document.querySelector("#bot-in"); const v = i?.value || ""; if (i) i.value = ""; botAsk(v); });
  window.addEventListener("hashchange", () => { if (!location.hash.includes("fi_bot")) { window.speechSynthesis?.cancel(); if (BOT.state === "speaking") BOT.state = "answered"; } });
}

const G = (fn) => (...a) => (F.H ? fn(...a) : wrap(""));
export const V11PAGES = Object.fromEntries(Object.entries({ fi_bot: pageBot, fi_tour: pageTour, fi_class: pageClass, fi_qb: () => replayPage("qb"), fi_dl: () => replayPage("dl"), fi_scen: pageScen, fi_learn: pageLearn, fi_cos: pageCos, fi_pos: pagePos, fi_board: pageBoard, fi_evidence: pageEvidence }).map(([k, fn]) => [k, G(fn)]));

// ---------------- events ----------------
function rerenderLive(pos) { const el = document.querySelector(`#fi-live-${pos}`); if (el) { el.innerHTML = liveBlock(pos); const fu = document.querySelector(`#fi-funnel-${pos}`); if (fu) fu.outerHTML = funnelHTML(pos); } else X.render(); }
export function bindV11(ctx) {
  X = ctx; load(); bindBot(); bindCoach();
  document.addEventListener("click", async (e) => {
    const t = e.target;
    const fi = t.closest("[data-fi]");
    if (fi) { const a = fi.dataset.fi;
      if (a === "reveal") { await reveal(); return X.render(); }
      if (a === "hide") { F.reveal = false; X.toast("2026 results hidden"); return X.render(); }
      if (a === "close") { F.prof = null; return X.render(); }
      if (a === "bclear") { F.board = null; F.boardName = ""; F.boardIssues = []; X.toast("Board cleared from memory"); return X.render(); }
      if (a === "braw") { F.boardRaw = !F.boardRaw; return X.render(); }
    }
    const pr = t.closest("[data-fiprof]"); if (pr) { F.prof = pr.dataset.fiprof; return X.render(); }
    if (t.classList?.contains("fi-drawer")) { F.prof = null; return X.render(); }
    const c = t.closest("[data-ficmp]"); if (c && !t.closest("a")) { const [pos, n] = c.dataset.ficmp.split(/:(.+)/); const L = F.cmp[pos] || []; F.cmp[pos] = L.includes(n) ? L.filter((x) => x !== n) : [...L, n].slice(-3); return rerenderLive(pos); }
    const rl = t.closest("[data-fireal]"); if (rl) { const [pos, v] = rl.dataset.fireal.split(":"); F.realOnly[pos] = v === "1"; return rerenderLive(pos); }
    const pre = t.closest("[data-fipre]"); if (pre) { const [pos, p] = pre.dataset.fipre.split(/:(.+)/); const v = PRESETS[pos][p]; if (v) F.w[pos] = { ...v }; else delete F.w[pos]; X.toast(`Weights: ${p}`); return X.render(); }
    const ps = t.closest("[data-fipos]"); if (ps) { F.posTab = ps.dataset.fipos; return X.render(); }
    const bp = t.closest("[data-fibpos]"); if (bp) { F.boardPos = bp.dataset.fibpos; return X.render(); }
    const sc = t.closest("[data-fiscen]"); if (sc) { F.scen.mode = sc.dataset.fiscen; if (!location.hash.includes("fi_scen")) X.go("fi_scen"); return X.render(); }
    const gg = t.closest("[data-figo]"); if (gg) { if (gg.dataset.fimode) F.scen.mode = gg.dataset.fimode; X.go(gg.dataset.figo); return; }
    const ak = t.closest("[data-fiask]"); if (ak) { return botAsk(ak.dataset.fiask); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && F.prof) { F.prof = null; X.render(); } if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-fiprof],[data-ficmp]")) { e.preventDefault(); e.target.click(); } });
  document.addEventListener("input", (e) => {
    const s = e.target.closest?.("[data-fiw]"); if (!s) return;
    const [pos, k] = s.dataset.fiw.split(":"); F.w[pos] = { ...weights(pos), [k]: +s.value };
    const w = weights(pos); const tot = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    document.querySelectorAll(`[data-fiwv^="${pos}:"]`).forEach((el) => { const kk = el.dataset.fiwv.split(":")[1]; el.textContent = Math.round((w[kk] / tot) * 100) + "%"; });
    clearTimeout(bindV11.t); bindV11.t = setTimeout(() => rerenderLive(pos), 60);
  });
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.dataset?.fiw) { const pos = t.dataset.fiw.split(":")[0]; return X.render(); }
    if (t.dataset?.fis) { const k = t.dataset.fis; F.scen[k] = k === "start" || k === "ready" ? Math.max(k === "ready" ? 50 : 1, +t.value || 300) : t.value; return X.render(); }
    if (t.dataset?.figone) { const n = t.dataset.figone; F.scen.gone = t.checked ? [...F.scen.gone, n] : F.scen.gone.filter((x) => x !== n); return X.render(); }
    if (t.dataset?.fidlout) { const n = t.dataset.fidlout; F.scen.dlOut = t.checked ? [...F.scen.dlOut, n] : F.scen.dlOut.filter((x) => x !== n); return X.render(); }
    if (t.id === "fi-file" && t.files?.[0]) {
      const file = t.files[0];
      try { const r = await readBoard(file); F.board = r.rows; F.boardName = file.name; F.boardIssues = validate(r.rows); const pos = r.rows.map((x) => MOD[String(x.position).toUpperCase()]).find(Boolean); if (pos) F.boardPos = pos; X.toast(`Loaded ${r.rows.length} rows · held in this tab only`); }
      catch (err) { X.toast("Could not read the board: " + err.message); }
      return X.render();
    }
  });
  document.addEventListener("submit", (e) => { if (e.target.id !== "fi-say") return; e.preventDefault(); const i = document.querySelector("#fi-in"); ask(i?.value || ""); X.render(); setTimeout(() => { const ch = document.querySelector("#fi-chat"); if (ch) ch.scrollTop = ch.scrollHeight; document.querySelector("#fi-in")?.focus(); }, 30); });
}
export const fiTest = { F, BOT, COACH, L, coachParse, coachApply, botAsk, answer, scored, cohortTest };
