import { expect, test } from '@playwright/test';
import { testName } from '../../testConfig';

let projectId: string;
let sourceEntityTypeId: string;
let targetEntityTypeId: string;
let relationshipTypeId: string;
let sourceEntityId: string;
let targetEntityId: string;
let relationshipsUrl: string;

test.beforeAll(async ({ request }) => {
    const projectRes = await request.post('/api/v1/projects', {
        data: { name: testName('Relationship CRUD Test Project') }
    });
    const { data: project } = await projectRes.json();
    projectId = project.id;
    relationshipsUrl = `/api/v1/projects/${projectId}/relationships`;

    const entityTypesUrl = `/api/v1/projects/${projectId}/entity-types`;
    const sourceTypeRes = await request.post(entityTypesUrl, { data: { name: 'Service' } });
    const targetTypeRes = await request.post(entityTypesUrl, { data: { name: 'Database' } });
    sourceEntityTypeId = (await sourceTypeRes.json()).data.id;
    targetEntityTypeId = (await targetTypeRes.json()).data.id;

    const relationshipTypeRes = await request.post(
        `/api/v1/projects/${projectId}/relationship-types`,
        { data: { name: 'Reads From', fields: [{ name: 'protocol', type: 'string', required: false }] } }
    );
    relationshipTypeId = (await relationshipTypeRes.json()).data.id;

    const entitiesUrl = `/api/v1/projects/${projectId}/entities`;
    const sourceEntityRes = await request.post(entitiesUrl, {
        data: { entityTypeId: sourceEntityTypeId, fieldValues: { name: 'Auth Service' } }
    });
    const targetEntityRes = await request.post(entitiesUrl, {
        data: { entityTypeId: targetEntityTypeId, fieldValues: { name: 'User DB' } }
    });
    sourceEntityId = (await sourceEntityRes.json()).data.id;
    targetEntityId = (await targetEntityRes.json()).data.id;
});

test('should create a relationship between two entities', async ({ request }) => {
    const res = await request.post(relationshipsUrl, {
        data: {
            relationshipTypeId,
            sourceEntityId,
            targetEntityId,
            fieldValues: { protocol: 'TCP' }
        }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.projectId).toBe(projectId);
    expect(data.relationshipTypeId).toBe(relationshipTypeId);
    expect(data.sourceEntityId).toBe(sourceEntityId);
    expect(data.targetEntityId).toBe(targetEntityId);
    expect(data.fieldValues.protocol).toBe('TCP');
});

test('should create a relationship without fieldValues', async ({ request }) => {
    const res = await request.post(relationshipsUrl, {
        data: { relationshipTypeId, sourceEntityId, targetEntityId }
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.fieldValues).toEqual({});
});

test('should not create a relationship without relationshipTypeId', async ({ request }) => {
    const res = await request.post(relationshipsUrl, {
        data: { sourceEntityId, targetEntityId }
    });
    expect(res.status()).toBe(400);
});

test('should not create a relationship without sourceEntityId', async ({ request }) => {
    const res = await request.post(relationshipsUrl, {
        data: { relationshipTypeId, targetEntityId }
    });
    expect(res.status()).toBe(400);
});

test('should not create a relationship without targetEntityId', async ({ request }) => {
    const res = await request.post(relationshipsUrl, {
        data: { relationshipTypeId, sourceEntityId }
    });
    expect(res.status()).toBe(400);
});

test('should list relationships for a project', async ({ request }) => {
    const res = await request.get(relationshipsUrl);
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((r: { relationshipTypeId: string }) => r.relationshipTypeId === relationshipTypeId)).toBe(true);
});

test('should delete a relationship', async ({ request }) => {
    const createRes = await request.post(relationshipsUrl, {
        data: { relationshipTypeId, sourceEntityId, targetEntityId }
    });
    const { data: created } = await createRes.json();

    const deleteRes = await request.delete(`/api/v1/projects/${projectId}/relationships/${created.id}`);
    expect(deleteRes.status()).toBe(200);

    const listRes = await request.get(relationshipsUrl);
    const { data } = await listRes.json();
    expect(data.some((r: { id: string }) => r.id === created.id)).toBe(false);
});

test('should return 404 when deleting a non-existent relationship', async ({ request }) => {
    const res = await request.delete(`/api/v1/projects/${projectId}/relationships/does-not-exist`);
    expect(res.status()).toBe(404);
});
