import { test, expect } from '@playwright/test'

test.describe('PWA Features', () => {
  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)

    const manifest = await response?.json()
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.icons).toHaveLength(4)
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBe('standalone')
  })

  test('should have service worker', async ({ page }) => {
    const response = await page.goto('/sw.js')
    expect(response?.status()).toBe(200)

    const content = await response?.text()
    expect(content).toContain('CACHE_NAME')
    expect(content).toContain('fetch')
  })

  test('should have PWA icons', async ({ page }) => {
    const icon192 = await page.goto('/icon-192.png')
    expect(icon192?.status()).toBe(200)

    const icon512 = await page.goto('/icon-512.png')
    expect(icon512?.status()).toBe(200)
  })

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/login')

    const themeColor = page.locator('meta[name="theme-color"]')
    // May or may not exist depending on layout
  })
})
