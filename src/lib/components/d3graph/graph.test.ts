import { render, waitFor } from '@testing-library/svelte';
import Graph from './graph.svelte';
import { defaultShapeConfigurations } from './graphNodes/shapeConfiguration';

test('renders graph', async () => {
    const { container } = render(Graph, {
        nodes: [{ id: '1', shapeConfiguration: defaultShapeConfigurations[0], data: {} }],
        links: [],
        config: { width: 100, height: 100 },
        mode: 'Simulation' as const
    });

    // The D3 simulation places nodes asynchronously via timers, so wait for the
    // node group to appear. data-nodeId is on the <g> wrapper, not the shape child.
    const nodeGroup = await waitFor(() => {
        const el = container.querySelector('[data-nodeId="1"]');
        if (!el) throw new Error('Node group not yet rendered');
        return el;
    });

    expect(nodeGroup).toBeInstanceOf(SVGElement);
    expect(nodeGroup.querySelector('circle')).not.toBeNull();
});
