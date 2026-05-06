import { expect, test } from '@playwright/test';

test('project list shows heading and new project button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New project' })).toBeVisible();
});

test('clicking new project reveals the create form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New project' }).click();
    await expect(page.getByLabel('Project name')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create project' })).toBeVisible();
});

test('clicking cancel hides the form again', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('Project name')).not.toBeVisible();
});

test('creating a project navigates to its schema page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByLabel('Project name').fill('UI Test Project');
    await page.getByLabel('Description').fill('Created by UI test');
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page).toHaveURL(/\/projects\/.+\/schema/);
    await expect(page.getByRole('heading', { name: 'UI Test Project' })).toBeVisible();
});

test('created project appears in the project list', async ({ page, request }) => {
    await request.post('/api/v1/projects', {
        data: { name: 'Listed UI Project', description: 'Should appear in list' }
    });

    await page.goto('/');
    await expect(page.getByText('Listed UI Project')).toBeVisible();
});
