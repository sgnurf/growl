import { json } from '@sveltejs/kit';
import { getEntity, updateEntity, deleteEntity } from '$lib/db/entityRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const entity = await getEntity(params.entityId);
    if (!entity) return json(err('Entity not found'), { status: 404 });
    return json(ok(entity));
}

export async function PATCH({ params, request }) {
    const body = await request.json();
    const updated = await updateEntity(params.entityId, {
        fieldValues: body.fieldValues ?? {}
    });
    if (!updated) return json(err('Entity not found'), { status: 404 });
    return json(ok(updated));
}

export async function DELETE({ params }) {
    const deleted = await deleteEntity(params.entityId);
    if (!deleted) return json(err('Entity not found'), { status: 404 });
    return json(ok({ deleted: true }));
}
