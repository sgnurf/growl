import { redirect } from '@sveltejs/kit';

// Redirect project root to its schema page for now.
// Phase 2 will replace this with the graph view.
export function load({ params }: { params: { id: string } }) {
    redirect(302, `/projects/${params.id}/schema`);
}
