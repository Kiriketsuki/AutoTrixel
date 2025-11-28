<script setup>
    import { onBeforeUnmount, onMounted, ref } from "vue";
    import { createAutoTrixel } from "./logic/createAutoTrixel";

    const appRoot = ref(null);
    let autoTrixelInstance = null;

    const toggleSidebar = () => {
        document.body.classList.toggle("sidebar-closed");
    };

    const setTool = (tool) => {
        autoTrixelInstance?.setTool(tool);
    };

    const undoAction = () => {
        autoTrixelInstance?.undoAction();
    };

    const resetCanvas = () => {
        autoTrixelInstance?.resetCanvas();
    };

    const exportImage = () => {
        autoTrixelInstance?.exportImage();
    };

    const exportSVG = () => {
        autoTrixelInstance?.exportSVG();
    };

    onMounted(() => {
        autoTrixelInstance = createAutoTrixel(appRoot.value);
    });

    onBeforeUnmount(() => {
        autoTrixelInstance?.destroy();
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
            </h1>

            <div class="tutorial-box">
                <h3>Shortcuts</h3>
                <div class="key-row"><span>Undo</span> <span class="kbd">Ctrl + Z</span></div>
                <div class="key-row"><span>Zoom In/Out</span> <span class="kbd">Ctrl + + / -</span></div>
                <div class="key-row"><span>Brush Size</span> <span class="kbd">Ctrl + [ / ]</span></div>
                <div class="key-row"><span>Scroll/Zoom</span> <span class="kbd">Ctrl + Wheel</span></div>
            </div>

            <div class="control-group">
                <label>Tools</label>
                <div class="tools-grid">
                    <button
                        class="tool-btn active"
                        id="tool-pencil"
                        @click="setTool('pencil')">
                        ✏️ Draw
                    </button>
                    <button
                        class="tool-btn"
                        id="tool-bucket"
                        @click="setTool('bucket')">
                        🪣 Fill
                    </button>
                    <button
                        class="tool-btn"
                        id="tool-eraser"
                        @click="setTool('eraser')">
                        🧹 Erase
                    </button>
                    <button
                        class="tool-btn"
                        id="tool-picker"
                        @click="setTool('picker')">
                        🧪 Pick
                    </button>
                </div>
                <button
                    class="undo-btn"
                    id="btnUndo"
                    @click="undoAction">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo (Ctrl+Z)
                </button>
            </div>

            <div class="control-group">
                <label
                    >Brush Size
                    <span
                        id="brushVal"
                        class="value-display"
                        >1</span
                    ></label
                >
                <input
                    type="range"
                    id="brushInput"
                    min="1"
                    max="5"
                    value="1" />
            </div>

            <div class="control-group color-section">
                <label>Color Editor (OKLCH)</label>
                <div class="color-preview-row">
                    <div id="colorPreviewBox"></div>
                    <div
                        id="colorCodeDisplay"
                        style="flex: 1; font-family: monospace; font-size: 0.8rem; color: #888">
                        #00d2ff
                    </div>
                </div>

                <div class="slider-row">
                    <span class="slider-label">Lightness (L)</span>
                    <input
                        type="range"
                        id="lInput"
                        min="0"
                        max="100"
                        value="60" />
                </div>
                <div class="slider-row">
                    <span class="slider-label">Chroma (C)</span>
                    <input
                        type="range"
                        id="cInput"
                        min="0"
                        max="0.37"
                        step="0.01"
                        value="0.15" />
                </div>
                <div class="slider-row">
                    <span class="slider-label">Hue (H)</span>
                    <input
                        type="range"
                        id="hInput"
                        min="0"
                        max="360"
                        value="200" />
                </div>

                <label style="margin-top: 10px">Quick Palette</label>
                <div
                    class="palette"
                    id="palette"></div>
            </div>

            <div class="control-group">
                <label>Triangle Scale (px)</label>
                <div class="input-row">
                    <input
                        type="range"
                        id="scaleSlider"
                        min="5"
                        max="200"
                        value="25" />
                    <input
                        type="number"
                        id="scaleNumber"
                        min="5"
                        max="200"
                        value="25" />
                </div>
            </div>

            <div class="control-group">
                <label>Grid Width</label>
                <div class="input-row">
                    <input
                        type="range"
                        id="widthSlider"
                        min="5"
                        max="500"
                        value="40" />
                    <input
                        type="number"
                        id="widthNumber"
                        min="5"
                        max="500"
                        value="40" />
                </div>
            </div>

            <div class="control-group">
                <label>Grid Height</label>
                <div class="input-row">
                    <input
                        type="range"
                        id="heightSlider"
                        min="5"
                        max="500"
                        value="30" />
                    <input
                        type="number"
                        id="heightNumber"
                        min="5"
                        max="500"
                        value="30" />
                </div>
            </div>

            <div class="control-group">
                <label>Grid Settings</label>
                <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between">
                    <span style="font-size: 0.85rem">Show Grid</span>
                    <input
                        type="checkbox"
                        id="gridToggle"
                        checked />
                </div>
                <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-top: 5px">
                    <span style="font-size: 0.85rem">Grid Color</span>
                    <input
                        type="color"
                        id="gridColorPicker"
                        value="#222222"
                        style="width: 40px; height: 25px" />
                </div>
            </div>

            <div class="control-group">
                <label style="color: var(--accent)">
                    Include Grid in Export
                    <input
                        type="checkbox"
                        id="exportGridToggle" />
                </label>
            </div>

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
