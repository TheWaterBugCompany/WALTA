#!/usr/bin/env bash
# Runs the on-device unit-test command, distinguishing a deterministic
# test failure (a `UNIT_TESTS_FAILED` marker reached stdout — don't
# retry) from an infrastructure flake (no marker — retry once). Used by
# the iOS + Android unit-test jobs in .github/workflows/ci.yml.
#
# - exit 0  → all tests passed
# - exit 1  → tests ran to completion and reported failures (no retry)
# - else    → retried once; final exit = second attempt's exit code
#
# See WB-48.

set -o pipefail

LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT

run_once() {
    "$@" 2>&1 | tee "$LOG"
    return ${PIPESTATUS[0]}
}

run_once "$@"
EXIT=$?

if [ $EXIT -eq 0 ]; then
    exit 0
fi

if grep -q UNIT_TESTS_FAILED "$LOG"; then
    echo "::error ::Unit tests reported failures — not retrying (failure is deterministic)"
    exit 1
fi

echo "::warning ::Unit-test attempt 1 failed without UNIT_TESTS_FAILED marker; retrying once (WB-54)"
"$@"
exit $?
