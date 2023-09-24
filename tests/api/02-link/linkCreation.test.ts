import { expect, test } from '@playwright/test';
import { projectName } from '../apiTestConfig';

test('should create a link between two nodes', async ({ request }) => {

    await request.post('/api/graph/node', {
        data: {
            project: projectName,
            nodeType: 'TestNode',
            nodeId: 'test-node-1',
        },
    });

    await request.post('/api/graph/node', {
        data: {
            project: 'TestProject',
            nodeType: 'TestNode',
            nodeId: 'test-node-2',
        },
    });

    const createLinkResponse = await request.post('/api/graph/link', {
        data: {
            project: projectName,
            linkType: 'TestLink',
            sourceNodeId: 'test-node-1',
            targetNodeId: 'test-node-2',
        },
    });

    expect(createLinkResponse.status()).toBe(200);
});

test('should not create a link if source node is missing', async ({ request }) => {

    const createLinkResponse = await request.post('/api/graph/link', {
        data: {
            project: projectName,
            linkType: 'TestLink',
            targetNodeId: 'test-node-2',
        },
    });

    expect(createLinkResponse.status()).toBe(400);
});

test('should not create a link if target node is missing', async ({ request }) => {

    const createLinkResponse = await request.post('/api/graph/link', {
        data: {
            project: projectName,
            linkType: 'TestLink',
            sourceNodeId: 'test-node-1',
        },
    });

    expect(createLinkResponse.status()).toBe(400);
});

test('should not create a link if project is missing', async ({ request }) => {

    const createLinkResponse = await request.post('/api/graph/link', {
        data: {
            linkType: 'TestLink',
            sourceNodeId: 'test-node-1',
            targetNodeId: 'test-node-2',
        },
    });

    expect(createLinkResponse.status()).toBe(400);
}
);

test('should not create a link if type is missing', async ({ request }) => {

    const createLinkResponse = await request.post('/api/graph/link', {
        data: {
            project: projectName,
            sourceNodeId: 'test-node-1',
            targetNodeId: 'test-node-2',
        },
    });

    expect(createLinkResponse.status()).toBe(400);
});