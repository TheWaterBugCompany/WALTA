#!/bin/bash
# Builds HelloWorld.app for use as an iOS integration test fixture.
# Requires: Xcode with a valid Apple Developer account (automatic signing).
# The DEVELOPMENT_TEAM in project.pbxproj is set to 6RRED3LUUV — update if needed.
# Run from any directory — output is written to build-tests/integration/HelloWorld.app.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/../../HelloWorld.app"
BUILD="$SCRIPT_DIR/build"

xcodebuild \
  -project "$SCRIPT_DIR/HelloWorld.xcodeproj" \
  -target HelloWorld \
  -configuration Debug \
  -sdk iphoneos \
  -derivedDataPath "$BUILD" \
  CODE_SIGN_STYLE=Automatic \
  build

APP="$BUILD/Build/Products/Debug-iphoneos/HelloWorld.app"

rm -rf "$DEST"
cp -r "$APP" "$DEST"

echo "Built: $DEST"
