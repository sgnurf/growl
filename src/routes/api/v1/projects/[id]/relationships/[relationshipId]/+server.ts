import { json } from '@sveltejs/kit';
import { deleteEntityRelationship } from '$lib/db/entityRepository';
import { ok, err } from '$lib/api/types';

export async function DELETE({ params }) {
    const deleted = await deleteEntityRelationship(params.relationshipId);
    if (!deleted) return json(err('Relationship not found'), { status: 404 });
    return json(ok({ deleted: true }));
}
