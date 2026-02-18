import Replicate from 'replicate';
import fs from 'node:fs';
import path from 'node:path';

// ── Config ──────────────────────────────────────────────────────────

const NANOBANANA_MODEL = 'google/nano-banana' as const;

const __dirname = decodeURIComponent(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.resolve(__dirname, '../public/sprites/game');
const DEBUG_DIR = path.join(OUT_DIR, 'debug');

const GAME_BG_PROMPT =
  '8-bit retro pixel art, flat digital display, 9:16 aspect ratio. ' +
  'Monochrome cyan color palette on a dark black background. ' +
  'A wide New York City street at night, first-person perspective looking down the street. ' +
  'Tall apartment buildings and brownstones line both sides, fire escapes and neon signs visible. ' +
  'Wet pavement reflects dim cyan and amber lights. Street lamps cast pools of light. ' +
  'No people, no characters — empty atmospheric street scene. ' +
  'Trash bags on sidewalks, steam rising from grates, distant city skyline. ' +
  'Dark, moody tones with high-contrast lighting. ' +
  'Gritty retro game style, no text, no CRT screen curvature.';

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

  console.log('=== Game Background PNG ===\n');

  // Generate image with nanobanana
  const rawPath = path.join(DEBUG_DIR, 'nyc-street-bg-raw.png');
  const outPath = path.join(OUT_DIR, 'nyc-street-bg.png');

  console.log('[1/1] Generating background with nanobanana...');
  console.log(`  Prompt: ${GAME_BG_PROMPT.slice(0, 80)}...`);

  const imgOutput = await replicate.run(NANOBANANA_MODEL, {
    input: {
      prompt: GAME_BG_PROMPT,
      aspect_ratio: '9:16',
      output_format: 'png',
    },
  });
  const imgData = await extractFileData(imgOutput);

  // Save raw debug copy + final output
  fs.writeFileSync(rawPath, imgData);
  fs.writeFileSync(outPath, imgData);

  const size = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`[1/1] Done: ${outPath} (${size} KB)`);

  console.log('\nGame background PNG generated successfully!');
  console.log(`Output: ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
