export interface ShapeConfiguration {
    id: string;
    name: string;
    shapeType: string;
    shapeProps: Record<string, any>;
    labelPropertyName: string;
}

export const defaultShapeConfigurations: ShapeConfiguration[] = [
    {
        id: "defaultCircle",
        name: "Default Circle",
        shapeType: "circle",
        shapeProps: {
            size: 10,
            color: "red"
        },
        labelPropertyName: "name"
    },
    {
        id: "defaultSquare",
        name: "Default Square",
        shapeType: "square",
        shapeProps: {
            size: 10,
            color: "blue"
        },
        labelPropertyName: "name"
    },
    {
        id: "defaultTriangle",
        name: "Default Triangle",
        shapeType: "triangle",
        shapeProps: {
            size: 12,
            color: "#ff00ff"
        },
        labelPropertyName: "name"
    },
    {
        id: "defaultCustom",
        name: "Default Custom",
        shapeType: "custom",
        shapeProps: {
            symbol: `
                <polygon points="-7,7 -7,-7 7,7 7,-7"></polygon>
                <text x="0" y="-17" text-anchor="middle" alignment-baseline="middle" stroke="black">#LABEL#</text>
        `
        },
        labelPropertyName: "name"
    }
];