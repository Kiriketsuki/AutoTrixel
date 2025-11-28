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
    <div class="control-section">
        <div
            class="section-header"
            @click="toggle">
            <span class="section-title">{{ title }}</span>
            <span
                class="toggle-icon"
                :class="{ collapsed: isCollapsed }">
                ▼
            </span>
        </div>
        <TransitionExpand :expanded="!isCollapsed">
            <div class="section-content">
                <slot></slot>
            </div>
        </TransitionExpand>
    </div>
</template>

<style scoped>
    .control-section {
        background-color: var(--color-black);
        border: 1px solid var(--border);
        border-radius: 6px;
        margin-bottom: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
        flex-shrink: 0; /* Prevent shrinking in flex container */
    }

    .control-section:hover {
        border-color: var(--accent);
    }

    .section-header {
        padding: 8px 10px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--color-black-light);
        user-select: none;
        border-bottom: 1px solid var(--border);
    }

    .section-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-white);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .toggle-icon {
        font-size: 0.7rem;
        color: var(--color-white-dark);
        transition: transform 0.2s;
    }

    .toggle-icon.collapsed {
        transform: rotate(-90deg);
    }

    .section-content {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
</style>
