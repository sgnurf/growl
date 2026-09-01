<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';
    import type { Field, EntityType, RelationshipType } from '$lib/schema/types';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import TabBar from '$lib/components/ui/TabBar.svelte';

    let { data }: { data: PageData } = $props();

    type Tab = 'entity-types' | 'relationship-types';
    let activeTab = $state<Tab>('entity-types');

    const schemaTabs = [
        { id: 'entity-types', label: 'Entity Types' },
        { id: 'relationship-types', label: 'Relationship Types' }
    ];

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

    let entityRepresentationOptions = $derived(
        data.representationLibraries.flatMap((library) =>
            library.entityRepresentations.map((rep) => ({
                id: rep.id,
                label: `${library.name} — ${rep.name}`
            }))
        )
    );

    let relationshipRepresentationOptions = $derived(
        data.representationLibraries.flatMap((library) =>
            library.relationshipRepresentations.map((rep) => ({
                id: rep.id,
                label: `${library.name} — ${rep.name}`
            }))
        )
    );
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

    <TabBar tabs={schemaTabs} active={activeTab} onchange={(id) => (activeTab = id as Tab)} />

    <!-- ── Entity Types tab ─────────────────────────────────────────────────── -->
    {#if activeTab === 'entity-types'}
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Entity Types</h2>
            <Button size="sm" onclick={openNewEntityType}>Add entity type</Button>
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
                    <FormField label="Name" for="et-name" required class="flex-1">
                        <Input
                            id="et-name" name="name" required
                            value={editingEntityType?.name ?? ''}
                            placeholder="e.g. Software System"
                        />
                    </FormField>
                    <FormField label="Description" for="et-desc" class="flex-1">
                        <Input
                            id="et-desc" name="description"
                            value={editingEntityType?.description ?? ''}
                            placeholder="Optional"
                        />
                    </FormField>
                </div>

                <div class="flex flex-col gap-2 max-w-sm">
                    <label class="text-sm font-medium" for="et-representation">Representation</label>
                    <select
                        id="et-representation" name="representationId"
                        class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">Default (auto)</option>
                        {#each entityRepresentationOptions as opt}
                            <option value={opt.id} selected={editingEntityType?.representationId === opt.id}>{opt.label}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Fields</span>
                        <Button variant="ghost" onclick={addEtField}>+ Add field</Button>
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
                                class="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                bind:value={etFields[i].type}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                    <Button type="submit">
                        {editingEntityType ? 'Save changes' : 'Create entity type'}
                    </Button>
                    <Button variant="secondary" onclick={closeEntityTypeForm}>Cancel</Button>
                </div>
            </form>
        {/if}

        {#if data.entityTypes.length === 0}
            <p class="text-gray-500 text-sm">No entity types defined yet.</p>
        {:else}
            <ul class="flex flex-col gap-2">
                {#each data.entityTypes as et}
                    <li>
                        <Card class="flex items-start justify-between gap-4">
                            <div>
                                <p class="font-medium">{et.name}</p>
                                {#if et.description}<p class="text-sm text-gray-500">{et.description}</p>{/if}
                                {#if et.fields.length > 0}
                                    <p class="text-xs text-gray-400 mt-1">
                                        {et.fields.map(f => `${f.name}: ${f.type}${f.required ? '*' : ''}`).join(' · ')}
                                    </p>
                                {/if}
                                <p class="text-xs text-gray-400 mt-1">
                                    Representation: {entityRepresentationOptions.find((o) => o.id === et.representationId)?.label ?? 'Default (auto)'}
                                </p>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <Button variant="ghost" onclick={() => openEditEntityType(et)}>Edit</Button>
                                <form method="POST" action="?/deleteEntityType" use:enhance>
                                    <input type="hidden" name="id" value={et.id} />
                                    <Button
                                        variant="destructive"
                                        type="submit"
                                        onclick={(e) => { if (!confirm(`Delete "${et.name}"?`)) e.preventDefault(); }}
                                    >Delete</Button>
                                </form>
                            </div>
                        </Card>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}

    <!-- ── Relationship Types tab ────────────────────────────────────────────── -->
    {#if activeTab === 'relationship-types'}
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Relationship Types</h2>
            <Button size="sm" onclick={openNewRelType}>Add relationship type</Button>
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
                    <FormField label="Name" for="rt-name" required class="flex-1">
                        <Input
                            id="rt-name" name="name" required
                            value={editingRelType?.name ?? ''}
                            placeholder="e.g. Depends On"
                        />
                    </FormField>
                    <FormField label="Description" for="rt-desc" class="flex-1">
                        <Input
                            id="rt-desc" name="description"
                            value={editingRelType?.description ?? ''}
                            placeholder="Optional"
                        />
                    </FormField>
                </div>

                <div class="flex gap-4">
                    <div class="flex flex-col gap-2 flex-1">
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
                    <div class="flex flex-col gap-2 flex-1">
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

                <div class="flex flex-col gap-2 max-w-sm">
                    <label class="text-sm font-medium" for="rt-representation">Representation</label>
                    <select
                        id="rt-representation" name="representationId"
                        class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">Default (auto)</option>
                        {#each relationshipRepresentationOptions as opt}
                            <option value={opt.id} selected={editingRelType?.representationId === opt.id}>{opt.label}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Fields</span>
                        <Button variant="ghost" onclick={addRtField}>+ Add field</Button>
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
                                class="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                bind:value={rtFields[i].type}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                    <Button type="submit">
                        {editingRelType ? 'Save changes' : 'Create relationship type'}
                    </Button>
                    <Button variant="secondary" onclick={closeRelTypeForm}>Cancel</Button>
                </div>
            </form>
        {/if}

        {#if data.relationshipTypes.length === 0}
            <p class="text-gray-500 text-sm">No relationship types defined yet.</p>
        {:else}
            <ul class="flex flex-col gap-2">
                {#each data.relationshipTypes as rt}
                    <li>
                        <Card class="flex items-start justify-between gap-4">
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
                                <p class="text-xs text-gray-400 mt-1">
                                    Representation: {relationshipRepresentationOptions.find((o) => o.id === rt.representationId)?.label ?? 'Default (auto)'}
                                </p>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <Button variant="ghost" onclick={() => openEditRelType(rt)}>Edit</Button>
                                <form method="POST" action="?/deleteRelationshipType" use:enhance>
                                    <input type="hidden" name="id" value={rt.id} />
                                    <Button
                                        variant="destructive"
                                        type="submit"
                                        onclick={(e) => { if (!confirm(`Delete "${rt.name}"?`)) e.preventDefault(); }}
                                    >Delete</Button>
                                </form>
                            </div>
                        </Card>
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
</div>
