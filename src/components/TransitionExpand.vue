<script setup>
    defineProps({
        expanded: {
            type: Boolean,
            required: true,
        },
    });
</script>

<template>
    <div
        class="expand-wrapper"
        :class="{ expanded: expanded }">
        <div class="expand-inner">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
    .expand-wrapper {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.3s ease-out;
    }

    .expand-wrapper.expanded {
        grid-template-rows: 1fr;
    }

    .expand-inner {
        overflow: hidden;
        min-height: 0;
    }
</style>
