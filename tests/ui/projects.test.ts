import { expect, test } from '@playwright/test';
import { testName } from '../testConfig';

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
    await page.getByLabel('Project name').fill(testName('UI Created Project'));
    await page.getByLabel('Description').fill('Created by UI test');
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page).toHaveURL(/\/projects\/.+\/schema/);
});

test('created project appears in the project list', async ({ page, request }) => {
    const name = testName('Listed UI Project');
    await request.post('/api/v1/projects', {
        data: { name, description: 'Should appear in list' }
    });

    await page.goto('/');
    // getByText scopes to exact name so it's unique within this test run
    await expect(page.getByText(name).first()).toBeVisible();
});
