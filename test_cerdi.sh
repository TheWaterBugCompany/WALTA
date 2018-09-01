#!/bin/sh
curl -v \
     https://api-wbb.till.cerdi.edu.au/v1/token/create/server \
     --header "Accept: application/json" \
     --header "Content-Type: application/json" \
     --data @- <<EOF
{ 
    "client_secret":"hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz", 
    "scope": "create-users"
}
EOF

