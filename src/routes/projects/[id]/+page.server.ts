import type { PageServerLoad } from './$types';
import { listEntityTypes, listRelationshipTypes } from '$lib/db/metaRepository';
import { getProjectGraph } from '$lib/db/entityRepository';
import { listViews } from '$lib/db/viewRepository';
import { listRepresentationLibraries } from '$lib/db/representationLibraryRepository';

export const load: PageServerLoad = async ({ params }) => {
    const [
        entityTypes,
        relationshipTypes,
        { entities, relationships },
        views,
        representationLibraries
    ] = await Promise.all([
        listEntityTypes(params.id),
        listRelationshipTypes(params.id),
        getProjectGraph(params.id),
        listViews(params.id),
        listRepresentationLibraries(params.id)
    ]);
    return {
        entityTypes,
        relationshipTypes,
        entities,
        relationships,
        views,
        representationLibraries
    };
};
