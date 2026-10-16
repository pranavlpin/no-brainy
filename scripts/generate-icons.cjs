// Generates PWA icons from public/icon.svg.
// Run once: NODE_PATH=node_modules/.pnpm/node_modules node scripts/generate-icons.cjs
const sharp = require('sharp')
const { mkdir } = require('node:fs/promises')

const sizes = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/maskable-512.png', size: 512, pad: 64 },
  { file: 'public/icons/apple-touch-icon.png', size: 180 },
]

async function main() {
  await mkdir('public/icons', { recursive: true })
  for (const { file, size, pad = 0 } of sizes) {
    const inner = size - pad * 2
    const svg = await sharp('public/icon.svg').resize(inner, inner).png().toBuffer()
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 27, g: 29, b: 51, alpha: pad ? 1 : 0 },
      },
    })
      .composite([{ input: svg, left: pad, top: pad }])
      .png()
      .toFile(file)
    console.log('wrote', file)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
