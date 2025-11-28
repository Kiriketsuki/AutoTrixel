<script setup>
    import { ref } from "vue";

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
        <div
            class="section-content"
            v-show="!isCollapsed">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
    .control-section {
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        margin-bottom: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
        flex-shrink: 0; /* Prevent shrinking in flex container */
    }

    .control-section:hover {
        border-color: rgba(255, 255, 255, 0.1);
        background-color: rgba(255, 255, 255, 0.05);
    }

    .section-header {
        padding: 8px 10px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.2);
        user-select: none;
    }

    .section-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: #ddd;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .toggle-icon {
        font-size: 0.7rem;
        color: #888;
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
