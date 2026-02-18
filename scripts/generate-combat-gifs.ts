import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;
const VEO_MODEL = 'google/veo-3.1' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/combat');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

// Reference image: landing page starting frame (for Veo style consistency)
const LANDING_DEBUG_DIR = path.resolve(__dirname, '../public/sprites/landing/debug');
const LANDING_REF_PATH = path.join(LANDING_DEBUG_DIR, 'landing-bg-start.png');

interface AnimConfig {
  name: string;
  prompt: string;
  trimSeconds: number;
  fps: number;
  loop: boolean;
}

// All combat animations are 9:16 atmospheric scenes
const ANIMATIONS: AnimConfig[] = [
  {
    name: 'combat-idle',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Close-up view of a chubby policeman standing in front of his police car at night. He holds a truncheon in one hand, raised slightly. Red and blue police sirens flash on the car roof behind him. He wears a police cap, sunglasses, and a uniform with badge. Wet street pavement reflects the siren lights. Dark urban backdrop. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      '6-frame loop with subtle siren light flicker and character movement, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.6,
    fps: 5,
    loop: true,
  },
  {
    name: 'combat-fight',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Two characters face each other in close combat on a dark New York City street at night. ' +
      'On the left: a mysterious man in a long trenchcoat and wide-brimmed fedora hat, face completely hidden in shadow, throwing a punch. ' +
      'On the right: a chubby policeman with a mustache and police cap, swinging his truncheon back. ' +
      'A police car with flashing sirens is parked behind them. Bright cyan impact flash sparks between them. Wet pavement, dark buildings. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      'Smooth looping animation of two characters fighting, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.5,
    fps: 10,
    loop: false,
  },
  {
    name: 'combat-run',
    prompt:
      '8-bit retro pixel art animation, flat digital display, 9:16 aspect ratio. ' +
      'Monochrome cyan color palette on a dark black background. ' +
      'Two characters in a chase scene on a dark New York City street at night. ' +
      'In front: a mysterious man in a long trenchcoat and wide-brimmed fedora hat, face hidden in shadow, sprinting to the left with coat flapping behind him. ' +
      'Behind him: a chubby policeman with a mustache and police cap, reaching forward trying to grab him. ' +
      'A police car with flashing sirens is visible in the background. Small dust particles kick up at their feet. Wet pavement, dark buildings. ' +
      'Dark, moody tones with high-contrast lighting. ' +
      'Smooth animation of a running escape, gritty retro game style, no text, no CRT screen curvature.',
    trimSeconds: 1.5,
    fps: 8,
    loop: false,
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
  for (const gif of fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.gif'))) {
    fs.unlinkSync(path.join(OUT_DIR, gif));
    console.log(`  Deleted: ${gif}`);
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

  // Support --only <name> to generate a single animation
  const onlyIdx = process.argv.indexOf('--only');
  const onlyName = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined;
  const animsToGenerate = onlyName
    ? ANIMATIONS.filter(a => a.name === onlyName)
    : ANIMATIONS;

  if (onlyName && animsToGenerate.length === 0) {
    console.error(`Error: No animation found with name "${onlyName}"`);
    console.error(`Available: ${ANIMATIONS.map(a => a.name).join(', ')}`);
    process.exit(1);
  }

  if (!onlyName) {
    cleanOldFiles();
  }
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const anim of animsToGenerate) {
    console.log(`\n=== ${anim.name} ===`);

    // Phase A: Generate starting frame with nanobanana
    const framePath = path.join(DEBUG_DIR, `${anim.name}-start.png`);

    console.log('  [1/3] Generating starting frame with nanobanana...');
    const imgOutput = await replicate.run(NANOBANANA_MODEL, {
      input: {
        prompt: anim.prompt,
        aspect_ratio: '9:16',
        output_format: 'png',
      },
    });
    const imgData = await extractFileData(imgOutput);
    fs.writeFileSync(framePath, imgData);
    console.log(`  [1/3] Saved: ${framePath}`);

    // Phase B: Animate with Veo 3.1 (image-to-video)
    // Use each animation's own starting frame so Veo animates the correct scene
    const mp4Path = path.join(DEBUG_DIR, `${anim.name}.mp4`);
    const startFrameDataUri = `data:image/png;base64,${imgData.toString('base64')}`;

    console.log('  [2/3] Generating video with Veo 3.1...');
    const vidOutput = await replicate.run(VEO_MODEL, {
      input: {
        image: startFrameDataUri,
        prompt: anim.prompt,
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
    const gifPath = path.join(OUT_DIR, `${anim.name}.gif`);
    console.log('  [3/3] Converting to GIF...');

    const paletteFile = path.join(DEBUG_DIR, `${anim.name}-palette.png`);
    const loopFlag = anim.loop ? 0 : -1; // 0 = infinite, -1 = no repeat

    // Scale to 360x640 (9:16) with nearest-neighbor for pixel crispness
    // Pass 1: Generate optimal palette
    execSync(
      `ffmpeg -y -i "${mp4Path}" -t ${anim.trimSeconds} ` +
        `-vf "fps=${anim.fps},scale=360:640:flags=neighbor,palettegen=max_colors=64" ` +
        `"${paletteFile}"`,
      { stdio: 'pipe' },
    );

    // Pass 2: Generate GIF using palette (loop based on config)
    execSync(
      `ffmpeg -y -i "${mp4Path}" -i "${paletteFile}" -t ${anim.trimSeconds} ` +
        `-lavfi "fps=${anim.fps},scale=360:640:flags=neighbor [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" ` +
        `-loop ${loopFlag} "${gifPath}"`,
      { stdio: 'pipe' },
    );

    const size = (fs.statSync(gifPath).size / 1024).toFixed(1);
    console.log(`  [3/3] Done: ${gifPath} (${size} KB)`);
  }

  console.log('\nAll combat GIFs generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
