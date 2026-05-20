import { test, expect } from '@playwright/test';

test('homepage shows project picker', async ({ page }) => {
	await page.goto('/');
	// Should have the app shell and topbar
	await expect(page.locator('.topbar')).toBeVisible();
	// Should show the picker heading
	await expect(page.getByRole('heading', { name: /choose a project/i })).toBeVisible();
	// Status bar should be visible
	await expect(page.locator('.statusbar')).toBeVisible();
	// Breadcrumb should show "Meridian"
	await expect(page.getByRole('link', { name: 'Meridian' })).toBeVisible();
});

test('project picker shows empty state', async ({ page }) => {
	await page.goto('/');
	// No project cards rendered when no projects
	await expect(page.locator('.picker-card')).toHaveCount(0);
	// The search hint should be present
	await expect(page.getByText(/⌘K/)).toBeVisible();
});
