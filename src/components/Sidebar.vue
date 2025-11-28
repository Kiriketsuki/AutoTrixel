<script setup>
    import { ref } from "vue";
    import ColorControls from "./ColorControls.vue";
    import GridControls from "./GridControls.vue";
    import BackgroundControls from "./BackgroundControls.vue";
    import ToolsControl from "./ToolsControl.vue";
    import VersionBadge from "./VersionBadge.vue";

    const props = defineProps({
        autoTrixelInstance: {
            type: Object,
            default: null,
        },
        bgState: {
            type: Object,
            required: true,
        },
        controlMode: {
            type: String,
            required: true,
        },
    });

    const emit = defineEmits(["updateBg", "setControlMode"]);

    const isOpen = ref(true);

    const toggleSidebar = () => {
        isOpen.value = !isOpen.value;
    };

    const resetCanvas = () => {
        props.autoTrixelInstance?.resetCanvas();
    };

    const exportImage = () => {
        props.autoTrixelInstance?.exportImage();
    };

    const exportSVG = () => {
        props.autoTrixelInstance?.exportSVG();
    };

    const updateBg = (prop, val) => {
        emit("updateBg", prop, val);
    };

    const setControlMode = (mode) => {
        emit("setControlMode", mode);
    };
</script>

<template>
    <button
        id="sidebarToggle"
        @click="toggleSidebar"
        title="Toggle Sidebar"
        class="fixed top-[10px] z-30 bg-secondary border border-black-light text-white w-10 h-10 rounded-full cursor-pointer flex items-center justify-center shadow-md transition-[left,transform] duration-300 hover:scale-110"
        :class="isOpen ? 'left-[calc(max(320px,20vw)+10px)]' : 'left-[10px]'">
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

    <div
        id="sidebar"
        class="w-[max(320px,20vw)] min-w-[max(320px,20vw)] bg-black-dark--1 border-r border-black-light flex flex-col p-[15px] gap-2 shadow-lg z-20 overflow-y-auto transition-[margin] duration-300 ease-in-out touch-pan-y"
        :class="{ '-ml-[calc(max(320px,20vw)+1px)]': !isOpen }">
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
</template>
