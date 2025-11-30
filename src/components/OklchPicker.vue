<script setup>
    import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
    import { oklchToRgb, inGamut } from "../logic/autotrixel/utils.js";

    const props = defineProps({
        modelValue: {
            type: Object,
            required: true,
            default: () => ({ l: 0.6, c: 0.15, h: 200 }),
        },
        position: {
            type: Object,
            default: () => ({ top: 0, left: 0 }),
        },
    });

    const emit = defineEmits(["update:modelValue", "close"]);

    const pickerRef = ref(null);
    const canvasLC = ref(null);
    const canvasCH = ref(null);
    const canvasHL = ref(null);

    // Local state
    const localColor = computed({
        get: () => props.modelValue,
        set: (val) => emit("update:modelValue", val),
    });

    const updateL = (e) => {
        localColor.value = { ...localColor.value, l: parseFloat(e.target.value) };
    };

    const updateC = (e) => {
        localColor.value = { ...localColor.value, c: parseFloat(e.target.value) };
    };

    const updateH = (e) => {
        localColor.value = { ...localColor.value, h: parseFloat(e.target.value) };
    };

    // Dynamic gradients for sliders
    const lGradient = computed(() => {
        const { c, h } = localColor.value;
        return `linear-gradient(to right, oklch(0% ${c} ${h}), oklch(50% ${c} ${h}), oklch(100% ${c} ${h}))`;
    });

    const cGradient = computed(() => {
        const { l, h } = localColor.value;
        return `linear-gradient(to right, oklch(${l * 100}% 0 ${h}), oklch(${l * 100}% 0.37 ${h}))`;
    });

    const hGradient = computed(() => {
        const { l, c } = localColor.value;
        const stops = [];
        for (let i = 0; i <= 360; i += 30) {
            stops.push(`oklch(${l * 100}% ${c} ${i})`);
        }
        return `linear-gradient(to right, ${stops.join(", ")})`;
    });

    // Graph Rendering Logic
    const renderGraphs = () => {
        if (!canvasLC.value || !canvasCH.value || !canvasHL.value) return;

        const { l, c, h } = localColor.value;
        const width = 150;
        const height = 100;

        // 1. Lightness (x) vs Chroma (y)
        // Fixed Hue
        const ctxLC = canvasLC.value.getContext("2d");
        ctxLC.clearRect(0, 0, width, height);
        const imgDataLC = ctxLC.createImageData(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const L = x / width;
                const C = ((height - y) / height) * 0.37;
                const rgb = oklchToRgb(L, C, h);
                const index = (y * width + x) * 4;
                if (inGamut(rgb.r, rgb.g, rgb.b)) {
                    // Convert 0-1 RGB to 0-255
                    imgDataLC.data[index] = rgb.r * 255;
                    imgDataLC.data[index + 1] = rgb.g * 255;
                    imgDataLC.data[index + 2] = rgb.b * 255;
                    imgDataLC.data[index + 3] = 255;
                } else {
                    imgDataLC.data[index + 3] = 0; // Transparent
                }
            }
        }
        ctxLC.putImageData(imgDataLC, 0, 0);
        // Draw cursor
        ctxLC.strokeStyle = "white";
        ctxLC.lineWidth = 2;
        ctxLC.beginPath();
        ctxLC.arc(l * width, height - (c / 0.37) * height, 4, 0, Math.PI * 2);
        ctxLC.stroke();

        // 2. Hue (x) vs Chroma (y)
        // Fixed Lightness
        const ctxCH = canvasCH.value.getContext("2d");
        ctxCH.clearRect(0, 0, width, height);
        const imgDataCH = ctxCH.createImageData(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const H = (x / width) * 360;
                const C = ((height - y) / height) * 0.37;
                const rgb = oklchToRgb(l, C, H);
                const index = (y * width + x) * 4;
                if (inGamut(rgb.r, rgb.g, rgb.b)) {
                    imgDataCH.data[index] = rgb.r * 255;
                    imgDataCH.data[index + 1] = rgb.g * 255;
                    imgDataCH.data[index + 2] = rgb.b * 255;
                    imgDataCH.data[index + 3] = 255;
                } else {
                    imgDataCH.data[index + 3] = 0;
                }
            }
        }
        ctxCH.putImageData(imgDataCH, 0, 0);
        // Draw cursor
        ctxCH.strokeStyle = "white";
        ctxCH.lineWidth = 2;
        ctxCH.beginPath();
        ctxCH.arc((h / 360) * width, height - (c / 0.37) * height, 4, 0, Math.PI * 2);
        ctxCH.stroke();

        // 3. Hue (x) vs Lightness (y)
        // Fixed Chroma
        const ctxHL = canvasHL.value.getContext("2d");
        ctxHL.clearRect(0, 0, width, height);
        const imgDataHL = ctxHL.createImageData(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const H = (x / width) * 360;
                const L = (height - y) / height;
                const rgb = oklchToRgb(L, c, H);
                const index = (y * width + x) * 4;
                if (inGamut(rgb.r, rgb.g, rgb.b)) {
                    imgDataHL.data[index] = rgb.r * 255;
                    imgDataHL.data[index + 1] = rgb.g * 255;
                    imgDataHL.data[index + 2] = rgb.b * 255;
                    imgDataHL.data[index + 3] = 255;
                } else {
                    imgDataHL.data[index + 3] = 0;
                }
            }
        }
        ctxHL.putImageData(imgDataHL, 0, 0);
        // Draw cursor
        ctxHL.strokeStyle = "white";
        ctxHL.lineWidth = 2;
        ctxHL.beginPath();
        ctxHL.arc((h / 360) * width, height - l * height, 4, 0, Math.PI * 2);
        ctxHL.stroke();
    };

    // Interaction Logic
    const handleGraphInput = (e, type) => {
        const rect = e.target.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        let { l, c, h } = localColor.value;
        let newL = l,
            newC = c,
            newH = h;

        if (type === "LC") {
            // x = L, y = C (inverted)
            newL = x;
            newC = (1 - y) * 0.37;
        } else if (type === "CH") {
            // x = H, y = C (inverted)
            newH = x * 360;
            newC = (1 - y) * 0.37;
        } else if (type === "HL") {
            // x = H, y = L (inverted)
            newH = x * 360;
            newL = 1 - y;
        }

        // Check if in gamut
        const rgb = oklchToRgb(newL, newC, newH);
        if (inGamut(rgb.r, rgb.g, rgb.b)) {
            localColor.value = { l: newL, c: newC, h: newH };
        }
    };

    const setupGraphInteraction = (canvas, type) => {
        let isDragging = false;
        const onDown = (e) => {
            isDragging = true;
            handleGraphInput(e, type);
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        };
        const onMove = (e) => {
            if (isDragging) handleGraphInput(e, type);
        };
        const onUp = () => {
            isDragging = false;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        canvas.addEventListener("mousedown", onDown);
    };

    watch(localColor, () => {
        requestAnimationFrame(renderGraphs);
    });

    onMounted(() => {
        renderGraphs();
        setupGraphInteraction(canvasLC.value, "LC");
        setupGraphInteraction(canvasCH.value, "CH");
        setupGraphInteraction(canvasHL.value, "HL");

        setTimeout(() => {
            window.addEventListener("click", handleClickOutside);
        }, 0);
    });

    const handleClickOutside = (e) => {
        if (pickerRef.value && !pickerRef.value.contains(e.target)) {
            emit("close");
        }
    };

    onBeforeUnmount(() => {
        window.removeEventListener("click", handleClickOutside);
    });
</script>

<template>
    <Teleport to="body">
        <div
            ref="pickerRef"
            class="fixed p-4 bg-black-dark--1 border border-black-light rounded-lg shadow-2xl z-50 w-[500px] flex flex-col gap-4"
            :style="{ top: position.top + 'px', left: position.left + 'px' }">
            <div class="grid grid-cols-2 gap-4">
                <!-- Left Column: Graphs -->
                <div class="flex flex-col gap-4">
                    <!-- L vs C -->
                    <div class="relative">
                        <div class="text-[10px] text-white-dark mb-1 flex justify-between"><span>Chroma</span> <span>Lightness</span></div>
                        <canvas
                            ref="canvasLC"
                            width="150"
                            height="100"
                            class="w-full h-[100px] bg-black rounded border border-black-light cursor-crosshair"></canvas>
                    </div>
                    <!-- C vs H -->
                    <div class="relative">
                        <div class="text-[10px] text-white-dark mb-1 flex justify-between"><span>Chroma</span> <span>Hue</span></div>
                        <canvas
                            ref="canvasCH"
                            width="150"
                            height="100"
                            class="w-full h-[100px] bg-black rounded border border-black-light cursor-crosshair"></canvas>
                    </div>
                    <!-- H vs L -->
                    <div class="relative">
                        <div class="text-[10px] text-white-dark mb-1 flex justify-between"><span>Lightness</span> <span>Hue</span></div>
                        <canvas
                            ref="canvasHL"
                            width="150"
                            height="100"
                            class="w-full h-[100px] bg-black rounded border border-black-light cursor-crosshair"></canvas>
                    </div>
                </div>

                <!-- Right Column: Sliders & Preview -->
                <div class="flex flex-col gap-4">
                    <!-- Preview & Hex -->
                    <div class="flex gap-2 items-center pb-2 border-b border-black-light">
                        <div
                            class="w-12 h-12 rounded border border-black-light shadow-inner"
                            :style="{ backgroundColor: `oklch(${localColor.l * 100}% ${localColor.c} ${localColor.h})` }"></div>
                        <div class="flex flex-col gap-0.5 flex-1 text-right">
                            <div class="text-xs font-mono text-white">oklch({{ Math.round(localColor.l * 100) }}% {{ localColor.c.toFixed(3) }} {{ Math.round(localColor.h) }})</div>
                        </div>
                    </div>

                    <!-- Lightness -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-xs text-white-dark">
                            <span>Lightness</span>
                            <span>{{ Math.round(localColor.l * 100) }}%</span>
                        </div>
                        <div class="relative h-4 rounded overflow-hidden ring-1 ring-black-light">
                            <div
                                class="absolute inset-0"
                                :style="{ background: lGradient }"></div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                :value="localColor.l"
                                @input="updateL"
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <!-- Chroma -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-xs text-white-dark">
                            <span>Chroma</span>
                            <span>{{ localColor.c.toFixed(3) }}</span>
                        </div>
                        <div class="relative h-4 rounded overflow-hidden ring-1 ring-black-light">
                            <div
                                class="absolute inset-0"
                                :style="{ background: cGradient }"></div>
                            <input
                                type="range"
                                min="0"
                                max="0.37"
                                step="0.001"
                                :value="localColor.c"
                                @input="updateC"
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <!-- Hue -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-xs text-white-dark">
                            <span>Hue</span>
                            <span>{{ Math.round(localColor.h) }}°</span>
                        </div>
                        <div class="relative h-4 rounded overflow-hidden ring-1 ring-black-light">
                            <div
                                class="absolute inset-0"
                                :style="{ background: hGradient }"></div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                :value="localColor.h"
                                @input="updateH"
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
    /* Custom slider thumb styling could go here if we weren't using opacity-0 input overlay */
</style>
