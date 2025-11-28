<script setup>
    import { ref } from "vue";
    import TransitionExpand from "./TransitionExpand.vue";

    const props = defineProps({
        title: {
            type: String,
            required: true,
        },
        initialCollapsed: {
            type: Boolean,
            default: false,
        },
    });

    const isCollapsed = ref(props.initialCollapsed);

    const toggle = () => {
        isCollapsed.value = !isCollapsed.value;
    };
</script>

<template>
    <div class="bg-black border border-black-light rounded-md mb-2 overflow-hidden transition-all duration-200 shrink-0 hover:border-primary">
        <div
            class="p-2.5 cursor-pointer flex justify-between items-center bg-black-light select-none border-b border-black-light"
            @click="toggle">
            <span class="text-xs font-semibold text-white uppercase tracking-wide">{{ title }}</span>
            <span
                class="text-[0.7rem] text-white-dark transition-transform duration-200"
                :class="{ '-rotate-90': isCollapsed }">
                ▼
            </span>
        </div>
        <TransitionExpand :expanded="!isCollapsed">
            <div class="p-2.5 flex flex-col gap-2">
                <slot></slot>
            </div>
        </TransitionExpand>
    </div>
</template>
