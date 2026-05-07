import { json } from '@sveltejs/kit';
import { getView, updateView, deleteView } from '$lib/db/viewRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const view = await getView(params.viewId);
    if (!view) return json(err('View not found'), { status: 404 });
    return json(ok(view));
}

export async function PATCH({ params, request }) {
    const body = await request.json();
    const view = await updateView(params.viewId, {
        name: body.name,
        filter: body.filter
    });
    if (!view) return json(err('View not found'), { status: 404 });
    return json(ok(view));
}

export async function DELETE({ params }) {
    const deleted = await deleteView(params.viewId);
    if (!deleted) return json(err('View not found'), { status: 404 });
    return json(ok({ success: true }));
}
