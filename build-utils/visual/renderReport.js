// Renders the screen × run matrix as a single self-contained HTML page: one row
// per screen, one column per platform/device, so a whole matrix run can be
// scanned side by side for anything that looks odd. Images are referenced by
// relative path rather than embedded — the page sits at the root of the captures
// tree and travels with it as one CI artifact, and inlining a few hundred
// screenshots would make it far too big to open.
//
// No network references: it has to open straight out of a downloaded artifact.

const STATUS_ORDER = ["fail", "missing", "new", "absent", "updated", "pass"];

// A run that captured nothing still gets a page — see buildReport.
const EMPTY_ROW = `<tr><td class="nothing">No screens were captured.</td></tr>`;

function esc(text) {
    return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function worstStatus(cells) {
    return STATUS_ORDER.find((status) => cells.some((c) => c.status === status)) || "pass";
}

function cellNote(cell) {
    if (cell.status === "fail") {
        const pixels = cell.diffPixels != null ? `${cell.diffPixels.toLocaleString("en")} px` : "differs";
        return cell.dimensionsMatch === false ? "size changed" : pixels;
    }
    if (cell.status === "absent") return "not captured";
    if (cell.status === "missing") return "capture failed";
    if (cell.status === "new") return "no baseline";
    return "";
}

function renderCell(cell) {
    const sources = Object.entries(cell.images)
        .map(([layer, src]) => ` data-src-${layer}="${esc(src)}"`).join("");
    const preferred = cell.images.actual || cell.images.baseline;
    const note = cellNote(cell);
    if (!preferred) {
        return `<td class="cell is-${esc(cell.status)}"><div class="empty">${esc(note || cell.status)}</div></td>`;
    }
    return `<td class="cell is-${esc(cell.status)}"><figure class="shot" tabindex="0"`
        + ` data-screen="${esc(cell.name)}" data-run="${esc(cell.runId)}" data-status="${esc(cell.status)}"${sources}>`
        + `<img loading="lazy" src="${esc(preferred)}" alt="${esc(cell.name)} on ${esc(cell.runId)}"`
        + ` onerror="this.closest('.shot').classList.add('is-broken')">`
        + `</figure>`
        + (note ? `<p class="note">${esc(note)}</p>` : "")
        + `</td>`;
}

function renderRow(screen) {
    return `<tr data-screen="${esc(screen.name)}" data-status="${esc(worstStatus(screen.cells))}">`
        + `<th scope="row"><span>${esc(screen.name)}</span></th>`
        + screen.cells.map(renderCell).join("")
        + `</tr>`;
}

// A column names the baseline set, the device that actually rendered it and when
// — so a run left over from an earlier session is obvious rather than read as
// part of the same matrix.
function renderHead(runs) {
    return `<tr><th class="corner" scope="col">Screen</th>`
        + runs.map((run) => `<th scope="col"><span class="platform">${esc(run.platform)}</span>`
            + `<span class="device">${esc(run.device)}</span>`
            + (run.deviceName ? `<span class="rendered-on">${esc(run.deviceName)}</span>` : "")
            + (run.capturedAt ? `<span class="captured-at">${esc(shortTime(run.capturedAt))}</span>` : "")
            + `</th>`).join("")
        + `</tr>`;
}

// "2026-08-26T02:39:47.801Z" -> "26 Aug 02:39"
function shortTime(iso) {
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) { return iso; }
    return at.toISOString().replace(/^\d{4}-(\d{2})-(\d{2})T(\d{2}:\d{2}).*$/, "$2/$1 $3");
}

function renderChips(summary) {
    return STATUS_ORDER
        .filter((status) => summary[status] > 0)
        .map((status) => `<span class="chip is-${status}">${summary[status]} ${status}</span>`)
        .join("");
}

