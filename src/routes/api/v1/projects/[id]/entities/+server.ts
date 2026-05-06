import { json } from '@sveltejs/kit';
import { listEntities, createEntity } from '$lib/db/entityRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const entities = await listEntities(params.id);
    return json(ok(entities));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.entityTypeId?.trim()) {
        return json(err('entityTypeId is required'), { status: 400 });
    }
    const entity = await createEntity(params.id, {
        entityTypeId: body.entityTypeId,
        fieldValues: body.fieldValues ?? {}
    });
    return json(ok(entity), { status: 201 });
}
