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
        <div class="color-preview-row">
            <div id="colorPreviewBox"></div>
            <div
                id="colorCodeDisplay"
                style="flex: 1; font-family: monospace; font-size: 0.8rem; color: #888">
                #00d2ff
            </div>
        </div>

        <div class="slider-row">
            <span class="slider-label">Lightness (L)</span>
            <input
                type="range"
                id="lInput"
                min="0"
                max="100"
                value="60" />
        </div>
        <div class="slider-row">
            <span class="slider-label">Chroma (C)</span>
            <input
                type="range"
                id="cInput"
                min="0"
                max="0.37"
                step="0.01"
                value="0.15" />
        </div>
        <div class="slider-row">
            <span class="slider-label">Hue (H)</span>
            <input
                type="range"
                id="hInput"
                min="0"
                max="360"
                value="200" />
        </div>

        <div style="margin-top: 5px">
            <label style="margin-bottom: 5px; font-size: 0.75rem">Quick Palette</label>
            <div
                class="palette"
                id="palette"></div>
        </div>
    </ControlSection>
</template>
