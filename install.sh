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

# Create default index.js symlink if missing (build plugin overwrites for unit-test builds)
if [ ! -e walta-app/app/controllers/index.js ]; then
  ln -s index-app.js walta-app/app/controllers/index.js
  echo "Symlinked controllers/index.js -> index-app.js"
fi

# Generate mock app-config if missing (gitignored, needed for non-release builds)
if [ ! -f walta-app/app/app-config.mock.json ]; then
  cat > walta-app/app/app-config.mock.json << 'APPCONFIG'
{
	"cerdiServerUrl": "http://localhost:9999",
	"cerdiApiSecret": "test-secret"
}
APPCONFIG
  echo "Generated app-config.mock.json"
fi

# Install ti.map from official GitHub releases (npm @titanium-sdk/ti.map is stale)
# https://github.com/appcelerator-modules/ti.map/releases
TIMAP_IOS_VERSION="7.3.1"
TIMAP_ANDROID_VERSION="5.7.0"
install_ti_map() {
  local platform=$1     # iphone or android
  local version=$2
  local dest="walta-app/modules/$platform/ti.map/$version"
  if [ -d "$dest" ]; then
    echo "ti.map $platform v$version already installed"
    return
  fi
  local url="https://github.com/appcelerator-modules/ti.map/releases/download/v$version-$([ "$platform" = "iphone" ] && echo ios || echo android)/ti.map-$platform-$version.zip"
  local tmp=$(mktemp -d)
  echo "Downloading ti.map $platform v$version..."
  curl -sL "$url" -o "$tmp/ti.map.zip"
  unzip -q "$tmp/ti.map.zip" -d "$tmp"
  rm -rf "walta-app/modules/$platform/ti.map"
  mkdir -p "walta-app/modules/$platform/ti.map"
  mv "$tmp/modules/$platform/ti.map/$version" "$dest"
  rm -rf "$tmp"
  echo "Installed ti.map $platform v$version"
}
install_ti_map iphone "$TIMAP_IOS_VERSION"
install_ti_map android "$TIMAP_ANDROID_VERSION"

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
ti config -a paths.hooks ./plugins/unittest/1.0/hooks
# not needed in 8 GA: liveview install clihook
alloy install plugin walta-app
npx webpack
