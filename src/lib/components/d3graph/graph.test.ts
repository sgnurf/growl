import { render, act, fireEvent, screen } from '@testing-library/svelte'
import Graph from './graph.svelte'
import { defaultShapeConfigurations } from './graphNodes/shapeConfiguration';

test('renders graph', async () => {
    const { container } = render(Graph, { nodes: [{id: "1", shapeConfiguration: defaultShapeConfigurations[0], data: {}}], links: [], config: { width: 100, height: 100 } });

    const linkElement = container.querySelector('circle');
    expect(linkElement).toBeInstanceOf(SVGElement);
    expect(linkElement).toHaveAttribute('data-nodeid', '1');
});