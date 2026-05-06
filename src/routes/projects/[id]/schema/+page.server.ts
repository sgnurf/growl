import type { PageServerLoad, Actions } from './$types';
import {
    getProject,
    listEntityTypes,
    listRelationshipTypes,
    createEntityType,
    updateEntityType,
    deleteEntityType,
    createRelationshipType,
    updateRelationshipType,
    deleteRelationshipType
} from '$lib/db/metaRepository';
import { fail, error } from '@sveltejs/kit';
import type { Field } from '$lib/schema/types';

export const load: PageServerLoad = async ({ params }) => {
    const [project, entityTypes, relationshipTypes] = await Promise.all([
        getProject(params.id),
        listEntityTypes(params.id),
        listRelationshipTypes(params.id)
    ]);
    if (!project) error(404, 'Project not found');
    return { project, entityTypes, relationshipTypes };
};

function parseFields(raw: string | null): Field[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export const actions: Actions = {
    createEntityType: async ({ params, request }) => {
        const data = await request.formData();
        const name = (data.get('name') as string)?.trim();
        const description = (data.get('description') as string)?.trim();
        const fieldsRaw = data.get('fields') as string | null;

        if (!name) return fail(400, { error: 'Name is required' });

        await createEntityType(params.id, {
            name,
            description,
            fields: parseFields(fieldsRaw)
        });
    },

    updateEntityType: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        const name = (data.get('name') as string)?.trim();
        const description = (data.get('description') as string)?.trim();
        const fieldsRaw = data.get('fields') as string | null;

        if (!id) return fail(400, { error: 'Missing id' });
        if (!name) return fail(400, { error: 'Name is required' });

        await updateEntityType(id, { name, description, fields: parseFields(fieldsRaw) });
    },

    deleteEntityType: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        if (!id) return fail(400, { error: 'Missing id' });
        await deleteEntityType(id);
    },

    createRelationshipType: async ({ params, request }) => {
        const data = await request.formData();
        const name = (data.get('name') as string)?.trim();
        const description = (data.get('description') as string)?.trim();
        const sourceEntityTypeId = (data.get('sourceEntityTypeId') as string) || undefined;
        const targetEntityTypeId = (data.get('targetEntityTypeId') as string) || undefined;
        const fieldsRaw = data.get('fields') as string | null;

        if (!name) return fail(400, { error: 'Name is required' });

        await createRelationshipType(params.id, {
            name,
            description,
            sourceEntityTypeId,
            targetEntityTypeId,
            fields: parseFields(fieldsRaw)
        });
    },

    updateRelationshipType: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        const name = (data.get('name') as string)?.trim();
        const description = (data.get('description') as string)?.trim();
        const sourceEntityTypeId = (data.get('sourceEntityTypeId') as string) || null;
        const targetEntityTypeId = (data.get('targetEntityTypeId') as string) || null;
        const fieldsRaw = data.get('fields') as string | null;

        if (!id) return fail(400, { error: 'Missing id' });
        if (!name) return fail(400, { error: 'Name is required' });

        await updateRelationshipType(id, {
            name,
            description,
            sourceEntityTypeId,
            targetEntityTypeId,
            fields: parseFields(fieldsRaw)
        });
    },

    deleteRelationshipType: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id') as string;
        if (!id) return fail(400, { error: 'Missing id' });
        await deleteRelationshipType(id);
    }
};
