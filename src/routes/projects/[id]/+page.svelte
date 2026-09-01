<script lang="ts">
    import { untrack } from 'svelte';
    import Graph from '$lib/components/d3graph/graph.svelte';
    import type { GraphMode } from '$lib/components/d3graph/types';
    import type { PageData } from './$types';
    import { entityToNode, entityRelationshipToLink } from '$lib/mappers/graphMapper';
    import type { EntityType, RelationshipType } from '$lib/schema/types';
    import type { Entity, EntityRelationship } from '$lib/entities/types';
    import type { View, NodePosition } from '$lib/views/types';
    import Button from '$lib/components/ui/Button.svelte';

    let { data }: { data: PageData } = $props();

    // ── Server-sourced data mirrored as local state for optimistic updates ────
    let allEntities = $state<Entity[]>(untrack(() => data.entities));
    let allRelationships = $state<EntityRelationship[]>(untrack(() => data.relationships));
    let views = $state<View[]>(untrack(() => data.views));

    // ── View state ────────────────────────────────────────────────────────────
    let activeViewId = $state<string | null>(null);
    let positionOverrides = $state<Record<string, NodePosition> | undefined>(undefined);
    let graphRef = $state<{ getPositions: () => Record<string, { x: number; y: number }> } | undefined>(undefined);
    let isSavingLayout = $state(false);

    const activeView = $derived(views.find((v) => v.id === activeViewId) ?? null);

    function switchView(viewId: string | null) {
        if (viewId === activeViewId) return;
        activeViewId = viewId;
        const view = viewId ? views.find((v) => v.id === viewId) : null;
        if (view && Object.keys(view.positions).length > 0) {
            positionOverrides = { ...view.positions };
        } else {
            positionOverrides = undefined;
        }
    }

    // ── Graph filtering ───────────────────────────────────────────────────────
    const visibleEntities = $derived(
        !activeView || activeView.filter.entityTypeIds.length === 0
            ? allEntities
            : allEntities.filter((e) => activeView.filter.entityTypeIds.includes(e.entityTypeId))
    );

    const visibleEntityIdSet = $derived(new Set(visibleEntities.map((e) => e.id)));

    const entityRepresentations = $derived(
        data.representationLibraries.flatMap((library) => library.entityRepresentations)
    );

    const displayNodes = $derived(
        visibleEntities.map((e) => entityToNode(e, data.entityTypes, entityRepresentations))
    );

    const displayLinks = $derived(
        (() => {
            let rels = allRelationships.filter(
                (r) =>
                    visibleEntityIdSet.has(r.sourceEntityId) &&
                    visibleEntityIdSet.has(r.targetEntityId)
            );
            if (activeView && activeView.filter.relationshipTypeIds.length > 0) {
                const allowed = new Set(activeView.filter.relationshipTypeIds);
                rels = rels.filter((r) => allowed.has(r.relationshipTypeId));
            }
            return rels.map(entityRelationshipToLink);
        })()
    );

    // ── Graph mode ────────────────────────────────────────────────────────────
    let graphMode = $state<GraphMode>('Simulation');

    // ── Side panel state ──────────────────────────────────────────────────────
    type PanelView = 'default' | 'createEntity' | 'createRelationship' | 'createView';
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
            allEntities = [...allEntities, json.data as Entity];
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
            allRelationships = [...allRelationships, json.data as EntityRelationship];
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

    // ── View creation ─────────────────────────────────────────────────────────
    let newViewName = $state('');
    let newViewEntityTypeFilter = $state<string[]>([]);
    let newViewRelTypeFilter = $state<string[]>([]);

    function openCreateView() {
        newViewName = '';
        newViewEntityTypeFilter = [];
        newViewRelTypeFilter = [];
        errorMessage = null;
        panelView = 'createView';
    }

    function toggleEntityTypeFilter(id: string) {
        newViewEntityTypeFilter = newViewEntityTypeFilter.includes(id)
            ? newViewEntityTypeFilter.filter((x) => x !== id)
            : [...newViewEntityTypeFilter, id];
    }

    function toggleRelTypeFilter(id: string) {
        newViewRelTypeFilter = newViewRelTypeFilter.includes(id)
            ? newViewRelTypeFilter.filter((x) => x !== id)
            : [...newViewRelTypeFilter, id];
    }

    async function submitCreateView() {
        if (!newViewName.trim()) return;
        isSubmitting = true;
        errorMessage = null;
        try {
            const response = await fetch(`/api/v1/projects/${data.project.id}/views`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newViewName.trim(),
                    filter: {
                        entityTypeIds: newViewEntityTypeFilter,
                        relationshipTypeIds: newViewRelTypeFilter
                    }
                })
            });
            const json = await response.json();
            if (!response.ok) { errorMessage = json.error?.message ?? 'Failed to create view'; return; }
            views = [...views, json.data as View];
            panelView = 'default';
        } finally {
            isSubmitting = false;
        }
    }

    // ── View deletion ─────────────────────────────────────────────────────────
    async function deleteView(viewId: string) {
        const response = await fetch(`/api/v1/projects/${data.project.id}/views/${viewId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            views = views.filter((v) => v.id !== viewId);
            if (activeViewId === viewId) switchView(null);
        }
    }

    // ── Layout save ───────────────────────────────────────────────────────────
    async function saveLayout() {
        if (!activeViewId || !graphRef) return;
        isSavingLayout = true;
        try {
            const allPositions = graphRef.getPositions();
            const positions: Record<string, NodePosition> = {};
            for (const entityId of visibleEntityIdSet) {
                if (allPositions[entityId]) positions[entityId] = allPositions[entityId];
            }
            const response = await fetch(
                `/api/v1/projects/${data.project.id}/views/${activeViewId}/positions`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ positions })
                }
            );
            const json = await response.json();
            if (response.ok) {
                views = views.map((v) => (v.id === activeViewId ? (json.data as View) : v));
            }
        } finally {
            isSavingLayout = false;
        }
    }
</script>

<svelte:head>
    <title>Growl – {data.project.name}</title>
</svelte:head>

<div class="flex h-full">
    <!-- ── Graph canvas ──────────────────────────────────────────────────── -->
    <div
        class="flex-1 overflow-hidden bg-gray-50 relative"
        bind:clientWidth={containerWidth}
        bind:clientHeight={containerHeight}
    >
        {#if containerWidth > 0 && containerHeight > 0}
            <Graph
                bind:this={graphRef}
                config={{ width: containerWidth, height: containerHeight }}
                nodes={displayNodes}
                links={displayLinks}
                mode={graphMode}
                {positionOverrides}
                onCreateLink={handleCreateLink}
            />
        {/if}

        {#if displayNodes.length === 0}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p class="text-gray-400 text-sm">
                    {allEntities.length === 0
                        ? 'No entities yet — add some from the panel →'
                        : 'No entities match this view\'s filter.'}
                </p>
            </div>
        {/if}
    </div>

    <!-- ── Side panel ───────────────────────────────────────────────────── -->
    <div class="w-64 shrink-0 border-l bg-white flex flex-col overflow-hidden">

        <!-- Views section -->
        <div class="p-3 border-b">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Views</span>
                <Button variant="ghost" onclick={openCreateView}>+ New</Button>
            </div>
            <ul class="flex flex-col gap-0.5">
                <li>
                    <button
                        onclick={() => switchView(null)}
                        class="w-full text-left text-xs px-2 py-1 rounded transition-colors"
                        class:bg-black={activeViewId === null}
                        class:text-white={activeViewId === null}
                        class:hover:bg-gray-100={activeViewId !== null}
                    >All entities</button>
                </li>
                {#each views as view (view.id)}
                    <li class="flex items-center gap-1">
                        <button
                            onclick={() => switchView(view.id)}
                            class="flex-1 text-left text-xs px-2 py-1 rounded truncate transition-colors"
                            class:bg-black={activeViewId === view.id}
                            class:text-white={activeViewId === view.id}
                            class:hover:bg-gray-100={activeViewId !== view.id}
                        >{view.name}</button>
                        <button
                            onclick={() => deleteView(view.id)}
                            class="text-gray-300 hover:text-red-500 text-xs px-1 shrink-0 transition-colors"
                            title="Delete view"
                        >✕</button>
                    </li>
                {/each}
            </ul>
            {#if activeViewId !== null}
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={saveLayout}
                    disabled={isSavingLayout}
                    class="w-full mt-2 justify-center"
                >
                    {isSavingLayout ? 'Saving…' : 'Save layout'}
                </Button>
            {/if}
        </div>

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

            {#if panelView === 'createView'}
                <!-- ── Create view form ──────────────────────────────────── -->
                <div class="p-4 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-sm">New View</h3>
                        <button onclick={cancelPanel} class="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>

                    {#if errorMessage}
                        <p class="text-xs text-red-500">{errorMessage}</p>
                    {/if}

                    <div class="flex flex-col gap-1">
                        <label for="view-name" class="text-xs font-medium text-gray-600">Name</label>
                        <input
                            id="view-name"
                            type="text"
                            placeholder="e.g. Frontend Services"
                            bind:value={newViewName}
                            class="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {#if data.entityTypes.length > 0}
                        <div>
                            <p class="text-xs font-medium text-gray-600 mb-1">Entity types (empty = all)</p>
                            {#each data.entityTypes as et}
                                <label class="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newViewEntityTypeFilter.includes(et.id)}
                                        onchange={() => toggleEntityTypeFilter(et.id)}
                                    />
                                    {et.name}
                                </label>
                            {/each}
                        </div>
                    {/if}

                    {#if data.relationshipTypes.length > 0}
                        <div>
                            <p class="text-xs font-medium text-gray-600 mb-1">Relationship types (empty = all)</p>
                            {#each data.relationshipTypes as rt}
                                <label class="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newViewRelTypeFilter.includes(rt.id)}
                                        onchange={() => toggleRelTypeFilter(rt.id)}
                                    />
                                    {rt.name}
                                </label>
                            {/each}
                        </div>
                    {/if}

                    <div class="flex gap-2 mt-1">
                        <Button onclick={submitCreateView} disabled={isSubmitting || !newViewName.trim()} class="flex-1">
                            Create view
                        </Button>
                        <Button variant="secondary" onclick={cancelPanel}>Cancel</Button>
                    </div>
                </div>

            {:else if panelView === 'createEntity' && selectedEntityType}
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
