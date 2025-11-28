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
            <label>Main Grid Style</label>
            <div class="input-row">
                <select
                    id="gridStyleSelect"
                    style="width: 100%">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>
            </div>
        </div>

        <div class="control-group">
            <label>Main Grid Thickness</label>
            <div class="input-row">
                <input
                    type="range"
                    id="gridThicknessSlider"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value="0.5" />
                <span id="gridThicknessVal">0.5</span>
            </div>
        </div>

        <div class="control-group">
            <label>Main Grid Opacity</label>
            <div class="input-row">
                <input
                    type="range"
                    id="gridOpacitySlider"
                    min="0"
                    max="1"
                    step="0.1"
                    value="1" />
                <span id="gridOpacityVal">1.0</span>
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

        <hr style="border-color: var(--border); margin: 10px 0" />

        <div class="control-group">
            <label>Sub-Grid Style</label>
            <div class="input-row">
                <select
                    id="subGridStyleSelect"
                    style="width: 100%">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>
            </div>
        </div>

        <div class="control-group">
            <label>Sub-Grid Thickness</label>
            <div class="input-row">
                <input
                    type="range"
                    id="subGridThicknessSlider"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value="0.5" />
                <span id="subGridThicknessVal">0.5</span>
            </div>
        </div>

        <div class="control-group">
            <label>Sub-Grid Opacity</label>
            <div class="input-row">
                <input
                    type="range"
                    id="subGridOpacitySlider"
                    min="0"
                    max="1"
                    step="0.1"
                    value="1" />
                <span id="subGridOpacityVal">1.0</span>
            </div>
        </div>

        <div class="control-group">
            <label>Sub-Grid Display</label>
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between">
                <span style="font-size: 0.85rem">Show Sub-Grid</span>
                <input
                    type="checkbox"
                    id="subGridToggle"
                    checked />
            </div>
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-top: 5px">
                <span style="font-size: 0.85rem">Sub-Grid Color</span>
                <input
                    type="color"
                    id="subGridColorPicker"
                    value="#444444"
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
