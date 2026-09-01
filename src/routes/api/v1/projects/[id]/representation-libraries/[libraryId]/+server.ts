import { json } from '@sveltejs/kit';
import {
    getRepresentationLibrary,
    updateRepresentationLibrary,
    deleteRepresentationLibrary
} from '$lib/db/representationLibraryRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const library = await getRepresentationLibrary(params.libraryId);
    if (!library) return json(err('Representation library not found'), { status: 404 });
    return json(ok(library));
}

export async function PATCH({ params, request }) {
    const body = await request.json();
    const library = await updateRepresentationLibrary(params.libraryId, {
        name: body.name,
        entityRepresentations: body.entityRepresentations,
        relationshipRepresentations: body.relationshipRepresentations
    });
    if (!library) return json(err('Representation library not found'), { status: 404 });
    return json(ok(library));
}

export async function DELETE({ params }) {
    const deleted = await deleteRepresentationLibrary(params.libraryId);
    if (!deleted) return json(err('Representation library not found'), { status: 404 });
    return json(ok({ success: true }));
}
