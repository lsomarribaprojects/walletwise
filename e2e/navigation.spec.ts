import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load login page', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('should load signup page', async ({ page }) => {
    const response = await page.goto('/signup')
    expect(response?.status()).toBe(200)
  })

  test('should load forgot password page', async ({ page }) => {
    const response = await page.goto('/forgot-password')
    expect(response?.status()).toBe(200)
  })

  test('should have responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Check that form is visible and properly sized
    const form = page.locator('form')
    await expect(form).toBeVisible()

    const formBox = await form.boundingBox()
    expect(formBox?.width).toBeLessThanOrEqual(375)
  })
})

test.describe('SEO & Meta', () => {
  test('should have meta viewport for mobile', async ({ page }) => {
    await page.goto('/login')

    const viewport = await page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/)
  })

  test('should have page title', async ({ page }) => {
    await page.goto('/login')

    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
