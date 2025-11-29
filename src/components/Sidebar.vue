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
        <h1 class="text-2xl text-primary uppercase tracking-widest flex items-center gap-2.5 m-0">
            <img
                src="/AutoTrixel.svg"
                alt="AutoTrixel Logo"
                class="w-8 h-8" />
            <span>Auto<span class="font-black">Trixel</span></span>
            <VersionBadge />
        </h1>

        <div class="bg-black/20 border border-black-light rounded-md p-2.5 text-xs text-white">
            <h3 class="m-0 mb-1.5 text-primary text-sm">Shortcuts</h3>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>Undo</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + Z</span></div>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>Zoom In/Out</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + + / -</span></div>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>Brush Size</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + [ / ]</span></div>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>Scroll/Zoom</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + Wheel</span></div>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>BG Scale</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + Alt + Wheel</span></div>
            <div class="flex justify-between mb-1 border-b border-black-light pb-0.5 last:border-none last:m-0"><span>BG Pan</span> <span class="bg-black px-1 py-0.5 rounded font-mono border border-black-light text-white-dark">Ctrl + Alt + Mid Drag</span></div>
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
                class="bg-black text-white-dark border border-black-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white w-full"
                @click="resetCanvas">
                Clear Canvas
            </button>
            <div class="flex gap-2">
                <button
                    class="bg-primary text-white border-none hover:bg-primary-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 flex-1"
                    @click="exportImage">
                    PNG
                </button>
                <button
                    class="bg-primary text-white border-none hover:bg-primary-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 flex-1"
                    @click="exportSVG">
                    SVG
                </button>
            </div>
        </div>
    </div>
</template>
