import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  // These tests require authentication - skipped for now
  // In a real scenario, you'd set up auth state

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('should load home page', async ({ page }) => {
    await page.goto('/')

    // Check that page loads without errors
    await expect(page).not.toHaveURL(/error/)
  })
})

test.describe('Dashboard - Authenticated', () => {
  // Use test.use to set up authenticated state
  test.use({
    storageState: {
      cookies: [],
      origins: [],
    },
  })

  test.skip('should display dashboard metrics', async ({ page }) => {
    // This test would require setting up auth
    await page.goto('/dashboard')

    await expect(page.locator('text=/balance|saldo/i')).toBeVisible()
  })
})
