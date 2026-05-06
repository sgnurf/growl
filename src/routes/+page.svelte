<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let showNewProjectForm = $state(false);
</script>

<svelte:head>
    <title>Growl – Projects</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Projects</h1>
        <button
            onclick={() => (showNewProjectForm = !showNewProjectForm)}
            class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
            {showNewProjectForm ? 'Cancel' : 'New project'}
        </button>
    </div>

    {#if showNewProjectForm}
        <form
            method="POST"
            action="?/create"
            use:enhance
            class="mb-8 p-5 border rounded-lg bg-gray-50 flex flex-col gap-3"
        >
            {#if form?.error}
                <p class="text-red-600 text-sm">{form.error}</p>
            {/if}
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium" for="name">Project name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. ACME Software Architecture"
                    class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium" for="description">Description</label>
                <input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Optional"
                    class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
            </div>
            <button
                type="submit"
                class="self-start px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
            >
                Create project
            </button>
        </form>
    {/if}

    {#if data.projects.length === 0}
        <p class="text-gray-500">No projects yet. Create your first one above.</p>
    {:else}
        <ul class="flex flex-col gap-3">
            {#each data.projects as project}
                <li class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <a href="/projects/{project.id}/schema" class="block">
                        <p class="font-semibold">{project.name}</p>
                        {#if project.description}
                            <p class="text-sm text-gray-500 mt-0.5">{project.description}</p>
                        {/if}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
