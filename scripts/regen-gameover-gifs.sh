#!/usr/bin/env bash
# Regenerate game over GIFs from cached debug starting frames.
# Uses sharp to trim black borders, then ffmpeg to create subtle looping
# animations (brightness pulse) at 360x640, 5fps, 1.6s (8 frames), 64 colors.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GAMEOVER_DIR="$BASE_DIR/public/sprites/gameover"
DEBUG_DIR="$GAMEOVER_DIR/debug"

SCENES=("gameover-negative" "gameover-low" "gameover-high")

for name in "${SCENES[@]}"; do
  src="$DEBUG_DIR/${name}-start.png"
  trimmed="$DEBUG_DIR/${name}-trimmed.png"
  gif="$GAMEOVER_DIR/${name}.gif"
  palette="$DEBUG_DIR/${name}-regen-palette.png"

  if [ ! -f "$src" ]; then
    echo "SKIP: $src not found"
    continue
  fi

  echo "=== Regenerating $name ==="

  # Step 0: Trim black borders using sharp
  echo "  Trimming black borders..."
  node -e "
    const sharp = require('sharp');
    sharp('$src')
      .trim({ background: '#000000', threshold: 30 })
      .toFile('$trimmed')
      .then(info => console.log('  Trimmed to: ' + info.width + 'x' + info.height))
      .catch(e => { console.error(e); process.exit(1); });
  "

  # Pass 1: Generate optimal 64-color palette from the trimmed frame
  ffmpeg -y -i "$trimmed" \
    -vf "scale=360:640:flags=neighbor,palettegen=max_colors=64" \
    -update 1 "$palette" 2>/dev/null

  # Pass 2: Create 8-frame GIF with subtle brightness pulse using the palette
  ffmpeg -y -loop 1 -t 1.6 -framerate 5 -i "$trimmed" -i "$palette" \
    -frames:v 8 \
    -lavfi "scale=360:640:flags=neighbor,eq=brightness='0.06*sin(2*PI*t/1.6)' [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$gif" 2>/dev/null

  size=$(du -k "$gif" | cut -f1)
  echo "  Done: $gif (${size} KB)"
done

echo ""
echo "All game over GIFs regenerated!"
