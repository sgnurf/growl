import { json } from '@sveltejs/kit';
import { getProject, updateProject, deleteProject } from '$lib/db/metaRepository';
import { ok, err } from '$lib/api/types';

export async function GET({ params }) {
    const project = await getProject(params.id);
    if (!project) return json(err('Project not found'), { status: 404 });
    return json(ok(project));
}

export async function PATCH({ params, request }) {
    const body = await request.json();
    const updated = await updateProject(params.id, {
        name: body.name?.trim(),
        description: body.description?.trim()
    });
    if (!updated) return json(err('Project not found'), { status: 404 });
    return json(ok(updated));
}

export async function DELETE({ params }) {
    const deleted = await deleteProject(params.id);
    if (!deleted) return json(err('Project not found'), { status: 404 });
    return json(ok({ deleted: true }));
}
