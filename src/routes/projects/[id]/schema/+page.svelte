<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';
    import type { Field, EntityType, RelationshipType } from '$lib/schema/types';

    let { data }: { data: PageData } = $props();

    type Tab = 'entity-types' | 'relationship-types';
    let activeTab = $state<Tab>('entity-types');

    // ── Entity type form state ────────────────────────────────────────────────
    let showEntityTypeForm = $state(false);
    let editingEntityType = $state<EntityType | null>(null);
    let etFields = $state<Field[]>([]);

    function openNewEntityType() {
        editingEntityType = null;
        etFields = [];
        showEntityTypeForm = true;
    }

    function openEditEntityType(et: EntityType) {
        editingEntityType = et;
        etFields = structuredClone(et.fields);
        showEntityTypeForm = true;
    }

    function closeEntityTypeForm() {
        showEntityTypeForm = false;
        editingEntityType = null;
        etFields = [];
    }

    function addEtField() {
        etFields = [...etFields, { id: crypto.randomUUID(), name: '', type: 'string', required: false }];
    }

    function removeEtField(idx: number) {
        etFields = etFields.filter((_, i) => i !== idx);
    }

    // ── Relationship type form state ──────────────────────────────────────────
    let showRelTypeForm = $state(false);
    let editingRelType = $state<RelationshipType | null>(null);
    let rtFields = $state<Field[]>([]);

    function openNewRelType() {
        editingRelType = null;
        rtFields = [];
        showRelTypeForm = true;
    }

    function openEditRelType(rt: RelationshipType) {
        editingRelType = rt;
        rtFields = structuredClone(rt.fields);
        showRelTypeForm = true;
    }

    function closeRelTypeForm() {
        showRelTypeForm = false;
        editingRelType = null;
        rtFields = [];
    }

    function addRtField() {
        rtFields = [...rtFields, { id: crypto.randomUUID(), name: '', type: 'string', required: false }];
    }

    function removeRtField(idx: number) {
        rtFields = rtFields.filter((_, i) => i !== idx);
    }

    const fieldTypes = ['string', 'int', 'boolean', 'date', 'url'] as const;
</script>

