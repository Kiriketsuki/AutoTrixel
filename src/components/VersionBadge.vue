<script setup>
    import { version } from "../../package.json";
</script>

<template>
    <span class="version-badge">v{{ version }}</span>
</template>

<style scoped>
    .version-badge {
        display: inline-block;
        font-size: 0.5rem;
        font-weight: 500;
        color: var(--color-white);
        background-color: var(--color-tertiary);
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        vertical-align: middle;
        border: 1px solid var(--border);
    }
</style>
