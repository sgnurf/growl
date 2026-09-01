import { json } from '@sveltejs/kit';
import { updateEntityType, deleteEntityType } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function PATCH({ params, request }) {
    const body = await request.json();
    const updated = await updateEntityType(params.etid, {
        name: body.name?.trim(),
        description: body.description?.trim(),
        fields: body.fields,
        ...('representationId' in body ? { representationId: body.representationId } : {})
    });
    if (!updated) return json(err('Entity type not found'), { status: 404 });
    return json(ok(updated));
}

export async function DELETE({ params }) {
    const deleted = await deleteEntityType(params.etid);
    if (!deleted) return json(err('Entity type not found'), { status: 404 });
    return json(ok({ deleted: true }));
}
