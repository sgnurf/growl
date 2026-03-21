<script lang="ts">
    interface Props {
        symbol: string;
        labelPropertyName: string;
        data?: any;
    }

    let { symbol, labelPropertyName, data = {} }: Props = $props();
</script>

<g
    ><!-- Not necessary for svg but there is a werid svelte bug which prevents the "dynamic" svg to be displayd otherwise  -->
    {@html symbol.replace('#LABEL#', data[labelPropertyName])}
</g>
