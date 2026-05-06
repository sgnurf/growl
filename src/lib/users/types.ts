export type ProjectRole = 'Viewer' | 'Editor' | 'Modeller' | 'Owner';

const ROLE_ORDER: ProjectRole[] = ['Viewer', 'Editor', 'Modeller', 'Owner'];

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface CurrentUser {
    user: User;
    getProjectRole(projectId: string): Promise<ProjectRole | null>;
}

export function hasRole(actual: ProjectRole | null, required: ProjectRole): boolean {
    if (!actual) return false;
    return ROLE_ORDER.indexOf(actual) >= ROLE_ORDER.indexOf(required);
}
