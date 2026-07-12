#!/usr/bin/env bash
set -euo pipefail
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"
cd "$(dirname "$0")/../backend"
exec ./mvnw "$@"
