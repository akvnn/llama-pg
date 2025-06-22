#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

echo "entrypoint.sh is empty"

exec  "$@"
