import { test, expect } from '@playwright/test';

test('navigating to a project page shows breadcrumb', async ({ page }) => {
	await page.goto('/some-project');
	// Should show the project in the breadcrumb
	await expect(page.getByRole('link', { name: 'some-project' })).toBeVisible();
	// Explorer sidebar should be visible (no-rails class removed on project pages)
	await expect(page.locator('.topbar')).toBeVisible();
});

test('navigating to a doc page shows page structure', async ({ page }) => {
	await page.goto('/some-project/some-doc');
	// Should have breadcrumb navigation
	await expect(page.getByRole('link', { name: 'Meridian' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'some-project' })).toBeVisible();
	// Topbar search should be visible
	await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
});
