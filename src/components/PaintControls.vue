<script setup>
    import { ref, onMounted, onBeforeUnmount, watch } from "vue";
    import ControlSection from "./ControlSection.vue";
    import OklchPicker from "./OklchPicker.vue";

    import { parseGPL, generateGPL } from "../logic/palette-utils.js";
    import { hexToOklchVals, oklchToHex } from "../logic/autotrixel/utils.js";

    const props = defineProps({
        autoTrixelInstance: Object,
    });

    const fileInput = ref(null);
    const paletteFileInput = ref(null);
    const images = ref([]);
    const paletteName = ref("Quick Palette");
    const paletteColors = ref(["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]);

    const showColorPicker = ref(false);
    const currentColor = ref({ l: 0.6, c: 0.15, h: 200 });
    const pickerPosition = ref({ top: 0, left: 0 });
    const triggerRef = ref(null);

    const toggleColorPicker = () => {
        if (!showColorPicker.value && triggerRef.value) {
            const rect = triggerRef.value.getBoundingClientRect();
            pickerPosition.value = {
                top: rect.bottom + 8,
                left: rect.left,
            };
        }
        showColorPicker.value = !showColorPicker.value;
    };

    const closeColorPicker = () => {
        showColorPicker.value = false;
    };

    const updateAppColor = (newColor) => {
        currentColor.value = newColor;
        if (props.autoTrixelInstance) {
            props.autoTrixelInstance.setColor(newColor.l, newColor.c, newColor.h);
        }
    };

    // Sync from app to local state (e.g. when picking color from canvas)
    let colorChangeListener = null;
    watch(
        () => props.autoTrixelInstance,
        (instance) => {
            if (instance) {
                colorChangeListener = (colorState) => {
                    currentColor.value = { ...colorState };
                };
                instance.onColorChange(colorChangeListener);
            }
        },
        { immediate: true },
    );

    const triggerUpload = () => {
        fileInput.value.click();
    };

    const triggerPaletteUpload = () => {
        paletteFileInput.value.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const id = `img_${Date.now()}`;
                    const imageData = {
                        id,
                        src: e.target.result,
                        element: img,
                    };
                    images.value.push(imageData);
                    selectImage(imageData);

                    if (props.autoTrixelInstance) {
                        props.autoTrixelInstance.registerImage(id, img);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        event.target.value = "";
    };

    const handlePaletteFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Sanitize filename: remove extension, replace non-alphanumeric with space, trim
            let name = file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9]/g, " ")
                .trim();
            // Title Case: Capitalize first letter of each word
            name = name
                .split(/\s+/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            paletteName.value = name || "Imported Palette";

            const reader = new FileReader();
            reader.onload = (e) => {
                const colors = parseGPL(e.target.result);
                paletteColors.value = colors.slice(0, 20); // Enforce limit on import
            };
            reader.readAsText(file);
        }
        event.target.value = "";
    };

    const exportPalette = () => {
        if (props.autoTrixelInstance) {
            const colors = paletteColors.value;
            const content = generateGPL(colors, paletteName.value);
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${paletteName.value.replace(/\s+/g, "_").toLowerCase()}.gpl`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const selectImage = (image) => {
        if (props.autoTrixelInstance) {
            props.autoTrixelInstance.setCurrentImage(image);
        }
    };

    const clearImages = () => {
        images.value = [];
        if (fileInput.value) {
            fileInput.value.value = "";
        }
    };

    const removeImage = (index) => {
        images.value.splice(index, 1);
        if (images.value.length === 0 && fileInput.value) {
            fileInput.value.value = "";
        }
    };

    const addColorToPalette = () => {
        const hex = oklchToHex(currentColor.value.l, currentColor.value.c, currentColor.value.h);
        if (!paletteColors.value.includes(hex)) {
            if (paletteColors.value.length >= 20) {
                // Optional: Show toast or alert
                console.warn("Palette is full (max 20 colors)");
                return;
            }
            paletteColors.value.push(hex);
        }
    };

    const selectPaletteColor = (color) => {
        const { l, c, h } = hexToOklchVals(color);
        updateAppColor({ l, c, h });
    };

    const removeColorFromPalette = (index) => {
        paletteColors.value.splice(index, 1);
    };
</script>

<template>
    <ControlSection title="Paint Editor">
        <div class="flex gap-2.5 items-center relative">
            <div
                id="colorPreviewBox"
                ref="triggerRef"
                @click="toggleColorPicker"
                class="w-10 h-10 rounded-md border-2 border-black-light bg-primary cursor-pointer hover:border-white transition-colors"></div>

            <OklchPicker
                v-if="showColorPicker"
                :modelValue="currentColor"
                :position="pickerPosition"
                @update:modelValue="updateAppColor"
                @close="closeColorPicker" />

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
            <div class="flex justify-between items-center mb-1.5">
                <input
                    v-model="paletteName"
                    type="text"
                    class="bg-black border border-black-light text-white-dark px-2 py-1 rounded text-xs focus:outline-none focus:border-primary focus:text-white transition-colors w-full mr-2"
                    placeholder="Palette Name" />
                <div class="flex gap-1">
                    <button
                        @click="exportPalette"
                        class="bg-black hover:bg-black-light text-white border border-black-light px-2 py-0.5 rounded text-xs cursor-pointer transition-colors"
                        title="Export .gpl">
                        Export
                    </button>
                    <button
                        @click="triggerPaletteUpload"
                        class="bg-black hover:bg-black-light text-white border border-black-light px-2 py-0.5 rounded text-xs cursor-pointer transition-colors"
                        title="Import .gpl">
                        Import
                    </button>
                </div>
            </div>
            <input
                type="file"
                ref="paletteFileInput"
                class="hidden"
                accept=".gpl"
                @change="handlePaletteFileChange" />
            <div
                class="grid grid-cols-5 gap-1.5 mt-1.5"
                id="palette">
                <div
                    v-for="(color, index) in paletteColors"
                    :key="index"
                    class="swatch group relative"
                    :style="{ backgroundColor: color }"
                    @click="selectPaletteColor(color)">
                    <button
                        @click.stop="removeColorFromPalette(index)"
                        class="absolute -top-1 -right-1 w-4 h-4 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                    </button>
                </div>

                <!-- Add Button in Grid -->
                <button
                    v-if="paletteColors.length < 20"
                    @click="addColorToPalette"
                    class="swatch flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 text-white-dark hover:text-white transition-colors border-2 border-dashed border-white/20 hover:border-white/50"
                    title="Add Current Color">
                    <span class="text-xl font-bold leading-none">+</span>
                    <span class="text-[10px] font-semibold">Add</span>
                </button>
            </div>
        </div>

        <div class="mt-4 border-t border-black-light pt-3">
            <h3 class="m-0 mb-1.5 text-white-dark text-xs font-semibold flex justify-between items-center">
                Image Fill
                <div class="flex gap-1">
                    <button
                        v-if="images.length > 0"
                        @click="clearImages"
                        class="bg-red-900 hover:bg-red-800 text-white border border-red-900 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors">
                        Clear
                    </button>
                    <button
                        @click="triggerUpload"
                        class="bg-black hover:bg-black-light text-white border border-black-light px-2 py-0.5 rounded text-xs cursor-pointer transition-colors">
                        + Upload
                    </button>
                </div>
            </h3>

            <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handleFileChange" />

            <div
                v-if="images.length === 0"
                class="text-white-dark italic text-center py-2 text-xs">
                No images uploaded
            </div>

            <div
                v-else
                class="grid grid-cols-4 gap-1 overflow-y-auto custom-scrollbar mt-2">
                <div
                    v-for="(img, index) in images"
                    :key="img.id"
                    class="aspect-square border border-black-light rounded overflow-hidden cursor-pointer hover:border-primary relative group"
                    @click="selectImage(img)">
                    <img
                        :src="img.src"
                        class="w-full h-full object-cover" />
                    <button
                        @click.stop="removeImage(index)"
                        class="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                    </button>
                </div>
            </div>
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

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
    }
</style>
