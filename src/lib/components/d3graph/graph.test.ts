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

test('renders a link with its representation styling', async () => {
    const { container } = render(Graph, {
        nodes: [
            { id: '1', shapeConfiguration: defaultShapeConfigurations[0], data: {} },
            { id: '2', shapeConfiguration: defaultShapeConfigurations[0], data: {} }
        ],
        links: [
            {
                source: '1',
                target: '2',
                representation: {
                    lineStyle: 'dashed',
                    color: 'red',
                    arrowhead: 'arrow',
                    labelPropertyName: null
                }
            }
        ],
        config: { width: 100, height: 100 },
        mode: 'Simulation' as const
    });

    const link = await waitFor(() => {
        const el = container.querySelector('[data-linkId="1-2"]');
        if (!el) throw new Error('Link not yet rendered');
        return el;
    });

    expect(link.getAttribute('stroke')).toBe('red');
    expect(link.getAttribute('stroke-dasharray')).toBe('6,4');
    expect(link.getAttribute('marker-end')).toBe('url(#link-arrowhead-arrow)');
});

test('renders a link with default styling when no representation is given', async () => {
    const { container } = render(Graph, {
        nodes: [
            { id: '1', shapeConfiguration: defaultShapeConfigurations[0], data: {} },
            { id: '2', shapeConfiguration: defaultShapeConfigurations[0], data: {} }
        ],
        links: [{ source: '1', target: '2' }],
        config: { width: 100, height: 100 },
        mode: 'Simulation' as const
    });

    const link = await waitFor(() => {
        const el = container.querySelector('[data-linkId="1-2"]');
        if (!el) throw new Error('Link not yet rendered');
        return el;
    });

    expect(link.getAttribute('stroke')).toBe('#999999');
    expect(link.hasAttribute('stroke-dasharray')).toBe(false);
    expect(link.hasAttribute('marker-end')).toBe(false);
});
