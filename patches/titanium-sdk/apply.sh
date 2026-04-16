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

SDK_VERSION="13.2.0.GA"

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

  local reverse_flag=""
  local action="Applying"
  local skipped_msg="already applied"
  if [ "$REVERSE" = true ]; then
    reverse_flag="-R"
    action="Reversing"
    skipped_msg="already reversed"
  fi

  echo "$action: $description"

  # Rewrite patch paths from /tmp/... to just the target filename,
  # preserving a/ and b/ prefixes so patch -p1 resolves correctly.
  local filename
  filename="$(basename "$target_file")"
  local rewritten="$TMPDIR/$(basename "$patch_file")"
  sed -E "s|([ab])/tmp/[^[:space:]]+|\\1/$filename|g" "$patch_file" > "$rewritten"

  local target_dir
  target_dir="$(dirname "$target_file")"

  if patch --dry-run $reverse_flag -p1 -d "$target_dir" < "$rewritten" > /dev/null 2>&1; then
    patch $reverse_flag -p1 -d "$target_dir" < "$rewritten"
    echo "  OK"
  else
    echo "  SKIPPED ($skipped_msg or conflicts)"
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

echo ""
if [ "$REVERSE" = true ]; then
  echo "All patches reversed for SDK $SDK_VERSION"
else
  echo "All patches applied to SDK $SDK_VERSION"
fi
