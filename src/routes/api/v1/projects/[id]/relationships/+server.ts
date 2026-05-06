import { json } from '@sveltejs/kit';
import { listEntityRelationships, createEntityRelationship } from '$lib/db/entityRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const relationships = await listEntityRelationships(params.id);
    return json(ok(relationships));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.relationshipTypeId?.trim()) {
        return json(err('relationshipTypeId is required'), { status: 400 });
    }
    if (!body.sourceEntityId?.trim()) {
        return json(err('sourceEntityId is required'), { status: 400 });
    }
    if (!body.targetEntityId?.trim()) {
        return json(err('targetEntityId is required'), { status: 400 });
    }
    const relationship = await createEntityRelationship(params.id, {
        relationshipTypeId: body.relationshipTypeId,
        sourceEntityId: body.sourceEntityId,
        targetEntityId: body.targetEntityId,
        fieldValues: body.fieldValues ?? {}
    });
    return json(ok(relationship), { status: 201 });
}
