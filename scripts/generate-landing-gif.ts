import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;
const VEO_MODEL = 'google/veo-3.1' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/landing');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

const LANDING_PROMPT =
  '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
  'Monochrome cyan color palette on a dark black background. ' +
  'A dark narrow New York City alley at night, centered perspective. ' +
  'A shady figure in a long trenchcoat and wide-brimmed fedora hat stands in the middle of the alley, ' +
  'half-hidden in shadows, with a small bag in his hand as if selling something illicit. ' +
  'In the far background, faint red and blue police lights glow from a distant police car parked at the end of the alley. ' +
  'Wet pavement reflects the dim lights. Trash cans and fire escapes line the walls. ' +
  'Dark, moody tones with high-contrast lighting. ' +
  '6-frame loop with subtle ambient movement like flickering lights and rain, gritty retro game style, no text, no CRT screen curvature.';

// ── Helpers ─────────────────────────────────────────────────────────

async function extractFileData(output: unknown): Promise<Buffer> {
  console.log('  [debug] Output type:', typeof output, output?.constructor?.name);

  if (Array.isArray(output) && output.length > 0) {
    return extractFileData(output[0]);
  }

  if (typeof output === 'string') {
    const res = await fetch(output);
    if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;

    if ('href' in obj && typeof obj.href === 'string') {
      const res = await fetch(obj.href);
      if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }

    const urlStr = String(output);
    if (urlStr.startsWith('http')) {
      const res = await fetch(urlStr);
      if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }

    if (Symbol.asyncIterator in obj) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of output as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
  }

  throw new Error(`Unexpected Replicate output format: ${typeof output} ${output?.constructor?.name}`);
}

// ── Main Pipeline ───────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('Error: REPLICATE_API_TOKEN env var is required');
    process.exit(1);
  }

  const replicate = new Replicate({ auth: token });

  // Clean old files
  if (fs.existsSync(DEBUG_DIR)) {
    fs.rmSync(DEBUG_DIR, { recursive: true });
  }
  if (fs.existsSync(OUT_DIR)) {
    for (const gif of fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.gif'))) {
      fs.unlinkSync(path.join(OUT_DIR, gif));
    }
  }
  fs.mkdirSync(DEBUG_DIR, { recursive: true });

  console.log('=== Landing Page Background GIF ===\n');

  // Phase A: Generate starting frame with nanobanana
  const framePath = path.join(DEBUG_DIR, 'landing-bg-start.png');

  console.log('[1/3] Generating starting frame with nanobanana...');
  const imgOutput = await replicate.run(NANOBANANA_MODEL, {
    input: {
      prompt: LANDING_PROMPT,
      aspect_ratio: '9:16',
      output_format: 'png',
    },
  });
  const imgData = await extractFileData(imgOutput);
  fs.writeFileSync(framePath, imgData);
  console.log(`[1/3] Saved: ${framePath}`);

  // Phase B: Animate with Veo 3.1 (image-to-video)
  const mp4Path = path.join(DEBUG_DIR, 'landing-bg.mp4');
  const startFrameDataUri = `data:image/png;base64,${imgData.toString('base64')}`;

  console.log('[2/3] Generating video with Veo 3.1...');
  const vidOutput = await replicate.run(VEO_MODEL, {
    input: {
      image: startFrameDataUri,
      prompt: LANDING_PROMPT,
      duration: 4,
      aspect_ratio: '9:16',
      generate_audio: false,
      negative_prompt: 'blurry, low quality, watermark, text, realistic photo, 3D render',
    },
  });
  const vidData = await extractFileData(vidOutput);
  fs.writeFileSync(mp4Path, vidData);
  console.log(`[2/3] Saved: ${mp4Path}`);

  // Phase C: Convert MP4 → GIF with ffmpeg
  const gifPath = path.join(OUT_DIR, 'landing-bg.gif');
  const paletteFile = path.join(DEBUG_DIR, 'landing-bg-palette.png');

  console.log('[3/3] Converting to GIF...');

  // 9:16 video → scale to 360x640 with nearest-neighbor
  const FPS = 5;
  const TRIM = 1.6;

  // Pass 1: Generate optimal palette
  execSync(
    `ffmpeg -y -i "${mp4Path}" -t ${TRIM} ` +
      `-vf "fps=${FPS},scale=360:640:flags=neighbor,palettegen=max_colors=64" ` +
      `"${paletteFile}"`,
    { stdio: 'pipe' },
  );

  // Pass 2: Generate GIF using palette (infinite loop)
  execSync(
    `ffmpeg -y -i "${mp4Path}" -i "${paletteFile}" -t ${TRIM} ` +
      `-lavfi "fps=${FPS},scale=360:640:flags=neighbor [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" ` +
      `-loop 0 "${gifPath}"`,
    { stdio: 'pipe' },
  );

  const size = (fs.statSync(gifPath).size / 1024).toFixed(1);
  console.log(`[3/3] Done: ${gifPath} (${size} KB)`);

  console.log('\nLanding page GIF generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
