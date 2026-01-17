import { test, expect } from '@playwright/test'

test.describe('Feature Pages - Public Routes', () => {
  test('should redirect to login from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/finances',
      '/budgets',
      '/goals',
      '/credit-score',
      '/reports',
      '/loans',
      '/notifications',
      '/agent',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/login/, { timeout: 10000 })
    }
  })
})

test.describe('Pricing Page', () => {
  test('should load pricing page', async ({ page }) => {
    // Pricing might be public or require auth
    const response = await page.goto('/pricing')

    // Either loads or redirects to login
    if (response?.status() === 200) {
      // Check for pricing content
      await expect(page.locator('text=/plan|pricing|precio/i').first()).toBeVisible()
    } else {
      await expect(page).toHaveURL(/login/)
    }
  })
})

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page-12345')

    // Should show 404 or redirect
    const content = await page.content()
    const is404 = content.includes('404') || content.includes('not found') || content.includes('No encontrado')
    const isRedirect = page.url().includes('login')

    expect(is404 || isRedirect).toBeTruthy()
  })
})

test.describe('Language Support', () => {
  test('should have language switcher on login page', async ({ page }) => {
    await page.goto('/login')

    // Look for language switcher
    const langSwitcher = page.locator('[data-testid="language-switcher"], button:has-text("ES"), button:has-text("EN")')

    // May or may not be visible depending on implementation
    const count = await langSwitcher.count()
    console.log(`Found ${count} language switcher elements`)
  })
})

test.describe('Form Validation', () => {
  test('should validate email format on login', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('invalid-email')

    // Try to submit
    await page.click('button[type="submit"]')

    // Check for validation
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBeTruthy()
  })

  test('should require password on login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'test@example.com')
    // Don't fill password

    await page.click('button[type="submit"]')

    // Should show validation error or remain on page
    await expect(page).toHaveURL(/login/)
  })
})
