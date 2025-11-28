<script setup>
    import { ref } from "vue";
    import ControlSection from "./ControlSection.vue";
    import TransitionExpand from "./TransitionExpand.vue";

    const props = defineProps({
        autoTrixelInstance: Object,
    });

    const showMainGridStyle = ref(false);
    const showSubGridStyle = ref(false);
    const showGridPalette = ref(false);
    const selectedGridColor = ref("var(--color-white-dark--1)");

    const gridColors = [
        { name: "Black Light -1", value: "var(--color-black-light--1)" },
        { name: "Black Light", value: "var(--color-black-light)" },
        { name: "Black Light +1", value: "var(--color-black-light-1)" },
        { name: "Black", value: "var(--color-black)" },
        { name: "Black Dark -1", value: "var(--color-black-dark--1)" },
        { name: "Black Dark", value: "var(--color-black-dark)" },
        { name: "Black Dark +1", value: "var(--color-black-dark-1)" },
        { name: "White Light -1", value: "var(--color-white-light--1)" },
        { name: "White Light", value: "var(--color-white-light)" },
        { name: "White Light +1", value: "var(--color-white-light-1)" },
        { name: "White", value: "var(--color-white)" },
        { name: "White Dark -1", value: "var(--color-white-dark--1)" },
        { name: "White Dark", value: "var(--color-white-dark)" },
        { name: "White Dark +1", value: "var(--color-white-dark-1)" },
    ];

    const showSubGridPalette = ref(false);
    const selectedSubGridColor = ref("var(--color-white)");

    const selectGridColor = (colorValue) => {
        selectedGridColor.value = colorValue;
        const input = document.getElementById("gridColorPicker");
        if (input) {
            input.value = colorValue;
            input.dispatchEvent(new Event("input"));
        }
    };

    const selectSubGridColor = (colorValue) => {
        selectedSubGridColor.value = colorValue;
        const input = document.getElementById("subGridColorPicker");
        if (input) {
            input.value = colorValue;
            input.dispatchEvent(new Event("input"));
        }
    };

    const selectedGridStyle = ref("solid");
    const selectedSubGridStyle = ref("dashed");

    const selectGridStyle = (style) => {
        selectedGridStyle.value = style;
        // Use setTimeout to ensure Vue has updated the DOM and to break out of the current call stack
        setTimeout(() => {
            const input = document.getElementById("gridStyleSelect");
            if (input) {
                input.value = style;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }, 0);
    };

    const selectSubGridStyle = (style) => {
        selectedSubGridStyle.value = style;
        setTimeout(() => {
            const input = document.getElementById("subGridStyleSelect");
            if (input) {
                input.value = style;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }, 0);
    };
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
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between">
                <label>Show Grid</label>
                <input
                    type="checkbox"
                    id="gridToggle"
                    checked />
            </div>
        </div>

        <div
            class="control-group"
            style="gap: 0">
            <div
                style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; background-color: var(--color-black-light); padding: 8px; border-radius: 4px"
                :style="{ borderRadius: showMainGridStyle ? '4px 4px 0 0' : '4px' }"
                @click="showMainGridStyle = !showMainGridStyle">
                <label style="cursor: pointer; font-size: 0.95rem">Main Grid Settings</label>
                <span style="font-size: 0.8rem; color: var(--color-white-dark)">{{ showMainGridStyle ? "▲" : "▼" }}</span>
            </div>

            <TransitionExpand :expanded="showMainGridStyle">
                <div style="padding: 10px; background-color: var(--color-black-light--1); border-radius: 0 0 4px 4px">
                    <div class="control-group">
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <label>Color</label>
                            <button
                                @click="showGridPalette = !showGridPalette"
                                style="background: none; border: none; color: var(--color-white-dark); cursor: pointer; font-size: 0.8rem; padding: 0">
                                {{ showGridPalette ? "▲" : "▼" }}
                            </button>
                        </div>

                        <input
                            type="hidden"
                            id="gridColorPicker"
                            :value="selectedGridColor" />

                        <div
                            v-if="showGridPalette"
                            class="palette"
                            style="grid-template-columns: repeat(7, 1fr); margin-top: 5px">
                            <div
                                v-for="color in gridColors"
                                :key="color.value"
                                class="swatch"
                                :class="{ selected: selectedGridColor === color.value }"
                                :style="{ backgroundColor: color.value }"
                                :title="color.name"
                                @click="selectGridColor(color.value)"></div>
                        </div>
                        <div
                            v-else
                            @click="showGridPalette = true"
                            style="cursor: pointer; height: 25px; border-radius: 4px; border: 1px solid var(--border); margin-top: 5px"
                            :style="{ backgroundColor: selectedGridColor }"></div>
                    </div>

                    <div class="control-group">
                        <label>Style</label>
                        <div
                            class="input-row"
                            style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px">
                            <select
                                id="gridStyleSelect"
                                style="position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px"
                                :value="selectedGridStyle">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>

                            <button
                                class="style-btn"
                                :class="{ active: selectedGridStyle === 'solid' }"
                                @click="selectGridStyle('solid')"
                                title="Solid">
                                <div style="width: 100%; height: 2px; background-color: currentColor"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedGridStyle === 'dashed' }"
                                @click="selectGridStyle('dashed')"
                                title="Dashed">
                                <div style="width: 100%; height: 0; border-top: 2px dashed currentColor"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedGridStyle === 'dotted' }"
                                @click="selectGridStyle('dotted')"
                                title="Dotted">
                                <div style="width: 100%; height: 0; border-top: 2px dotted currentColor"></div>
                            </button>
                        </div>
                    </div>

                    <div class="control-group">
                        <label>Thickness</label>
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
                        <label>Opacity</label>
                        <div class="input-row">
                            <input
                                type="range"
                                id="gridOpacitySlider"
                                min="0"
                                max="1"
                                step="0.1"
                                value="0.2" />
                            <span id="gridOpacityVal">0.2</span>
                        </div>
                    </div>
                </div>
            </TransitionExpand>
        </div>

        <hr style="border-color: var(--border); margin: 10px 0" />

        <div class="control-group">
            <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between">
                <label>Show Sub-Grid</label>
                <input
                    type="checkbox"
                    id="subGridToggle"
                    checked />
            </div>
        </div>

        <div
            class="control-group"
            style="gap: 0">
            <div
                style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; background-color: var(--color-black-light); padding: 8px; border-radius: 4px"
                :style="{ borderRadius: showSubGridStyle ? '4px 4px 0 0' : '4px' }"
                @click="showSubGridStyle = !showSubGridStyle">
                <label style="cursor: pointer; font-size: 0.95rem">Sub-Grid Settings</label>
                <span style="font-size: 0.8rem; color: var(--color-white-dark)">{{ showSubGridStyle ? "▲" : "▼" }}</span>
            </div>

            <TransitionExpand :expanded="showSubGridStyle">
                <div style="padding: 10px; background-color: var(--color-black-light--1); border-radius: 0 0 4px 4px">
                    <div class="control-group">
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <label>Color</label>
                            <button
                                @click="showSubGridPalette = !showSubGridPalette"
                                style="background: none; border: none; color: var(--color-white-dark); cursor: pointer; font-size: 0.8rem; padding: 0">
                                {{ showSubGridPalette ? "▲" : "▼" }}
                            </button>
                        </div>

                        <input
                            type="hidden"
                            id="subGridColorPicker"
                            :value="selectedSubGridColor" />

                        <div
                            v-if="showSubGridPalette"
                            class="palette"
                            style="grid-template-columns: repeat(7, 1fr); margin-top: 5px">
                            <div
                                v-for="color in gridColors"
                                :key="color.value"
                                class="swatch"
                                :class="{ selected: selectedSubGridColor === color.value }"
                                :style="{ backgroundColor: color.value }"
                                :title="color.name"
                                @click="selectSubGridColor(color.value)"></div>
                        </div>
                        <div
                            v-else
                            @click="showSubGridPalette = true"
                            style="cursor: pointer; height: 25px; border-radius: 4px; border: 1px solid var(--border); margin-top: 5px"
                            :style="{ backgroundColor: selectedSubGridColor }"></div>
                    </div>

                    <div class="control-group">
                        <label>Style</label>
                        <div
                            class="input-row"
                            style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px">
                            <select
                                id="subGridStyleSelect"
                                style="position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px"
                                :value="selectedSubGridStyle">
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>

                            <button
                                class="style-btn"
                                :class="{ active: selectedSubGridStyle === 'solid' }"
                                @click="selectSubGridStyle('solid')"
                                title="Solid">
                                <div style="width: 100%; height: 2px; background-color: currentColor"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedSubGridStyle === 'dashed' }"
                                @click="selectSubGridStyle('dashed')"
                                title="Dashed">
                                <div style="width: 100%; height: 0; border-top: 2px dashed currentColor"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedSubGridStyle === 'dotted' }"
                                @click="selectSubGridStyle('dotted')"
                                title="Dotted">
                                <div style="width: 100%; height: 0; border-top: 2px dotted currentColor"></div>
                            </button>
                        </div>
                    </div>

                    <div class="control-group">
                        <label>Thickness</label>
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
                        <label>Opacity</label>
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
                </div>
            </TransitionExpand>
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
