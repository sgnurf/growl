import { expect, test } from '@playwright/test';

const BASE = '/api/v1/projects';

test('should create a project', async ({ request }) => {
    const res = await request.post(BASE, {
        data: { name: 'Test Project Alpha', description: 'A test project' }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe('Test Project Alpha');
    expect(data.description).toBe('A test project');
    expect(data.createdAt).toBeTruthy();
    expect(data.updatedAt).toBeTruthy();
});

test('should not create a project without a name', async ({ request }) => {
    const res = await request.post(BASE, { data: { description: 'No name here' } });
    expect(res.status()).toBe(400);
    const { error } = await res.json();
    expect(error.message).toBeTruthy();
});

test('should list projects including recently created ones', async ({ request }) => {
    await request.post(BASE, { data: { name: 'List Test Project' } });

    const res = await request.get(BASE);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: { name: string }) => p.name === 'List Test Project')).toBe(true);
});

test('should get a project by id', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: 'Get Test Project' } });
    const { data: created } = await createRes.json();

    const res = await request.get(`${BASE}/${created.id}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe('Get Test Project');
});

test('should return 404 for a non-existent project', async ({ request }) => {
    const res = await request.get(`${BASE}/does-not-exist`);
    expect(res.status()).toBe(404);
});

test('should update a project name and description', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: 'Original Name' } });
    const { data: created } = await createRes.json();

    const res = await request.patch(`${BASE}/${created.id}`, {
        data: { name: 'Updated Name', description: 'Updated description' }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Updated Name');
    expect(data.description).toBe('Updated description');
});

test('should delete a project and then return 404 on get', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: 'Project To Delete' } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${BASE}/${created.id}`);
    expect(deleteRes.status()).toBe(200);
    expect((await deleteRes.json()).data.deleted).toBe(true);

    const getRes = await request.get(`${BASE}/${created.id}`);
    expect(getRes.status()).toBe(404);
});
