import { expect, test } from '@playwright/test';
import { testName } from '../testConfig';

test('graph page shows mode buttons and entity type panel', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph UI Test Project') } });
    const { data: project } = await res.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, { data: { name: 'Service' } });

    await page.goto(`/projects/${project.id}`);

    await expect(page.getByRole('button', { name: 'Simulation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Static' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByText('Entity Types')).toBeVisible();
    await expect(page.getByText('Service')).toBeVisible();
});

test('entity types appear with add buttons in the side panel', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Panel Test') } });
    const { data: project } = await res.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, { data: { name: 'Database' } });
    await request.post(`/api/v1/projects/${project.id}/entity-types`, { data: { name: 'Person' } });

    await page.goto(`/projects/${project.id}`);

    await expect(page.getByText('Database')).toBeVisible();
    await expect(page.getByText('Person')).toBeVisible();

    const addButtons = page.getByRole('button', { name: '+ Add' });
    await expect(addButtons).toHaveCount(2);
});

test('clicking + Add opens the entity creation form', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Entity Form Test') } });
    const { data: project } = await res.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, {
        data: {
            name: 'Component',
            fields: [{ name: 'name', type: 'string', required: true }]
        }
    });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('button', { name: '+ Add' }).click();

    await expect(page.getByText('New Component')).toBeVisible();
    await expect(page.getByLabel('name *')).toBeVisible();
});

test('can create an entity and have it appear in the graph', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Create Entity Test') } });
    const { data: project } = await res.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, {
        data: {
            name: 'System',
            fields: [{ name: 'name', type: 'string', required: false }]
        }
    });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('button', { name: '+ Add' }).click();
    await page.getByLabel('name').fill('My System');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Entity Types')).toBeVisible();
    await expect(page.locator('svg')).toBeVisible();
});

test('cancel button in entity form returns to entity type list', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Cancel Test') } });
    const { data: project } = await res.json();

    await request.post(`/api/v1/projects/${project.id}/entity-types`, { data: { name: 'Actor' } });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByText('New Actor')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Entity Types')).toBeVisible();
    await expect(page.getByText('New Actor')).not.toBeVisible();
});

test('Edit mode shows hint text', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Edit Mode Test') } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByText('Drag from one node to another to draw a relationship.')).toBeVisible();
});

test('empty project shows no entities message', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Empty Graph Test') } });
    const { data: project } = await res.json();

    await page.goto(`/projects/${project.id}`);
    await expect(page.getByText('No entities yet')).toBeVisible();
});

test('pre-seeded entities appear in the graph canvas', async ({ page, request }) => {
    const res = await request.post('/api/v1/projects', { data: { name: testName('Graph Pre-seeded Test') } });
    const { data: project } = await res.json();

    const entityTypeRes = await request.post(`/api/v1/projects/${project.id}/entity-types`, {
        data: { name: 'Node', fields: [{ name: 'name', type: 'string', required: false }] }
    });
    const entityTypeId = (await entityTypeRes.json()).data.id;

    await request.post(`/api/v1/projects/${project.id}/entities`, {
        data: { entityTypeId, fieldValues: { name: 'Alpha' } }
    });

    await page.goto(`/projects/${project.id}`);
    await expect(page.getByText('No entities yet')).not.toBeVisible();
    await expect(page.locator('svg')).toBeVisible();
});
