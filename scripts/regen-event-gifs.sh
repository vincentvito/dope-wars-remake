#!/usr/bin/env bash
# Regenerate event GIFs from correct debug starting frames.
# Uses ffmpeg to create subtle looping animations (brightness pulse)
# that match the GIF specs: 360x640, 5fps, 1.6s (8 frames), 64 colors.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EVENTS_DIR="$BASE_DIR/public/sprites/events"
DEBUG_DIR="$EVENTS_DIR/debug"

EVENTS=("event-mugging" "event-find-drugs" "event-find-gun" "event-find-coat" "event-loan-shark")

for name in "${EVENTS[@]}"; do
  src="$DEBUG_DIR/${name}-start.png"
  gif="$EVENTS_DIR/${name}.gif"
  palette="$DEBUG_DIR/${name}-regen-palette.png"

  if [ ! -f "$src" ]; then
    echo "SKIP: $src not found"
    continue
  fi

  echo "=== Regenerating $name ==="

  # Pass 1: Generate optimal 64-color palette from the single source frame
  ffmpeg -y -i "$src" \
    -vf "scale=360:640:flags=neighbor,palettegen=max_colors=64" \
    -update 1 "$palette" 2>/dev/null

  # Pass 2: Create 8-frame GIF with subtle brightness pulse using the palette
  ffmpeg -y -loop 1 -t 1.6 -framerate 5 -i "$src" -i "$palette" \
    -frames:v 8 \
    -lavfi "scale=360:640:flags=neighbor,eq=brightness='0.06*sin(2*PI*t/1.6)' [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$gif" 2>/dev/null

  size=$(du -k "$gif" | cut -f1)
  echo "  Done: $gif (${size} KB)"
done

echo ""
echo "All event GIFs regenerated!"
