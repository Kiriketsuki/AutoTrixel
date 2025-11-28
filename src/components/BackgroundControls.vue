<script setup>
    import { ref, watch, onMounted, onBeforeUnmount } from "vue";
    import ControlSection from "./ControlSection.vue";
    import TransitionExpand from "./TransitionExpand.vue";

    const props = defineProps({
        autoTrixelInstance: Object,
        bgState: Object,
        controlMode: String,
    });

    const emit = defineEmits(["updateBg", "setControlMode"]);

    const triggerImageUpload = () => {
        document.getElementById("bgImageInput").click();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && props.autoTrixelInstance) {
            props.autoTrixelInstance.setBackgroundImage(file);
        }
    };

    const updateBg = (prop, val) => {
        emit("updateBg", prop, val);
    };

    const setControlMode = (mode) => {
        emit("setControlMode", mode);
    };
</script>

<template>
    <ControlSection title="Background Image">
        <div class="flex flex-col gap-2">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Control Mode</label>
            <div class="flex gap-2">
                <button
                    class="bg-black text-white-dark border border-black-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white flex-1"
                    :class="{ 'bg-primary text-white border-none hover:bg-primary-light': controlMode === 'canvas' }"
                    @click="setControlMode('canvas')">
                    Canvas
                </button>
                <button
                    class="bg-black text-white-dark border border-black-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white flex-1"
                    :class="{ 'bg-primary text-white border-none hover:bg-primary-light': controlMode === 'background' }"
                    @click="setControlMode('background')">
                    Background
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-xs text-white-dark font-semibold flex justify-between items-center">Image Source</label>
            <input
                type="file"
                id="bgImageInput"
                accept="image/*"
                style="display: none"
                @change="handleImageUpload" />
            <button
                class="bg-black text-white-dark border border-black-light p-2.5 rounded-md cursor-pointer font-semibold transition-colors duration-200 mt-1.5 hover:bg-tertiary-dark-1 hover:border-tertiary hover:text-white w-full mb-2.5"
                @click="triggerImageUpload">
                Import Image
            </button>

            <TransitionExpand :expanded="bgState.hasImage">
                <div class="flex flex-col gap-2">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-white-dark">X Pos</span>
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            :value="bgState.x"
                            @input="updateBg('x', $event.target.value)"
                            class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                        <input
                            type="number"
                            class="w-[50px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary"
                            :value="bgState.x"
                            @input="updateBg('x', $event.target.value)" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-white-dark">Y Pos</span>
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            :value="bgState.y"
                            @input="updateBg('y', $event.target.value)"
                            class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                        <input
                            type="number"
                            class="w-[50px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary"
                            :value="bgState.y"
                            @input="updateBg('y', $event.target.value)" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-white-dark">Scale</span>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.01"
                            :value="bgState.scale"
                            @input="updateBg('scale', $event.target.value)"
                            class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                        <input
                            type="number"
                            class="w-[50px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary"
                            step="0.01"
                            :value="bgState.scale"
                            @input="updateBg('scale', $event.target.value)" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-white-dark">Opacity</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            :value="bgState.opacity"
                            @input="updateBg('opacity', $event.target.value)"
                            class="flex-1 h-1 accent-primary hover:accent-tertiary transition-colors duration-200 w-full" />
                        <input
                            type="number"
                            class="w-[50px] bg-black border border-black-light text-primary p-1 rounded font-inherit text-sm text-right focus:outline-none focus:border-primary"
                            step="0.01"
                            :value="bgState.opacity"
                            @input="updateBg('opacity', $event.target.value)" />
                    </div>
                </div>
            </TransitionExpand>
        </div>
    </ControlSection>
</template>
