<script setup>
    import { ref } from "vue";
    import ControlSection from "./ControlSection.vue";

    const props = defineProps({
        autoTrixelInstance: Object,
    });

    // ... (rest of script)
</script>

<template>
    <ControlSection title="Color Editor">
        <div class="flex gap-2.5 items-center">
            <div
                id="colorPreviewBox"
                class="w-10 h-10 rounded-md border-2 border-black-light bg-primary"></div>
            <div
                id="colorCodeDisplay"
                class="flex-1 font-mono text-xs text-white-dark">
                #00d2ff
            </div>
        </div>

        <div class="flex flex-col gap-0.5">
            <span class="text-xs text-white-dark">Lightness (L)</span>
            <input
                type="range"
                id="lInput"
                min="0"
                max="100"
                value="60"
                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
        </div>
        <div class="flex flex-col gap-0.5">
            <span class="text-xs text-white-dark">Chroma (C)</span>
            <input
                type="range"
                id="cInput"
                min="0"
                max="0.37"
                step="0.01"
                value="0.15"
                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
        </div>
        <div class="flex flex-col gap-0.5">
            <span class="text-xs text-white-dark">Hue (H)</span>
            <input
                type="range"
                id="hInput"
                min="0"
                max="360"
                value="200"
                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
        </div>

        <div style="margin-top: 5px">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center mb-1.5">Quick Palette</label>
            <div
                class="grid grid-cols-5 gap-1.5 mt-1.5"
                id="palette"></div>
        </div>
    </ControlSection>
</template>

<style scoped>
    @reference "../style.css";

    :deep(.swatch) {
        @apply w-full aspect-square rounded cursor-pointer border-2 border-transparent transition-transform duration-100 hover:scale-110 hover:z-10;
    }
    :deep(.swatch.selected) {
        @apply border-white ring-2 ring-primary;
    }
</style>
