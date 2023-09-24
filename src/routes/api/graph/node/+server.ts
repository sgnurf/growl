import { error, json } from '@sveltejs/kit';
import { UpsertNode } from '$lib/services/neo4jQueryExecutor';
import { Validator } from 'fluentvalidation-ts';

interface NodeCreateRequest {
    project: string;
    nodeType: string;
    nodeId: string;
    properties: Record<string, any>;
}

class NodeCreateRequestValidator extends Validator<NodeCreateRequest> {
    constructor() {
        super();

        this.ruleFor('project').notNull().notEmpty().withMessage("Missing project");
        this.ruleFor('nodeType').notNull().notEmpty().withMessage("Missing nodeType");
        this.ruleFor('nodeId').notNull().notEmpty().withMessage("Missing nodeId");

        //TODO Add properties validation
    }
}

const nodeCreateRequestValidator = new NodeCreateRequestValidator();

export async function POST({ request }: any) {

    const body = await request.json() as NodeCreateRequest;

    //Body validation
    const validationResult = nodeCreateRequestValidator.validate(body);
    if (!!Object.keys(validationResult).length) {
        throw error(400, { message: validationResult.toString() });
    }
    
    let result = await UpsertNode(body.project, body.nodeType, body.nodeId, body.properties);
    
    return json(result);
    
}