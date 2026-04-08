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
