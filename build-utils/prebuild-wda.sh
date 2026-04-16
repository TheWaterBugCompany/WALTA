#!/bin/bash
# Prebuilds WebDriverAgent for iOS simulator testing into the default
# Xcode DerivedData location. Used in CI so appium-xcuitest-driver
# finds a warm build on first session, skipping the ~2-3 min cold
# compile. No custom derivedDataPath — Appium's default code paths
# stay untouched.
set -e

WDA_PROJECT="node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj"
if [ ! -d "$WDA_PROJECT" ]; then
  echo "WebDriverAgent project not found at $WDA_PROJECT — run 'npm install' first" >&2
  exit 1
fi

xcodebuild build-for-testing \
  -project "$WDA_PROJECT" \
  -scheme WebDriverAgentRunner \
  -destination "generic/platform=iOS Simulator" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  GCC_TREAT_WARNINGS_AS_ERRORS=0 \
  COMPILER_INDEX_STORE_ENABLE=NO

echo "WebDriverAgent prebuilt into default DerivedData"
