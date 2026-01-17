import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check page title and form elements
    await expect(page.locator('h1, h2').first()).toContainText(/iniciar sesión|login/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('h1, h2').first()).toContainText(/crear cuenta|registr|signup/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('text=/error|invalid|incorrecto/i')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login')

    // Find link to signup
    const signupLink = page.locator('a[href*="signup"], button:has-text("Crear cuenta"), a:has-text("Registrar")')
    await signupLink.first().click()

    await expect(page).toHaveURL(/signup/)
  })

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login')

    const forgotLink = page.locator('a[href*="forgot"], a:has-text("Olvidé"), a:has-text("Forgot")')
    await expect(forgotLink.first()).toBeVisible()
  })
})
