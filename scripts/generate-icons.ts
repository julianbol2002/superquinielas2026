import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "public/icon.png");
const ICONS_DIR = join(ROOT, "public/icons");

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;
const FAVICON_SIZES = [16, 32, 48] as const;

async function generateOpenGraphImage() {
  const icon = await sharp(SOURCE).resize(120, 120).png().toBuffer();
  const textOverlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <text x="600" y="360" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#f0f0f0" letter-spacing="4">SUPER QUINIELAS</text>
      <text x="600" y="410" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#666666">Mundial 2026 · Quiniela Familiar</text>
    </svg>
  `);

  const ogPath = join(ROOT, "app/opengraph-image.png");
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .composite([
      { input: icon, top: 150, left: 540 },
      { input: textOverlay, top: 0, left: 0 },
    ])
    .png()
    .toFile(ogPath);

  console.log(`Wrote ${ogPath}`);
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  for (const size of PWA_SIZES) {
    const out = join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE).resize(size, size).png().toFile(out);
    console.log(`Wrote ${out}`);
  }

  const faviconBuffers = await Promise.all(
    FAVICON_SIZES.map((size) =>
      sharp(SOURCE).resize(size, size).png().toBuffer()
    )
  );

  const ico = await toIco(faviconBuffers);
  const faviconPath = join(ROOT, "public/favicon.ico");
  await writeFile(faviconPath, ico);
  console.log(`Wrote ${faviconPath}`);

  await generateOpenGraphImage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
