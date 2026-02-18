import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/intro');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

const TARGET_WIDTH = 360;
const TARGET_HEIGHT = 640;

interface SlideConfig {
  name: string;
  prompt: string;
}

const STYLE_PREFIX =
  '8-bit retro pixel art, flat digital display, 9:16 aspect ratio. ' +
  'Monochrome cyan color palette on a dark black background. ';

const STYLE_SUFFIX =
  'The subject and scene details are positioned in the lower half of the frame. ' +
  'The upper half of the image is very dark, almost pure black, gradually fading from the scene below. ' +
  'Dark, moody tones with high-contrast lighting. ' +
  'Gritty retro game style, no text, no CRT screen curvature.';

const NEGATIVE_PROMPT = 'blurry, low quality, watermark, text, realistic photo, 3D render';

const SLIDES: SlideConfig[] = [
  {
    name: 'intro-1-office',
    prompt:
      STYLE_PREFIX +
      'Interior of a modern corporate office at night, seen from a low angle looking upward. ' +
      'In the lower half: a large wooden desk with a computer monitor, a nameplate, and a coffee mug. ' +
      'A leather office chair sits behind the desk. Tall glass windows behind show a dim city skyline. ' +
      'Venetian blinds cast horizontal light stripes. The upper half fades to deep darkness. ' +
      STYLE_SUFFIX,
  },
  {
    name: 'intro-2-fired',
    prompt:
      STYLE_PREFIX +
      'Interior of a corporate office being cleared out, viewed from the doorway. ' +
      'In the lower half: a cardboard box on the floor filled with personal items, a framed photo, a desk lamp. ' +
      'The desk behind it is completely bare and empty. A single overhead fluorescent light flickers dimly. ' +
      'The upper half is engulfed in shadows and darkness. Feeling of abandonment and loss. ' +
      STYLE_SUFFIX,
  },
  {
    name: 'intro-3-daughter',
    prompt:
      STYLE_PREFIX +
      'A dark bedroom at night, viewed from floor level. ' +
      'In the lower half: the silhouette of a small child sleeping in a bed, covered by a blanket, ' +
      'with a stuffed teddy bear beside her. A faint nightlight casts a small cyan glow on her peaceful face. ' +
      'The rest of the room above fades into deep, oppressive darkness. ' +
      STYLE_SUFFIX,
  },
  {
    name: 'intro-4-poverty',
    prompt:
      STYLE_PREFIX +
      'A run-down kitchen in a small apartment at night, viewed straight on. ' +
      'In the lower half: an open empty refrigerator door casting a faint cyan glow on a bare kitchen floor. ' +
      'The fridge shelves are completely empty. Scattered unpaid bills and an eviction notice lie on the floor. ' +
      'Cracked tile floor, peeling wallpaper. The upper half disappears into heavy darkness. Desperation and poverty. ' +
      STYLE_SUFFIX,
  },
  {
    name: 'intro-5-call',
    prompt:
      STYLE_PREFIX +
      'A dark narrow alley at night, viewed from a low angle. ' +
      'In the lower half: a man in a hoodie stands with his back partially to the viewer, holding a glowing cell phone to his ear. ' +
      'The phone screen casts a faint cyan light on his face and hand. He leans against a brick wall. ' +
      'Wet pavement reflects the faint phone glow. Trash cans and fire escapes barely visible. ' +
      'The upper half of the alley fades into complete darkness above. ' +
      STYLE_SUFFIX,
  },
  {
    name: 'intro-6-loanshark',
    prompt:
      STYLE_PREFIX +
      'A dark New York City alley at night, viewed from a low cowering perspective looking up slightly. ' +
      'In the lower half: two large menacing silhouettes stand side by side, backlit by a distant streetlight behind them. ' +
      'One figure cracks his knuckles, the other holds a baseball bat at his side. Their faces are hidden in shadow. ' +
      'Wet pavement at their feet reflects their dark outlines. ' +
      'The upper half is consumed by darkness with only a faint distant streetlight glow. ' +
      STYLE_SUFFIX,
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
    for (const png of fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'))) {
      fs.unlinkSync(path.join(OUT_DIR, png));
      console.log(`  Deleted: ${png}`);
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

  // Support --only <name> to generate a single slide
  const onlyIdx = process.argv.indexOf('--only');
  const onlyName = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined;
  const slidesToGenerate = onlyName
    ? SLIDES.filter(s => s.name === onlyName)
    : SLIDES;

  if (onlyName && slidesToGenerate.length === 0) {
    console.error(`Error: No slide found with name "${onlyName}"`);
    console.error(`Available: ${SLIDES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  if (!onlyName) {
    cleanOldFiles();
  }
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const slide of slidesToGenerate) {
    console.log(`\n=== ${slide.name} ===`);

    // Phase A: Generate image with nanobanana
    const rawPath = path.join(DEBUG_DIR, `${slide.name}-raw.png`);

    console.log('  [1/2] Generating image with nanobanana...');
    const imgOutput = await replicate.run(NANOBANANA_MODEL, {
      input: {
        prompt: slide.prompt,
        aspect_ratio: '9:16',
        output_format: 'png',
        negative_prompt: NEGATIVE_PROMPT,
      },
    });
    const imgData = await extractFileData(imgOutput);
    fs.writeFileSync(rawPath, imgData);
    console.log(`  [1/2] Saved raw: ${rawPath}`);

    // Phase B: Trim black borders + resize to 360x640 with nearest-neighbor
    const outputPath = path.join(OUT_DIR, `${slide.name}.png`);

    console.log('  [2/2] Processing with Sharp...');
    const trimmed = await sharp(rawPath)
      .trim({ background: '#000000', threshold: 30 })
      .toBuffer({ resolveWithObject: true });

    console.log(`  [2/2] Trimmed to: ${trimmed.info.width}x${trimmed.info.height}`);

    await sharp(trimmed.data)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        kernel: sharp.kernel.nearest,
      })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`  [2/2] Done: ${outputPath} (${size} KB)`);
  }

  console.log('\nAll intro PNGs generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
