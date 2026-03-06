#!/usr/bin/env bash
# Render texture plugin test images using the genart CLI.
# Usage: bash test-renders/render.sh
#
# Prerequisites:
#   cd ~/genart-dev/cli && npm link   (makes `genart` available globally)
#   — or use: npx --prefix ~/genart-dev/cli genart ...

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

GENART="${GENART_CLI:-genart}"

echo "Rendering paper-cold-press..."
"$GENART" render "$DIR/paper-cold-press.genart" -o "$DIR/paper-cold-press.png"

echo "Rendering paper-rough..."
"$GENART" render "$DIR/paper-rough.genart" -o "$DIR/paper-rough.png"

echo "Rendering canvas-default..."
"$GENART" render "$DIR/canvas-default.genart" -o "$DIR/canvas-default.png"

echo "Rendering washi-default..."
"$GENART" render "$DIR/washi-default.genart" -o "$DIR/washi-default.png"

echo "Rendering noise-fractal..."
"$GENART" render "$DIR/noise-fractal.genart" -o "$DIR/noise-fractal.png"

echo "Rendering noise-ridged..."
"$GENART" render "$DIR/noise-ridged.genart" -o "$DIR/noise-ridged.png"

echo "Done. Output in $DIR/"
