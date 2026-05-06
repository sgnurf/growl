<script lang="ts">
    import { untrack } from 'svelte';
    import Graph from '$lib/components/d3graph/graph.svelte';
    import type { Node, Link, GraphMode } from '$lib/components/d3graph/types';
    import type { PageData } from './$types';
    import { entityToNode, entitiesToNodes, entityRelationshipsToLinks } from '$lib/mappers/graphMapper';
    import type { EntityType, RelationshipType } from '$lib/schema/types';
    import Button from '$lib/components/ui/Button.svelte';

    let { data }: { data: PageData } = $props();

    // Local graph state — updated optimistically when entities/relationships are created.
    // untrack() signals we intentionally want a one-time snapshot of the server data.
    let nodes = $state<Node[]>(untrack(() => entitiesToNodes(data.entities, data.entityTypes)));
    let links = $state<Link[]>(untrack(() => entityRelationshipsToLinks(data.relationships)));

    let graphMode = $state<GraphMode>('Simulation');

    // ── Side panel state ──────────────────────────────────────────────────────
    type PanelView = 'default' | 'createEntity' | 'createRelationship';
    let panelView = $state<PanelView>('default');

    let selectedEntityType = $state<EntityType | null>(null);
    let entityFieldValues = $state<Record<string, unknown>>({});

    let pendingRelationship = $state<{ sourceEntityId: string; targetEntityId: string } | null>(null);
    let selectedRelationshipType = $state<RelationshipType | null>(null);
    let relationshipFieldValues = $state<Record<string, unknown>>({});

    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    // ── Graph container sizing ────────────────────────────────────────────────
    let containerWidth = $state(0);
    let containerHeight = $state(0);

    // ── Entity creation ───────────────────────────────────────────────────────
    function openCreateEntity(entityType: EntityType) {
        selectedEntityType = entityType;
        entityFieldValues = {};
        errorMessage = null;
        panelView = 'createEntity';
    }

    async function submitCreateEntity() {
        if (!selectedEntityType) return;
        isSubmitting = true;
        errorMessage = null;
        try {
            const response = await fetch(`/api/v1/projects/${data.project.id}/entities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityTypeId: selectedEntityType.id,
                    fieldValues: entityFieldValues
                })
            });
            const json = await response.json();
            if (!response.ok) { errorMessage = json.error?.message ?? 'Failed to create entity'; return; }
            nodes = [...nodes, entityToNode(json.data, data.entityTypes)];
            panelView = 'default';
        } finally {
            isSubmitting = false;
        }
    }

    // ── Relationship creation ─────────────────────────────────────────────────
    function handleCreateLink(sourceEntityId: string, targetEntityId: string) {
        pendingRelationship = { sourceEntityId, targetEntityId };
        selectedRelationshipType = data.relationshipTypes[0] ?? null;
        relationshipFieldValues = {};
        errorMessage = null;
        panelView = 'createRelationship';
    }

    async function submitCreateRelationship() {
        if (!pendingRelationship || !selectedRelationshipType) return;
        isSubmitting = true;
        errorMessage = null;
        try {
            const response = await fetch(`/api/v1/projects/${data.project.id}/relationships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    relationshipTypeId: selectedRelationshipType.id,
                    sourceEntityId: pendingRelationship.sourceEntityId,
                    targetEntityId: pendingRelationship.targetEntityId,
                    fieldValues: relationshipFieldValues
                })
            });
            const json = await response.json();
            if (!response.ok) { errorMessage = json.error?.message ?? 'Failed to create relationship'; return; }
            links = [...links, {
                source: pendingRelationship.sourceEntityId,
                target: pendingRelationship.targetEntityId
            }];
            pendingRelationship = null;
            panelView = 'default';
        } finally {
            isSubmitting = false;
        }
    }

    function cancelPanel() {
        panelView = 'default';
        pendingRelationship = null;
        errorMessage = null;
    }
</script>

<svelte:head>
    <title>Growl – {data.project.name}</title>
</svelte:head>

