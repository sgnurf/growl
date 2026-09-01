import { json } from '@sveltejs/kit';
import { listRelationshipTypes, createRelationshipType } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const types = await listRelationshipTypes(params.id);
    return json(ok(types));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.name?.trim()) {
        return json(err('name is required'), { status: 400 });
    }
    const relType = await createRelationshipType(params.id, {
        name: body.name.trim(),
        description: body.description?.trim(),
        sourceEntityTypeId: body.sourceEntityTypeId,
        targetEntityTypeId: body.targetEntityTypeId,
        fields: body.fields ?? [],
        representationId: body.representationId
    });
    return json(ok(relType), { status: 201 });
}
