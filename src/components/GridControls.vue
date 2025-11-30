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
        <div class="flex flex-col gap-2">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Triangle Scale (px)</label>
            <div class="flex gap-2.5 items-center">
                <input
                    type="range"
                    id="scaleSlider"
                    min="5"
                    max="200"
                    value="25"
                    class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                <input
                    type="number"
                    id="scaleNumber"
                    min="5"
                    max="200"
                    value="25"
                    class="w-[60px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary" />
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Canvas Width (px)</label>
            <div class="flex gap-2.5 items-center">
                <input
                    type="range"
                    id="widthSlider"
                    min="100"
                    max="5000"
                    value="1000"
                    class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                <input
                    type="number"
                    id="widthNumber"
                    min="100"
                    max="5000"
                    value="1000"
                    class="w-[60px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary" />
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Canvas Height (px)</label>
            <div class="flex gap-2.5 items-center">
                <input
                    type="range"
                    id="heightSlider"
                    min="100"
                    max="5000"
                    value="1000"
                    class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                <input
                    type="number"
                    id="heightNumber"
                    min="100"
                    max="5000"
                    value="1000"
                    class="w-[60px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary" />
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <div class="flex gap-2.5 items-center justify-between">
                <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Show Grid</label>
                <input
                    type="checkbox"
                    id="gridToggle"
                    checked />
            </div>
        </div>

        <div class="flex flex-col gap-0">
            <div
                class="flex justify-between items-center cursor-pointer bg-black-light p-2 rounded"
                :class="{ 'rounded-b-none': showMainGridStyle }"
                @click="showMainGridStyle = !showMainGridStyle">
                <label class="cursor-pointer text-[0.95rem] text-white-dark font-semibold">Main Grid Settings</label>
                <span class="text-xs text-white-dark">{{ showMainGridStyle ? "▲" : "▼" }}</span>
            </div>

            <TransitionExpand :expanded="showMainGridStyle">
                <div class="p-2.5 bg-black-light--1 rounded-b">
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <label class="text-xs text-white-dark font-semibold">Color</label>
                            <button
                                @click="showGridPalette = !showGridPalette"
                                class="bg-none border-none text-white-dark cursor-pointer text-xs p-0">
                                {{ showGridPalette ? "▲" : "▼" }}
                            </button>
                        </div>

                        <input
                            type="hidden"
                            id="gridColorPicker"
                            :value="selectedGridColor" />

                        <div
                            v-if="showGridPalette"
                            class="grid grid-cols-7 gap-1.5 mt-1.5">
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
                            class="cursor-pointer h-[25px] rounded border border-black-light mt-1.5"
                            :style="{ backgroundColor: selectedGridColor }"></div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Style</label>
                        <div class="grid grid-cols-3 gap-1.5">
                            <select
                                id="gridStyleSelect"
                                class="absolute opacity-0 pointer-events-none w-px h-px"
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
                                <div class="w-full h-[2px] bg-current"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedGridStyle === 'dashed' }"
                                @click="selectGridStyle('dashed')"
                                title="Dashed">
                                <div class="w-full h-0 border-t-2 border-dashed border-current"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedGridStyle === 'dotted' }"
                                @click="selectGridStyle('dotted')"
                                title="Dotted">
                                <div class="w-full h-0 border-t-2 border-dotted border-current"></div>
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Thickness</label>
                        <div class="flex gap-2.5 items-center">
                            <input
                                type="range"
                                id="gridThicknessSlider"
                                min="0.1"
                                max="1.5"
                                step="0.1"
                                value="0.5"
                                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                            <span
                                id="gridThicknessVal"
                                class="text-xs text-primary"
                                >0.5</span
                            >
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Opacity</label>
                        <div class="flex gap-2.5 items-center">
                            <input
                                type="range"
                                id="gridOpacitySlider"
                                min="0"
                                max="1"
                                step="0.1"
                                value="0.2"
                                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                            <span
                                id="gridOpacityVal"
                                class="text-xs text-primary"
                                >0.2</span
                            >
                        </div>
                    </div>
                </div>
            </TransitionExpand>
        </div>

        <hr class="border-black-light my-2.5" />

        <div class="flex flex-col gap-2">
            <div class="flex gap-2.5 items-center justify-between">
                <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Show Sub-Grid</label>
                <input
                    type="checkbox"
                    id="subGridToggle"
                    checked />
            </div>
        </div>

        <div class="flex flex-col gap-0">
            <div
                class="flex justify-between items-center cursor-pointer bg-black-light p-2 rounded"
                :class="{ 'rounded-b-none': showSubGridStyle }"
                @click="showSubGridStyle = !showSubGridStyle">
                <label class="cursor-pointer text-[0.95rem] text-white-dark font-semibold">Sub-Grid Settings</label>
                <span class="text-xs text-white-dark">{{ showSubGridStyle ? "▲" : "▼" }}</span>
            </div>

            <TransitionExpand :expanded="showSubGridStyle">
                <div class="p-2.5 bg-black-light--1 rounded-b">
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <label class="text-xs text-white-dark font-semibold">Color</label>
                            <button
                                @click="showSubGridPalette = !showSubGridPalette"
                                class="bg-none border-none text-white-dark cursor-pointer text-xs p-0">
                                {{ showSubGridPalette ? "▲" : "▼" }}
                            </button>
                        </div>

                        <input
                            type="hidden"
                            id="subGridColorPicker"
                            :value="selectedSubGridColor" />

                        <div
                            v-if="showSubGridPalette"
                            class="grid grid-cols-7 gap-1.5 mt-1.5">
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
                            class="cursor-pointer h-[25px] rounded border border-black-light mt-1.5"
                            :style="{ backgroundColor: selectedSubGridColor }"></div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Style</label>
                        <div class="grid grid-cols-3 gap-1.5">
                            <select
                                id="subGridStyleSelect"
                                class="absolute opacity-0 pointer-events-none w-px h-px"
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
                                <div class="w-full h-[2px] bg-current"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedSubGridStyle === 'dashed' }"
                                @click="selectSubGridStyle('dashed')"
                                title="Dashed">
                                <div class="w-full h-0 border-t-2 border-dashed border-current"></div>
                            </button>
                            <button
                                class="style-btn"
                                :class="{ active: selectedSubGridStyle === 'dotted' }"
                                @click="selectSubGridStyle('dotted')"
                                title="Dotted">
                                <div class="w-full h-0 border-t-2 border-dotted border-current"></div>
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Thickness</label>
                        <div class="flex gap-2.5 items-center">
                            <input
                                type="range"
                                id="subGridThicknessSlider"
                                min="0.1"
                                max="1.5"
                                step="0.1"
                                value="0.5"
                                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                            <span
                                id="subGridThicknessVal"
                                class="text-xs text-primary"
                                >0.5</span
                            >
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-white-dark font-semibold">Opacity</label>
                        <div class="flex gap-2.5 items-center">
                            <input
                                type="range"
                                id="subGridOpacitySlider"
                                min="0"
                                max="1"
                                step="0.1"
                                value="1"
                                class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                            <span
                                id="subGridOpacityVal"
                                class="text-xs text-primary"
                                >1.0</span
                            >
                        </div>
                    </div>
                </div>
            </TransitionExpand>
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-xs text-primary font-semibold flex justify-between items-center">
                Include Grid in Export
                <input
                    type="checkbox"
                    id="exportGridToggle" />
            </label>
        </div>
    </ControlSection>
</template>

<style scoped>
    @reference "../style.css";

    .style-btn {
        @apply bg-black border border-black-light rounded h-[30px] flex items-center justify-center px-2.5 cursor-pointer text-white-dark transition-all duration-200 hover:border-tertiary hover:text-white;
    }
    .style-btn.active {
        @apply bg-primary border-primary text-white;
    }
    .swatch {
        @apply w-full aspect-square rounded cursor-pointer border-2 border-transparent transition-transform duration-100 hover:scale-110 hover:z-10;
    }
    .swatch.selected {
        @apply border-white ring-2 ring-primary;
    }
</style>
