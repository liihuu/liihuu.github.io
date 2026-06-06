import sharp from 'sharp'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const avatarPath = join(root, 'public/avatar.jpg')
const outputPath = join(root, 'public/og-image.jpg')

const width = 1200
const height = 630
const avatarSize = 280
const avatarX = 100
const avatarY = Math.round((height - avatarSize) / 2)

const candlesticks = Array.from({ length: 48 }, (_, i) => {
  const x = 40 + i * 26
  const body = 28 + Math.abs(Math.sin(i * 0.45)) * 90 + Math.abs(Math.cos(i * 0.22)) * 40
  const y = 430 - body / 2 + Math.sin(i * 0.35) * 30
  const opacity = 0.06 + (Math.sin(i * 0.7) + 1) * 0.04
  const wickTop = y - 18 - Math.abs(Math.sin(i)) * 12
  const wickBottom = y + body + 18 + Math.abs(Math.cos(i)) * 12
  return `
    <line x1="${x + 6}" y1="${wickTop}" x2="${x + 6}" y2="${wickBottom}" stroke="rgba(147,197,253,${opacity.toFixed(3)})" stroke-width="2"/>
    <rect x="${x}" y="${y.toFixed(1)}" width="12" height="${body.toFixed(1)}" rx="2" fill="rgba(147,197,253,${(opacity + 0.04).toFixed(3)})"/>
  `
}).join('')

const backgroundSvg = Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="18%" cy="50%" r="45%">
      <stop offset="0%" stop-color="rgba(147,197,253,0.12)"/>
      <stop offset="100%" stop-color="rgba(2,2,8,0)"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#020208"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  ${candlesticks}
  <text x="440" y="268" fill="#f2f4ff" font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif" font-size="72" font-weight="700">liihuu</text>
  <text x="440" y="340" fill="#b0b0b8" font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif" font-size="34">前端开发工程师 · KLineChart 作者</text>
  <text x="440" y="400" fill="#93c5fd" font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif" font-size="30">金融前端 · 数据可视化</text>
</svg>
`)

const avatarMask = Buffer.from(`
<svg width="${avatarSize}" height="${avatarSize}">
  <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2 - 4}" fill="white"/>
</svg>
`)

const avatarRing = Buffer.from(`
<svg width="${avatarSize + 8}" height="${avatarSize + 8}">
  <circle cx="${(avatarSize + 8) / 2}" cy="${(avatarSize + 8) / 2}" r="${avatarSize / 2 + 2}" fill="none" stroke="rgba(147,197,253,0.55)" stroke-width="3"/>
</svg>
`)

const roundedAvatar = await sharp(avatarPath)
  .resize(avatarSize, avatarSize, { fit: 'cover', position: 'centre' })
  .composite([{ input: avatarMask, blend: 'dest-in' }])
  .png()
  .toBuffer()

await sharp(backgroundSvg)
  .composite([
    { input: avatarRing, left: avatarX - 4, top: avatarY - 4 },
    { input: roundedAvatar, left: avatarX, top: avatarY }
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(outputPath)

console.log(`Generated ${outputPath}`)
