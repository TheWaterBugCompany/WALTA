// The Pages site that hosts the visual review galleries: one directory per CI
// run, plus an index listing them. GitHub only ever serves an Actions artifact
// as a zip, so a report that is meant to be clicked has to live somewhere that
// serves HTML — and the report's images are relative paths, so publishing the
// capture tree as-is is all it takes.
//
// Old runs are dropped rather than kept forever: a run is ~38MB against a 1GB
// site, and the branch is rewritten as a single commit each publish so the
// history doesn't carry every run ever published.

export function retainedRuns(existing, incoming, limit) {
    const older = existing.filter((run) => run.id !== incoming.id);
    return [incoming, ...older].slice(0, limit);
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

function row(run) {
    return `<tr>
      <td><a href="${escapeHtml(run.id)}/report.html">${escapeHtml(run.id)}</a></td>
      <td>${escapeHtml(run.branch)}</td>
      <td><code>${escapeHtml(run.sha)}</code></td>
      <td>${escapeHtml(run.capturedAt)}</td>
    </tr>`;
}

export function renderIndex(runs) {
    const body = runs.length
        ? `<table>
      <thead><tr><th>Run</th><th>Branch</th><th>Commit</th><th>Captured</th></tr></thead>
      <tbody>${runs.map(row).join("")}</tbody>
    </table>`
        : "<p>No visual runs published yet.</p>";
    return `<!doctype html>
<meta charset="utf-8">
<title>WALTA visual review</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 60rem; padding: 0 1rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .4rem .6rem; border-bottom: 1px solid #ddd; }
  code { font-size: .9em; }
</style>
<h1>WALTA visual review</h1>
<p>The most recent visual regression runs. Each links to that run's gallery.</p>
${body}
`;
}
