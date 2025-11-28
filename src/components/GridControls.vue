<script setup>
    import ControlSection from "./ControlSection.vue";

    const props = defineProps({
        autoTrixelInstance: Object,
    });
</script>

<template>
    <ControlSection title="Grid Settings">
        <div class="control-group">
            <label>Triangle Scale (px)</label>
            <div class="input-row">
                <input
                    type="range"
                    id="scaleSlider"
                    min="5"
                    max="200"
                    value="25" />
                <input
                    type="number"
                    id="scaleNumber"
                    min="5"
                    max="200"
                    value="25" />
            </div>
        </div>

        <div class="control-group">
            <label>Grid Width</label>
            <div class="input-row">
                <input
                    type="range"
                    id="widthSlider"
                    min="5"
                    max="500"
                    value="40" />
                <input
                    type="number"
                    id="widthNumber"
                    min="5"
                    max="500"
                    value="40" />
            </div>
        </div>

        <div class="control-group">
            <label>Grid Height</label>
            <div class="input-row">
                <input
                    type="range"
                    id="heightSlider"
                    min="5"
                    max="500"
                    value="30" />
                <input
                    type="number"
                    id="heightNumber"
                    min="5"
                    max="500"
                    value="30" />
            </div>
        </div>

        <div class="control-group">
            <label>Display</label>
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between">
                <span style="font-size: 0.85rem">Show Grid</span>
                <input
                    type="checkbox"
                    id="gridToggle"
                    checked />
            </div>
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-top: 5px">
                <span style="font-size: 0.85rem">Grid Color</span>
                <input
                    type="color"
                    id="gridColorPicker"
                    value="#222222"
                    style="width: 40px; height: 25px" />
            </div>
        </div>

        <div class="control-group">
            <label style="color: var(--accent)">
                Include Grid in Export
                <input
                    type="checkbox"
                    id="exportGridToggle" />
            </label>
        </div>
    </ControlSection>
</template>
