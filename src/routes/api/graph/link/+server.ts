import { error, json } from '@sveltejs/kit';
import { CreateRelationship, UpsertNode } from '$lib/services/neo4jQueryExecutor';
import { Validator } from 'fluentvalidation-ts';

interface LinkCreateRequest {
    project: string;
    linkType: string;
    sourceNodeId: string;
    targetNodeId: string;
    properties: Record<string, any>;
}

class LinkCreateRequestValidator extends Validator<LinkCreateRequest> {
    constructor() {
        super();

        this.ruleFor('project').notNull().notEmpty().withMessage("Missing project");
        this.ruleFor('linkType').notNull().notEmpty().withMessage("Missing linkType");
        this.ruleFor('sourceNodeId').notNull().notEmpty().withMessage("Missing nodeId1");
        this.ruleFor('targetNodeId').notNull().notEmpty().withMessage("Missing nodeId2");

        //TODO Add properties validation
    }
}

const nodeCreateRequestValidator = new LinkCreateRequestValidator();

export async function POST({ request }: any) {

    const body = await request.json() as LinkCreateRequest;

    const validationResult = nodeCreateRequestValidator.validate(body);
    if (!!Object.keys(validationResult).length) {
        error(400, { message: validationResult.toString() });
    }
    
    let result = await CreateRelationship(body.project, body.linkType, body.sourceNodeId, body.targetNodeId, body.properties);
    
    return json(result);
}