import { json } from '@sveltejs/kit';
import { updateRelationshipType, deleteRelationshipType } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function PATCH({ params, request }) {
    const body = await request.json();
    const updated = await updateRelationshipType(params.rtid, {
        name: body.name?.trim(),
        description: body.description?.trim(),
        sourceEntityTypeId: body.sourceEntityTypeId,
        targetEntityTypeId: body.targetEntityTypeId,
        fields: body.fields
    });
    if (!updated) return json(err('Relationship type not found'), { status: 404 });
    return json(ok(updated));
}

export async function DELETE({ params }) {
    const deleted = await deleteRelationshipType(params.rtid);
    if (!deleted) return json(err('Relationship type not found'), { status: 404 });
    return json(ok({ deleted: true }));
}
