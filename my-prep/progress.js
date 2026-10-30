/* SAA progress layer — one file shared by every page of the site.
 *
 * 1. Watches the localStorage keys that the playbooks, studybook, Mock Exam A,
 *    simulator and dashboard already write, and stamps each change with a time.
 * 2. Optionally syncs those keys to a JSON file in a GitHub repo (default:
 *    progress/progress.json in this repo) through the GitHub Contents API, using a
 *    fine-grained token that never leaves this browser. Newest value per key wins.
 * 3. Builds a summary + a Markdown report that Claude can read from the repo.
 *
 * No server, no build step. Pages include it with <script src=".../my-prep/progress.js"></script>.
 */
(function () {
  "use strict";
  if (window.SAAProgress) return;

  const SCRIPT = document.currentScript;
  const BASE = new URL(".", SCRIPT ? SCRIPT.src : location.href).href; // .../my-prep/
  const SHOW_BAR = !(SCRIPT && SCRIPT.dataset.bar === "off");

  const TRACK = [
    /^(fndpb|iampb|secpb|netpb|stopb|ec2pb|srvpb|dbpb|intpb|monpb|migpb|anapb|archpb|costpb):/,
    /^saa-studybook-v1$/, /^saa-flash-v1$/, /^saa-mockA-(v1|history)$/,
    /^saa-c03-(history-v1|qstats-v1|reviews-v1)$/, /^saa-dash-v1$/
  ];
  const CFG = "saa-sync-config", META = "saa-sync-meta", TIMES = "saa-sync-times", HASH = "saa-sync-hashes";
  const DEFAULT_CFG = { owner: "aminghuf", repo: "aws-certified-solutions-architect-associate-saa-c03", branch: "main", path: "progress/progress.json", token: "", device: "", auto: true };

  const LS = window.localStorage;
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  const tracked = k => TRACK.some(r => r.test(k));
  const jget = (k, d) => { try { const v = LS.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const jset = (k, v) => { try { rawSet.call(LS, k, JSON.stringify(v)); } catch (e) {} };

  let times = jget(TIMES, {}), hashes = jget(HASH, {});
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + ":" + s.length; };
  let pushTimer = null, busy = false, listeners = [];

  /* ---------- change tracking ---------- */
  function touch(k) {
    times[k] = Date.now(); jset(TIMES, times);
    const v = LS.getItem(k); if (v === null) delete hashes[k]; else hashes[k] = fnv(v); jset(HASH, hashes);
    const m = meta(); m.dirty = true; setMeta(m);
    schedulePush(); emit();
  }
  Storage.prototype.setItem = function (k, v) {
    const old = this === LS ? LS.getItem(k) : null;
    rawSet.call(this, k, v);
    if (this === LS && tracked(k) && old !== String(v)) touch(k);
  };
  Storage.prototype.removeItem = function (k) {
    const had = this === LS && LS.getItem(k) !== null;
    rawRemove.call(this, k);
    if (had && tracked(k)) touch(k);
  };

  // Catch writes that happened before this script loaded (pages write on boot) or in another tab.
  function scan() {
    const keys = new Set(Object.keys(hashes));
    for (let i = 0; i < LS.length; i++) { const k = LS.key(i); if (tracked(k)) keys.add(k); }
    keys.forEach(k => { const v = LS.getItem(k); const h = v === null ? undefined : fnv(v); if (h !== hashes[k]) touch(k); });
  }

  function config() { return Object.assign({}, DEFAULT_CFG, jget(CFG, {})); }
  function setConfig(c) { jset(CFG, Object.assign(config(), c)); emit(); }
  function meta() { return jget(META, {}); }
  function setMeta(m) { jset(META, m); }
  function syncReady() { const c = config(); return !!(c.token && c.owner && c.repo && c.path); }

  /* ---------- snapshot / merge ---------- */
  function snapshot() {
    scan();
    const out = {};
    for (let i = 0; i < LS.length; i++) {
      const k = LS.key(i);
      if (tracked(k)) out[k] = { v: LS.getItem(k), t: times[k] || 0 };
    }
    Object.keys(times).forEach(k => { if (tracked(k) && !(k in out)) out[k] = { v: null, t: times[k] }; });
    return out;
  }
  function merge(a, b) {
    const out = Object.assign({}, a);
    Object.keys(b || {}).forEach(k => { if (!out[k] || (b[k].t || 0) > (out[k].t || 0)) out[k] = b[k]; });
    return out;
  }
  // Write remote values that are newer than ours. Returns the keys changed.
  function applyRemote(data) {
    const changed = [];
    Object.keys(data || {}).forEach(k => {
      if (!tracked(k)) return;
      const r = data[k], lt = times[k] || 0;
      if ((r.t || 0) <= lt) return;
      if (r.v === null) { rawRemove.call(LS, k); delete hashes[k]; } else { rawSet.call(LS, k, r.v); hashes[k] = fnv(r.v); }
      times[k] = r.t; changed.push(k);
    });
    if (changed.length) { jset(TIMES, times); jset(HASH, hashes); }
    return changed;
  }

  /* ---------- GitHub contents API ---------- */
  function b64encode(str) {
    const bytes = new TextEncoder().encode(str); let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, "")); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function api(path, opt) {
    const c = config();
    const headers = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (c.token) headers.Authorization = "Bearer " + c.token;
    if (opt && opt.body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + path, Object.assign({ headers, cache: "no-store" }, opt));
  }
  function filePath() { return "/contents/" + config().path.split("/").map(encodeURIComponent).join("/"); }
  async function fetchRemote() {
    const c = config();
    const res = await api(filePath() + "?ref=" + encodeURIComponent(c.branch));
    if (res.status === 404) return { sha: null, doc: null };
    if (!res.ok) throw new Error("GitHub " + res.status + ": " + (await res.text()).slice(0, 160));
    const j = await res.json();
    let text = j.content ? b64decode(j.content) : "";
    if (!text && j.sha && j.size) { // > 1 MB: fetch the blob
      const r2 = await api("/git/blobs/" + j.sha); const b = await r2.json(); text = b64decode(b.content);
    }
    return { sha: j.sha, doc: text ? JSON.parse(text) : null };
  }

  async function pull() {
    if (!syncReady()) throw new Error("Sync is not set up");
    const { sha, doc } = await fetchRemote();
    const changed = doc ? applyRemote(doc.data) : [];
    const m = meta(); m.lastPull = Date.now(); m.sha = sha; m.error = ""; setMeta(m); emit();
    return changed;
  }

  async function push(reason) {
    if (!syncReady() || busy) return false;
    busy = true; emit();
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { sha, doc } = await fetchRemote();
        if (doc) applyRemote(doc.data);
        const data = merge(doc ? doc.data : {}, snapshot());
        const summary = await buildSummary(data);
        const c = config();
        const body = {
          schema: 1, updatedAt: new Date().toISOString(), device: c.device || deviceName(),
          summary, report_md: report(summary), data
        };
        const res = await api(filePath(), { method: "PUT", body: JSON.stringify({
          message: "progress: " + (reason || "sync") + " (" + (c.device || deviceName()) + ")",
          content: b64encode(JSON.stringify(body, null, 1)), branch: c.branch, sha: sha || undefined
        }) });
        if (res.status === 409 || res.status === 422) continue; // someone else pushed: merge again
        if (!res.ok) throw new Error("GitHub " + res.status + ": " + (await res.text()).slice(0, 160));
        const j = await res.json();
        const m = meta(); m.lastPush = Date.now(); m.lastPull = Date.now(); m.sha = j.content && j.content.sha; m.dirty = false; m.error = ""; setMeta(m);
        return true;
      }
      throw new Error("Could not save after retrying (conflict)");
    } catch (e) {
      const m = meta(); m.error = String(e.message || e); setMeta(m); throw e;
    } finally { busy = false; emit(); }
  }
  // Auto-save at most once per hour: the first change after a save starts the clock,
  // later changes ride along. The Sync button always saves immediately.
  const INTERVAL = 60 * 60 * 1000;
  const nextDue = () => (meta().lastPush || 0) + INTERVAL;
  function schedulePush() {
    if (!syncReady() || config().auto === false || pushTimer) return;
    pushTimer = setTimeout(() => { pushTimer = null; if (meta().dirty) push("hourly").catch(() => {}); }, Math.max(0, nextDue() - Date.now()));
  }
  function deviceName() {
    const u = navigator.userAgent;
    const os = /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Mac/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : /Linux/.test(u) ? "Linux" : "device";
    const br = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "browser";
    return br + " on " + os;
  }

  /* ---------- plan + summary ---------- */
  let planP = null;
  function ensurePlan() {
    if (window.PLAN && window.PLAYBOOKS) return Promise.resolve();
    if (!planP) planP = new Promise(res => { const s = document.createElement("script"); s.src = BASE + "plan.js"; s.onload = s.onerror = () => res(); document.head.appendChild(s); });
    return planP;
  }
  const parse = (data, k, d) => { try { return data[k] && data[k].v !== null ? JSON.parse(data[k].v) : d; } catch (e) { return d; } };
  function today() { const d = new Date(), p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

  async function buildSummary(data) {
    await ensurePlan();
    data = data || snapshot();
    const PLAN = window.PLAN || [], PB = window.PLAYBOOKS || [], MODS = window.MODULES || [];
    const sb = parse(data, "saa-studybook-v1", { tasks: {}, conf: {}, q: {}, mocks: [] });
    const dash = parse(data, "saa-dash-v1", { mocks: [], log: [], conf: {}, notes: "" });
    const t = today();
    const days = PLAN.map((d, i) => {
      const done = d.tasks.filter((_, j) => sb.tasks && sb.tasks[d.date + ":" + j]).length;
      return { day: i + 1, date: d.date, label: d.label, title: d.title, kind: d.kind, done, total: d.tasks.length,
        open: d.tasks.filter((_, j) => !(sb.tasks && sb.tasks[d.date + ":" + j])) };
    });
    const playbooks = PB.map(p => {
      const g = k => parse(data, p.prefix + ":" + k, null);
      const qr = g("qr") || [], gr = g("gr") || [], seen = g("seen") || [];
      return { id: p.id, title: p.title, module: p.module, lessonsSeen: seen.length, lessons: p.lessons,
        quizAnswered: qr.length, quizCorrect: qr.filter(Boolean).length, quizTotal: p.quiz,
        quizPct: qr.length ? Math.round(qr.filter(Boolean).length / qr.length * 100) : null,
        gameAnswered: gr.length, gameCorrect: gr.filter(Boolean).length };
    });
    // mocks from every source
    const mocks = [];
    (dash.mocks || []).forEach(m => mocks.push({ date: m.date, source: m.source || "External", pct: +m.pct, domains: m.domains || null, note: m.note || "" }));
    (sb.mocks || []).forEach(m => mocks.push({ date: (m.d || "").slice(0, 10), source: "Studybook mock", pct: m.p }));
    (parse(data, "saa-mockA-history", []) || []).forEach(m => mocks.push({ date: new Date(m.date).toISOString().slice(0, 10), source: "Mock Exam A", pct: m.pct }));
    (parse(data, "saa-c03-history-v1", []) || []).forEach(m => { if (m.total >= 30) mocks.push({ date: new Date(m.date).toISOString().slice(0, 10), source: "Simulator: " + (m.title || "exam"), pct: m.pct, byModule: m.byDomain || null }); });
    mocks.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    // studybook question accuracy by module (ids start with the module number)
    const byMod = {};
    Object.keys(sb.q || {}).forEach(id => {
      const mm = /^(\d\d)-/.exec(id); if (!mm) return; const r = sb.q[id];
      const o = byMod[mm[1]] || (byMod[mm[1]] = { c: 0, s: 0, q: 0 }); o.c += r.c; o.s += r.s; o.q++;
    });
    const modules = MODS.map(([n, name]) => {
      const o = byMod[n]; const pbs = playbooks.filter(p => p.module === n && p.quizPct !== null);
      return { module: n, name, confidence: (dash.conf || {})[n] || null,
        practiceAnswered: o ? o.s : 0, practicePct: o && o.s ? Math.round(o.c / o.s * 100) : null,
        playbookQuizPct: pbs.length ? Math.round(pbs.reduce((a, p) => a + p.quizPct, 0) / pbs.length) : null };
    });
    const weak = modules.map(m => ({ m, score: [m.practicePct, m.playbookQuizPct, m.confidence ? m.confidence * 33 : null].filter(x => x !== null) }))
      .filter(x => x.score.length).map(x => ({ module: x.m.module, name: x.m.name, score: Math.round(x.score.reduce((a, b) => a + b, 0) / x.score.length) }))
      .sort((a, b) => a.score - b.score).slice(0, 3);
    const exam = window.EXAM_DATE || "2026-11-10";
    const daysLeft = Math.round((new Date(exam + "T00:00:00") - new Date(t + "T00:00:00")) / 864e5);
    const tasksDone = days.reduce((a, d) => a + d.done, 0), tasksTotal = days.reduce((a, d) => a + d.total, 0);
    const recent = mocks.slice(-3).map(m => m.pct);
    return {
      generatedAt: new Date().toISOString(), today: t, examDate: exam, daysLeft,
      plan: { tasksDone, tasksTotal, overdue: days.filter(d => d.date < t && d.done < d.total).map(d => ({ date: d.date, title: d.title, open: d.open })), today: days.find(d => d.date === t) || null, days: days.map(({ open, ...d }) => d) },
      mocks, mockStats: { count: mocks.length, best: mocks.length ? Math.max(...mocks.map(m => m.pct)) : null, last3avg: recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null, target: window.MOCK_TARGET || 75 },
      playbooks, modules, weakest: weak, flashcards: (() => { const f = parse(data, "saa-flash-v1", { cards: {} }).cards || {}, v = Object.values(f);
        return { rated: v.length, got: v.filter(x => x.r === "g").length, again: v.filter(x => x.r === "a").length }; })(),
      log: (dash.log || []).slice(-14), notes: dash.notes || ""
    };
  }

  function report(s) {
    const L = [];
    L.push(`# SAA-C03 progress — ${s.today}`, "");
    L.push(`Exam ${s.examDate} · **${s.daysLeft} days left** · plan tasks ${s.plan.tasksDone}/${s.plan.tasksTotal}`, "");
    if (s.plan.today) L.push(`**Today (${s.plan.today.label}):** ${s.plan.today.title} — ${s.plan.today.done}/${s.plan.today.total} tasks done`, "");
    if (s.plan.overdue.length) { L.push("**Behind on:**"); s.plan.overdue.forEach(d => L.push(`- ${d.date} ${d.title}: ${d.open.join("; ")}`)); L.push(""); }
    L.push("## Mocks");
    if (!s.mocks.length) L.push("- none yet");
    s.mocks.forEach(m => L.push(`- ${m.date} · ${m.source} · **${m.pct}%**` + (m.domains ? ` · Secure ${m.domains.secure ?? "?"} / Resilient ${m.domains.resilient ?? "?"} / Performant ${m.domains.performant ?? "?"} / Cost ${m.domains.cost ?? "?"}` : "") + (m.note ? ` · ${m.note}` : "")));
    L.push(`- Last-3 average: ${s.mockStats.last3avg ?? "—"}% (target ≥ ${s.mockStats.target}%)`, "");
    L.push("## Playbooks", "| Playbook | Lessons | Quiz | Game |", "|---|---|---|---|");
    s.playbooks.forEach(p => L.push(`| ${p.title} | ${p.lessonsSeen}/${p.lessons} | ${p.quizAnswered ? p.quizCorrect + "/" + p.quizAnswered + " (" + p.quizPct + "%)" : "—"} | ${p.gameAnswered ? p.gameCorrect + "/" + p.gameAnswered : "—"} |`));
    if (s.flashcards && s.flashcards.rated) L.push("", `**Flashcards (md decks):** ${s.flashcards.got} got it · ${s.flashcards.again} again · ${s.flashcards.rated} rated`);
    L.push("", "## Modules", "| # | Module | Confidence | Practice | Playbook quiz |", "|---|---|---|---|---|");
    s.modules.forEach(m => L.push(`| ${m.module} | ${m.name} | ${m.confidence ? ["", "low", "medium", "high"][m.confidence] : "—"} | ${m.practicePct !== null ? m.practicePct + "% of " + m.practiceAnswered : "—"} | ${m.playbookQuizPct !== null ? m.playbookQuizPct + "%" : "—"} |`));
    if (s.weakest.length) L.push("", "**Weakest right now:** " + s.weakest.map(w => `${w.name} (${w.score})`).join(", "));
    if (s.log.length) { L.push("", "## Recent days"); s.log.forEach(d => L.push(`- ${d.date}: SAA ${d.saa || 0} h, chess ${d.chess || 0} h${d.note ? " — " + d.note : ""}`)); }
    if (s.notes) L.push("", "## Notes for Claude", s.notes);
    return L.join("\n");
  }

  /* ---------- export / import ---------- */
  function exportJSON() { return JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), data: snapshot() }, null, 1); }
  function importJSON(text) {
    const doc = JSON.parse(text), d = doc.data || {};
    // An imported backup is an explicit choice: take its values even when the stamps are older.
    const now = Date.now(), forced = {};
    Object.keys(d).forEach(k => { if (tracked(k)) forced[k] = { v: d[k].v, t: Math.max(d[k].t || 0, (times[k] || 0) + 1, now) }; });
    const ch = applyRemote(forced);
    if (ch.length) { const m = meta(); m.dirty = true; setMeta(m); schedulePush(); }
    emit(); return ch;
  }

  /* ---------- mini status bar ---------- */
  function ago(ms) { if (!ms) return "never"; const s = (Date.now() - ms) / 1000; return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " d ago"; }
  function status() {
    const m = meta();
    if (!syncReady()) return { cls: "local", text: "Saved in this browser", hint: "Set up sync" };
    if (busy) return { cls: "busy", text: "Syncing…" };
    if (m.error) return { cls: "err", text: "Sync error", hint: m.error };
    if (m.dirty) { const t = new Date(Math.max(Date.now(), nextDue())); return { cls: "dirty", text: "Unsaved · auto-save " + (t - Date.now() < 60000 ? "now" : String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0")), hint: "Press Sync to save now" }; }
    return { cls: "ok", text: "Synced " + ago(m.lastPush || m.lastPull) };
  }
  function emit() { listeners.forEach(f => { try { f(status()); } catch (e) {} }); }
  function bar() {
    if (!SHOW_BAR || document.getElementById("saa-sync-bar")) return;
    const css = document.createElement("style");
    css.textContent = `#saa-sync-bar{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:50;display:flex;gap:6px;align-items:center;font:500 12px/1 system-ui,-apple-system,sans-serif;background:rgba(18,26,46,.9);color:#fff;border-radius:999px;padding:6px 6px 6px 10px;box-shadow:0 4px 16px rgba(0,0,0,.2)}
#saa-sync-bar a,#saa-sync-bar button{color:#fff;text-decoration:none;background:rgba(255,255,255,.12);border:0;border-radius:999px;padding:5px 9px;font:inherit;cursor:pointer}
#saa-sync-bar a:hover,#saa-sync-bar button:hover{background:rgba(255,255,255,.22)}
#saa-sync-bar i{width:8px;height:8px;border-radius:50%;display:inline-block;background:#9aa4b8}
#saa-sync-bar i.ok{background:#4cc38a}#saa-sync-bar i.dirty,#saa-sync-bar i.busy{background:#f0b44c}#saa-sync-bar i.err{background:#ff7b6f}
@media print{#saa-sync-bar{display:none}}`;
    document.head.appendChild(css);
    const el = document.createElement("div"); el.id = "saa-sync-bar"; el.setAttribute("role", "status");
    document.body.appendChild(el);
    const draw = s => { el.innerHTML = `<i class="${s.cls}"></i><span title="${(s.hint || "").replace(/"/g, "&quot;")}">${s.text}</span>` +
      (syncReady() ? `<button type="button" data-a="sync">Sync</button>` : "") + `<a href="${BASE}index.html${syncReady() ? "" : "#sync"}">Dashboard</a>`; };
    el.addEventListener("click", e => { const b = e.target.closest("[data-a=sync]"); if (b) syncNow().catch(() => {}); });
    listeners.push(draw); draw(status());
    setInterval(() => draw(status()), 30000);
  }

  async function syncNow() { const ch = await pull(); await push("manual"); return ch; }

  /* ---------- boot: pull newer progress, reload once if this page's data changed ---------- */
  async function boot() {
    scan();
    if (!syncReady()) return;
    try {
      const changed = await pull();
      if (changed.length) {
        const key = "saa-sync-reloaded";
        const last = +(sessionStorage.getItem(key) || 0);
        if (Date.now() - last > 15000) { sessionStorage.setItem(key, String(Date.now())); location.reload(); return; }
      }
      if (meta().dirty) schedulePush();
    } catch (e) { emit(); }
  }
  // Leaving the page saves only if the hourly save is already due (otherwise the next visit, on any page, catches up).
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && meta().dirty && syncReady() && config().auto !== false && Date.now() >= nextDue()) { clearTimeout(pushTimer); pushTimer = null; push("hourly").catch(() => {}); } });

  window.SAAProgress = { config, setConfig, syncReady, pull, push, syncNow, snapshot, buildSummary, report, exportJSON, importJSON, status, onStatus: f => { listeners.push(f); f(status()); }, meta, BASE };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { bar(); boot(); }); else { bar(); boot(); }
})();
