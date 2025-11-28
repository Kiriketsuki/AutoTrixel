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
        class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out"
        :class="{ 'grid-rows-[1fr]': expanded }">
        <div class="overflow-hidden min-h-0">
            <slot></slot>
        </div>
    </div>
</template>
