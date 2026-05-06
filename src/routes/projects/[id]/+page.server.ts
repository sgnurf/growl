import type { PageServerLoad } from './$types';
import { listEntityTypes, listRelationshipTypes } from '$lib/db/metaRepository';
import { getProjectGraph } from '$lib/db/entityRepository';

export const load: PageServerLoad = async ({ params }) => {
    const [entityTypes, relationshipTypes, { entities, relationships }] = await Promise.all([
        listEntityTypes(params.id),
        listRelationshipTypes(params.id),
        getProjectGraph(params.id)
    ]);
    return { entityTypes, relationshipTypes, entities, relationships };
};
