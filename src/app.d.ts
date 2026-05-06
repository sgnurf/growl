// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { CurrentUser } from '$lib/users/types';

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            currentUser: CurrentUser;
        }
        // interface PageData {}
        // interface Platform {}
    }
}

export {};
