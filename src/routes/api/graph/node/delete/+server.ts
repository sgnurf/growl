import { error, json } from '@sveltejs/kit';
import { DeleteNode } from '$lib/services/neo4jQueryExecutor';
import { Validator } from 'fluentvalidation-ts';

interface NodeDeleteRequest {
    project: string;
    nodeType: string;
    nodeId: string;
}

class NodeDeleteRequestValidator extends Validator<NodeDeleteRequest> {
    constructor() {
        super();

        this.ruleFor('project').notNull().notEmpty().withMessage("Missing project");
        this.ruleFor('nodeType').notNull().notEmpty().withMessage("Missing nodeType");
        this.ruleFor('nodeId').notNull().notEmpty().withMessage("Missing nodeId");
    }
}

const nodeCreateRequestValidator = new NodeDeleteRequestValidator();

export async function POST({ request }: any) {

    const body = await request.json() as NodeDeleteRequest;

    const validationResult = nodeCreateRequestValidator.validate(body);
    if (!!Object.keys(validationResult).length) {
        error(400, { message: validationResult.toString() });
    }

    let result = await DeleteNode(body.project, body.nodeType, body.nodeId);

    return json(result);
}