#!/usr/bin/env bash
# Publishes this run's visual gallery to the gh-pages branch, under the run id.
#
# The branch is rewritten as a SINGLE orphan commit every time rather than
# appended to. A run's captures are ~38MB, so an accumulating history would grow
# the repo by that much per run forever, and none of it is worth keeping — the
# reports themselves are the artefact, and publishPages.js keeps the newest few.
set -euo pipefail

: "${RUN_ID:?RUN_ID must be set}"
: "${BRANCH:?BRANCH must be set}"
: "${SHA:?SHA must be set}"
CAPTURED_AT="${CAPTURED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
SITE_DIR="${SITE_DIR:-/tmp/visual-pages}"
KEEP="${KEEP:-10}"
# Overridable so the whole flow can be exercised against a local bare repo.
REMOTE_URL="${REMOTE_URL:-https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git}"

rm -rf "$SITE_DIR"
# A shallow fetch of just the tip: we rewrite history anyway, so the rest of it
# is bandwidth spent on something we are about to discard.
if git ls-remote --exit-code --heads "$REMOTE_URL" gh-pages >/dev/null 2>&1; then
    git clone --branch gh-pages --single-branch --depth 1 "$REMOTE_URL" "$SITE_DIR"
else
    echo "gh-pages does not exist yet — starting the site from empty"
    mkdir -p "$SITE_DIR"
    git -C "$SITE_DIR" init -q
    git -C "$SITE_DIR" remote add origin "$REMOTE_URL"
fi

node build-utils/visual/publishPages.js \
    "$SITE_DIR" builds/visual "$RUN_ID" "$BRANCH" "$SHA" "$CAPTURED_AT" "$KEEP"

cd "$SITE_DIR"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -q --orphan publish
git add -A
git commit -q -m "Visual review galleries (latest: run ${RUN_ID}, ${BRANCH})"
git push -q --force origin publish:gh-pages
echo "Published ${PAGES_BASE:-https://${GITHUB_REPOSITORY_OWNER:-owner}.github.io/${GITHUB_REPOSITORY#*/}}/${RUN_ID}/report.html"
