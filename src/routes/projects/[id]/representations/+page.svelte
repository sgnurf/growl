<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';
    import type {
        RepresentationLibrary,
        EntityRepresentation,
        RelationshipRepresentation,
        LineStyle,
        ArrowheadStyle
    } from '$lib/representations/types';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import Shape from '$lib/components/d3graph/graphNodes/shape.svelte';

    let { data }: { data: PageData } = $props();

    type EditableRelationshipRepresentation = Omit<RelationshipRepresentation, 'labelFieldName'> & {
        labelFieldName: string;
    };

    let showLibraryForm = $state(false);
    let editingLibrary = $state<RepresentationLibrary | null>(null);
    let entityReps = $state<EntityRepresentation[]>([]);
    let relationshipReps = $state<EditableRelationshipRepresentation[]>([]);

    function openNewLibrary() {
        editingLibrary = null;
        entityReps = [];
        relationshipReps = [];
        showLibraryForm = true;
    }

    function openEditLibrary(library: RepresentationLibrary) {
        editingLibrary = library;
        entityReps = structuredClone(library.entityRepresentations);
        relationshipReps = structuredClone(library.relationshipRepresentations).map((r) => ({
            ...r,
            labelFieldName: r.labelFieldName ?? ''
        }));
        showLibraryForm = true;
    }

    function closeLibraryForm() {
        showLibraryForm = false;
        editingLibrary = null;
        entityReps = [];
        relationshipReps = [];
    }

    function addEntityRep() {
        entityReps = [
            ...entityReps,
            {
                id: crypto.randomUUID(),
                name: '',
                shapeType: 'circle',
                shapeProps: { size: 10, color: 'black' },
                labelFieldName: 'name'
            }
        ];
    }

    function removeEntityRep(idx: number) {
        entityReps = entityReps.filter((_, i) => i !== idx);
    }

    const defaultCustomSymbol = `
        <polygon points="-7,7 -7,-7 7,7 7,-7"></polygon>
        <text x="0" y="-17" text-anchor="middle" alignment-baseline="middle" stroke="black">#LABEL#</text>
`;

    function onEntityRepShapeTypeChange(idx: number) {
        const rep = entityReps[idx];
        if (rep.shapeType === 'custom') {
            if (rep.shapeProps.symbol === undefined) {
                rep.shapeProps = { symbol: defaultCustomSymbol };
            }
        } else if (rep.shapeProps.size === undefined || rep.shapeProps.color === undefined) {
            rep.shapeProps = {
                size: rep.shapeProps.size ?? 10,
                color: rep.shapeProps.color ?? 'black'
            };
        }
    }

    function addRelationshipRep() {
        relationshipReps = [
            ...relationshipReps,
            {
                id: crypto.randomUUID(),
                name: '',
                lineStyle: 'solid',
                color: '#999999',
                arrowhead: 'none',
                labelFieldName: ''
            }
        ];
    }

    function removeRelationshipRep(idx: number) {
        relationshipReps = relationshipReps.filter((_, i) => i !== idx);
    }

    let relationshipRepsForSubmit = $derived(
        relationshipReps.map((r) => ({ ...r, labelFieldName: r.labelFieldName.trim() || null }))
    );

    function dashArrayFor(lineStyle: LineStyle): string | undefined {
        if (lineStyle === 'dashed') return '6,4';
        if (lineStyle === 'dotted') return '2,3';
        return undefined;
    }

    const shapeTypes = ['circle', 'square', 'triangle', 'custom'] as const;
    const lineStyles: LineStyle[] = ['solid', 'dashed', 'dotted'];
    const arrowheadStyles: ArrowheadStyle[] = ['none', 'arrow', 'open'];
</script>

