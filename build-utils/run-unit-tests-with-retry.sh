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

# Deliberately does not claim a cause. This branch covers build/AAPT wobbles
# and the output-logs idle hang alike, and calling every one of them an "infra
# flake" is what kept the hang unexamined for months (WB-196). The retry stays;
# the diagnosis does not.
echo "::warning ::Unit-test attempt 1 failed with exit $EXIT (cause unknown — check the log above for a device-state dump); retrying once (WB-54)"
"$@"
exit $?
