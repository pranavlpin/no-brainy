// Generates PWA icons from public/icon.svg.
// Run once: NODE_PATH=node_modules/.pnpm/node_modules node scripts/generate-icons.cjs
const sharp = require('sharp')
const { mkdir, writeFile } = require('node:fs/promises')

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

  // favicon.ico: a 32 px PNG wrapped in an ICO container (supported by every modern browser).
  const png32 = await sharp('public/icon.svg').resize(32, 32).png().toBuffer()
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  const entry = Buffer.alloc(16)
  entry.writeUInt8(32, 0) // width
  entry.writeUInt8(32, 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png32.length, 8) // image size
  entry.writeUInt32LE(6 + 16, 12) // image offset
  await writeFile('public/favicon.ico', Buffer.concat([header, entry, png32]))
  console.log('wrote public/favicon.ico')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
