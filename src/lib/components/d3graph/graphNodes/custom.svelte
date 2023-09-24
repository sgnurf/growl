<script lang="ts">
    export let symbol: string;
    export let labelPropertyName: string;
    export let data: any = {};
</script>

<g><!-- Not necessary for svg but there is a werid svelte bug which prevents the "dynamic" svg to be displayd otherwise  -->
    {@html symbol.replace("#LABEL#",data[labelPropertyName])}
</g>