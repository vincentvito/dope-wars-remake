import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/game');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

const STYLE_PREFIX =
  '8-bit retro pixel art, flat digital display, 9:16 aspect ratio. ' +
  'Monochrome cyan color palette on a dark black background. ';

const CITIES = [
  {
    name: 'miami',
    filename: 'miami-bg.png',
    prompt:
      STYLE_PREFIX +
      'A Miami art deco district street at night, first-person perspective looking down the street. ' +
      'Pastel-colored art deco buildings with neon signs line both sides, palm trees silhouetted against the sky. ' +
      'A glimpse of the ocean and beach in the far distance. ' +
      'Wet pavement reflects pink and cyan neon lights. Warm amber glow mixed with cyan tones. ' +
      'No people, no characters — empty atmospheric street scene. ' +
      'Exotic cars parked on the side, tropical plants, distant cruise ship lights on the horizon. ' +
      'Dark, moody tones with high-contrast neon lighting. ' +
      'Gritty retro game style, no text, no CRT screen curvature.',
  },
  {
    name: 'la',
    filename: 'la-bg.png',
    prompt:
      STYLE_PREFIX +
      'A wide Los Angeles boulevard at night, first-person perspective looking down the street. ' +
      'Tall palm trees line both sides of the road, their silhouettes against a hazy night sky. ' +
      'Distant Hollywood hills and the faint outline of the Hollywood sign in the background. ' +
      'Streaking car headlights and taillights on the road. Smog-filtered moonlight. ' +
      'No people, no characters — empty atmospheric street scene. ' +
      'Low-rise buildings with graffiti, liquor store signs, chain-link fences. ' +
      'Dark, moody tones with high-contrast lighting, hazy atmosphere. ' +
      'Gritty retro game style, no text, no CRT screen curvature.',
  },
  {
    name: 'medellin',
    filename: 'medellin-bg.png',
    prompt:
      STYLE_PREFIX +
      'A narrow steep hillside street in Medellin Colombia at night, first-person perspective looking up the hill. ' +
      'Colorful but weathered buildings with barred windows and metal doors line both sides. ' +
      'Tropical vegetation and vines growing over crumbling walls. ' +
      'Andes mountains silhouette in the far background against a dark sky. ' +
      'No people, no characters — empty atmospheric street scene. ' +
      'Stray dogs, motorcycles parked on sidewalks, exposed electrical wires overhead. ' +
      'The most dangerous and gritty atmosphere of all cities. ' +
      'Dark, moody tones with high-contrast lighting, oppressive atmosphere. ' +
      'Gritty retro game style, no text, no CRT screen curvature.',
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

// ── Main Pipeline ───────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('Error: REPLICATE_API_TOKEN env var is required');
    process.exit(1);
  }

  const replicate = new Replicate({ auth: token });

  // Ensure output directories exist
  fs.mkdirSync(DEBUG_DIR, { recursive: true });

  console.log('=== City Background PNGs ===\n');

  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i];
    const step = `[${i + 1}/${CITIES.length}]`;

    const rawPath = path.join(DEBUG_DIR, `${city.name}-bg-raw.png`);
    const outPath = path.join(OUT_DIR, city.filename);

    console.log(`${step} Generating ${city.name} background with nanobanana...`);
    console.log(`  Prompt: ${city.prompt.slice(0, 80)}...`);

    const imgOutput = await replicate.run(NANOBANANA_MODEL, {
      input: {
        prompt: city.prompt,
        aspect_ratio: '9:16',
        output_format: 'png',
      },
    });
    const imgData = await extractFileData(imgOutput);

    // Save raw debug copy + final output
    fs.writeFileSync(rawPath, imgData);
    fs.writeFileSync(outPath, imgData);

    const size = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`${step} Done: ${outPath} (${size} KB)\n`);
  }

  console.log('All city background PNGs generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
