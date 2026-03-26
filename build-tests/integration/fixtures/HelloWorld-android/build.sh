#!/bin/bash
# Builds hello.apk for use as an integration test fixture.
# Requires: Android SDK (ANDROID_HOME set), Java (javac), debug keystore.
# Run from any directory — output is written to build-tests/integration/hello.apk.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/../../hello.apk"
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

rm -rf "$BUILD" && mkdir -p "$BUILD/classes"

# Link manifest into a bare APK (no resources)
"$BUILD_TOOLS/aapt2" link \
  --manifest "$SCRIPT_DIR/AndroidManifest.xml" \
  -I "$ANDROID_JAR" \
  -o "$BUILD/hello_unaligned.apk" \
  --min-sdk-version 26 \
  --target-sdk-version 36

# Compile Java source
javac \
  -source 8 -target 8 \
  -classpath "$ANDROID_JAR" \
  -d "$BUILD/classes" \
  "$SCRIPT_DIR/src/com/example/helloworld/MainActivity.java"

# Convert class files to DEX
"$BUILD_TOOLS/d8" \
  --min-api 26 \
  --output "$BUILD" \
  "$BUILD/classes/com/example/helloworld/MainActivity.class"

# Add DEX to the APK
(cd "$BUILD" && zip -j hello_unaligned.apk classes.dex)

# Align (must happen before signing)
"$BUILD_TOOLS/zipalign" -f -p 4 "$BUILD/hello_unaligned.apk" "$BUILD/hello_aligned.apk"

# Sign with debug keystore
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

"$BUILD_TOOLS/apksigner" sign \
  --ks "$DEBUG_KEYSTORE" \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$DEST" \
  "$BUILD/hello_aligned.apk"

echo "Built: $DEST"
