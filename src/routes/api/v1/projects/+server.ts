import { json } from '@sveltejs/kit';
import { listProjects, createProject } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ locals }) {
    const projects = await listProjects(locals.currentUser.user.id);
    return json(ok(projects));
}

export async function POST({ request, locals }) {
    const body = await request.json();
    if (!body.name?.trim()) {
        return json(err('name is required'), { status: 400 });
    }
    const project = await createProject(
        { name: body.name.trim(), description: body.description?.trim() },
        locals.currentUser.user
    );
    return json(ok(project), { status: 201 });
}
