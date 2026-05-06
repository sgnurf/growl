import type { PageServerLoad, Actions } from './$types';
import { listProjects, createProject } from '$lib/db/metaRepository';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const projects = await listProjects(locals.currentUser.user.id);
    return { projects };
};

export const actions: Actions = {
    create: async ({ request, locals }) => {
        const data = await request.formData();
        const name = (data.get('name') as string)?.trim();
        const description = (data.get('description') as string)?.trim();

        if (!name) return fail(400, { error: 'Project name is required' });

        const project = await createProject({ name, description }, locals.currentUser.user);
        redirect(303, `/projects/${project.id}/schema`);
    }
};
