import type { LayoutServerLoad } from './$types';
import { getProject } from '$lib/db/metaRepository';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params }) => {
    const project = await getProject(params.id);
    if (!project) error(404, 'Project not found');
    return { project };
};
