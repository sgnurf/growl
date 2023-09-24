import { expect, test } from '@playwright/test';
import { projectName } from '../apiTestConfig';

test('should delete a node', async ({ request }) => {

    const nodeData = {
        project: projectName,
        nodeType: "TestNode",
        nodeId: "TESTDeletion"
    };

    await request.post(`/api/graph/node`, { data: nodeData });
    const deleteNodeResponse = await request.post(`/api/graph/node/delete`, { data: nodeData });
    expect(deleteNodeResponse.status()).toBe(200);
    expect((await deleteNodeResponse.json()).nodeDeleted).toBeTruthy();

});

test('should not delete a node if node Id is missing', async ({ request }) => {
    const deleteNodeResponse = await request.post(`/api/graph/node/delete`, {
        data: {
            project: projectName,
            nodeType: "TestNode"
        }
    });
    expect(deleteNodeResponse.status()).toBe(400);
});

test('should not delete a node if project is missing', async ({ request }) => {
    const deleteNodeResponse = await request.post(`/api/graph/node/delete`, {
        data: {
            nodeType: "TestNode",
            nodeId: "TEST"
        }
    });
    expect(deleteNodeResponse.status()).toBe(400);
});

test('should not delete a node if type is missing', async ({ request }) => {
    const deleteNodeResponse = await request.post(`/api/graph/node/delete`, {
        data: {
            project: projectName,
            nodeId: "TEST"
        }
    });
    expect(deleteNodeResponse.status()).toBe(400);
});


