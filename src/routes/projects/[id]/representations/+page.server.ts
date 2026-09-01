import type { PageServerLoad, Actions } from './$types';
import { getProject } from '$lib/db/metaRepository';
import {
    listRepresentationLibraries,
    createRepresentationLibrary,
    updateRepresentationLibrary,
    deleteRepresentationLibrary
} from '$lib/db/representationLibraryRepository';
import { fail, error } from '@sveltejs/kit';
import type { EntityRepresentation, RelationshipRepresentation } from '$lib/representations/types';

export const load: PageServerLoad = async ({ params }) => {
    const [project, representationLibraries] = await Promise.all([
        getProject(params.id),
        listRepresentationLibraries(params.id)
    ]);
    if (!project) error(404, 'Project not found');
    return { project, representationLibraries };
};

function parseEntityRepresentations(raw: string | null): EntityRepresentation[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function parseRelationshipRepresentations(raw: string | null): RelationshipRepresentation[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export const actions: Actions = {
    createLibrary: async ({ params, request }) => {
        const data = await request.formData();
        const name = (data.get('name') as string)?.trim();
        const entityRepresentationsRaw = data.get('entityRepresentations') as string | null;
        const relationshipRepresentationsRaw = data.get('relationshipRepresentations') as
            | string
            | null;

        if (!name) return fail(400, { error: 'Name is required' });

        const library = await createRepresentationLibrary(params.id, { name });
        const entityRepresentations = parseEntityRepresentations(entityRepresentationsRaw);
        const relationshipRepresentations = parseRelationshipRepresentations(
            relationshipRepresentationsRaw
        );
        if (entityRepresentations.length || relationshipRepresentations.length) {
            await updateRepresentationLibrary(library.id, {
                entityRepresentations,
                relationshipRepresentations
            });
        }
    },

    updateLibrary: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        const name = (data.get('name') as string)?.trim();
        const entityRepresentationsRaw = data.get('entityRepresentations') as string | null;
        const relationshipRepresentationsRaw = data.get('relationshipRepresentations') as
            | string
            | null;

        if (!id) return fail(400, { error: 'Missing id' });
        if (!name) return fail(400, { error: 'Name is required' });

        await updateRepresentationLibrary(id, {
            name,
            entityRepresentations: parseEntityRepresentations(entityRepresentationsRaw),
            relationshipRepresentations: parseRelationshipRepresentations(
                relationshipRepresentationsRaw
            )
        });
    },

    deleteLibrary: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        if (!id) return fail(400, { error: 'Missing id' });
        await deleteRepresentationLibrary(id);
    }
};
