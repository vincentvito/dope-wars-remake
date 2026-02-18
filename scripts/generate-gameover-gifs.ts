import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;
const VEO_MODEL = 'google/veo-3.1' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/gameover');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

interface AnimConfig {
  name: string;
  prompt: string;
  trimSeconds: number;
  fps: number;
}

const GAMEOVER_SCENES: AnimConfig[] = [
  {
    name: 'gameover-negative',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'A dark empty New York City alley at night, completely desolate. ' +
      'A lone trenchcoat and fedora hat lie abandoned on the wet ground in the center of the alley. ' +
      'Crumpled dollar bills and empty bags are scattered around on the wet pavement. ' +
      'Heavy rain pours down. A single dim streetlight flickers overhead. ' +
      'Trash cans overturned, puddles everywhere. Brick walls with fire escapes on both sides. ' +
      'A sense of abandonment and loss. No people visible. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle rain and light flicker, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'gameover-low',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'A narrow New York City alley at night, centered perspective looking down the alley. ' +
      'A man in a trenchcoat walks away from the viewer holding the hand of his small young daughter beside him. ' +
      'They walk together down the middle of the wet alley toward a faint distant light at the end. ' +
      'The daughter is small, reaching up to hold her father\'s hand. Their silhouettes are backlit by the distant glow. ' +
      'Puddles reflect their figures. Fire escapes and brick walls on both sides. A bittersweet, hopeful mood. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle walking movement and rain, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'gameover-high',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Interior of a lavish dark office at night, Scarface movie style. ' +
      'A man sits behind a massive desk, leaning back confidently in a leather chair. ' +
      'The desk and floor are covered with huge stacks and piles of cash money everywhere. ' +
      'Behind him, a large floor-to-ceiling window shows a glittering city skyline at night. ' +
      'Venetian blinds cast horizontal light stripes across the scene. Cigar smoke curls upward. ' +
      'Opulent and powerful atmosphere. Dark wood paneling on the walls. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle smoke and light shimmer, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
];

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

function cleanOldFiles() {
  console.log('Cleaning old cached files...');
  if (fs.existsSync(DEBUG_DIR)) {
    fs.rmSync(DEBUG_DIR, { recursive: true });
    console.log(`  Deleted: ${DEBUG_DIR}`);
  }
  if (fs.existsSync(OUT_DIR)) {
    for (const gif of fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.gif'))) {
      fs.unlinkSync(path.join(OUT_DIR, gif));
      console.log(`  Deleted: ${gif}`);
    }
  }
}

// ── Main Pipeline ───────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('Error: REPLICATE_API_TOKEN env var is required');
    process.exit(1);
  }

  const replicate = new Replicate({ auth: token });

  // Support --only <name> to generate a single scene
  const onlyIdx = process.argv.indexOf('--only');
  const onlyName = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined;
  const scenesToGenerate = onlyName
    ? GAMEOVER_SCENES.filter(e => e.name === onlyName)
    : GAMEOVER_SCENES;

  if (onlyName && scenesToGenerate.length === 0) {
    console.error(`Error: No scene found with name "${onlyName}"`);
    console.error(`Available: ${GAMEOVER_SCENES.map(e => e.name).join(', ')}`);
    process.exit(1);
  }

  if (!onlyName) {
    cleanOldFiles();
  }
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const scene of scenesToGenerate) {
    console.log(`\n=== ${scene.name} ===`);

    // Phase A: Generate starting frame with nanobanana
    const framePath = path.join(DEBUG_DIR, `${scene.name}-start.png`);

    console.log('  [1/3] Generating starting frame with nanobanana...');
    const imgOutput = await replicate.run(NANOBANANA_MODEL, {
      input: {
        prompt: scene.prompt,
        aspect_ratio: '9:16',
        output_format: 'png',
      },
    });
    const imgData = await extractFileData(imgOutput);
    fs.writeFileSync(framePath, imgData);
    console.log(`  [1/3] Saved: ${framePath}`);

    // Phase B: Animate with Veo 3.1 (image-to-video)
    const mp4Path = path.join(DEBUG_DIR, `${scene.name}.mp4`);
    const startFrameDataUri = `data:image/png;base64,${imgData.toString('base64')}`;

    console.log('  [2/3] Generating video with Veo 3.1...');
    const vidOutput = await replicate.run(VEO_MODEL, {
      input: {
        image: startFrameDataUri,
        prompt: scene.prompt,
        duration: 4,
        aspect_ratio: '9:16',
        generate_audio: false,
        negative_prompt: 'blurry, low quality, watermark, text, realistic photo, 3D render',
      },
    });
    const vidData = await extractFileData(vidOutput);
    fs.writeFileSync(mp4Path, vidData);
    console.log(`  [2/3] Saved: ${mp4Path}`);

    // Phase C: Trim black borders from starting frame, then convert MP4 → GIF
    const gifPath = path.join(OUT_DIR, `${scene.name}.gif`);
    console.log('  [3/3] Converting to GIF...');

    // Trim black borders from the starting frame using sharp
    const trimmedPath = path.join(DEBUG_DIR, `${scene.name}-trimmed.png`);
    const trimInfo = await sharp(framePath)
      .trim({ background: '#000000', threshold: 30 })
      .toFile(trimmedPath);
    console.log(`  [3/3] Trimmed to: ${trimInfo.width}x${trimInfo.height}`);

    // Build crop filter from trim info for the MP4
    // The MP4 is 1080x1920, the PNG is 768x1344 — scale the trim proportionally
    const origMeta = await sharp(framePath).metadata();
    const scaleX = 1080 / (origMeta.width ?? 768);
    const scaleY = 1920 / (origMeta.height ?? 1344);
    const cropW = Math.round(trimInfo.width * scaleX);
    const cropH = Math.round(trimInfo.height * scaleY);
    const cropX = Math.round(((origMeta.width ?? 768) - trimInfo.width) / 2 * scaleX);
    const cropY = Math.round(-((trimInfo as unknown as Record<string, number>).trimOffsetTop ?? 0) * scaleY);
    const cropFilter = `crop=${cropW}:${cropH}:${cropX}:${cropY},`;

    const paletteFile = path.join(DEBUG_DIR, `${scene.name}-palette.png`);

    // Scale to 360x640 (9:16) with nearest-neighbor for pixel crispness
    // Pass 1: Generate optimal palette
    execSync(
      `ffmpeg -y -i "${mp4Path}" -t ${scene.trimSeconds} ` +
        `-vf "fps=${scene.fps},${cropFilter}scale=360:640:flags=neighbor,palettegen=max_colors=64" ` +
        `"${paletteFile}"`,
      { stdio: 'pipe' },
    );

    // Pass 2: Generate GIF using palette (infinite loop)
    execSync(
      `ffmpeg -y -i "${mp4Path}" -i "${paletteFile}" -t ${scene.trimSeconds} ` +
        `-lavfi "fps=${scene.fps},${cropFilter}scale=360:640:flags=neighbor [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" ` +
        `-loop 0 "${gifPath}"`,
      { stdio: 'pipe' },
    );

    const size = (fs.statSync(gifPath).size / 1024).toFixed(1);
    console.log(`  [3/3] Done: ${gifPath} (${size} KB)`);
  }

  console.log('\nAll game over GIFs generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
