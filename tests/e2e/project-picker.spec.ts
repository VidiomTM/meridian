import { test, expect } from '@playwright/test';

test('homepage shows project picker shell', async ({ page }) => {
	await page.goto('/');
	// App shell visible
	await expect(page.locator('.topbar')).toBeVisible();
	await expect(page.locator('.statusbar')).toBeVisible();
	// Breadcrumb shows "Meridian"
	await expect(page.getByRole('link', { name: 'Meridian' })).toBeVisible();
	// Picker heading visible
	await expect(
		page.getByRole('heading', { name: /choose a project/i }),
	).toBeVisible();
});

test('project picker shows empty state when no projects found', async ({
	page,
}) => {
	await page.goto('/');
	// Empty state message
	await expect(
		page.getByRole('heading', { name: /no openspec workspaces found/i }),
	).toBeVisible();
	// No project cards rendered
	await expect(page.locator('.picker-card')).toHaveCount(0);
	// Keyboard shortcut hint present
	await expect(page.getByText(/⌘K/)).toBeVisible();
});

test('search input is not shown when no projects exist', async ({ page }) => {
	await page.goto('/');
	// Search should not be rendered when there are no projects at all
	await expect(
		page.getByRole('searchbox', { name: /filter projects/i }),
	).toHaveCount(0);
});
