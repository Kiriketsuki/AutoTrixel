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
        <div class="grid grid-cols-2 gap-2">
            <button
                class="tool-btn active bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white"
                id="tool-pencil"
                @click="setTool('pencil')">
                ✏️ Draw
            </button>
            <button
                class="tool-btn bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white"
                id="tool-bucket"
                @click="setTool('bucket')">
                🪣 Fill
            </button>
            <button
                class="tool-btn bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white"
                id="tool-eraser"
                @click="setTool('eraser')">
                🧹 Erase
            </button>
            <button
                class="tool-btn bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white"
                id="tool-picker"
                @click="setTool('picker')">
                🧪 Pick
            </button>
            <button
                class="tool-btn bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white"
                id="tool-subdivide"
                @click="setTool('subdivide')">
                ◭ Subdivide
            </button>
        </div>
        <button
            class="bg-black border border-black-light text-white-dark p-2 rounded-md cursor-pointer flex items-center justify-center gap-1.5 text-sm hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white active:bg-tertiary-dark disabled:opacity-50 disabled:cursor-not-allowed w-full mt-2"
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
            class="flex flex-col gap-2"
            style="margin-top: 5px">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center"
                >Brush Size
                <span
                    id="brushVal"
                    class="text-xs text-primary"
                    >1</span
                ></label
            >
            <input
                type="range"
                id="brushInput"
                min="1"
                max="5"
                value="1"
                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
        </div>
    </ControlSection>
</template>

<style scoped>
    @reference "../style.css";

    .tool-btn.active {
        @apply bg-primary text-white border-primary font-bold;
    }
</style>
