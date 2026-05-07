import { json } from '@sveltejs/kit';
import { saveViewPositions } from '$lib/db/viewRepository';
import { ok, err } from '$lib/api/types';

export async function PUT({ params, request }) {
    const body = await request.json();
    if (!body.positions || typeof body.positions !== 'object') {
        return json(err('positions is required'), { status: 400 });
    }
    const view = await saveViewPositions(params.viewId, body.positions);
    if (!view) return json(err('View not found'), { status: 404 });
    return json(ok(view));
}
