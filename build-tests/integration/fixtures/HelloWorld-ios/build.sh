#!/bin/bash
# Builds device and simulator HelloWorld.app fixtures for iOS integration tests.
# - v1/ and v2/         — device builds (iphoneos, requires Apple Developer account)
# - sim-v1/ and sim-v2/ — simulator builds (iphonesimulator, no signing needed)
# The DEVELOPMENT_TEAM in project.pbxproj is set to 6RRED3LUUV — update if needed.
# Run from any directory — outputs are written alongside this script.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD="$SCRIPT_DIR/build"

build_device() {
  local VERSION=$1
  local DEST="$SCRIPT_DIR/v${VERSION}/HelloWorld.app"

  xcodebuild \
    -project "$SCRIPT_DIR/HelloWorld.xcodeproj" \
    -target HelloWorld \
    -configuration Debug \
    -sdk iphoneos \
    CODE_SIGN_STYLE=Automatic \
    CURRENT_PROJECT_VERSION="$VERSION" \
    CONFIGURATION_BUILD_DIR="$BUILD/v${VERSION}" \
    build

  rm -rf "$DEST"
  mkdir -p "$SCRIPT_DIR/v${VERSION}"
  cp -r "$BUILD/v${VERSION}/HelloWorld.app" "$DEST"
  echo "Built: $DEST"
}

build_simulator() {
  local VERSION=$1
  local DEST="$SCRIPT_DIR/sim-v${VERSION}/HelloWorld.app"

  local DEST_FLAG=()
  if [ -n "${SIM_UDID:-}" ]; then
    DEST_FLAG=(-destination "id=$SIM_UDID,arch=$(uname -m)")
  fi

  xcodebuild \
    -project "$SCRIPT_DIR/HelloWorld.xcodeproj" \
    -scheme HelloWorld \
    -configuration Debug \
    -sdk iphonesimulator \
    "${DEST_FLAG[@]}" \
    -derivedDataPath "$BUILD/sim-derived-v${VERSION}" \
    CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
    CURRENT_PROJECT_VERSION="$VERSION" \
    build

  rm -rf "$DEST"
  mkdir -p "$SCRIPT_DIR/sim-v${VERSION}"
  cp -r "$BUILD/sim-derived-v${VERSION}/Build/Products/Debug-iphonesimulator/HelloWorld.app" "$DEST"
  echo "Built: $DEST"
}

# Device builds require a provisioning profile — skip in CI or when --simulator-only is passed
if [ "${1:-}" = "--simulator-only" ]; then
  echo "Skipping device builds (--simulator-only)"
else
  build_device 1
  build_device 2
fi

build_simulator 1
build_simulator 2
