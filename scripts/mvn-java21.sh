#!/usr/bin/env bash
set -euo pipefail
WIN_JDK="/c/Program Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot"
if [[ -d "$WIN_JDK" ]]; then
  export JAVA_HOME="$WIN_JDK"
  export PATH="$JAVA_HOME/bin:$PATH"
fi
cd "$(dirname "$0")/../backend"
exec ./mvnw "$@"