<div class="flex h-full">
    <!-- ── Graph canvas ──────────────────────────────────────────────────── -->
    <div
        class="flex-1 overflow-hidden bg-gray-50"
        bind:clientWidth={containerWidth}
        bind:clientHeight={containerHeight}
    >
        {#if containerWidth > 0 && containerHeight > 0}
            <Graph
                config={{ width: containerWidth, height: containerHeight }}
                {nodes}
                {links}
                mode={graphMode}
                onCreateLink={handleCreateLink}
            />
        {/if}

        {#if nodes.length === 0}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p class="text-gray-400 text-sm">No entities yet — add some from the panel →</p>
            </div>
        {/if}
    </div>

    <!-- ── Side panel ───────────────────────────────────────────────────── -->
    <div class="w-64 shrink-0 border-l bg-white flex flex-col overflow-hidden">

        <!-- Mode controls -->
        <div class="p-3 border-b">
            <div class="flex gap-1">
                {#each (['Simulation', 'Static', 'Edit'] as GraphMode[]) as graphModeOption}
                    <button
                        onclick={() => (graphMode = graphModeOption)}
                        class="flex-1 py-1 text-xs rounded border transition-colors"
                        class:bg-black={graphMode === graphModeOption}
                        class:text-white={graphMode === graphModeOption}
                        class:border-black={graphMode === graphModeOption}
                        class:border-gray-200={graphMode !== graphModeOption}
                        class:text-gray-600={graphMode !== graphModeOption}
                    >{graphModeOption}</button>
                {/each}
            </div>
            {#if graphMode === 'Edit'}
                <p class="text-xs text-gray-400 mt-2">Drag from one node to another to draw a relationship.</p>
            {/if}
        </div>

        <!-- Panel body -->
        <div class="flex-1 overflow-y-auto">

            {#if panelView === 'createEntity' && selectedEntityType}
                <!-- ── Create entity form ────────────────────────────────── -->
                <div class="p-4 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-sm">New {selectedEntityType.name}</h3>
                        <button onclick={cancelPanel} class="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>

                    {#if errorMessage}
                        <p class="text-xs text-red-500">{errorMessage}</p>
                    {/if}

                    {#if selectedEntityType.fields.length === 0}
                        <p class="text-xs text-gray-400">This entity type has no fields defined.</p>
                    {:else}
                        {#each selectedEntityType.fields as field}
                            <div class="flex flex-col gap-1">
                                <label for="entity-field-{field.name}" class="text-xs font-medium text-gray-600">
                                    {field.name}{field.required ? ' *' : ''}
                                </label>
                                {#if field.type === 'boolean'}
                                    <input
                                        id="entity-field-{field.name}"
                                        type="checkbox"
                                        checked={Boolean(entityFieldValues[field.name])}
                                        onchange={(event) => { entityFieldValues[field.name] = (event.target as HTMLInputElement).checked; }}
                                        class="self-start"
                                    />
                                {:else}
                                    <input
                                        id="entity-field-{field.name}"
                                        type={field.type === 'int' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                                        placeholder={field.name}
                                        value={String(entityFieldValues[field.name] ?? '')}
                                        oninput={(event) => { entityFieldValues[field.name] = (event.target as HTMLInputElement).value; }}
                                        class="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                {/if}
                            </div>
                        {/each}
                    {/if}

                    <div class="flex gap-2 mt-1">
                        <Button onclick={submitCreateEntity} disabled={isSubmitting} class="flex-1">Create</Button>
                        <Button variant="secondary" onclick={cancelPanel}>Cancel</Button>
                    </div>
                </div>

            {:else if panelView === 'createRelationship'}
                <!-- ── Create relationship form ───────────────────────────── -->
                <div class="p-4 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-sm">New Relationship</h3>
                        <button onclick={cancelPanel} class="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>

                    {#if errorMessage}
                        <p class="text-xs text-red-500">{errorMessage}</p>
                    {/if}

                    {#if data.relationshipTypes.length === 0}
                        <p class="text-xs text-gray-400">
                            No relationship types defined.
                            <a href="/projects/{data.project.id}/schema" class="underline">Add some in Schema.</a>
                        </p>
                    {:else}
                        <div class="flex flex-col gap-1">
                            <label for="relationship-type-select" class="text-xs font-medium text-gray-600">Type</label>
                            <select
                                id="relationship-type-select"
                                value={selectedRelationshipType?.id ?? ''}
                                onchange={(event) => {
                                    selectedRelationshipType = data.relationshipTypes.find(
                                        (relationshipType) => relationshipType.id === (event.target as HTMLSelectElement).value
                                    ) ?? null;
                                    relationshipFieldValues = {};
                                }}
                                class="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {#each data.relationshipTypes as relationshipType}
                                    <option value={relationshipType.id}>{relationshipType.name}</option>
                                {/each}
                            </select>
                        </div>

                        {#if selectedRelationshipType}
                            {#each selectedRelationshipType.fields as field}
                                <div class="flex flex-col gap-1">
                                    <label for="rel-field-{field.name}" class="text-xs font-medium text-gray-600">
                                        {field.name}{field.required ? ' *' : ''}
                                    </label>
                                    <input
                                        id="rel-field-{field.name}"
                                        type="text"
                                        placeholder={field.name}
                                        value={String(relationshipFieldValues[field.name] ?? '')}
                                        oninput={(event) => { relationshipFieldValues[field.name] = (event.target as HTMLInputElement).value; }}
                                        class="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            {/each}
                        {/if}

                        <div class="flex gap-2 mt-1">
                            <Button onclick={submitCreateRelationship} disabled={isSubmitting} class="flex-1">Create</Button>
                            <Button variant="secondary" onclick={cancelPanel}>Cancel</Button>
                        </div>
                    {/if}
                </div>

            {:else}
                <!-- ── Default: entity type list ─────────────────────────── -->
                <div class="p-4">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Entity Types</p>
                    {#if data.entityTypes.length === 0}
                        <p class="text-xs text-gray-400">
                            No entity types defined.
                            <a href="/projects/{data.project.id}/schema" class="underline">Define some in Schema.</a>
                        </p>
                    {:else}
                        <ul class="flex flex-col gap-0.5">
                            {#each data.entityTypes as entityType}
                                <li class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                                    <span class="text-sm">{entityType.name}</span>
                                    <Button variant="ghost" onclick={() => openCreateEntity(entityType)} class="shrink-0">+ Add</Button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
