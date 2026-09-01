import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

let projectId: string;
let sourceEntityTypeId: string;
let targetEntityTypeId: string;
let relationshipTypesUrl: string;
let representationId: string;

test.beforeAll(async ({ request }) => {
    const projectRes = await request.post('/api/v1/projects', {
        data: { name: testName('Relationship Type Test Project') }
    });
    const { data: project } = await projectRes.json();
    projectId = project.id;
    relationshipTypesUrl = `/api/v1/projects/${projectId}/relationship-types`;

    const entityTypesUrl = `/api/v1/projects/${projectId}/entity-types`;
    const sourceRes = await request.post(entityTypesUrl, { data: { name: 'Container' } });
    const targetRes = await request.post(entityTypesUrl, { data: { name: 'Software System' } });
    sourceEntityTypeId = (await sourceRes.json()).data.id;
    targetEntityTypeId = (await targetRes.json()).data.id;

    const librariesUrl = `/api/v1/projects/${projectId}/representation-libraries`;
    const libraryRes = await request.post(librariesUrl, { data: { name: 'Test Library' } });
    const { data: library } = await libraryRes.json();
    const updateRes = await request.patch(`${librariesUrl}/${library.id}`, {
        data: {
            relationshipRepresentations: [
                {
                    id: crypto.randomUUID(),
                    name: 'Test Line',
                    lineStyle: 'dashed',
                    color: 'red',
                    arrowhead: 'arrow',
                    labelFieldName: null
                }
            ]
        }
    });
    const { data: updatedLibrary } = await updateRes.json();
    representationId = updatedLibrary.relationshipRepresentations[0].id;
});

test('should create a relationship type', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, {
        data: { name: 'Uses', description: 'One component uses another' }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.name).toBe('Uses');
    expect(data.projectId).toBe(projectId);
    expect(data.sourceEntityTypeId).toBeNull();
    expect(data.targetEntityTypeId).toBeNull();
    expect(data.fields).toEqual([]);
});

test('should create a relationship type with source and target entity type constraints', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, {
        data: {
            name: 'Belongs To',
            sourceEntityTypeId: sourceEntityTypeId,
            targetEntityTypeId: targetEntityTypeId
        }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.sourceEntityTypeId).toBe(sourceEntityTypeId);
    expect(data.targetEntityTypeId).toBe(targetEntityTypeId);
});

test('should create a relationship type with fields', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, {
        data: {
            name: 'Depends On',
            fields: [{ name: 'protocol', type: 'string', required: false }]
        }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.fields).toHaveLength(1);
    expect(data.fields[0].name).toBe('protocol');
    expect(data.fields[0].id).toBeTruthy();
});

test('should not create a relationship type without a name', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, { data: { description: 'Missing name' } });
    expect(res.status()).toBe(400);
});

test('should list relationship types for a project', async ({ request }) => {
    await request.post(relationshipTypesUrl, { data: { name: 'Calls' } });

    const res = await request.get(relationshipTypesUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((rt: { name: string }) => rt.name === 'Calls')).toBe(true);
});

test('should update a relationship type', async ({ request }) => {
    const createRes = await request.post(relationshipTypesUrl, { data: { name: 'Interacts With' } });
    const { data: created } = await createRes.json();

    const res = await request.patch(`${relationshipTypesUrl}/${created.id}`, {
        data: {
            name: 'Interacts With (async)',
            sourceEntityTypeId: sourceEntityTypeId,
            fields: [{ id: crypto.randomUUID(), name: 'channel', type: 'string', required: false }]
        }
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Interacts With (async)');
    expect(data.sourceEntityTypeId).toBe(sourceEntityTypeId);
    expect(data.fields[0].name).toBe('channel');
});

test('should return 404 when updating a non-existent relationship type', async ({ request }) => {
    const res = await request.patch(`${relationshipTypesUrl}/does-not-exist`, { data: { name: 'X' } });
    expect(res.status()).toBe(404);
});

test('should default representationId to null when not provided', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, { data: { name: 'Unstyled Relationship' } });
    const { data } = await res.json();
    expect(data.representationId).toBeNull();
});

test('should create a relationship type with a representationId', async ({ request }) => {
    const res = await request.post(relationshipTypesUrl, {
        data: { name: 'Styled Relationship', representationId }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.representationId).toBe(representationId);
});

test('should set and clear a relationship type representationId', async ({ request }) => {
    const createRes = await request.post(relationshipTypesUrl, { data: { name: 'ToRestyle' } });
    const { data: created } = await createRes.json();

    const setRes = await request.patch(`${relationshipTypesUrl}/${created.id}`, {
        data: { representationId }
    });
    const { data: withRepresentation } = await setRes.json();
    expect(withRepresentation.representationId).toBe(representationId);

    const clearRes = await request.patch(`${relationshipTypesUrl}/${created.id}`, {
        data: { representationId: null }
    });
    const { data: cleared } = await clearRes.json();
    expect(cleared.representationId).toBeNull();
});

test('should delete a relationship type', async ({ request }) => {
    const createRes = await request.post(relationshipTypesUrl, { data: { name: 'ToDelete' } });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`${relationshipTypesUrl}/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const listRes = await request.get(relationshipTypesUrl);
    const { data } = await listRes.json();
    expect(data.some((rt: { id: string }) => rt.id === created.id)).toBe(false);
});
