#!/usr/bin/env bash
# Runs the on-device unit-test command with one retry on infrastructure
# flake — but not on a deterministic test failure. Used by the iOS +
# Android unit-test jobs in .github/workflows/ci.yml.
#
# Exit-code contract from `npx grunt unit-test`:
#   - 0  → all tests passed
#   - 2  → tests ran to completion and reported failures (do not retry)
#   - any other non-zero → infrastructure/build/AAPT flake (retry once)
#
# This wrapper's exit code:
#   - 0 → all passed
#   - 1 → deterministic test failure (CI job goes red, no retry)
#   - whatever the second attempt exits with on infra flake
#
# See WB-48.

"$@"
EXIT=$?

if [ $EXIT -eq 0 ]; then
    exit 0
fi

if [ $EXIT -eq 2 ]; then
    echo "::error ::Unit tests reported failures (grunt exit 2) — not retrying (failure is deterministic)"
    exit 1
fi

echo "::warning ::Unit-test attempt 1 failed with exit $EXIT (infra flake); retrying once (WB-54)"
"$@"
exit $?
