#!/usr/bin/env bash
# Runs an on-device test command with one retry on infrastructure
# flake — but not on a deterministic test failure. Used by both the
# unit-test jobs (WB-48) and the acceptance/cucumber jobs (WB-54
# follow-up) in .github/workflows/ci.yml.
#
# Exit-code contract from the wrapped grunt task (unit-test or
# acceptance-test):
#   - 0  → all tests passed
#   - 2  → tests ran to completion and reported failures (do not retry)
#   - any other non-zero → infrastructure/build/AAPT/Appium flake
#                          (retry once)
#
# This wrapper's exit code:
#   - 0 → all passed
#   - 1 → deterministic test failure (CI job goes red, no retry)
#   - whatever the second attempt exits with on infra flake
#
# Filename retains the historical "unit-tests" name; renaming is
# pure cosmetic and tracked as a future cleanup.

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