export function renderReport(model, { title = "Visual regression review", generatedAt = "" } = {}) {
    const subtitle = [
        `${model.screens.length} screens`,
        `${model.runs.length} device${model.runs.length === 1 ? "" : "s"}`,
        generatedAt,
    ].filter(Boolean).join(" · ");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
  <div class="titles">
    <h1>${esc(title)}</h1>
    <p class="subtitle">${esc(subtitle)}</p>
  </div>
  <div class="chips">${renderChips(model.summary)}</div>
  <div class="controls">
    <div class="group" role="group" aria-label="Image layer">
      <button type="button" data-layer="actual" class="on">Capture</button>
      <button type="button" data-layer="baseline">Baseline</button>
      <button type="button" data-layer="diff">Diff</button>
    </div>
    <div class="group" role="group" aria-label="Filter">
      <button type="button" data-filter="all" class="on">All</button>
      <button type="button" data-filter="changed">Needs a look</button>
    </div>
    <label class="zoom">Size <input type="range" min="120" max="640" step="20" value="240"></label>
  </div>
</header>
<main>
<table class="gallery">
<thead>${renderHead(model.runs)}</thead>
<tbody>${model.screens.length ? model.screens.map(renderRow).join("\n") : EMPTY_ROW}</tbody>
</table>
</main>
<div class="lightbox" hidden>
  <div class="lightbox-bar">
    <strong class="lightbox-title"></strong>
    <span class="lightbox-hint">← → devices · ↑ ↓ screens · Esc close</span>
    <button type="button" class="close" aria-label="Close">✕</button>
  </div>
  <div class="lightbox-panes"></div>
</div>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

const STYLE = `
:root {
  --bg: #f6f7f9; --panel: #fff; --ink: #14181d; --muted: #5f6b7a; --line: #dfe3e8;
  --pass: #2f9e5e; --fail: #d64545; --new: #2f6fd0; --missing: #b9761f; --absent: #8a94a2; --updated: #6b4fd0;
  --shadow: 0 1px 3px rgba(16,22,30,.12);
  --w: 240px; --head-h: 84px; --letterbox: #e9edf1;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14181d; --panel: #1b2027; --ink: #e8ecf1; --muted: #97a2b0; --line: #2b323b;
    --pass: #4cc07d; --fail: #ff6b6b; --new: #6ba4ff; --missing: #e0a34c; --absent: #7d879a; --updated: #a98cff;
    --shadow: 0 1px 3px rgba(0,0,0,.45);
    --letterbox: #10141a;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; height: 100vh; display: flex; flex-direction: column; overflow: hidden;
  background: var(--bg); color: var(--ink);
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
header {
  flex: none; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center;
  padding: 12px 20px; background: var(--panel); border-bottom: 1px solid var(--line);
  box-shadow: var(--shadow); z-index: 5;
}
.titles { margin-right: auto; }
h1 { margin: 0; font-size: 16px; letter-spacing: .01em; }
.subtitle { margin: 2px 0 0; color: var(--muted); font-size: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600;
  color: #fff; background: var(--absent);
}
.chip.is-pass { background: var(--pass); } .chip.is-fail { background: var(--fail); }
.chip.is-new { background: var(--new); } .chip.is-missing { background: var(--missing); }
.chip.is-updated { background: var(--updated); } .chip.is-absent { background: var(--absent); }
.controls { display: flex; align-items: center; gap: 16px; }
.group { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.group button {
  border: 0; padding: 5px 12px; font: inherit; font-size: 12px; cursor: pointer;
  background: transparent; color: var(--muted);
}
.group button + button { border-left: 1px solid var(--line); }
.group button.on { background: var(--ink); color: var(--panel); }
.zoom { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
/* main is the scroll container in both axes, so the sticky header row and the
   sticky screen-name column both anchor to it rather than to the page. */
main { flex: 1; overflow: auto; padding: 0 20px 8px; }
/* macOS hides overlay scrollbars until you scroll, which leaves no hint that the
   matrix continues off-screen — styling the pseudo-elements forces the classic
   always-on pair, with the horizontal one pinned to the bottom of the frame.
   Deliberately not paired with the standard scrollbar-color/scrollbar-width:
   setting either makes Chrome ignore these rules and fall back to overlay. */
main::-webkit-scrollbar { width: 14px; height: 14px; }
main::-webkit-scrollbar-track { background: var(--bg); }
main::-webkit-scrollbar-thumb { background: var(--muted); border: 4px solid var(--bg); border-radius: 7px; }
main::-webkit-scrollbar-thumb:hover { background: var(--ink); }
main::-webkit-scrollbar-corner { background: var(--bg); }
.gallery { border-collapse: separate; border-spacing: 0; }
.gallery th { font-weight: 600; text-align: left; }
thead th {
  position: sticky; top: 0; z-index: 3; height: var(--head-h); padding: 8px 10px;
  background: var(--bg); border-bottom: 1px solid var(--line); vertical-align: bottom;
}
thead .platform { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
thead .device { display: block; font-size: 13px; }
thead .rendered-on, thead .captured-at { display: block; font-size: 11px; font-weight: 400; color: var(--muted); }
thead th.corner, tbody th { position: sticky; left: 0; z-index: 2; background: var(--bg); }
thead th.corner { z-index: 4; }
tbody th { padding: 8px 14px 8px 0; vertical-align: top; white-space: nowrap; }
tbody th span { position: sticky; top: var(--head-h); display: block; }
tbody tr[data-status="fail"] th span { color: var(--fail); }
td.cell { padding: 4px 4px 10px; vertical-align: top; }
/* Every cell is the same box, whatever the device's aspect ratio — a ragged grid
   is much harder to scan than a letterboxed one, and letterboxing keeps each
   capture undistorted. */
.shot {
  margin: 0; display: grid; place-items: center; cursor: zoom-in; border-radius: 6px;
  width: var(--w); aspect-ratio: 16 / 9;
  border: 2px solid transparent; background: var(--letterbox); box-shadow: var(--shadow); overflow: hidden;
}
.shot:focus-visible { outline: 2px solid var(--new); outline-offset: 2px; }
.shot img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
/* Dimmed when the chosen layer doesn't exist for this screen and we fell back —
   on the Diff layer that leaves only the screens that actually differ lit up. */
.shot.is-fallback img { opacity: .25; }
/* A page opened away from its captures (a half-downloaded artifact, a moved
   folder) would otherwise show the browser's broken-image glyph, which reads as
   "this screen rendered wrong" rather than "this file isn't here". */
.shot.is-broken img { display: none; }
.shot.is-broken::after {
  content: "image not in this folder"; padding: 0 8px; text-align: center;
  color: var(--muted); font-size: 11px;
}
.is-fail .shot { border-color: var(--fail); }
.is-new .shot { border-color: var(--new); }
.is-missing .shot { border-color: var(--missing); }
/* The note sits under the shot, never over it — an overlay would hide the very
   corner of the screen you are checking. */
.note { margin: 4px 2px 0; font-size: 11px; font-weight: 600; color: var(--muted); }
.is-fail .note { color: var(--fail); }
.is-new .note { color: var(--new); }
.is-missing .note { color: var(--missing); }
.nothing { padding: 40px 0; color: var(--muted); }
.empty {
  display: grid; place-items: center; width: var(--w); aspect-ratio: 16 / 9;
  border: 1px dashed var(--line); border-radius: 6px; color: var(--muted); font-size: 12px;
}
.lightbox {
  position: fixed; inset: 0; z-index: 20; display: flex; flex-direction: column;
  background: #0a0d11; color: #f2f5f8;
}
.lightbox[hidden] { display: none; }
.lightbox-bar { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid #2b323b; }
.lightbox-hint { margin-right: auto; color: #97a2b0; font-size: 12px; }
.lightbox .close { border: 0; background: transparent; color: inherit; font-size: 18px; cursor: pointer; }
.lightbox-panes { flex: 1; display: flex; align-items: center; gap: 12px; padding: 16px; overflow: auto; }
.pane { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.pane h2 { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: #97a2b0; }
.pane img { width: 100%; height: auto; border-radius: 4px; background: #000; }
`;

const SCRIPT = `
(function () {
  var root = document.documentElement;
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var rows = Array.prototype.slice.call(document.querySelectorAll("tbody tr"));

  function setLayer(layer) {
    document.querySelectorAll("[data-layer]").forEach(function (b) { b.classList.toggle("on", b.dataset.layer === layer); });
    shots.forEach(function (shot) {
      var src = shot.dataset["src" + layer[0].toUpperCase() + layer.slice(1)];
      // Fall back to whatever the screen does have: only mismatches carry a diff,
      // and a screen with no baseline has only a capture.
      var fallback = shot.dataset.srcActual || shot.dataset.srcBaseline;
      var img = shot.querySelector("img");
      shot.classList.remove("is-broken");
      img.src = src || fallback;
      shot.classList.toggle("is-fallback", !src);
    });
  }

  function setFilter(filter) {
    document.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.toggle("on", b.dataset.filter === filter); });
    rows.forEach(function (row) {
      row.hidden = filter === "changed" && row.dataset.status === "pass";
    });
  }

  document.querySelectorAll("[data-layer]").forEach(function (b) {
    b.addEventListener("click", function () { setLayer(b.dataset.layer); });
  });
  document.querySelectorAll("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () { setFilter(b.dataset.filter); });
  });
  var zoom = document.querySelector(".zoom input");
  zoom.addEventListener("input", function () { root.style.setProperty("--w", zoom.value + "px"); });
  root.style.setProperty("--w", zoom.value + "px");

  var box = document.querySelector(".lightbox");
  var panes = box.querySelector(".lightbox-panes");
  var boxTitle = box.querySelector(".lightbox-title");
  var open = -1;

  var LAYERS = [["srcBaseline", "Baseline"], ["srcActual", "Capture"], ["srcDiff", "Diff"]];

  function show(index) {
    var shot = shots[index];
    if (!shot) return;
    open = index;
    boxTitle.textContent = shot.dataset.screen + " — " + shot.dataset.run + " (" + shot.dataset.status + ")";
    panes.innerHTML = LAYERS
      .filter(function (l) { return shot.dataset[l[0]]; })
      .map(function (l) { return '<div class="pane"><h2>' + l[1] + '</h2><img src="' + shot.dataset[l[0]] + '"></div>'; })
      .join("");
    box.hidden = false;
    // Keep the open screen in the address bar so a reviewer can link a colleague
    // straight at the cell they are asking about.
    history.replaceState(null, "", "#" + shot.dataset.run + "/" + shot.dataset.screen);
  }

  function close() {
    box.hidden = true;
    history.replaceState(null, "", location.pathname);
    if (shots[open]) shots[open].focus();
  }

  // Step across the row (devices) or down the column (screens) without leaving
  // the lightbox — comparing the same screen device to device is the whole point.
  function step(dx, dy) {
    var shot = shots[open];
    var cell = shot.parentElement;
    var row = cell.parentElement;
    var column = Array.prototype.indexOf.call(row.children, cell);
    var target = row;
    if (dy) {
      var visible = rows.filter(function (r) { return !r.hidden; });
      var at = visible.indexOf(row) + dy;
      if (at < 0 || at >= visible.length) return;
      target = visible[at];
    }
    var next = target.children[column + dx];
    var nextShot = next && next.querySelector(".shot");
    if (nextShot) show(shots.indexOf(nextShot));
  }

  shots.forEach(function (shot, i) {
    shot.addEventListener("click", function () { show(i); });
    shot.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i); } });
  });
  box.querySelector(".close").addEventListener("click", close);

  var linked = decodeURIComponent(location.hash.slice(1));
  if (linked) {
    var at = shots.findIndex(function (shot) { return shot.dataset.run + "/" + shot.dataset.screen === linked; });
    if (at >= 0) show(at);
  }
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowLeft") { step(-1, 0); }
    else if (e.key === "ArrowRight") { step(1, 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); step(0, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); step(0, 1); }
  });
}());
`;
