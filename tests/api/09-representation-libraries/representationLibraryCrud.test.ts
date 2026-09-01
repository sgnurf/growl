import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

let projectId: string;
let librariesUrl: string;

test.beforeAll(async ({ request }) => {
    const projectRes = await request.post('/api/v1/projects', {
        data: { name: testName('Representation Library Test Project') }
    });
    const { data: project } = await projectRes.json();
    projectId = project.id;
    librariesUrl = `/api/v1/projects/${projectId}/representation-libraries`;
});

test('project creation seeds a default representation library', async ({ request }) => {
    const res = await request.get(librariesUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);

    const defaultLibrary = data.find((l: { name: string }) => l.name === 'Default');
    expect(defaultLibrary).toBeTruthy();
    expect(defaultLibrary.entityRepresentations.length).toBe(4);
    expect(defaultLibrary.relationshipRepresentations.length).toBe(1);
});

test('should create a representation library with empty representations', async ({ request }) => {
    const res = await request.post(librariesUrl, { data: { name: 'Custom Library' } });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.projectId).toBe(projectId);
    expect(data.name).toBe('Custom Library');
    expect(data.entityRepresentations).toEqual([]);
    expect(data.relationshipRepresentations).toEqual([]);
});

test('should not create a representation library without a name', async ({ request }) => {
    const res = await request.post(librariesUrl, { data: {} });
    expect(res.status()).toBe(400);
});

test('should list representation libraries for a project', async ({ request }) => {
    await request.post(librariesUrl, { data: { name: 'Listed Library' } });

    const res = await request.get(librariesUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.some((l: { name: string }) => l.name === 'Listed Library')).toBe(true);
});

test('should get a representation library by id', async ({ request }) => {
    const createRes = await request.post(librariesUrl, { data: { name: 'Get By ID Library' } });
    const { data: created } = await createRes.json();

    const res = await request.get(`${librariesUrl}/${created.id}`);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe('Get By ID Library');
});

test('should return 404 for a non-existent representation library', async ({ request }) => {
    const res = await request.get(`${librariesUrl}/does-not-exist`);
    expect(res.status()).toBe(404);
});

test('should update a library name and its representations', async ({ request }) => {
    const createRes = await request.post(librariesUrl, { data: { name: 'Original Name' } });
    const { data: created } = await createRes.json();

    const entityRepresentations = [
        {
            id: crypto.randomUUID(),
            name: 'Green Square',
            shapeType: 'square',
            shapeProps: { size: 12, color: 'green' },
            labelFieldName: 'name'
        }
    ];
    const relationshipRepresentations = [
        {
            id: crypto.randomUUID(),
            name: 'Dashed Red',
            lineStyle: 'dashed',
            color: 'red',
            arrowhead: 'arrow',
            labelFieldName: null
        }
    ];

    const res = await request.patch(`${librariesUrl}/${created.id}`, {
        data: { name: 'Updated Name', entityRepresentations, relationshipRepresentations }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Updated Name');
    expect(data.entityRepresentations).toHaveLength(1);
    expect(data.entityRepresentations[0].shapeType).toBe('square');
    expect(data.relationshipRepresentations).toHaveLength(1);
    expect(data.relationshipRepresentations[0].lineStyle).toBe('dashed');
});

test('should return 404 when updating a non-existent representation library', async ({
    request
}) => {
    const res = await request.patch(`${librariesUrl}/does-not-exist`, { data: { name: 'X' } });
    expect(res.status()).toBe(404);
});

test('should delete a representation library', async ({ request }) => {
    const createRes = await request.post(librariesUrl, { data: { name: 'To Delete' } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${librariesUrl}/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const getRes = await request.get(`${librariesUrl}/${created.id}`);
    expect(getRes.status()).toBe(404);
});

test('should return 404 when deleting a non-existent representation library', async ({
    request
}) => {
    const res = await request.delete(`${librariesUrl}/does-not-exist`);
    expect(res.status()).toBe(404);
});
