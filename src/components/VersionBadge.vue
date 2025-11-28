<script setup>
    import { version } from "../../package.json";
</script>

<template>
    <span class="inline-block text-[0.5rem] font-medium text-white bg-secondary px-1.5 py-0.5 rounded ml-2 align-middle border border-black-light">v{{ version }}</span>
</template>
