import { REQUIRED_SELECTORS, DEFAULT_CONFIG } from "./autotrixel/constants.js";
import { clamp, hexToOklchVals } from "./autotrixel/utils.js";
import { pixelToGrid, getTriangleCluster, findBestCenterPixel, getTriangleVertices, getBarycentric } from "./autotrixel/geometry.js";
import { fullRedraw, drawCursor } from "./autotrixel/drawing.js";
import { batchPaintCells, fillBucket, interpolateStroke } from "./autotrixel/actions.js";
import { exportImage, exportSVG } from "./autotrixel/export.js";

export function createAutoTrixel(rootElement) {
    if (!rootElement) {
        throw new Error("AutoTrixel root element was not provided");
    }

    const selectorCache = new Map();
    const select = (selector) => {
        if (selectorCache.has(selector)) {
            return selectorCache.get(selector);
        }
        const el = rootElement.querySelector(selector);
        if (!el) {
            throw new Error(`AutoTrixel init failed: missing element ${selector}`);
        }
        selectorCache.set(selector, el);
        return el;
    };

    REQUIRED_SELECTORS.forEach(select);

    const artCanvas = select("#artLayer");
    const artCtx = artCanvas.getContext("2d", { alpha: true });
    const cursorCanvas = select("#cursorLayer");
    const cursorCtx = cursorCanvas.getContext("2d");
    const canvasStack = select("#canvas-stack");
    const toast = select("#toast");
    const brushInput = select("#brushInput");
    const brushVal = select("#brushVal");
    const lInput = select("#lInput");
    const cInput = select("#cInput");
    const hInput = select("#hInput");
    const colorPreviewBox = select("#colorPreviewBox");
    const colorCodeDisplay = select("#colorCodeDisplay");
    const paletteContainer = select("#palette");
    const scaleSlider = select("#scaleSlider");
    const scaleNumber = select("#scaleNumber");
    const widthSlider = select("#widthSlider");
    const widthNumber = select("#widthNumber");
    const heightSlider = select("#heightSlider");
    const heightNumber = select("#heightNumber");
    const gridToggle = select("#gridToggle");
    const gridColorPicker = select("#gridColorPicker");
    const exportGridToggle = select("#exportGridToggle");
    const btnUndo = select("#btnUndo");
    const toolButtons = Array.from(rootElement.querySelectorAll(".tool-btn"));

    if (!artCtx || !cursorCtx) {
        throw new Error("Failed to initialize AutoTrixel canvases");
    }

    const windowListeners = [];
    const addWindowListener = (event, handler, options) => {
        window.addEventListener(event, handler, options);
        windowListeners.push(() => window.removeEventListener(event, handler, options));
    };

    const config = { ...DEFAULT_CONFIG };

    let gridData = {};
    let hoveredCells = [];
    let isDrawing = false;
    let currentTool = "pencil";
    let storedBrushSize = 1;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let isPanning = false;
    let isBgPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOffsetX = 0;
    let panOffsetY = 0;
    let startPanOffsetX = 0;
    let startPanOffsetY = 0;
    let bgPanStartX = 0;
    let bgPanStartY = 0;
    let startBgX = 0;
    let startBgY = 0;
    let controlMode = "canvas"; // 'canvas' or 'background'

    let historyQueue = [];
    const MAX_HISTORY = 10;
    let tempSnapshot = null;

    let colorState = { l: 0.6, c: 0.15, h: 200 };
    let currentCssColor = "oklch(60% 0.15 200)";

    let triHeight;
    let W_half;
    let toastTimeout = null;

    let bgImage = {
        img: null,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 0.5,
    };

    function updateDimensions() {
        triHeight = (config.triSide * Math.sqrt(3)) / 2;
        W_half = config.triSide / 2;

        const w = Math.ceil(config.widthTriangles * W_half + W_half);
        const h = Math.ceil(config.heightTriangles * triHeight);

        artCanvas.width = w;
        artCanvas.height = h;
        cursorCanvas.width = w;
        cursorCanvas.height = h;

        canvasStack.style.width = `${w}px`;
        canvasStack.style.height = `${h}px`;

        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
    }

    function updateCanvasTransform() {
        canvasStack.style.transform = `translate(${panOffsetX}px, ${panOffsetY}px)`;
    }

    function showToast(message) {
        toast.innerText = message;
        toast.classList.add("show");
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 1500);
    }

    function saveStateForUndo() {
        return JSON.stringify(gridData);
    }

    function pushToHistory(snapshot) {
        historyQueue.push(snapshot);
        if (historyQueue.length > MAX_HISTORY) {
            historyQueue.shift();
        }
        updateUndoButton();
    }

    function undoAction() {
        if (historyQueue.length === 0) {
            showToast("Nothing to Undo");
            return;
        }
        const previousState = historyQueue.pop();
        gridData = JSON.parse(previousState);
        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        updateUndoButton();
        showToast("Undo");
    }

    function updateUndoButton() {
        btnUndo.disabled = historyQueue.length === 0;
        btnUndo.style.opacity = historyQueue.length === 0 ? "0.5" : "1";
    }

    function updateColorUI(cssString) {
        currentCssColor = cssString;
        colorPreviewBox.style.backgroundColor = cssString;
        lInput.value = Math.round(colorState.l * 100);
        cInput.value = colorState.c;
        hInput.value = Math.round(colorState.h);

        if (cssString.startsWith("#")) {
            colorCodeDisplay.innerText = cssString;
        } else {
            colorCodeDisplay.innerText = `L:${Math.round(colorState.l * 100)} C:${colorState.c.toFixed(2)} H:${Math.round(colorState.h)}`;
        }

        if (currentTool === "eraser" || currentTool === "picker" || currentTool === "subdivide") {
            setTool("pencil");
        }
    }

    function syncColorFromHex(hex) {
        const vals = hexToOklchVals(hex);
        colorState = { l: vals.l, c: vals.c, h: vals.h };
        updateColorUI(hex);
    }

    function updateColorFromSliders() {
        const L = parseFloat(lInput.value) / 100;
        const C = parseFloat(cInput.value);
        const H = parseFloat(hInput.value);

        colorState = { l: L, c: C, h: H };
        const cssStr = `oklch(${Math.round(L * 100)}% ${C} ${Math.round(H)})`;
        updateColorUI(cssStr);
    }

    function setTool(tool) {
        currentTool = tool;
        toolButtons.forEach((button) => button.classList.remove("active"));
        const activeButton = rootElement.querySelector(`#tool-${tool}`);
        if (activeButton) {
            activeButton.classList.add("active");
        }

        cursorCanvas.style.cursor = "crosshair";

        if (tool === "pencil" || tool === "eraser") {
            config.brushSize = storedBrushSize;
            brushInput.value = storedBrushSize;
            brushVal.innerText = storedBrushSize;
        }

        drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half);
    }

    function updateBrushSize(change) {
        let newSize = currentTool === "picker" || currentTool === "bucket" ? storedBrushSize : config.brushSize;
        newSize = clamp(newSize + change, 1, 5);

        if (newSize !== config.brushSize) {
            if (currentTool === "picker" || currentTool === "bucket") {
                storedBrushSize = newSize;
                showToast(`Saved Brush Size: ${newSize}`);
            } else {
                config.brushSize = newSize;
                storedBrushSize = newSize;
                brushInput.value = newSize;
                brushVal.innerText = newSize;
                drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half);
                showToast(`Brush Size: ${newSize}`);
            }
        }
    }

    function zoom(change) {
        const newSize = clamp(config.triSide + change, 5, 200);
        if (newSize !== config.triSide) {
            config.triSide = newSize;
            scaleSlider.value = newSize;
            scaleNumber.value = newSize;
            updateDimensions();
            showToast(`Zoom: ${newSize}px`);
        }
    }

    function processSubdivision(gridData, key, p, r, c, tool, color, triHeight, W_half) {
        let data = gridData[key];

        // Prevent further subdivision if already subdivided
        if (tool === "subdivide" && data && data.subdivided) {
            return data;
        }

        const vertices = getTriangleVertices(r, c, triHeight, W_half);

        const updateRecursive = (node, p, v0, v1, v2) => {
            if (typeof node === "string" || !node) {
                if (tool === "subdivide") {
                    const baseColor = node || null;
                    return {
                        subdivided: true,
                        children: [baseColor, baseColor, baseColor, baseColor],
                    };
                } else {
                    return tool === "eraser" ? null : color;
                }
            }

            if (node.subdivided) {
                const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
                const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                const m20 = { x: (v2.x + v0.x) / 2, y: (v2.y + v0.y) / 2 };

                const { u, v, w } = getBarycentric(p, v0, v1, v2);

                let childIndex = 3;
                let nextV0, nextV1, nextV2;

                if (u > 0.5) {
                    childIndex = 0;
                    nextV0 = v0;
                    nextV1 = m01;
                    nextV2 = m20;
                } else if (v > 0.5) {
                    childIndex = 1;
                    nextV0 = m01;
                    nextV1 = v1;
                    nextV2 = m12;
                } else if (w > 0.5) {
                    childIndex = 2;
                    nextV0 = m20;
                    nextV1 = m12;
                    nextV2 = v2;
                } else {
                    childIndex = 3;
                    nextV0 = m01;
                    nextV1 = m12;
                    nextV2 = m20;
                }

                const newChildren = [...node.children];
                newChildren[childIndex] = updateRecursive(newChildren[childIndex], p, nextV0, nextV1, nextV2);
                return { ...node, children: newChildren };
            }
            return node;
        };

        return updateRecursive(data, p, vertices[0], vertices[1], vertices[2]);
    }

    function handleSingleClick() {
        if (hoveredCells.length === 0) return false;

        let didChange = false;

        if (currentTool === "bucket") {
            const cell = hoveredCells[0];
            didChange = fillBucket(cell.r, cell.c, currentCssColor, gridData, config);
        } else if (currentTool === "picker") {
            const cell = hoveredCells[0];
            const key = `${cell.r},${cell.c}`;
            const color = gridData[key];
            if (color) {
                // Handle picking from subdivided?
                // For now, picker just picks the base color or fails if subdivided.
                // To support picking from subdivided, we'd need to drill down.
                // Let's keep it simple for now or use the first child if subdivided.
                let picked = color;
                if (typeof color === "object" && color.subdivided) {
                    // Just pick the first non-null child or something?
                    // Or maybe we don't support picking from subdivided yet.
                    // Let's try to pick recursively?
                    // Without mouse coords, we can't know which sub-pixel.
                    // But handleSingleClick is called from mousedown which has coords.
                    // But handleSingleClick doesn't take coords.
                    // We can use lastMouseX, lastMouseY.

                    const vertices = getTriangleVertices(cell.r, cell.c, triHeight, W_half);
                    const p = { x: lastMouseX, y: lastMouseY };

                    const pickRecursive = (node, p, v0, v1, v2) => {
                        if (typeof node === "string") return node;
                        if (!node) return null;
                        if (node.subdivided) {
                            const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
                            const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                            const m20 = { x: (v2.x + v0.x) / 2, y: (v2.y + v0.y) / 2 };
                            const { u, v, w } = getBarycentric(p, v0, v1, v2);
                            let childIndex = 3;
                            let nextV0, nextV1, nextV2;
                            if (u > 0.5) {
                                childIndex = 0;
                                nextV0 = v0;
                                nextV1 = m01;
                                nextV2 = m20;
                            } else if (v > 0.5) {
                                childIndex = 1;
                                nextV0 = m01;
                                nextV1 = v1;
                                nextV2 = m12;
                            } else if (w > 0.5) {
                                childIndex = 2;
                                nextV0 = m20;
                                nextV1 = m12;
                                nextV2 = v2;
                            } else {
                                childIndex = 3;
                                nextV0 = m01;
                                nextV1 = m12;
                                nextV2 = m20;
                            }
                            return pickRecursive(node.children[childIndex], p, nextV0, nextV1, nextV2);
                        }
                        return null;
                    };
                    picked = pickRecursive(color, p, vertices[0], vertices[1], vertices[2]);
                }

                if (picked) {
                    if (picked.startsWith("#")) {
                        syncColorFromHex(picked);
                    } else if (picked.startsWith("oklch")) {
                        const matches = picked.match(/oklch\(([^%]+)%\s+([\d.]+)\s+([\d.]+)\)/);
                        if (matches) {
                            colorState = {
                                l: parseFloat(matches[1]) / 100,
                                c: parseFloat(matches[2]),
                                h: parseFloat(matches[3]),
                            };
                            updateColorUI(picked);
                        }
                    }
                    showToast("Color Picked");
                }
            }
        } else {
            if (config.brushSize === 1 && (currentTool === "subdivide" || currentTool === "pencil" || currentTool === "eraser")) {
                const cell = hoveredCells[0];
                const key = `${cell.r},${cell.c}`;
                const p = { x: lastMouseX, y: lastMouseY };
                const newData = processSubdivision(gridData, key, p, cell.r, cell.c, currentTool, currentCssColor, triHeight, W_half);
                if (JSON.stringify(gridData[key]) !== JSON.stringify(newData)) {
                    gridData[key] = newData;
                    didChange = true;
                }
            } else {
                if (currentTool === "subdivide") {
                    hoveredCells.forEach((cell) => {
                        const key = `${cell.r},${cell.c}`;
                        if (!gridData[key] || typeof gridData[key] === "string") {
                            const base = gridData[key] || null;
                            gridData[key] = { subdivided: true, children: [base, base, base, base] };
                            didChange = true;
                        }
                    });
                } else {
                    didChange = batchPaintCells(hoveredCells, currentTool, gridData, currentCssColor);
                }
            }
        }

        if (didChange) {
            fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        }
        return didChange;
    }

    function setupEvents() {
        cursorCanvas.addEventListener("mousedown", (e) => {
            if (e.button === 1) {
                e.preventDefault();
                // Check for BG Pan Shortcut: Ctrl + Shift + Middle Click
                if ((e.ctrlKey && e.shiftKey) || controlMode === "background") {
                    isBgPanning = true;
                    bgPanStartX = e.clientX;
                    bgPanStartY = e.clientY;
                    startBgX = bgImage.x;
                    startBgY = bgImage.y;
                    cursorCanvas.style.cursor = "move";
                } else {
                    isPanning = true;
                    panStartX = e.clientX;
                    panStartY = e.clientY;
                    startPanOffsetX = panOffsetX;
                    startPanOffsetY = panOffsetY;
                    cursorCanvas.style.cursor = "grabbing";
                }
                return;
            }

            const rect = cursorCanvas.getBoundingClientRect();
            lastMouseX = e.clientX - rect.left;
            lastMouseY = e.clientY - rect.top;

            tempSnapshot = saveStateForUndo();
            isDrawing = true;

            handleSingleClick();
        });

        addWindowListener("mouseup", (e) => {
            if (isPanning) {
                isPanning = false;
                cursorCanvas.style.cursor = "crosshair";
                return;
            }
            if (isBgPanning) {
                isBgPanning = false;
                cursorCanvas.style.cursor = "crosshair";
                return;
            }

            if (isDrawing) {
                isDrawing = false;
                const newState = JSON.stringify(gridData);
                if (newState !== tempSnapshot) {
                    pushToHistory(tempSnapshot);
                }
            }
        });

        cursorCanvas.addEventListener("mousemove", (e) => {
            if (isPanning) {
                const dx = e.clientX - panStartX;
                const dy = e.clientY - panStartY;
                panOffsetX = startPanOffsetX + dx;
                panOffsetY = startPanOffsetY + dy;
                updateCanvasTransform();
                return;
            }

            if (isBgPanning) {
                const dx = e.clientX - bgPanStartX;
                const dy = e.clientY - bgPanStartY;
                bgImage.x = startBgX + dx;
                bgImage.y = startBgY + dy;
                fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                notifyBgChange();
                return;
            }

            const rect = cursorCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const cell = pixelToGrid(x, y, triHeight, W_half, config);

            if (cell) {
                const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                let anchor = { r: cell.r, c: cell.c };
                if (useSize > 1) {
                    // Use pixel-based centering for better accuracy
                    anchor = findBestCenterPixel(x, y, useSize, config, triHeight, W_half) || anchor;
                }
                hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize, config);

                if (useSize === 1 && hoveredCells.length === 1) {
                    const key = `${cell.r},${cell.c}`;
                    const data = gridData[key];
                    if (data && data.subdivided) {
                        const vertices = getTriangleVertices(cell.r, cell.c, triHeight, W_half);
                        const [v0, v1, v2] = vertices;
                        const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
                        const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                        const m20 = { x: (v2.x + v0.x) / 2, y: (v2.y + v0.y) / 2 };

                        const p = { x: x, y: y };
                        const { u, v, w } = getBarycentric(p, v0, v1, v2);

                        let subVertices;
                        if (u > 0.5) {
                            subVertices = [v0, m01, m20];
                        } else if (v > 0.5) {
                            subVertices = [m01, v1, m12];
                        } else if (w > 0.5) {
                            subVertices = [m20, m12, v2];
                        } else {
                            subVertices = [m01, m12, m20];
                        }
                        hoveredCells[0].subVertices = subVertices;
                    }
                }
            } else {
                hoveredCells = [];
            }
            drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half);

            if (isDrawing && currentTool !== "bucket" && currentTool !== "picker") {
                if (config.brushSize === 1 && (currentTool === "subdivide" || currentTool === "pencil" || currentTool === "eraser")) {
                    const dx = x - lastMouseX;
                    const dy = y - lastMouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const steps = Math.ceil(dist / 2);

                    let didChange = false;
                    for (let i = 0; i <= steps; i++) {
                        const t = steps === 0 ? 0 : i / steps;
                        const px = lastMouseX + dx * t;
                        const py = lastMouseY + dy * t;
                        const c = pixelToGrid(px, py, triHeight, W_half, config);
                        if (c) {
                            const key = `${c.r},${c.c}`;
                            const newData = processSubdivision(gridData, key, { x: px, y: py }, c.r, c.c, currentTool, currentCssColor, triHeight, W_half);
                            if (JSON.stringify(gridData[key]) !== JSON.stringify(newData)) {
                                gridData[key] = newData;
                                didChange = true;
                            }
                        }
                    }
                    if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                } else {
                    const cellsToPaint = interpolateStroke(lastMouseX, lastMouseY, x, y, currentTool, config, triHeight, W_half);
                    if (cellsToPaint.length > 0) {
                        if (currentTool === "subdivide") {
                            let didChange = false;
                            cellsToPaint.forEach((c) => {
                                const key = `${c.r},${c.c}`;
                                // Only subdivide if not already subdivided
                                if (!gridData[key] || typeof gridData[key] === "string") {
                                    const base = gridData[key] || null;
                                    gridData[key] = { subdivided: true, children: [base, base, base, base] };
                                    didChange = true;
                                }
                            });
                            if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        } else {
                            const didChange = batchPaintCells(cellsToPaint, currentTool, gridData, currentCssColor);
                            if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        }
                    }
                }
            }

            lastMouseX = x;
            lastMouseY = y;
        });

        cursorCanvas.addEventListener("mouseleave", () => {
            hoveredCells = [];
            drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half);
        });

        cursorCanvas.addEventListener("mouseenter", (e) => {
            if (isDrawing) {
                const rect = cursorCanvas.getBoundingClientRect();
                lastMouseX = e.clientX - rect.left;
                lastMouseY = e.clientY - rect.top;
            }
        });

        cursorCanvas.addEventListener(
            "touchstart",
            (e) => {
                e.preventDefault();
                if (e.touches.length === 2) {
                    isPanning = true;
                    isDrawing = false;
                    const t1 = e.touches[0];
                    const t2 = e.touches[1];
                    panStartX = (t1.clientX + t2.clientX) / 2;
                    panStartY = (t1.clientY + t2.clientY) / 2;
                    startPanOffsetX = panOffsetX;
                    startPanOffsetY = panOffsetY;
                    return;
                }

                if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    const rect = cursorCanvas.getBoundingClientRect();
                    lastMouseX = touch.clientX - rect.left;
                    lastMouseY = touch.clientY - rect.top;

                    tempSnapshot = saveStateForUndo();
                    isDrawing = true;

                    const cell = pixelToGrid(lastMouseX, lastMouseY, triHeight, W_half, config);
                    if (cell) {
                        const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                        let anchor = { r: cell.r, c: cell.c };
                        if (useSize > 1) {
                            anchor = findBestCenter(cell.r, cell.c, useSize, config);
                        }
                        hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize, config);
                    } else {
                        hoveredCells = [];
                    }

                    handleSingleClick();
                }
            },
            { passive: false },
        );

        cursorCanvas.addEventListener(
            "touchmove",
            (e) => {
                e.preventDefault();
                if (isPanning && e.touches.length === 2) {
                    const t1 = e.touches[0];
                    const t2 = e.touches[1];
                    const cx = (t1.clientX + t2.clientX) / 2;
                    const cy = (t1.clientY + t2.clientY) / 2;
                    const dx = cx - panStartX;
                    const dy = cy - panStartY;
                    panOffsetX = startPanOffsetX + dx;
                    panOffsetY = startPanOffsetY + dy;
                    updateCanvasTransform();
                    return;
                }

                if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    const rect = cursorCanvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;

                    const cell = pixelToGrid(x, y, triHeight, W_half, config);
                    if (cell) {
                        const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                        let anchor = { r: cell.r, c: cell.c };
                        if (useSize > 1) {
                            // Use pixel-based centering for better accuracy
                            anchor = findBestCenterPixel(x, y, useSize, config, triHeight, W_half) || anchor;
                        }
                        hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize, config);

                        if (useSize === 1 && hoveredCells.length === 1) {
                            const key = `${cell.r},${cell.c}`;
                            const data = gridData[key];
                            if (data && data.subdivided) {
                                const vertices = getTriangleVertices(cell.r, cell.c, triHeight, W_half);
                                const [v0, v1, v2] = vertices;
                                const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
                                const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                                const m20 = { x: (v2.x + v0.x) / 2, y: (v2.y + v0.y) / 2 };

                                const p = { x: x, y: y };
                                const { u, v, w } = getBarycentric(p, v0, v1, v2);

                                let subVertices;
                                if (u > 0.5) {
                                    subVertices = [v0, m01, m20];
                                } else if (v > 0.5) {
                                    subVertices = [m01, v1, m12];
                                } else if (w > 0.5) {
                                    subVertices = [m20, m12, v2];
                                } else {
                                    subVertices = [m01, m12, m20];
                                }
                                hoveredCells[0].subVertices = subVertices;
                            }
                        }
                    } else {
                        hoveredCells = [];
                    }

                    if (isDrawing && currentTool !== "bucket" && currentTool !== "picker") {
                        if (config.brushSize === 1 && (currentTool === "subdivide" || currentTool === "pencil" || currentTool === "eraser")) {
                            const dx = x - lastMouseX;
                            const dy = y - lastMouseY;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const steps = Math.ceil(dist / 2);

                            let didChange = false;
                            for (let i = 0; i <= steps; i++) {
                                const t = steps === 0 ? 0 : i / steps;
                                const px = lastMouseX + dx * t;
                                const py = lastMouseY + dy * t;
                                const c = pixelToGrid(px, py, triHeight, W_half, config);
                                if (c) {
                                    const key = `${c.r},${c.c}`;
                                    const newData = processSubdivision(gridData, key, { x: px, y: py }, c.r, c.c, currentTool, currentCssColor, triHeight, W_half);
                                    if (JSON.stringify(gridData[key]) !== JSON.stringify(newData)) {
                                        gridData[key] = newData;
                                        didChange = true;
                                    }
                                }
                            }
                            if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        } else {
                            const cellsToPaint = interpolateStroke(lastMouseX, lastMouseY, x, y, currentTool, config, triHeight, W_half);
                            if (cellsToPaint.length > 0) {
                                if (currentTool === "subdivide") {
                                    let didChange = false;
                                    cellsToPaint.forEach((c) => {
                                        const key = `${c.r},${c.c}`;
                                        // Only subdivide if not already subdivided
                                        if (!gridData[key] || typeof gridData[key] === "string") {
                                            const base = gridData[key] || null;
                                            gridData[key] = { subdivided: true, children: [base, base, base, base] };
                                            didChange = true;
                                        }
                                    });
                                    if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                                } else {
                                    const didChange = batchPaintCells(cellsToPaint, currentTool, gridData, currentCssColor);
                                    if (didChange) fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                                }
                            }
                        }
                    }
                    lastMouseX = x;
                    lastMouseY = y;
                }
            },
            { passive: false },
        );

        addWindowListener("touchend", (e) => {
            if (isPanning && e.touches.length < 2) {
                isPanning = false;
            }
            if (isDrawing) {
                isDrawing = false;
                const newState = JSON.stringify(gridData);
                if (newState !== tempSnapshot) {
                    pushToHistory(tempSnapshot);
                }
            }
        });

        addWindowListener("keydown", (e) => {
            if (e.ctrlKey) {
                if (e.key === "z" || e.key === "Z") {
                    e.preventDefault();
                    undoAction();
                } else if (e.key === "=" || e.key === "+") {
                    e.preventDefault();
                    zoom(5);
                } else if (e.key === "-") {
                    e.preventDefault();
                    zoom(-5);
                } else if (e.key === "[") {
                    e.preventDefault();
                    updateBrushSize(-1);
                } else if (e.key === "]") {
                    e.preventDefault();
                    updateBrushSize(1);
                }
            } else {
                if (controlMode === "background") {
                    // Background Pan with Arrow Keys
                    if (e.key === "ArrowUp") {
                        e.preventDefault();
                        bgImage.y -= 10;
                        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        notifyBgChange();
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        bgImage.y += 10;
                        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        notifyBgChange();
                    } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        bgImage.x -= 10;
                        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        notifyBgChange();
                    } else if (e.key === "ArrowRight") {
                        e.preventDefault();
                        bgImage.x += 10;
                        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        notifyBgChange();
                    }
                } else {
                    // Canvas Pan with Arrow Keys
                    if (e.key === "ArrowUp") {
                        e.preventDefault();
                        panOffsetY -= 20;
                        updateCanvasTransform();
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        panOffsetY += 20;
                        updateCanvasTransform();
                    } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        panOffsetX -= 20;
                        updateCanvasTransform();
                    } else if (e.key === "ArrowRight") {
                        e.preventDefault();
                        panOffsetX += 20;
                        updateCanvasTransform();
                    }
                }
            }
        });

        addWindowListener(
            "wheel",
            (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    // Check for BG Scale Shortcut: Ctrl + Shift + Scroll
                    if (e.shiftKey || controlMode === "background") {
                        const delta = e.deltaY < 0 ? 0.1 : -0.1;
                        bgImage.scale = clamp(bgImage.scale + delta, 0.1, 5);
                        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                        notifyBgChange();
                        showToast(`BG Scale: ${bgImage.scale.toFixed(2)}`);
                    } else {
                        const delta = e.deltaY < 0 ? 1 : -1;
                        zoom(delta * 5);
                    }
                }
            },
            { passive: false },
        );

        const updateScale = (val) => {
            config.triSide = parseInt(val, 10);
            scaleSlider.value = val;
            scaleNumber.value = val;
            updateDimensions();
        };
        scaleSlider.addEventListener("input", (e) => updateScale(e.target.value));
        scaleNumber.addEventListener("input", (e) => updateScale(e.target.value));

        brushInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            config.brushSize = val;
            storedBrushSize = val;
            brushVal.innerText = val;
        });

        const updateWidth = (val) => {
            config.widthTriangles = parseInt(val, 10);
            widthSlider.value = val;
            widthNumber.value = val;
            updateDimensions();
        };
        widthSlider.addEventListener("input", (e) => updateWidth(e.target.value));
        widthNumber.addEventListener("input", (e) => updateWidth(e.target.value));

        const updateHeight = (val) => {
            config.heightTriangles = parseInt(val, 10);
            heightSlider.value = val;
            heightNumber.value = val;
            updateDimensions();
        };
        heightSlider.addEventListener("input", (e) => updateHeight(e.target.value));
        heightNumber.addEventListener("input", (e) => updateHeight(e.target.value));

        gridToggle.addEventListener("change", (e) => {
            config.showGrid = e.target.checked;
            fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        });

        gridColorPicker.addEventListener("input", (e) => {
            config.gridColor = e.target.value;
            fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        });

        lInput.addEventListener("input", updateColorFromSliders);
        cInput.addEventListener("input", updateColorFromSliders);
        hInput.addEventListener("input", updateColorFromSliders);
    }

    function setupPalette() {
        const colors = ["#ff0000", "#ff8800", "#ffee00", "#00cc00", "#0099ff", "#0000ff", "#cc00ff", "#ffffff", "#888888", "#000000", "#550000", "#553300", "#555500", "#003300", "#003355"];
        paletteContainer.innerHTML = "";
        colors.forEach((c) => {
            const div = document.createElement("div");
            div.className = "swatch";
            div.style.backgroundColor = c;
            div.addEventListener("click", () => {
                syncColorFromHex(c);
                showToast("Palette Color Selected");
            });
            paletteContainer.appendChild(div);
        });
    }

    function resetCanvas() {
        pushToHistory(saveStateForUndo());
        gridData = {};
        bgImage = {
            img: null,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 0.5,
        };
        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        notifyBgChange();
        showToast("Canvas & Background Cleared");
    }

    function setBackgroundImage(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                bgImage.img = img;
                bgImage.x = 0;
                bgImage.y = 0;
                bgImage.scale = 1;
                fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
                notifyBgChange();
                showToast("Background Image Loaded");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function updateBackground(props) {
        if (props.x !== undefined) bgImage.x = props.x;
        if (props.y !== undefined) bgImage.y = props.y;
        if (props.scale !== undefined) bgImage.scale = props.scale;
        if (props.opacity !== undefined) bgImage.opacity = props.opacity;
        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
    }

    function setControlMode(mode) {
        controlMode = mode;
        showToast(`Control Mode: ${mode === "background" ? "Background" : "Canvas"}`);
    }

    let onBgChangeCallback = null;
    function onBgChange(cb) {
        onBgChangeCallback = cb;
    }

    function notifyBgChange() {
        if (onBgChangeCallback) {
            onBgChangeCallback({ ...bgImage, hasImage: !!bgImage.img });
        }
    }

    function init() {
        updateDimensions();
        setupPalette();
        setupEvents();
        fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half, bgImage);
        updateColorFromSliders();
        updateUndoButton();
    }

    init();

    return {
        setTool,
        undoAction,
        resetCanvas,
        setBackgroundImage,
        updateBackground,
        setControlMode,
        onBgChange,
        exportImage: () => exportImage(artCanvas, gridData, config, triHeight, W_half, exportGridToggle, showToast),
        exportSVG: () => exportSVG(artCanvas, gridData, config, triHeight, W_half, exportGridToggle, showToast),
        destroy: () => {
            windowListeners.forEach((dispose) => dispose());
            windowListeners.length = 0;
        },
    };
}
