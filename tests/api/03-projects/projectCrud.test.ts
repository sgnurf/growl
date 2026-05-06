import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

const BASE = '/api/v1/projects';

test('should create a project', async ({ request }) => {
    const name = testName('Alpha');
    const res = await request.post(BASE, {
        data: { name, description: 'A test project' }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe(name);
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
    const name = testName('List Test Project');
    await request.post(BASE, { data: { name } });

    const res = await request.get(BASE);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: { name: string }) => p.name === name)).toBe(true);
});

test('should get a project by id', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: testName('Get Test Project') } });
    const { data: created } = await createRes.json();

    const res = await request.get(`${BASE}/${created.id}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe(created.id);
});

test('should return 404 for a non-existent project', async ({ request }) => {
    const res = await request.get(`${BASE}/does-not-exist`);
    expect(res.status()).toBe(404);
});

test('should update a project name and description', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: testName('Original Name') } });
    const { data: created } = await createRes.json();

    const updatedName = testName('Updated Name');
    const res = await request.patch(`${BASE}/${created.id}`, {
        data: { name: updatedName, description: 'Updated description' }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe(updatedName);
    expect(data.description).toBe('Updated description');
});

test('should delete a project and then return 404 on get', async ({ request }) => {
    const createRes = await request.post(BASE, { data: { name: testName('Project To Delete') } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${BASE}/${created.id}`);
    expect(deleteRes.status()).toBe(200);
    expect((await deleteRes.json()).data.deleted).toBe(true);

    const getRes = await request.get(`${BASE}/${created.id}`);
    expect(getRes.status()).toBe(404);
});
