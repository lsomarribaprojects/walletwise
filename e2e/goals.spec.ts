import { test, expect } from '@playwright/test'

test.describe('Goals Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/goals')

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})

test.describe('Budgets Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/budgets')

    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})

test.describe('Reports Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/reports')

    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})

test.describe('Notifications Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/notifications')

    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})

test.describe('Credit Score Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/credit-score')

    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})
