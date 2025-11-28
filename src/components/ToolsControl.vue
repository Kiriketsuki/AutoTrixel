<script setup>
    import { ref } from "vue";
    import ControlSection from "./ControlSection.vue";

    const props = defineProps({
        autoTrixelInstance: Object,
    });

    const setTool = (tool) => {
        props.autoTrixelInstance?.setTool(tool);
    };

    const undoAction = () => {
        props.autoTrixelInstance?.undoAction();
    };
</script>

<template>
    <ControlSection title="Tools">
        <div class="tools-grid">
            <button
                class="tool-btn active"
                id="tool-pencil"
                @click="setTool('pencil')">
                ✏️ Draw
            </button>
            <button
                class="tool-btn"
                id="tool-bucket"
                @click="setTool('bucket')">
                🪣 Fill
            </button>
            <button
                class="tool-btn"
                id="tool-eraser"
                @click="setTool('eraser')">
                🧹 Erase
            </button>
            <button
                class="tool-btn"
                id="tool-picker"
                @click="setTool('picker')">
                🧪 Pick
            </button>
        </div>
        <button
            class="undo-btn"
            id="btnUndo"
            @click="undoAction">
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo (Ctrl+Z)
        </button>

        <div
            class="control-group"
            style="margin-top: 5px">
            <label
                >Brush Size
                <span
                    id="brushVal"
                    class="value-display"
                    >1</span
                ></label
            >
            <input
                type="range"
                id="brushInput"
                min="1"
                max="5"
                value="1" />
        </div>
    </ControlSection>
</template>
