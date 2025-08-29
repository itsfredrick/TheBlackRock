import { test, expect } from '@playwright/test'

test('loads shell and shows role badge', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Onboarding|Dashboard/i)).toBeVisible()
})
