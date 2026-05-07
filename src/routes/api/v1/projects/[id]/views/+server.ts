import { json } from '@sveltejs/kit';
import { listViews, createView } from '$lib/db/viewRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const views = await listViews(params.id);
    return json(ok(views));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.name?.trim()) {
        return json(err('name is required'), { status: 400 });
    }
    const view = await createView(params.id, {
        name: body.name.trim(),
        filter: body.filter
    });
    return json(ok(view), { status: 201 });
}
