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
        <div class="control-group">
            <label>Control Mode</label>
            <div class="btn-group">
                <button
                    class="action-btn"
                    :class="{ primary: controlMode === 'canvas' }"
                    style="flex: 1"
                    @click="setControlMode('canvas')">
                    Canvas
                </button>
                <button
                    class="action-btn"
                    :class="{ primary: controlMode === 'background' }"
                    style="flex: 1"
                    @click="setControlMode('background')">
                    Background
                </button>
            </div>
        </div>

        <div class="control-group">
            <label>Image Source</label>
            <input
                type="file"
                id="bgImageInput"
                accept="image/*"
                style="display: none"
                @change="handleImageUpload" />
            <button
                class="action-btn"
                style="width: 100%; margin-bottom: 10px"
                @click="triggerImageUpload">
                Import Image
            </button>

            <TransitionExpand :expanded="bgState.hasImage">
                <div class="control-group">
                    <div class="slider-row">
                        <span class="slider-label">X Pos</span>
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            :value="bgState.x"
                            @input="updateBg('x', $event.target.value)" />
                        <input
                            type="number"
                            style="width: 50px"
                            :value="bgState.x"
                            @input="updateBg('x', $event.target.value)" />
                    </div>
                    <div class="slider-row">
                        <span class="slider-label">Y Pos</span>
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            :value="bgState.y"
                            @input="updateBg('y', $event.target.value)" />
                        <input
                            type="number"
                            style="width: 50px"
                            :value="bgState.y"
                            @input="updateBg('y', $event.target.value)" />
                    </div>
                    <div class="slider-row">
                        <span class="slider-label">Scale</span>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.01"
                            :value="bgState.scale"
                            @input="updateBg('scale', $event.target.value)" />
                        <input
                            type="number"
                            style="width: 50px"
                            step="0.01"
                            :value="bgState.scale"
                            @input="updateBg('scale', $event.target.value)" />
                    </div>
                    <div class="slider-row">
                        <span class="slider-label">Opacity</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            :value="bgState.opacity"
                            @input="updateBg('opacity', $event.target.value)" />
                        <input
                            type="number"
                            style="width: 50px"
                            step="0.01"
                            :value="bgState.opacity"
                            @input="updateBg('opacity', $event.target.value)" />
                    </div>
                </div>
            </TransitionExpand>
        </div>
    </ControlSection>
</template>
