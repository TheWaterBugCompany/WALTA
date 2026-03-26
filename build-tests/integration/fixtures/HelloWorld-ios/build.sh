#!/bin/bash
# Builds v1/HelloWorld.app and v2/HelloWorld.app for use as iOS integration test fixtures.
# Requires: Xcode with a valid Apple Developer account (automatic signing).
# The DEVELOPMENT_TEAM in project.pbxproj is set to 6RRED3LUUV — update if needed.
# Run from any directory — outputs are written alongside this script.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD="$SCRIPT_DIR/build"

build_app() {
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

build_app 1
build_app 2
