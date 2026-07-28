#!/usr/bin/env bash
# Runs the acceptance suite once, and retries ONCE on a freshly-rebooted device
# only when the run was an infrastructure/environment flake — never on a real
# test failure. Used identically by the iOS and Android acceptance jobs in
# .github/workflows/ci.yml so the two platforms share one retry policy (WB-203).
#
# Exit-code contract from `npx grunt ... acceptance-test` (see CucumberLauncher):
#   - 0   → all scenarios passed
#   - 75  → EX_TEMPFAIL: the run never reached scenarios, OR every failure was
#           infra/environmental (dropped session, slow GPS fix, sample tray not
#           settled). Retry-eligible — a fresh device gives it a clean shot.
#   - any other non-zero → a real test failure. NEVER retried (no masking): a
#           deterministic defect fails the retry too, so retrying only wastes a
#           device cycle and risks hiding a flaky-but-real bug.
#
# The retry runs on a FRESH device because the environmental flakes are device
# state (emulator GPS provider, leaked app state) that a same-device re-run
# can't cure. Rebooting is a first-class feature on BOTH platforms — the only
# per-platform difference is the OS-level reboot primitive below.
set -uo pipefail

PLATFORM="${1:?usage: run-acceptance-with-retry.sh <android|ios>}"
EX_TEMPFAIL=75

run_attempt() {
    # Tee the run into the uploaded artifacts so the cucumber "Failed scenarios"
    # summary + step + error survive even when the CI job log isn't retrievable
    # (the emulator-runner job log often won't serve). pipefail keeps grunt's
    # exit code as the function's result so the EX_TEMPFAIL logic still works.
    mkdir -p /tmp/acceptance-artifacts
    npx grunt --platform="$PLATFORM" --simulator --skip-build acceptance-test 2>&1 \
        | tee -a /tmp/acceptance-artifacts/acceptance-output.log
}

reset_device() {
    case "$PLATFORM" in
        android)
            local adb="adb"
            [ -n "${ANDROID_SDK_ROOT:-}" ] && adb="$ANDROID_SDK_ROOT/platform-tools/adb"
            echo "::group::Reboot Android emulator for a clean retry"
            "$adb" reboot
            "$adb" wait-for-device
            # Wait for the guest OS to finish booting so the retry starts on a
            # settled device (fresh GPS provider); attempt 2's BeforeAll clears
            # leaked app state. Cap the wait so a wedged boot can't hang the job.
            local waited=0
            until [ "$("$adb" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
                waited=$((waited + 2))
                if [ "$waited" -gt 180 ]; then
                    echo "::warning ::emulator did not report boot_completed within 180s; retrying anyway"
                    break
                fi
                sleep 2
            done
            echo "::endgroup::"
            ;;
        ios)
            : "${SIM_UDID:?SIM_UDID must be set for the iOS acceptance retry}"
            echo "::group::Erase & reboot iOS simulator for a clean retry"
            xcrun simctl shutdown "$SIM_UDID" || true
            xcrun simctl erase "$SIM_UDID"
            xcrun simctl boot "$SIM_UDID"
            xcrun simctl bootstatus "$SIM_UDID" -b
            echo "::endgroup::"
            ;;
        *)
            echo "unknown platform: $PLATFORM" >&2
            exit 64
            ;;
    esac
}

rc=0
run_attempt || rc=$?
[ "$rc" -eq 0 ] && exit 0
[ "$rc" -ne "$EX_TEMPFAIL" ] && exit "$rc"

echo "::warning ::Acceptance attempt 1 was infra/environmental (EX_TEMPFAIL 75); retrying once on a fresh device (WB-203)"
reset_device

rc=0
run_attempt || rc=$?
exit "$rc"
