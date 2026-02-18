import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;
const VEO_MODEL = 'google/veo-3.1' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/events');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

// Reference image: landing page starting frame (for Veo style consistency)
const LANDING_DEBUG_DIR = path.resolve(__dirname, '../public/sprites/landing/debug');
const LANDING_REF_PATH = path.join(LANDING_DEBUG_DIR, 'landing-bg-start.png');

interface AnimConfig {
  name: string;
  prompt: string;
  trimSeconds: number;
  fps: number;
}

// All events are looping idle-style animations (9:16 atmospheric scenes)
const EVENTS: AnimConfig[] = [
  {
    name: 'event-mugging',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'A dark New York City alley at night, viewed from a wide angle. A hooded figure lunges from the shadows toward the viewer, arms outstretched aggressively. A single streetlight casts dramatic long shadows down the alley. Wet pavement, trash cans, fire escapes on brick walls. Menacing atmosphere. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle ambient movement, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'event-find-drugs',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Looking down at the wet ground of a New York City alley at night. A small glowing bag of white powder sits on the cracked pavement, emitting a faint cyan glow that illuminates the surrounding puddles and debris. Steam rising from a nearby grate. Trash scattered around. Brick walls visible at the edges. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle glowing pulse and steam, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'event-find-gun',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Close-up view of a revolver pistol lying on wet pavement in a New York City alley at night. The gun is large and centered in the frame, taking up much of the image. Faint cyan light reflects off the metal barrel and cylinder. Rain puddles surround it, reflecting a distant flickering streetlight. Wet ground texture with cracks. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle rain and light flicker on the gun, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'event-find-coat',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Close-up view of a large trenchcoat hanging on a chain-link fence in a dark New York City alley at night. The coat is large and centered in the frame, taking up much of the image, swaying gently in the wind. Dim cyan light catches the folds and texture of the fabric. Dark brick walls and a fire escape ladder visible behind it. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle coat swaying movement, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
  },
  {
    name: 'event-loan-shark',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'A New York City side street at night, viewed from a low angle. Two large menacing silhouettes stand under a broken streetlight, backlit with dramatic rim lighting on their muscular figures. One cracks his knuckles. Parked cars and storefronts with metal shutters in the background. Puddles on the asphalt reflect their shadows. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle threatening movement, gritty retro game style, no text, no CRT screen curvature.',
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

  // Load the landing page reference frame for Veo style consistency
  if (!fs.existsSync(LANDING_REF_PATH)) {
    console.error(`Error: Reference image not found: ${LANDING_REF_PATH}`);
    console.error('Run generate-landing-gif.ts first to create the reference frame.');
    process.exit(1);
  }
  console.log(`Loaded reference image: ${LANDING_REF_PATH}`);

  const replicate = new Replicate({ auth: token });

  // Support --only <name> to generate a single event
  const onlyIdx = process.argv.indexOf('--only');
  const onlyName = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined;
  const eventsToGenerate = onlyName
    ? EVENTS.filter(e => e.name === onlyName)
    : EVENTS;

  if (onlyName && eventsToGenerate.length === 0) {
    console.error(`Error: No event found with name "${onlyName}"`);
    console.error(`Available: ${EVENTS.map(e => e.name).join(', ')}`);
    process.exit(1);
  }

  if (!onlyName) {
    cleanOldFiles();
  }
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const event of eventsToGenerate) {
    console.log(`\n=== ${event.name} ===`);

    // Phase A: Generate starting frame with nanobanana
    const framePath = path.join(DEBUG_DIR, `${event.name}-start.png`);

    console.log('  [1/3] Generating starting frame with nanobanana...');
    const imgOutput = await replicate.run(NANOBANANA_MODEL, {
      input: {
        prompt: event.prompt,
        aspect_ratio: '9:16',
        output_format: 'png',
      },
    });
    const imgData = await extractFileData(imgOutput);
    fs.writeFileSync(framePath, imgData);
    console.log(`  [1/3] Saved: ${framePath}`);

    // Phase B: Animate with Veo 3.1 (image-to-video)
    // Use each event's own starting frame so Veo animates the correct scene
    const mp4Path = path.join(DEBUG_DIR, `${event.name}.mp4`);
    const startFrameDataUri = `data:image/png;base64,${imgData.toString('base64')}`;

    console.log('  [2/3] Generating video with Veo 3.1...');
    const vidOutput = await replicate.run(VEO_MODEL, {
      input: {
        image: startFrameDataUri,
        prompt: event.prompt,
        duration: 4,
        aspect_ratio: '9:16',
        generate_audio: false,
        negative_prompt: 'blurry, low quality, watermark, text, realistic photo, 3D render',
      },
    });
    const vidData = await extractFileData(vidOutput);
    fs.writeFileSync(mp4Path, vidData);
    console.log(`  [2/3] Saved: ${mp4Path}`);

    // Phase C: Convert MP4 → GIF with ffmpeg
    const gifPath = path.join(OUT_DIR, `${event.name}.gif`);
    console.log('  [3/3] Converting to GIF...');

    const paletteFile = path.join(DEBUG_DIR, `${event.name}-palette.png`);

    // Scale to 360x640 (9:16) with nearest-neighbor for pixel crispness
    // Pass 1: Generate optimal palette
    execSync(
      `ffmpeg -y -i "${mp4Path}" -t ${event.trimSeconds} ` +
        `-vf "fps=${event.fps},scale=360:640:flags=neighbor,palettegen=max_colors=64" ` +
        `"${paletteFile}"`,
      { stdio: 'pipe' },
    );

    // Pass 2: Generate GIF using palette (all events loop infinitely)
    execSync(
      `ffmpeg -y -i "${mp4Path}" -i "${paletteFile}" -t ${event.trimSeconds} ` +
        `-lavfi "fps=${event.fps},scale=360:640:flags=neighbor [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" ` +
        `-loop 0 "${gifPath}"`,
      { stdio: 'pipe' },
    );

    const size = (fs.statSync(gifPath).size / 1024).toFixed(1);
    console.log(`  [3/3] Done: ${gifPath} (${size} KB)`);
  }

  console.log('\nAll event GIFs generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
