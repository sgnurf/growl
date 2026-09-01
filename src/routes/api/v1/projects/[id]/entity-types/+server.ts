import { json } from '@sveltejs/kit';
import { listEntityTypes, createEntityType } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const types = await listEntityTypes(params.id);
    return json(ok(types));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.name?.trim()) {
        return json(err('name is required'), { status: 400 });
    }
    const entityType = await createEntityType(params.id, {
        name: body.name.trim(),
        description: body.description?.trim(),
        fields: body.fields ?? [],
        representationId: body.representationId
    });
    return json(ok(entityType), { status: 201 });
}
