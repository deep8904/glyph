import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const pages = [
  { url: 'http://localhost:3000', name: 'landing' },
  { url: 'http://localhost:3000/signup', name: 'signup' },
  { url: 'http://localhost:3000/login', name: 'login' },
]

;(async () => {
  const dir = path.join(process.cwd(), 'screenshots')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const browser = await chromium.launch()

  for (const p of pages) {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(p.url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500) // allow GSAP to settle
    await page.screenshot({ path: path.join(dir, `${p.name}.png`), fullPage: true })
    console.log(`✓ ${p.name} → screenshots/${p.name}.png`)
    await page.close()
  }

  await browser.close()
  console.log('\nDone. Open screenshots/ to review.')
})()
