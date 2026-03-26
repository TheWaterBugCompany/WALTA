#!/bin/bash
# Builds hello-v1.apk and hello-v2.apk for use as integration test fixtures.
# Requires: Android SDK (ANDROID_HOME set), Java (javac), debug keystore.
# Run from any directory — outputs are written alongside this script.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD="$SCRIPT_DIR/build"

if [ -z "$ANDROID_HOME" ]; then
  echo "Error: ANDROID_HOME is not set" >&2
  exit 1
fi

BUILD_TOOLS="$ANDROID_HOME/build-tools/$(ls "$ANDROID_HOME/build-tools" | sort -V | tail -1)"
PLATFORM="$ANDROID_HOME/platforms/$(ls "$ANDROID_HOME/platforms" | sort -V | tail -1)"
ANDROID_JAR="$PLATFORM/android.jar"

echo "Using build-tools: $BUILD_TOOLS"
echo "Using platform:    $PLATFORM"

# Sign with debug keystore (create it if missing)
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
if [ ! -f "$DEBUG_KEYSTORE" ]; then
  keytool -genkeypair -v \
    -keystore "$DEBUG_KEYSTORE" \
    -alias androiddebugkey \
    -keyalg RSA -keysize 2048 \
    -validity 10000 \
    -storepass android -keypass android \
    -dname "CN=Android Debug,O=Android,C=US"
fi

build_apk() {
  local VERSION_CODE=$1
  local DEST="$SCRIPT_DIR/hello-v${VERSION_CODE}.apk"
  local WORK="$BUILD/v${VERSION_CODE}"

  rm -rf "$WORK" && mkdir -p "$WORK/classes"

  # Link manifest into a bare APK (no resources)
  "$BUILD_TOOLS/aapt2" link \
    --manifest "$SCRIPT_DIR/AndroidManifest.xml" \
    -I "$ANDROID_JAR" \
    -o "$WORK/hello_unaligned.apk" \
    --version-code "$VERSION_CODE" \
    --min-sdk-version 26 \
    --target-sdk-version 36

  # Compile Java source
  javac \
    -source 8 -target 8 \
    -classpath "$ANDROID_JAR" \
    -d "$WORK/classes" \
    "$SCRIPT_DIR/src/com/example/helloworld/MainActivity.java"

  # Convert class files to DEX
  "$BUILD_TOOLS/d8" \
    --min-api 26 \
    --output "$WORK" \
    "$WORK/classes/com/example/helloworld/MainActivity.class"

  # Add DEX to the APK
  (cd "$WORK" && zip -j hello_unaligned.apk classes.dex)

  # Align (must happen before signing)
  "$BUILD_TOOLS/zipalign" -f -p 4 "$WORK/hello_unaligned.apk" "$WORK/hello_aligned.apk"

  "$BUILD_TOOLS/apksigner" sign \
    --ks "$DEBUG_KEYSTORE" \
    --ks-key-alias androiddebugkey \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "$DEST" \
    "$WORK/hello_aligned.apk"

  echo "Built: $DEST"
}

build_apk 1
build_apk 2
