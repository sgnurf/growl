import { expect, test } from '@playwright/test';

test('homepage has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
