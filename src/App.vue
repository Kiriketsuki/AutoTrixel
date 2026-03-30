<script setup>
    import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
    import { createTrKixel } from "./logic/createTrKixel";
    import Sidebar from "./components/Sidebar.vue";
    import { initMenuHandler } from "./tauri/menu-handler.js";

    const appRoot = ref(null);
    const controlMode = ref("canvas"); // 'canvas' or 'background'
    const bgState = ref({ x: 0, y: 0, scale: 1, opacity: 0.5 });
    const trKixelInstance = shallowRef(null);

    const updateBg = (prop, val) => {
        const numVal = parseFloat(val);
        bgState.value[prop] = numVal;
        trKixelInstance.value?.updateBackground({ [prop]: numVal });
    };

    const setControlMode = (mode) => {
        controlMode.value = mode;
        trKixelInstance.value?.setControlMode(mode);
    };

    onMounted(async () => {
        trKixelInstance.value = createTrKixel(appRoot.value);
        trKixelInstance.value.onBgChange((newState) => {
            bgState.value = { ...newState };
        });

        const isTauri = '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
        if (isTauri) {
            await initMenuHandler(trKixelInstance.value);
        }
    });

    onBeforeUnmount(() => {
        trKixelInstance.value?.destroy();
    });
</script>

<template>
    <div
        class="flex h-full overflow-hidden touch-none"
        ref="appRoot">
        <Sidebar
            :trKixelInstance="trKixelInstance"
            :bgState="bgState"
            :controlMode="controlMode"
            @updateBg="updateBg"
            @setControlMode="setControlMode" />

        <div
            id="workspace"
            class="flex-1 relative bg-black overflow-hidden flex justify-center items-center p-10 touch-none bg-[radial-gradient(var(--color-black-light)_1px,transparent_1px)] [background-size:20px_20px]">
            <div
                id="canvas-stack"
                class="relative shadow-2xl leading-none bg-black/30">
                <canvas
                    id="cursorLayer"
                    class="absolute top-0 left-0 z-20 pointer-events-auto cursor-crosshair block [image-rendering:pixelated]"></canvas>
                <canvas
                    id="artLayer"
                    class="z-10 block [image-rendering:pixelated]"></canvas>
            </div>
        </div>

        <div
            id="toast"
            class="fixed bottom-5 right-5 bg-primary text-primary-dark px-5 py-2.5 rounded font-bold opacity-0 translate-y-5 transition-all duration-300 pointer-events-none z-50">
            Image Saved!
        </div>
    </div>
</template>
