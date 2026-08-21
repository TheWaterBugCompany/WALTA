#!/bin/bash
# Applies (or reverses) patches to the installed Titanium SDK.
#
# Usage:
#   npm run patch-sdk            # apply patches
#   npm run unpatch-sdk          # unapply patches (restore originals)

set -e

REVERSE=false
for arg in "$@"; do
  if [ "$arg" = "--reverse" ]; then
    REVERSE=true
  fi
done

SDK_VERSION="13.4.0.GA"

case "$(uname -s)" in
  Darwin) SDK_BASE="$HOME/Library/Application Support/Titanium/mobilesdk/osx/$SDK_VERSION" ;;
  Linux)  SDK_BASE="$HOME/.titanium/mobilesdk/linux/$SDK_VERSION" ;;
  *)      echo "Unsupported platform: $(uname -s)"; exit 1 ;;
esac

if [ ! -d "$SDK_BASE" ]; then
  echo "Titanium SDK $SDK_VERSION not found at: $SDK_BASE"
  echo "Install it with: npx titanium sdk install $SDK_VERSION"
  exit 1
fi

PATCHES_DIR="$(cd "$(dirname "$0")" && pwd)"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

apply_patch() {
  local patch_file="$1"
  local target_file="$2"
  local description="$3"

  local action="Applying"
  [ "$REVERSE" = true ] && action="Reversing"
  echo "$action: $description"

  # Rewrite patch paths from /tmp/... to just the target filename,
  # preserving a/ and b/ prefixes so patch -p1 resolves correctly.
  local filename
  filename="$(basename "$target_file")"
  local rewritten="$TMPDIR/$(basename "$patch_file")"
  sed -E "s|([ab])/tmp/[^[:space:]]+|\\1/$filename|g" "$patch_file" > "$rewritten"

  local target_dir
  target_dir="$(dirname "$target_file")"

  # Detect whether the patch is already applied. A plain `patch --dry-run`
  # succeeds in BOTH directions on Apple's `patch` regardless of state (it
  # offers to reverse an already-applied patch), which made repeated runs
  # toggle. `--forward` refuses an already-applied patch, so it is a reliable
  # signal: it succeeds only when the patch is NOT yet applied.
  local applied=false
  patch --forward --dry-run -p1 -d "$target_dir" < "$rewritten" > /dev/null 2>&1 || applied=true

  if [ "$REVERSE" = true ]; then
    if ! $applied; then
      echo "  SKIPPED (already reversed)"
    elif patch -R -p1 -d "$target_dir" < "$rewritten" > /dev/null 2>&1; then
      echo "  OK"
    else
      echo "  SKIPPED (conflicts)"
    fi
  else
    if $applied; then
      echo "  SKIPPED (already applied)"
    elif patch --forward -p1 -d "$target_dir" < "$rewritten" > /dev/null 2>&1; then
      echo "  OK"
    else
      echo "  SKIPPED (conflicts)"
    fi
  fi
}

apply_patch \
  "$PATCHES_DIR/ioslib-5.2.0-removeProfile-fix.patch" \
  "$SDK_BASE/node_modules/ioslib/lib/provisioning.js" \
  "ioslib: fix removeProfile crash (results.provisioning[...])"

apply_patch \
  "$PATCHES_DIR/sdk-13.1.1.GA-android-module-namespace.patch" \
  "$SDK_BASE/android/cli/commands/_build.js" \
  "Android: pass moduleId to lib.build.gradle template"

apply_patch \
  "$PATCHES_DIR/sdk-13.1.1.GA-android-lib-build-gradle-namespace.patch" \
  "$SDK_BASE/android/templates/build/lib.build.gradle" \
  "Android: add namespace to module lib.build.gradle template"

# LiveView is our custom fork (pinned in package.json). Two symlinks wire the
# SDK to it, both idempotent and both reversed by `npm run unpatch-sdk`.
PROJECT_ROOT="$(cd "$PATCHES_DIR/../.." && pwd)"

# 1. Point the SDK's bundled liveview at the fork. SDK 13.4.0 ships an old
# liveview 1.5.6 whose hook injects a legacy client that resolves relative
# requires against the compile stack (wrong for a require() in a deferred
# callback — it drops the parent dir, e.g. "sinks/ConsoleSink") and runs a
# separate file server the fork's single-port vite server never provides. The
# SDK's cli/hooks/liveview.js is `export * from 'liveview/hook/lvhook.js'`, which
# resolves `liveview` to <sdk>/node_modules/liveview — so symlinking that dir to
# the fork makes the SDK load the fork's v2 hook and inject its v2 client
# (single vite port, require resolved against the calling module).
LV_TARGET="$SDK_BASE/node_modules/liveview"
LV_SOURCE="$PROJECT_ROOT/node_modules/liveview"
LV_BACKUP="$SDK_BASE/node_modules/liveview.sdk-bundled"
if [ "$REVERSE" = true ]; then
  echo "Reversing: LiveView fork symlink (node_modules/liveview)"
  if [ -L "$LV_TARGET" ]; then
    rm -f "$LV_TARGET"
    [ -d "$LV_BACKUP" ] && mv "$LV_BACKUP" "$LV_TARGET"
    echo "  OK"
  else
    echo "  SKIPPED (not a symlink)"
  fi
else
  echo "Applying: LiveView fork symlink (node_modules/liveview)"
  if [ ! -e "$LV_SOURCE" ]; then
    echo "  SKIPPED (liveview not installed at $LV_SOURCE — run npm install first)"
  elif [ -L "$LV_TARGET" ]; then
    echo "  SKIPPED (already applied)"
  else
    [ -e "$LV_TARGET" ] && mv "$LV_TARGET" "$LV_BACKUP"
    ln -sfn "$LV_SOURCE" "$LV_TARGET"
    echo "  OK"
  fi
fi

# 2. The `titanium serve` command (LiveView dev server) is hardcoded in CLI v9's
# sdkCommands map, so the CLI resolves it to <sdk>/cli/commands/serve.js and
# ignores our liveview fork's paths.commands. The SDK doesn't ship serve.js, so
# symlink the fork's implementation into place.
SERVE_TARGET="$SDK_BASE/cli/commands/serve.js"
SERVE_SOURCE="$PROJECT_ROOT/node_modules/liveview/dist/node/commands/serve.js"
if [ "$REVERSE" = true ]; then
  echo "Reversing: LiveView serve.js symlink"
  if [ -L "$SERVE_TARGET" ]; then
    rm -f "$SERVE_TARGET"
    echo "  OK"
  else
    echo "  SKIPPED (not a symlink)"
  fi
else
  echo "Applying: LiveView serve.js symlink"
  if [ -e "$SERVE_SOURCE" ]; then
    ln -sf "$SERVE_SOURCE" "$SERVE_TARGET"
    echo "  OK"
  else
    echo "  SKIPPED (liveview not installed at $SERVE_SOURCE — run npm install first)"
  fi
fi

echo ""
if [ "$REVERSE" = true ]; then
  echo "All patches reversed for SDK $SDK_VERSION"
else
  echo "All patches applied to SDK $SDK_VERSION"
fi
