#!/bin/bash
# Prebuilds WebDriverAgent for iOS simulator testing into a caller-supplied
# DerivedData path. Used in CI so appium-xcuitest-driver can reuse a cached
# WDA via the derivedDataPath capability, skipping the ~2-3 min cold compile
# on every acceptance run.
set -e

DERIVED_DATA_PATH="${WDA_DERIVED_DATA_PATH:-$1}"
if [ -z "$DERIVED_DATA_PATH" ]; then
  echo "Usage: WDA_DERIVED_DATA_PATH=<path> $0, or $0 <path>" >&2
  exit 1
fi

WDA_PROJECT="node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj"
if [ ! -d "$WDA_PROJECT" ]; then
  echo "WebDriverAgent project not found at $WDA_PROJECT — run 'npm install' first" >&2
  exit 1
fi

mkdir -p "$DERIVED_DATA_PATH"

xcodebuild build-for-testing \
  -project "$WDA_PROJECT" \
  -scheme WebDriverAgentRunner \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  GCC_TREAT_WARNINGS_AS_ERRORS=0 \
  COMPILER_INDEX_STORE_ENABLE=NO

echo "WebDriverAgent prebuilt at: $DERIVED_DATA_PATH"
