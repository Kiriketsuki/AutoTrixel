<script setup>
    import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
    import { createAutoTrixel } from "./logic/createAutoTrixel";
    import ColorControls from "./components/ColorControls.vue";
    import GridControls from "./components/GridControls.vue";
    import BackgroundControls from "./components/BackgroundControls.vue";
    import ToolsControl from "./components/ToolsControl.vue";
    import VersionBadge from "./components/VersionBadge.vue";

    const appRoot = ref(null);
    const controlMode = ref("canvas"); // 'canvas' or 'background'
    const bgState = ref({ x: 0, y: 0, scale: 1, opacity: 0.5 });
    const autoTrixelInstance = shallowRef(null);

    const toggleSidebar = () => {
        document.body.classList.toggle("sidebar-closed");
    };

    const resetCanvas = () => {
        autoTrixelInstance.value?.resetCanvas();
    };

    const exportImage = () => {
        autoTrixelInstance.value?.exportImage();
    };

    const exportSVG = () => {
        autoTrixelInstance.value?.exportSVG();
    };

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
        <button
            id="sidebarToggle"
            @click="toggleSidebar"
            title="Toggle Sidebar">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <div id="sidebar">
            <h1>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M12 2L1 21h22L12 2zm0 3.516L19.297 19H4.703L12 5.516z" />
                </svg>
                AutoTrixel
                <VersionBadge />
            </h1>

            <div class="tutorial-box">
                <h3>Shortcuts</h3>
                <div class="key-row"><span>Undo</span> <span class="kbd">Ctrl + Z</span></div>
                <div class="key-row"><span>Zoom In/Out</span> <span class="kbd">Ctrl + + / -</span></div>
                <div class="key-row"><span>Brush Size</span> <span class="kbd">Ctrl + [ / ]</span></div>
                <div class="key-row"><span>Scroll/Zoom</span> <span class="kbd">Ctrl + Wheel</span></div>
                <div class="key-row"><span>BG Scale</span> <span class="kbd">Ctrl + Shift + Wheel</span></div>
                <div class="key-row"><span>BG Pan</span> <span class="kbd">Ctrl + Shift + Mid Drag</span></div>
            </div>

            <ToolsControl :autoTrixelInstance="autoTrixelInstance" />

            <ColorControls :autoTrixelInstance="autoTrixelInstance" />

            <BackgroundControls
                :autoTrixelInstance="autoTrixelInstance"
                :bgState="bgState"
                :controlMode="controlMode"
                @updateBg="updateBg"
                @setControlMode="setControlMode" />

            <GridControls :autoTrixelInstance="autoTrixelInstance" />

            <div style="margin-top: auto">
                <button
                    class="action-btn"
                    style="width: 100%"
                    @click="resetCanvas">
                    Clear Canvas
                </button>
                <div class="btn-group">
                    <button
                        class="action-btn primary"
                        style="flex: 1"
                        @click="exportImage">
                        PNG
                    </button>
                    <button
                        class="action-btn primary"
                        style="flex: 1"
                        @click="exportSVG">
                        SVG
                    </button>
                </div>
            </div>
        </div>

        <div id="workspace">
            <div id="canvas-stack">
                <canvas id="cursorLayer"></canvas>
                <canvas id="artLayer"></canvas>
            </div>
        </div>

        <div id="toast">Image Saved!</div>
    </div>
</template>
