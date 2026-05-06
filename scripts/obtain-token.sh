#!/bin/sh
#
# Obtain a server-scoped CERDI access token using the credentials in
# walta-app/app/app-config.test.json. Same file the contract tests read.
#
# That config file is gitignored — copy app-config.test.json.template
# and fill in your CERDI client_secret before running this.
#
# Usage:
#   ./scripts/obtain-token.sh

set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
CONFIG="$SCRIPT_DIR/../walta-app/app/app-config.test.json"

if [ ! -f "$CONFIG" ]; then
  echo "Missing $CONFIG" >&2
  echo "Copy walta-app/app/app-config.test.json.template and fill in your CERDI client_secret." >&2
  exit 1
fi

SERVER_URL=$(node -e "console.log(require(process.argv[1]).cerdiServerUrl)" "$CONFIG")
CLIENT_SECRET=$(node -e "console.log(require(process.argv[1]).cerdiApiSecret)" "$CONFIG")

curl -X POST "${SERVER_URL}/token/create/server" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"client_secret\":\"${CLIENT_SECRET}\",\"scope\":\"create-users\"}"
