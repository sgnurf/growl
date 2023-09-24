import { expect, test } from '@playwright/test';
import { projectName } from '../apiTestConfig';

test('should create a node', async ({ request }) => {
    const newNodeResponse = await request.post(`/api/graph/node`, {
      data: {
        project: projectName,
        nodeType: "TestNode",
        nodeId: "TEST",
        properties: {name: "Testing"}
      }
    });
    expect(newNodeResponse.status()).toBe(200);
    const nodeId = Number((await newNodeResponse.json()).id);
    expect(Number.isNaN(nodeId)).toBe(false);
});

test('should not create a node if node Id is missing', async ({ request }) => {
  const newNodeResponse = await request.post(`/api/graph/node`, {
    data: {
      project: projectName,
      nodeType: "TestNode",
      properties: {name: "Testing"}
    }
  });
  expect(newNodeResponse.status()).toBe(400);
});

test('should not create a node if project is missing', async ({ request }) => {
  const newNodeResponse = await request.post(`/api/graph/node`, {
    data: {
      project: projectName,
      nodeId: "TEST",
      properties: {name: "Testing"}
    }
  });
  expect(newNodeResponse.status()).toBe(400);
});

test('should not create a node if type is missing', async ({ request }) => {
  const newNodeResponse = await request.post(`/api/graph/node`, {
    data: {
      project: projectName,
      nodeId: "TEST",
      properties: {name: "Testing"}
    }
  });
  expect(newNodeResponse.status()).toBe(400);
});


