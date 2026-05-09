#! /bin/sh
set -e

# Generate tiapp.xml from template
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
  echo "ERROR: GOOGLE_MAPS_API_KEY environment variable is not set." >&2
  echo "See CLAUDE.md for required environment variables." >&2
  exit 1
fi
sed "s/GOOGLE_MAPS_API_KEY_PLACEHOLDER/$GOOGLE_MAPS_API_KEY/" \
  walta-app/tiapp.xml.template > walta-app/tiapp.xml
echo "tiapp.xml generated from template."

# Seed app-config.test.json from template if missing. Gitignored —
# the user fills in cerdiApiSecret from 1Password (see
# INSTALLATION.md). Used by debug + acceptance/unit-test builds
# (Gruntfile defaults --app-config to "test"); acceptance tests
# redirect the URL to a local mock at runtime via the
# cerdiServerUrlOverride intent extra.
if [ ! -f walta-app/app/app-config.test.json ]; then
  cp walta-app/app/app-config.test.json.template walta-app/app/app-config.test.json
  echo "Seeded app-config.test.json from template — fill in cerdiApiSecret from 1Password"
fi

# Install Titanium native modules from official GitHub releases
# at https://github.com/appcelerator-modules/<module>/releases.
# Each release tag is either v<ver>-ios, v<ver>-android, or v<ver> for
# both-platform releases (e.g. ti.playservices). The asset name is
# <module>-<platform>-<ver>.zip.
install_ti_module() {
  local module=$1       # e.g. ti.map
  local platform=$2     # iphone or android
  local version=$3
  local tag_suffix=$4   # "-ios", "-android", or empty
  local dest="walta-app/modules/$platform/$module/$version"
  if [ -d "$dest" ]; then
    echo "$module $platform v$version already installed"
    return
  fi
  local url="https://github.com/appcelerator-modules/$module/releases/download/v$version$tag_suffix/$module-$platform-$version.zip"
  local tmp=$(mktemp -d)
  echo "Downloading $module $platform v$version..."
  curl -sSL --fail --retry 3 --retry-delay 2 --retry-all-errors "$url" -o "$tmp/module.zip"
  unzip -q "$tmp/module.zip" -d "$tmp"
  rm -rf "walta-app/modules/$platform/$module"
  mkdir -p "walta-app/modules/$platform/$module"
  mv "$tmp/modules/$platform/$module/$version" "$dest"
  rm -rf "$tmp"
  echo "Installed $module $platform v$version"
}
install_ti_module ti.map iphone 7.3.1 -ios
install_ti_module ti.map android 5.7.0 -android
install_ti_module ti.playservices android 18.6.0 ""

SPECS_LIB_DIR=walta-app/app/spec/lib
LIB_DIR=walta-app/app/lib/lib
ASSET_DIR=walta-app/app/assets
if [ ! -d $SPECS_LIB_DIR ]; then
  mkdir $SPECS_LIB_DIR
fi
if [ ! -d $LIB_DIR ]; then
  mkdir $LIB_DIR
fi
if [ ! -d $ASSET_DIR ]; then
  mkdir $ASSET_DIR
fi
cp ./node_modules/chai-date-string/lib/chai-date-string.js $SPECS_LIB_DIR/chai-date-string.js
cp ./node_modules/simple-mock/index.js $SPECS_LIB_DIR/simple-mock.js
cp ./node_modules/moment/moment.js $LIB_DIR/moment.js
cp -rf ./node_modules/leaflet/dist/* $ASSET_DIR/leaflet
PATH=./node_modules/.bin:$PATH

# Install Appium drivers used by the acceptance and integration test suites.
# `appium driver install` errors if the driver is already installed, so we
# check first and skip if present.
install_appium_driver() {
  local driver=$1
  # Strip ANSI color codes from appium output before matching
  if npx appium driver list --installed 2>&1 \
      | sed 's/\x1b\[[0-9;]*m//g' \
      | grep -q "${driver}@.*\[installed"; then
    echo "Appium driver $driver already installed"
  else
    echo "Installing Appium driver $driver..."
    npx appium driver install "$driver"
  fi
}
install_appium_driver xcuitest
install_appium_driver uiautomator2

ti config -a paths.hooks ./plugins/unittest/1.0/hooks
# not needed in 8 GA: liveview install clihook
alloy install plugin walta-app
npx webpack
