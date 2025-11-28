<script setup>
    import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
    import { createAutoTrixel } from "./logic/createAutoTrixel";
    import Sidebar from "./components/Sidebar.vue";

    const appRoot = ref(null);
    const controlMode = ref("canvas"); // 'canvas' or 'background'
    const bgState = ref({ x: 0, y: 0, scale: 1, opacity: 0.5 });
    const autoTrixelInstance = shallowRef(null);

    const updateBg = (prop, val) => {
        const numVal = parseFloat(val);
        bgState.value[prop] = numVal;
        autoTrixelInstance.value?.updateBackground({ [prop]: numVal });
    };

    const setControlMode = (mode) => {
        controlMode.value = mode;
        autoTrixelInstance.value?.setControlMode(mode);
    };

    onMounted(() => {
        autoTrixelInstance.value = createAutoTrixel(appRoot.value);
        autoTrixelInstance.value.onBgChange((newState) => {
            bgState.value = { ...newState };
        });
    });

    onBeforeUnmount(() => {
        autoTrixelInstance.value?.destroy();
    });
</script>

<template>
    <div
        class="app-root"
        ref="appRoot">
        <Sidebar
            :autoTrixelInstance="autoTrixelInstance"
            :bgState="bgState"
            :controlMode="controlMode"
            @updateBg="updateBg"
            @setControlMode="setControlMode" />

        <div id="workspace">
            <div id="canvas-stack">
                <canvas id="cursorLayer"></canvas>
                <canvas id="artLayer"></canvas>
            </div>
        </div>

        <div id="toast">Image Saved!</div>
    </div>
</template>
