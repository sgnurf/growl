import type { Handle } from '@sveltejs/kit';
import type { CurrentUser } from '$lib/users/types';

// Stub: always injects a dev user with Owner access to all projects.
// Replace with real session resolution when auth is implemented (Phase 6).
const DEV_USER: CurrentUser = {
    user: {
        id: 'dev-user-001',
        email: 'dev@growl.local',
        name: 'Dev User'
    },
    getProjectRole: async (_projectId: string) => 'Owner'
};

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.currentUser = DEV_USER;
    return resolve(event);
};
