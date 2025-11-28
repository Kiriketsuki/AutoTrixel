const REQUIRED_SELECTORS = ["#artLayer", "#cursorLayer", "#canvas-stack", "#toast", "#brushInput", "#brushVal", "#lInput", "#cInput", "#hInput", "#colorPreviewBox", "#colorCodeDisplay", "#palette", "#scaleSlider", "#scaleNumber", "#widthSlider", "#widthNumber", "#heightSlider", "#heightNumber", "#gridToggle", "#gridColorPicker", "#exportGridToggle", "#btnUndo"];

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

    if (!artCtx || !cursorCtx) {
        throw new Error("Failed to initialize AutoTrixel canvases");
    }

    const windowListeners = [];
    const addWindowListener = (event, handler, options) => {
        window.addEventListener(event, handler, options);
        windowListeners.push(() => window.removeEventListener(event, handler, options));
    };

    const config = {
        triSide: 25,
        widthTriangles: 40,
        heightTriangles: 30,
        bgColor: "transparent",
        gridColor: "#222222",
        showGrid: true,
        brushSize: 1,
    };

    let gridData = {};
    let hoveredCells = [];
    let isDrawing = false;
    let currentTool = "pencil";
    let storedBrushSize = 1;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let historyQueue = [];
    const MAX_HISTORY = 10;
    let tempSnapshot = null;

    let colorState = { l: 0.6, c: 0.15, h: 200 };
    let currentCssColor = "oklch(60% 0.15 200)";

    let triHeight;
    let W_half;
    let toastTimeout = null;

    const toolButtons = Array.from(rootElement.querySelectorAll(".tool-btn"));

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function hexToOklchVals(hex) {
        let r = parseInt(hex.substring(1, 3), 16) / 255;
        let g = parseInt(hex.substring(3, 5), 16) / 255;
        let b = parseInt(hex.substring(5, 7), 16) / 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);

        const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
        const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
        const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

        const C = Math.sqrt(a * a + b_ * b_);
        let H = (Math.atan2(b_, a) * 180) / Math.PI;
        if (H < 0) H += 360;

        return { l: L, c: C, h: H };
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

        if (currentTool === "eraser" || currentTool === "picker") {
            setTool("pencil");
        }
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
        fullRedraw();
        updateUndoButton();
        showToast("Undo");
    }

    function updateUndoButton() {
        btnUndo.disabled = historyQueue.length === 0;
        btnUndo.style.opacity = historyQueue.length === 0 ? "0.5" : "1";
    }

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

        fullRedraw();
    }

    function pixelToGrid(x, y) {
        const row = Math.floor(y / triHeight);
        const colApprox = Math.floor(x / W_half);
        const localX = (x % W_half) / W_half;
        const localY = (y % triHeight) / triHeight;
        let finalCol = -1;
        const parity = (colApprox + row) % 2;

        if (parity === 0) {
            const isEvenRow = row % 2 === 0;
            if (isEvenRow) {
                if (colApprox % 2 === 0) {
                    finalCol = localX + localY >= 1 ? colApprox : colApprox - 1;
                } else {
                    finalCol = localY >= localX ? colApprox - 1 : colApprox;
                }
            } else {
                if (colApprox % 2 === 0) {
                    finalCol = localX >= localY ? colApprox : colApprox - 1;
                } else {
                    finalCol = localX + localY <= 1 ? colApprox - 1 : colApprox;
                }
            }
        } else {
            // Handle the other parity case (checkerboard pattern)
            const isEvenRow = row % 2 === 0;
            if (isEvenRow) {
                if (colApprox % 2 !== 0) {
                    finalCol = localX + localY >= 1 ? colApprox : colApprox - 1;
                } else {
                    finalCol = localY >= localX ? colApprox - 1 : colApprox;
                }
            } else {
                if (colApprox % 2 !== 0) {
                    finalCol = localX >= localY ? colApprox : colApprox - 1;
                } else {
                    finalCol = localX + localY <= 1 ? colApprox - 1 : colApprox;
                }
            }
        }

        if (row < 0 || row >= config.heightTriangles) return null;
        if (finalCol < 0 || finalCol >= config.widthTriangles) return null;

        return { r: row, c: finalCol };
    }

    function getTriangleCluster(r, c, size) {
        if (size <= 1) return [{ r, c }];
        const coords = [];
        const isUp = r % 2 === Math.abs(c) % 2;
        for (let i = 0; i < size; i++) {
            const currentRow = isUp ? r + i : r - i;
            const startCol = c - i;
            const endCol = c + i;
            for (let col = startCol; col <= endCol; col++) {
                if (currentRow >= 0 && currentRow < config.heightTriangles && col >= 0 && col < config.widthTriangles) {
                    coords.push({ r: currentRow, c: col });
                }
            }
        }
        return coords;
    }

    function findBestCenter(targetR, targetC, size) {
        if (size <= 1) return { r: targetR, c: targetC };

        let bestAnchor = { r: targetR, c: targetC };
        let minDist = Infinity;
        const range = Math.ceil(size / 2) + 1;

        for (let dr = -range; dr <= range; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = targetR + dr;
                const c = targetC + dc;

                if (r < -size || r > config.heightTriangles + size || c < -size || c > config.widthTriangles + size) continue;

                const cluster = getTriangleCluster(r, c, size);
                if (cluster.length === 0) continue;

                let sumR = 0;
                let sumC = 0;
                for (const cell of cluster) {
                    sumR += cell.r;
                    sumC += cell.c;
                }
                const avgR = sumR / cluster.length;
                const avgC = sumC / cluster.length;

                const dist = (avgR - targetR) ** 2 + (avgC - targetC) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    bestAnchor = { r, c };
                }
            }
        }
        return bestAnchor;
    }

    function getTrianglePath(r, c) {
        const path = new Path2D();
        const xBase = c * W_half;
        const yBase = r * triHeight;
        const isUp = r % 2 === Math.abs(c) % 2;

        if (isUp) {
            path.moveTo(xBase, yBase + triHeight);
            path.lineTo(xBase + 2 * W_half, yBase + triHeight);
            path.lineTo(xBase + W_half, yBase);
            path.closePath();
        } else {
            path.moveTo(xBase, yBase);
            path.lineTo(xBase + 2 * W_half, yBase);
            path.lineTo(xBase + W_half, yBase + triHeight);
            path.closePath();
        }
        return path;
    }

    function fullRedraw() {
        artCtx.clearRect(0, 0, artCanvas.width, artCanvas.height);

        if (config.bgColor !== "transparent") {
            artCtx.fillStyle = config.bgColor;
            artCtx.fillRect(0, 0, artCanvas.width, artCanvas.height);
        }

        const keys = Object.keys(gridData);
        keys.forEach((key) => {
            const [r, c] = key.split(",").map(Number);
            const color = gridData[key];
            const path = getTrianglePath(r, c);
            artCtx.fillStyle = color;
            artCtx.fill(path);
            artCtx.strokeStyle = color;
            artCtx.lineWidth = 0.5;
            artCtx.stroke(path);
        });

        if (config.showGrid) {
            drawGridLines(artCtx);
        }
    }

    function drawCursor() {
        cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
        if (hoveredCells.length === 0) return;

        cursorCtx.lineWidth = 2;
        cursorCtx.lineCap = "round";
        cursorCtx.lineJoin = "round";

        if (currentTool === "eraser") cursorCtx.strokeStyle = "#ff4444";
        else if (currentTool === "picker") cursorCtx.strokeStyle = "#ffff00";
        else if (currentTool === "bucket") cursorCtx.strokeStyle = "#00ff00";
        else cursorCtx.strokeStyle = "#ffffff";

        cursorCtx.shadowColor = "rgba(0,0,0,0.8)";
        cursorCtx.shadowBlur = 4;

        hoveredCells.forEach((cell) => {
            const path = getTrianglePath(cell.r, cell.c);
            cursorCtx.stroke(path);
        });

        cursorCtx.shadowColor = "transparent";
        cursorCtx.shadowBlur = 0;
    }

    function drawGridLines(ctx) {
        if (config.widthTriangles * config.heightTriangles > 400000) return;

        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let r = 0; r <= config.heightTriangles; r++) {
            ctx.moveTo(0, r * triHeight);
            ctx.lineTo(artCanvas.width, r * triHeight);
        }

        for (let r = 0; r < config.heightTriangles; r++) {
            for (let c = 0; c < config.widthTriangles; c++) {
                const xBase = c * W_half;
                const yBase = r * triHeight;
                const isUp = r % 2 === Math.abs(c) % 2;
                if (isUp) {
                    ctx.moveTo(xBase, yBase + triHeight);
                    ctx.lineTo(xBase + W_half, yBase);
                    ctx.lineTo(xBase + 2 * W_half, yBase + triHeight);
                } else {
                    ctx.moveTo(xBase, yBase);
                    ctx.lineTo(xBase + W_half, yBase + triHeight);
                    ctx.lineTo(xBase + 2 * W_half, yBase);
                }
            }
        }
        ctx.stroke();
    }

    function batchPaintCells(cells) {
        let didChange = false;
        cells.forEach((cell) => {
            const key = `${cell.r},${cell.c}`;
            if (currentTool === "pencil") {
                if (gridData[key] !== currentCssColor) {
                    gridData[key] = currentCssColor;
                    didChange = true;
                }
            } else if (currentTool === "eraser") {
                if (gridData[key]) {
                    delete gridData[key];
                    didChange = true;
                }
            }
        });
        return didChange;
    }

    function interpolateStroke(x0, y0, x1, y1) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const stepSize = Math.max(1, config.triSide / 3);
        const steps = Math.ceil(dist / stepSize);

        const uniqueCells = [];
        const seenKeys = new Set();

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const x = x0 + dx * t;
            const y = y0 + dy * t;

            const centerCell = pixelToGrid(x, y);
            if (centerCell) {
                const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                let anchor = { r: centerCell.r, c: centerCell.c };
                if (useSize > 1) {
                    anchor = findBestCenter(centerCell.r, centerCell.c, useSize);
                }
                const cluster = getTriangleCluster(anchor.r, anchor.c, useSize);

                cluster.forEach((c) => {
                    const k = `${c.r},${c.c}`;
                    if (!seenKeys.has(k)) {
                        seenKeys.add(k);
                        uniqueCells.push(c);
                    }
                });
            }
        }
        return uniqueCells;
    }

    function handleSingleClick() {
        if (hoveredCells.length === 0) return false;

        let didChange = false;

        if (currentTool === "bucket") {
            const cell = hoveredCells[0];
            didChange = fillBucket(cell.r, cell.c, currentCssColor);
        } else if (currentTool === "picker") {
            const cell = hoveredCells[0];
            const key = `${cell.r},${cell.c}`;
            const color = gridData[key];
            if (color) {
                if (color.startsWith("#")) {
                    syncColorFromHex(color);
                } else if (color.startsWith("oklch")) {
                    const matches = color.match(/oklch\(([^%]+)%\s+([\d.]+)\s+([\d.]+)\)/);
                    if (matches) {
                        colorState = {
                            l: parseFloat(matches[1]) / 100,
                            c: parseFloat(matches[2]),
                            h: parseFloat(matches[3]),
                        };
                        updateColorUI(color);
                    }
                }
                showToast("Color Picked");
            }
        } else {
            didChange = batchPaintCells(hoveredCells);
        }

        if (didChange) {
            fullRedraw();
        }
        return didChange;
    }

    function fillBucket(startR, startC, fillCol) {
        const startKey = `${startR},${startC}`;
        const targetColor = gridData[startKey];

        if (targetColor === fillCol) return false;

        const queue = [{ r: startR, c: startC }];
        const visited = new Set();
        let count = 0;
        let changed = false;

        while (queue.length > 0) {
            count++;
            if (count > 500000) break;

            const { r, c } = queue.shift();
            const key = `${r},${c}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (gridData[key] !== targetColor) continue;

            gridData[key] = fillCol;
            changed = true;

            const isUp = r % 2 === Math.abs(c) % 2;
            addNeighbor(r, c - 1, queue);
            addNeighbor(r, c + 1, queue);
            if (isUp) {
                addNeighbor(r + 1, c, queue);
            } else {
                addNeighbor(r - 1, c, queue);
            }
        }
        return changed;
    }

    function addNeighbor(r, c, queue) {
        if (r >= 0 && r < config.heightTriangles && c >= 0 && c < config.widthTriangles) {
            queue.push({ r, c });
        }
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
                drawCursor();
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

    function showToast(message) {
        toast.innerText = message;
        toast.classList.add("show");
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 1500);
    }

    function setupEvents() {
        cursorCanvas.addEventListener("mousedown", (e) => {
            const rect = cursorCanvas.getBoundingClientRect();
            lastMouseX = e.clientX - rect.left;
            lastMouseY = e.clientY - rect.top;

            tempSnapshot = saveStateForUndo();
            isDrawing = true;

            handleSingleClick();
        });

        addWindowListener("mouseup", () => {
            if (isDrawing) {
                isDrawing = false;
                const newState = JSON.stringify(gridData);
                if (newState !== tempSnapshot) {
                    pushToHistory(tempSnapshot);
                }
            }
        });

        cursorCanvas.addEventListener("mousemove", (e) => {
            const rect = cursorCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const cell = pixelToGrid(x, y);

            if (cell) {
                const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                let anchor = { r: cell.r, c: cell.c };
                if (useSize > 1) {
                    anchor = findBestCenter(cell.r, cell.c, useSize);
                }
                hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize);
            } else {
                hoveredCells = [];
            }
            drawCursor();

            if (isDrawing && currentTool !== "bucket" && currentTool !== "picker") {
                const cellsToPaint = interpolateStroke(lastMouseX, lastMouseY, x, y);
                if (cellsToPaint.length > 0) {
                    const didChange = batchPaintCells(cellsToPaint);
                    if (didChange) fullRedraw();
                }
            }

            lastMouseX = x;
            lastMouseY = y;
        });

        cursorCanvas.addEventListener("mouseleave", () => {
            hoveredCells = [];
            isDrawing = false;
            drawCursor();
        });

        cursorCanvas.addEventListener(
            "touchstart",
            (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    const rect = cursorCanvas.getBoundingClientRect();
                    lastMouseX = touch.clientX - rect.left;
                    lastMouseY = touch.clientY - rect.top;

                    tempSnapshot = saveStateForUndo();
                    isDrawing = true;

                    const cell = pixelToGrid(lastMouseX, lastMouseY);
                    if (cell) {
                        const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                        let anchor = { r: cell.r, c: cell.c };
                        if (useSize > 1) {
                            anchor = findBestCenter(cell.r, cell.c, useSize);
                        }
                        hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize);
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
                if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    const rect = cursorCanvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;

                    const cell = pixelToGrid(x, y);
                    if (cell) {
                        const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
                        let anchor = { r: cell.r, c: cell.c };
                        if (useSize > 1) {
                            anchor = findBestCenter(cell.r, cell.c, useSize);
                        }
                        hoveredCells = getTriangleCluster(anchor.r, anchor.c, useSize);
                    } else {
                        hoveredCells = [];
                    }

                    if (isDrawing && currentTool !== "bucket" && currentTool !== "picker") {
                        const cellsToPaint = interpolateStroke(lastMouseX, lastMouseY, x, y);
                        if (cellsToPaint.length > 0) {
                            const didChange = batchPaintCells(cellsToPaint);
                            if (didChange) fullRedraw();
                        }
                    }
                    lastMouseX = x;
                    lastMouseY = y;
                }
            },
            { passive: false },
        );

        addWindowListener("touchend", () => {
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
                    updateBrushSize(1);
                } else if (e.key === "-") {
                    e.preventDefault();
                    updateBrushSize(-1);
                } else if (e.key === "[") {
                    e.preventDefault();
                    zoom(-5);
                } else if (e.key === "]") {
                    e.preventDefault();
                    zoom(5);
                }
            }
        });

        addWindowListener(
            "wheel",
            (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 1 : -1;
                    updateBrushSize(delta);
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
            fullRedraw();
        });

        gridColorPicker.addEventListener("input", (e) => {
            config.gridColor = e.target.value;
            fullRedraw();
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

    function setTool(tool) {
        currentTool = tool;
        toolButtons.forEach((button) => button.classList.remove("active"));
        const activeButton = rootElement.querySelector(`#tool-${tool}`);
        if (activeButton) {
            activeButton.classList.add("active");
        }

        if (tool === "picker") cursorCanvas.style.cursor = "crosshair";
        else cursorCanvas.style.cursor = "crosshair";

        if (tool === "pencil" || tool === "eraser") {
            config.brushSize = storedBrushSize;
            brushInput.value = storedBrushSize;
            brushVal.innerText = storedBrushSize;
        }

        drawCursor();
    }

    function resetCanvas() {
        pushToHistory(saveStateForUndo());
        gridData = {};
        fullRedraw();
        showToast("Canvas Cleared");
    }

    function exportImage() {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = artCanvas.width;
        tempCanvas.height = artCanvas.height;
        const tCtx = tempCanvas.getContext("2d");

        tCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        if (config.bgColor !== "transparent") {
            tCtx.fillStyle = config.bgColor;
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        const keys = Object.keys(gridData);
        keys.forEach((key) => {
            const [r, c] = key.split(",").map(Number);
            const color = gridData[key];
            const path = getTrianglePath(r, c);
            tCtx.fillStyle = color;
            tCtx.fill(path);
            tCtx.strokeStyle = color;
            tCtx.lineWidth = 0.5;
            tCtx.stroke(path);
        });

        if (exportGridToggle.checked) {
            drawGridLines(tCtx);
        }

        tempCanvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "tripixel-art.png";
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
            showToast("Image Saved!");
        }, "image/png");
    }

    function exportSVG() {
        const w = artCanvas.width;
        const h = artCanvas.height;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

        if (config.bgColor !== "transparent") {
            svg += `<rect width="100%" height="100%" fill="${config.bgColor}"/>`;
        }

        const keys = Object.keys(gridData);
        keys.forEach((key) => {
            const [r, c] = key.split(",").map(Number);
            const color = gridData[key];

            const xBase = c * W_half;
            const yBase = r * triHeight;
            const isUp = r % 2 === Math.abs(c) % 2;

            let points = "";
            if (isUp) {
                points = `${xBase},${yBase + triHeight} ${xBase + 2 * W_half},${yBase + triHeight} ${xBase + W_half},${yBase}`;
            } else {
                points = `${xBase},${yBase} ${xBase + 2 * W_half},${yBase} ${xBase + W_half},${yBase + triHeight}`;
            }

            svg += `<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
        });

        if (exportGridToggle.checked && config.widthTriangles * config.heightTriangles <= 400000) {
            const gridColor = config.gridColor;

            for (let r = 0; r <= config.heightTriangles; r++) {
                const y = r * triHeight;
                svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`;
            }

            for (let r = 0; r < config.heightTriangles; r++) {
                for (let c = 0; c < config.widthTriangles; c++) {
                    const xBase = c * W_half;
                    const yBase = r * triHeight;
                    const isUp = r % 2 === Math.abs(c) % 2;

                    let p = "";
                    if (isUp) {
                        p = `${xBase},${yBase + triHeight} ${xBase + W_half},${yBase} ${xBase + 2 * W_half},${yBase + triHeight}`;
                    } else {
                        p = `${xBase},${yBase} ${xBase + W_half},${yBase + triHeight} ${xBase + 2 * W_half},${yBase}`;
                    }
                    svg += `<polyline points="${p}" fill="none" stroke="${gridColor}" stroke-width="0.5"/>`;
                }
            }
        }

        svg += "</svg>";

        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "tripixel-art.svg";
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showToast("SVG Saved!");
    }

    function init() {
        updateDimensions();
        setupPalette();
        setupEvents();
        fullRedraw();
        updateColorFromSliders();
        updateUndoButton();
    }

    init();

    return {
        setTool,
        undoAction,
        resetCanvas,
        exportImage,
        exportSVG,
        destroy: () => {
            windowListeners.forEach((dispose) => dispose());
            windowListeners.length = 0;
        },
    };
}
