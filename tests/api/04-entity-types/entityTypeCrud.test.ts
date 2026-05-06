import { expect, test } from '@playwright/test';

let projectId: string;
let etBase: string;

test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/v1/projects', {
        data: { name: 'Entity Type Test Project' }
    });
    const { data } = await res.json();
    projectId = data.id;
    etBase = `/api/v1/projects/${projectId}/entity-types`;
});

test('should create an entity type', async ({ request }) => {
    const res = await request.post(etBase, {
        data: { name: 'Software System', description: 'A top-level software system' }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe('Software System');
    expect(data.projectId).toBe(projectId);
    expect(data.description).toBe('A top-level software system');
    expect(data.fields).toEqual([]);
});

test('should create an entity type with fields and assign ids to each field', async ({ request }) => {
    const res = await request.post(etBase, {
        data: {
            name: 'Container',
            fields: [
                { name: 'technology', type: 'string', required: false },
                { name: 'description', type: 'string', required: true }
            ]
        }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.fields).toHaveLength(2);
    expect(data.fields[0].name).toBe('technology');
    expect(data.fields[0].type).toBe('string');
    expect(data.fields[0].required).toBe(false);
    expect(data.fields[1].required).toBe(true);
    data.fields.forEach((f: { id: string }) => expect(f.id).toBeTruthy());
});

test('should not create an entity type without a name', async ({ request }) => {
    const res = await request.post(etBase, { data: { description: 'Missing name' } });
    expect(res.status()).toBe(400);
});

test('should list entity types for a project', async ({ request }) => {
    await request.post(etBase, { data: { name: 'Person' } });

    const res = await request.get(etBase);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((et: { name: string }) => et.name === 'Person')).toBe(true);
});

test('should update an entity type name, description and fields', async ({ request }) => {
    const createRes = await request.post(etBase, { data: { name: 'Component' } });
    const { data: created } = await createRes.json();

    const res = await request.patch(`${etBase}/${created.id}`, {
        data: {
            name: 'Component (updated)',
            description: 'Now with a description',
            fields: [{ id: crypto.randomUUID(), name: 'title', type: 'string', required: true }]
        }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Component (updated)');
    expect(data.description).toBe('Now with a description');
    expect(data.fields[0].name).toBe('title');
    expect(data.fields[0].required).toBe(true);
});

test('should return 404 when updating a non-existent entity type', async ({ request }) => {
    const res = await request.patch(`${etBase}/does-not-exist`, { data: { name: 'X' } });
    expect(res.status()).toBe(404);
});

test('should delete an entity type', async ({ request }) => {
    const createRes = await request.post(etBase, { data: { name: 'ToDelete' } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${etBase}/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const listRes = await request.get(etBase);
    const { data } = await listRes.json();
    expect(data.some((et: { id: string }) => et.id === created.id)).toBe(false);
});
