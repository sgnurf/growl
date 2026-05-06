import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

let projectId: string;
let entityTypeId: string;
let entitiesUrl: string;

test.beforeAll(async ({ request }) => {
    const projectRes = await request.post('/api/v1/projects', {
        data: { name: testName('Entity CRUD Test Project') }
    });
    const { data: project } = await projectRes.json();
    projectId = project.id;
    entitiesUrl = `/api/v1/projects/${projectId}/entities`;

    const entityTypeRes = await request.post(`/api/v1/projects/${projectId}/entity-types`, {
        data: {
            name: 'Person',
            fields: [
                { name: 'name', type: 'string', required: true },
                { name: 'age', type: 'int', required: false }
            ]
        }
    });
    entityTypeId = (await entityTypeRes.json()).data.id;
});

test('should create an entity', async ({ request }) => {
    const res = await request.post(entitiesUrl, {
        data: { entityTypeId, fieldValues: { name: 'Alice', age: 30 } }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.projectId).toBe(projectId);
    expect(data.entityTypeId).toBe(entityTypeId);
    expect(data.fieldValues.name).toBe('Alice');
    expect(data.fieldValues.age).toBe(30);
});

test('should create an entity without fieldValues', async ({ request }) => {
    const res = await request.post(entitiesUrl, { data: { entityTypeId } });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.fieldValues).toEqual({});
});

test('should not create an entity without entityTypeId', async ({ request }) => {
    const res = await request.post(entitiesUrl, {
        data: { fieldValues: { name: 'Bob' } }
    });
    expect(res.status()).toBe(400);
});

test('should get an entity by id', async ({ request }) => {
    const createRes = await request.post(entitiesUrl, {
        data: { entityTypeId, fieldValues: { name: 'Carol' } }
    });
    const { data: created } = await createRes.json();

    const res = await request.get(`${entitiesUrl}/${created.id}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.fieldValues.name).toBe('Carol');
});

test('should return 404 for a non-existent entity', async ({ request }) => {
    const res = await request.get(`${entitiesUrl}/does-not-exist`);
    expect(res.status()).toBe(404);
});

test('should list entities for a project', async ({ request }) => {
    await request.post(entitiesUrl, {
        data: { entityTypeId, fieldValues: { name: 'Dave' } }
    });

    const res = await request.get(entitiesUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((e: { fieldValues: { name: string } }) => e.fieldValues.name === 'Dave')).toBe(true);
});

test('should update an entity', async ({ request }) => {
    const createRes = await request.post(entitiesUrl, {
        data: { entityTypeId, fieldValues: { name: 'Eve' } }
    });
    const { data: created } = await createRes.json();

    const res = await request.patch(`${entitiesUrl}/${created.id}`, {
        data: { fieldValues: { name: 'Eve Updated', age: 25 } }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.fieldValues.name).toBe('Eve Updated');
    expect(data.fieldValues.age).toBe(25);
});

test('should return 404 when updating a non-existent entity', async ({ request }) => {
    const res = await request.patch(`${entitiesUrl}/does-not-exist`, {
        data: { fieldValues: { name: 'X' } }
    });
    expect(res.status()).toBe(404);
});

test('should delete an entity', async ({ request }) => {
    const createRes = await request.post(entitiesUrl, {
        data: { entityTypeId, fieldValues: { name: 'ToDelete' } }
    });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${entitiesUrl}/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const getRes = await request.get(`${entitiesUrl}/${created.id}`);
    expect(getRes.status()).toBe(404);
});