<svelte:head>
    <title>Growl – {data.project.name} – Representations</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <p class="text-sm text-gray-400 mb-1">
            <a href="/" class="hover:underline">Projects</a> / {data.project.name}
        </p>
        <h1 class="text-3xl font-bold">{data.project.name}</h1>
    </div>

    <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Representation Libraries</h2>
        <Button size="sm" onclick={openNewLibrary}>Add library</Button>
    </div>

    {#if showLibraryForm}
        <form
            method="POST"
            action={editingLibrary ? '?/updateLibrary' : '?/createLibrary'}
            use:enhance={() => {
                closeLibraryForm();
                return async ({ update }) => update();
            }}
            class="mb-6 p-5 border rounded-lg bg-gray-50 flex flex-col gap-5"
        >
            {#if editingLibrary}
                <input type="hidden" name="id" value={editingLibrary.id} />
            {/if}
            <input type="hidden" name="entityRepresentations" value={JSON.stringify(entityReps)} />
            <input
                type="hidden"
                name="relationshipRepresentations"
                value={JSON.stringify(relationshipRepsForSubmit)}
            />

            <FormField label="Name" for="lib-name" required class="max-w-sm">
                <Input
                    id="lib-name"
                    name="name"
                    required
                    value={editingLibrary?.name ?? ''}
                    placeholder="e.g. C4 Style"
                />
            </FormField>

            <!-- ── Entity representations ─────────────────────────────────────── -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">Entity representations</span>
                    <Button variant="ghost" onclick={addEntityRep}
                        >+ Add entity representation</Button
                    >
                </div>
                {#if entityReps.length === 0}
                    <p class="text-xs text-gray-400">No entity representations defined.</p>
                {/if}
                {#each entityReps as rep, i}
                    <div class="flex gap-2 items-start mb-2 p-2 border rounded bg-white">
                        <svg width="40" height="40" viewBox="-20 -20 40 40" class="shrink-0">
                            <Shape
                                shapeConfiguration={{
                                    id: rep.id,
                                    name: rep.name,
                                    shapeType: rep.shapeType,
                                    shapeProps: rep.shapeProps,
                                    labelPropertyName: rep.labelFieldName
                                }}
                                data={{ [rep.labelFieldName || 'name']: 'Label' }}
                            />
                        </svg>
                        <div class="flex flex-wrap gap-2 flex-1">
                            <input
                                type="text"
                                placeholder="Name"
                                bind:value={entityReps[i].name}
                                class="border rounded px-2 py-1 text-sm flex-1 min-w-[8rem] focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                bind:value={entityReps[i].shapeType}
                                onchange={() => onEntityRepShapeTypeChange(i)}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {#each shapeTypes as st}<option value={st}>{st}</option>{/each}
                            </select>
                            <input
                                type="text"
                                placeholder="Color"
                                bind:value={entityReps[i].shapeProps.color}
                                class="border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <input
                                type="number"
                                placeholder="Size"
                                bind:value={entityReps[i].shapeProps.size}
                                class="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <input
                                type="text"
                                placeholder="Label field"
                                bind:value={entityReps[i].labelFieldName}
                                class="border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            {#if entityReps[i].shapeType === 'custom'}
                                <textarea
                                    placeholder="SVG symbol markup — use #LABEL# as the label placeholder"
                                    bind:value={entityReps[i].shapeProps.symbol}
                                    class="border rounded px-2 py-1 text-sm w-full font-mono focus:outline-none focus:ring-2 focus:ring-black"
                                ></textarea>
                            {/if}
                        </div>
                        <button
                            type="button"
                            onclick={() => removeEntityRep(i)}
                            class="text-red-400 hover:text-red-600 text-sm">✕</button
                        >
                    </div>
                {/each}
            </div>

            <!-- ── Relationship representations ───────────────────────────────── -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">Relationship representations</span>
                    <Button variant="ghost" onclick={addRelationshipRep}
                        >+ Add relationship representation</Button
                    >
                </div>
                {#if relationshipReps.length === 0}
                    <p class="text-xs text-gray-400">No relationship representations defined.</p>
                {/if}
                {#each relationshipReps as rep, i}
                    <div class="flex gap-2 items-center mb-2 p-2 border rounded bg-white">
                        <svg width="60" height="24" viewBox="0 0 60 24" class="shrink-0">
                            <line
                                x1="4"
                                y1="12"
                                x2="50"
                                y2="12"
                                stroke={rep.color}
                                stroke-width="2"
                                stroke-dasharray={dashArrayFor(rep.lineStyle)}
                            />
                            {#if rep.arrowhead === 'arrow'}
                                <polygon points="50,7 58,12 50,17" fill={rep.color} />
                            {:else if rep.arrowhead === 'open'}
                                <polyline
                                    points="50,7 58,12 50,17"
                                    fill="none"
                                    stroke={rep.color}
                                    stroke-width="2"
                                />
                            {/if}
                        </svg>
                        <div class="flex flex-wrap gap-2 flex-1">
                            <input
                                type="text"
                                placeholder="Name"
                                bind:value={relationshipReps[i].name}
                                class="border rounded px-2 py-1 text-sm flex-1 min-w-[8rem] focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                bind:value={relationshipReps[i].lineStyle}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {#each lineStyles as ls}<option value={ls}>{ls}</option>{/each}
                            </select>
                            <input
                                type="text"
                                placeholder="Color"
                                bind:value={relationshipReps[i].color}
                                class="border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                bind:value={relationshipReps[i].arrowhead}
                                class="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {#each arrowheadStyles as ah}<option value={ah}>{ah}</option>{/each}
                            </select>
                            <input
                                type="text"
                                placeholder="Label field (optional)"
                                bind:value={relationshipReps[i].labelFieldName}
                                class="border rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <button
                            type="button"
                            onclick={() => removeRelationshipRep(i)}
                            class="text-red-400 hover:text-red-600 text-sm">✕</button
                        >
                    </div>
                {/each}
            </div>

            <div class="flex gap-2">
                <Button type="submit">{editingLibrary ? 'Save changes' : 'Create library'}</Button>
                <Button variant="secondary" onclick={closeLibraryForm}>Cancel</Button>
            </div>
        </form>
    {/if}

    {#if data.representationLibraries.length === 0}
        <p class="text-gray-500 text-sm">No representation libraries defined yet.</p>
    {:else}
        <ul class="flex flex-col gap-2">
            {#each data.representationLibraries as library}
                <li>
                    <Card class="flex items-start justify-between gap-4">
                        <div>
                            <p class="font-medium">{library.name}</p>
                            <p class="text-xs text-gray-400 mt-1">
                                {library.entityRepresentations.length} entity representation{library
                                    .entityRepresentations.length === 1
                                    ? ''
                                    : 's'} · {library.relationshipRepresentations.length} relationship
                                representation{library.relationshipRepresentations.length === 1
                                    ? ''
                                    : 's'}
                            </p>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <Button variant="ghost" onclick={() => openEditLibrary(library)}
                                >Edit</Button
                            >
                            <form method="POST" action="?/deleteLibrary" use:enhance>
                                <input type="hidden" name="id" value={library.id} />
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    onclick={(e) => {
                                        if (!confirm(`Delete "${library.name}"?`))
                                            e.preventDefault();
                                    }}>Delete</Button
                                >
                            </form>
                        </div>
                    </Card>
                </li>
            {/each}
        </ul>
    {/if}
</div>
