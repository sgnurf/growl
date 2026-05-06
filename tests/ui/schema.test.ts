import { expect, test } from '@playwright/test';

test('schema page shows project name and both tabs', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', {
        data: { name: 'Schema UI Test Project' }
    });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}/schema`);
    await expect(page.getByRole('heading', { name: 'Schema UI Test Project' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entity Types' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Relationship Types' })).toBeVisible();
});

test('entity types tab is active by default and shows add button', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: 'Schema Tab Test' } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}/schema`);
    await expect(page.getByRole('button', { name: 'Add entity type' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add relationship type' })).not.toBeVisible();
});

test('clicking relationship types tab shows its add button', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: 'Schema Tab Switch Test' } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}/schema`);
    await page.getByRole('button', { name: 'Relationship Types' }).click();
    await expect(page.getByRole('button', { name: 'Add relationship type' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add entity type' })).not.toBeVisible();
});

test('can open and cancel the entity type form', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: 'Entity Form Test' } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}/schema`);
    await page.getByRole('button', { name: 'Add entity type' }).click();
    await expect(page.getByLabel('Name')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('Name')).not.toBeVisible();
});

test('can create an entity type and see it in the list', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: 'Entity Create Test' } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}/schema`);
    await page.getByRole('button', { name: 'Add entity type' }).click();
    await page.getByLabel('Name').fill('Software System');
    await page.getByLabel('Description').fill('A top-level system');
    await page.getByRole('button', { name: 'Create entity type' }).click();

    await expect(page.getByText('Software System')).toBeVisible();
});

test('existing entity types created via API appear in the list', async ({ page, request }) => {
    const projectRes = await request.post('/api/v1/projects', { data: { name: 'Pre-seeded Schema Test' } });
    const { data: project } = await projectRes.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, {
        data: { name: 'Container', description: 'A deployable unit' }
    });

    await page.goto(`/projects/${project.id}/schema`);
    await expect(page.getByText('Container')).toBeVisible();
    await expect(page.getByText('A deployable unit')).toBeVisible();
});
