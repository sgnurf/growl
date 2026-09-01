import { json } from '@sveltejs/kit';
import {
    listRepresentationLibraries,
    createRepresentationLibrary
} from '$lib/db/representationLibraryRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const libraries = await listRepresentationLibraries(params.id);
    return json(ok(libraries));
}

export async function POST({ params, request }) {
    const body = await request.json();
    if (!body.name?.trim()) {
        return json(err('name is required'), { status: 400 });
    }
    const library = await createRepresentationLibrary(params.id, {
        name: body.name.trim()
    });
    return json(ok(library), { status: 201 });
}
