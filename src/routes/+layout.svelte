<script lang="ts">
    import Header from './Header.svelte';
    import './styles.css';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<div class="app">
    <Header />

    <main>
        {@render children?.()}
    </main>
</div>
