<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Card from '$lib/components/ui/Card.svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let showNewProjectForm = $state(false);
</script>

<svelte:head>
    <title>Growl – Projects</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Projects</h1>
        <Button onclick={() => (showNewProjectForm = !showNewProjectForm)}>
            {showNewProjectForm ? 'Cancel' : 'New project'}
        </Button>
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
            <FormField label="Project name" for="name" required>
                <Input id="name" name="name" placeholder="e.g. ACME Software Architecture" required />
            </FormField>
            <FormField label="Description" for="description">
                <Input id="description" name="description" placeholder="Optional" />
            </FormField>
            <Button type="submit" size="sm" class="self-start">Create project</Button>
        </form>
    {/if}

    {#if data.projects.length === 0}
        <p class="text-gray-500">No projects yet. Create your first one above.</p>
    {:else}
        <ul class="flex flex-col gap-3">
            {#each data.projects as project}
                <li>
                    <Card href="/projects/{project.id}/schema">
                        <p class="font-semibold">{project.name}</p>
                        {#if project.description}
                            <p class="text-sm text-gray-500 mt-0.5">{project.description}</p>
                        {/if}
                    </Card>
                </li>
            {/each}
        </ul>
    {/if}
</div>