<svelte:head>
    <title>Growl – {data.project.name} – Schema</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <p class="text-sm text-gray-400 mb-1">
            <a href="/" class="hover:underline">Projects</a> / {data.project.name}
        </p>
        <h1 class="text-3xl font-bold">{data.project.name}</h1>
        {#if data.project.description}
            <p class="text-gray-500 mt-1">{data.project.description}</p>
        {/if}
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b mb-6">
        {#each [['entity-types', 'Entity Types'], ['relationship-types', 'Relationship Types']] as [key, label]}
            <button
                onclick={() => (activeTab = key as Tab)}
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
                class:border-black={activeTab === key}
                class:text-black={activeTab === key}
                class:border-transparent={activeTab !== key}
                class:text-gray-500={activeTab !== key}
            >{label}</button>
        {/each}
    </div>

    <!-- ── Entity Types tab ─────────────────────────────────────────────────── -->
    {#if activeTab === 'entity-types'}
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Entity Types</h2>
            <button onclick={openNewEntityType} class="px-3 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800">
                Add entity type
            </button>
        </div>

        {#if showEntityTypeForm}
            <form
                method="POST"
                action={editingEntityType ? '?/updateEntityType' : '?/createEntityType'}
                use:enhance={() => { closeEntityTypeForm(); return async ({ update }) => update(); }}
                class="mb-6 p-5 border rounded-lg bg-gray-50 flex flex-col gap-4"
            >
                {#if editingEntityType}
                    <input type="hidden" name="id" value={editingEntityType.id} />
                {/if}
                <input type="hidden" name="fields" value={JSON.stringify(etFields)} />

                <div class="flex gap-4">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="et-name">Name</label>
                        <input
                            id="et-name" name="name" type="text" required
                            value={editingEntityType?.name ?? ''}
                            placeholder="e.g. Software System"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="et-desc">Description</label>
                        <input
                            id="et-desc" name="description" type="text"
                            value={editingEntityType?.description ?? ''}
                            placeholder="Optional"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Fields</span>
                        <button type="button" onclick={addEtField} class="text-xs text-blue-600 hover:underline">
                            + Add field
                        </button>
                    </div>
                    {#if etFields.length === 0}
                        <p class="text-xs text-gray-400">No fields defined.</p>
                    {/if}
                    {#each etFields as field, i}
                        <div class="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                placeholder="Field name"
                                bind:value={etFields[i].name}
                                class="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <select
                                bind:value={etFields[i].type}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {#each fieldTypes as ft}<option value={ft}>{ft}</option>{/each}
                            </select>
                            <label class="flex items-center gap-1 text-xs text-gray-600">
                                <input type="checkbox" bind:checked={etFields[i].required} />
                                required
                            </label>
                            <button type="button" onclick={() => removeEtField(i)} class="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                    {/each}
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800">
                        {editingEntityType ? 'Save changes' : 'Create entity type'}
                    </button>
                    <button type="button" onclick={closeEntityTypeForm} class="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                        Cancel
                    </button>
                </div>
            </form>
        {/if}

        {#if data.entityTypes.length === 0}
            <p class="text-gray-500 text-sm">No entity types defined yet.</p>
        {:else}
            <ul class="flex flex-col gap-2">
                {#each data.entityTypes as et}
                    <li class="border rounded-lg p-4 flex items-start justify-between gap-4">
                        <div>
                            <p class="font-medium">{et.name}</p>
                            {#if et.description}<p class="text-sm text-gray-500">{et.description}</p>{/if}
                            {#if et.fields.length > 0}
                                <p class="text-xs text-gray-400 mt-1">
                                    {et.fields.map(f => `${f.name}: ${f.type}${f.required ? '*' : ''}`).join(' · ')}
                                </p>
                            {/if}
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button onclick={() => openEditEntityType(et)} class="text-xs text-blue-600 hover:underline">Edit</button>
                            <form method="POST" action="?/deleteEntityType" use:enhance>
                                <input type="hidden" name="id" value={et.id} />
                                <button type="submit" class="text-xs text-red-500 hover:underline"
                                    onclick={(e) => { if (!confirm(`Delete "${et.name}"?`)) e.preventDefault(); }}>
                                    Delete
                                </button>
                            </form>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}

    <!-- ── Relationship Types tab ────────────────────────────────────────────── -->
    {#if activeTab === 'relationship-types'}
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Relationship Types</h2>
            <button onclick={openNewRelType} class="px-3 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800">
                Add relationship type
            </button>
        </div>

        {#if showRelTypeForm}
            <form
                method="POST"
                action={editingRelType ? '?/updateRelationshipType' : '?/createRelationshipType'}
                use:enhance={() => { closeRelTypeForm(); return async ({ update }) => update(); }}
                class="mb-6 p-5 border rounded-lg bg-gray-50 flex flex-col gap-4"
            >
                {#if editingRelType}
                    <input type="hidden" name="id" value={editingRelType.id} />
                {/if}
                <input type="hidden" name="fields" value={JSON.stringify(rtFields)} />

                <div class="flex gap-4">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="rt-name">Name</label>
                        <input
                            id="rt-name" name="name" type="text" required
                            value={editingRelType?.name ?? ''}
                            placeholder="e.g. Depends On"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="rt-desc">Description</label>
                        <input
                            id="rt-desc" name="description" type="text"
                            value={editingRelType?.description ?? ''}
                            placeholder="Optional"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="rt-src">Source entity type</label>
                        <select
                            id="rt-src" name="sourceEntityTypeId"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="">Any</option>
                            {#each data.entityTypes as et}
                                <option value={et.id} selected={editingRelType?.sourceEntityTypeId === et.id}>{et.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                        <label class="text-sm font-medium" for="rt-tgt">Target entity type</label>
                        <select
                            id="rt-tgt" name="targetEntityTypeId"
                            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="">Any</option>
                            {#each data.entityTypes as et}
                                <option value={et.id} selected={editingRelType?.targetEntityTypeId === et.id}>{et.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Fields</span>
                        <button type="button" onclick={addRtField} class="text-xs text-blue-600 hover:underline">+ Add field</button>
                    </div>
                    {#if rtFields.length === 0}
                        <p class="text-xs text-gray-400">No fields defined.</p>
                    {/if}
                    {#each rtFields as field, i}
                        <div class="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                placeholder="Field name"
                                bind:value={rtFields[i].name}
                                class="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <select
                                bind:value={rtFields[i].type}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                {#each fieldTypes as ft}<option value={ft}>{ft}</option>{/each}
                            </select>
                            <label class="flex items-center gap-1 text-xs text-gray-600">
                                <input type="checkbox" bind:checked={rtFields[i].required} />
                                required
                            </label>
                            <button type="button" onclick={() => removeRtField(i)} class="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                    {/each}
                </div>

                <div class="flex gap-2">
                    <button type="submit" class="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800">
                        {editingRelType ? 'Save changes' : 'Create relationship type'}
                    </button>
                    <button type="button" onclick={closeRelTypeForm} class="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                        Cancel
                    </button>
                </div>
            </form>
        {/if}

        {#if data.relationshipTypes.length === 0}
            <p class="text-gray-500 text-sm">No relationship types defined yet.</p>
        {:else}
            <ul class="flex flex-col gap-2">
                {#each data.relationshipTypes as rt}
                    <li class="border rounded-lg p-4 flex items-start justify-between gap-4">
                        <div>
                            <p class="font-medium">{rt.name}</p>
                            {#if rt.description}<p class="text-sm text-gray-500">{rt.description}</p>{/if}
                            <p class="text-xs text-gray-400 mt-1">
                                {#if rt.sourceEntityTypeId || rt.targetEntityTypeId}
                                    {data.entityTypes.find(e => e.id === rt.sourceEntityTypeId)?.name ?? 'Any'}
                                    →
                                    {data.entityTypes.find(e => e.id === rt.targetEntityTypeId)?.name ?? 'Any'}
                                {:else}
                                    Any → Any
                                {/if}
                                {#if rt.fields.length > 0}
                                    · {rt.fields.map(f => `${f.name}: ${f.type}${f.required ? '*' : ''}`).join(' · ')}
                                {/if}
                            </p>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button onclick={() => openEditRelType(rt)} class="text-xs text-blue-600 hover:underline">Edit</button>
                            <form method="POST" action="?/deleteRelationshipType" use:enhance>
                                <input type="hidden" name="id" value={rt.id} />
                                <button type="submit" class="text-xs text-red-500 hover:underline"
                                    onclick={(e) => { if (!confirm(`Delete "${rt.name}"?`)) e.preventDefault(); }}>
                                    Delete
                                </button>
                            </form>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
</div>
