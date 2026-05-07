import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

let projectId: string;
let entityTypeId: string;
let viewsUrl: string;

test.beforeAll(async ({ request }) => {
    const projectRes = await request.post('/api/v1/projects', {
        data: { name: testName('View CRUD Test Project') }
    });
    const { data: project } = await projectRes.json();
    projectId = project.id;
    viewsUrl = `/api/v1/projects/${projectId}/views`;

    const entityTypeRes = await request.post(`/api/v1/projects/${projectId}/entity-types`, {
        data: { name: 'Service' }
    });
    entityTypeId = (await entityTypeRes.json()).data.id;
});

test('should create a view with no filter', async ({ request }) => {
    const res = await request.post(viewsUrl, { data: { name: 'All Services' } });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.projectId).toBe(projectId);
    expect(data.name).toBe('All Services');
    expect(data.filter.entityTypeIds).toEqual([]);
    expect(data.filter.relationshipTypeIds).toEqual([]);
    expect(data.positions).toEqual({});
});

test('should create a view with an entity type filter', async ({ request }) => {
    const res = await request.post(viewsUrl, {
        data: {
            name: 'Services Only',
            filter: { entityTypeIds: [entityTypeId], relationshipTypeIds: [] }
        }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.filter.entityTypeIds).toEqual([entityTypeId]);
});

test('should not create a view without a name', async ({ request }) => {
    const res = await request.post(viewsUrl, { data: {} });
    expect(res.status()).toBe(400);
});

test('should list views for a project', async ({ request }) => {
    const res = await request.get(viewsUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
});

test('should get a view by id', async ({ request }) => {
    const createRes = await request.post(viewsUrl, { data: { name: 'Get By ID View' } });
    const { data: created } = await createRes.json();

    const res = await request.get(`${viewsUrl}/${created.id}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe('Get By ID View');
});

test('should return 404 for a non-existent view', async ({ request }) => {
    const res = await request.get(`${viewsUrl}/does-not-exist`);
    expect(res.status()).toBe(404);
});

test('should update a view name and filter', async ({ request }) => {
    const createRes = await request.post(viewsUrl, { data: { name: 'Original Name' } });
    const { data: created } = await createRes.json();

    const res = await request.patch(`${viewsUrl}/${created.id}`, {
        data: {
            name: 'Updated Name',
            filter: { entityTypeIds: [entityTypeId], relationshipTypeIds: [] }
        }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Updated Name');
    expect(data.filter.entityTypeIds).toEqual([entityTypeId]);
});

test('should return 404 when updating a non-existent view', async ({ request }) => {
    const res = await request.patch(`${viewsUrl}/does-not-exist`, { data: { name: 'X' } });
    expect(res.status()).toBe(404);
});

test('should save and retrieve positions', async ({ request }) => {
    const createRes = await request.post(viewsUrl, { data: { name: 'Position Test View' } });
    const { data: created } = await createRes.json();

    const positions = {
        'entity-1': { x: 100, y: 200 },
        'entity-2': { x: 300, y: 400 }
    };

    const putRes = await request.put(`${viewsUrl}/${created.id}/positions`, {
        data: { positions }
    });
    expect(putRes.status()).toBe(200);
    const { data: updated } = await putRes.json();
    expect(updated.positions['entity-1']).toEqual({ x: 100, y: 200 });
    expect(updated.positions['entity-2']).toEqual({ x: 300, y: 400 });
});

test('should return 404 when saving positions for a non-existent view', async ({ request }) => {
    const res = await request.put(`${viewsUrl}/does-not-exist/positions`, {
        data: { positions: {} }
    });
    expect(res.status()).toBe(404);
});

test('should delete a view', async ({ request }) => {
    const createRes = await request.post(viewsUrl, { data: { name: 'To Delete' } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${viewsUrl}/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const getRes = await request.get(`${viewsUrl}/${created.id}`);
    expect(getRes.status()).toBe(404);
});

test('should return 404 when deleting a non-existent view', async ({ request }) => {
    const res = await request.delete(`${viewsUrl}/does-not-exist`);
    expect(res.status()).toBe(404);
});
