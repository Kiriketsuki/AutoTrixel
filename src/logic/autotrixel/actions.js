import { pixelToGrid, findBestCenter, getTriangleCluster } from "./geometry.js";

function areColorsEqual(c1, c2) {
    if (c1 === c2) return true;
    if (typeof c1 === "object" && typeof c2 === "object" && c1 !== null && c2 !== null) {
        return c1.type === c2.type && c1.imageId === c2.imageId;
    }
    return false;
}

export function batchPaintCells(cells, currentTool, gridData, currentFill) {
    let didChange = false;
    cells.forEach((cell) => {
        const key = `${cell.r},${cell.c}`;
        if (currentTool === "pencil") {
            if (!areColorsEqual(gridData[key], currentFill)) {
                gridData[key] = currentFill;
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

export function fillBucket(startR, startC, fillCol, gridData, config) {
    const startKey = `${startR},${startC}`;
    const targetColor = gridData[startKey];

    if (areColorsEqual(targetColor, fillCol)) return false;

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

        if (!areColorsEqual(gridData[key], targetColor)) continue;

        gridData[key] = fillCol;
        changed = true;

        const isUp = r % 2 === Math.abs(c) % 2;
        addNeighbor(r, c - 1, queue, config);
        addNeighbor(r, c + 1, queue, config);
        if (isUp) {
            addNeighbor(r + 1, c, queue, config);
        } else {
            addNeighbor(r - 1, c, queue, config);
        }
    }
    return changed;
}

function addNeighbor(r, c, queue, config) {
    if (r >= 0 && r < config.heightTriangles && c >= 0 && c < config.widthTriangles) {
        queue.push({ r, c });
    }
}

export function interpolateStroke(x0, y0, x1, y1, currentTool, config, triHeight, W_half) {
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

        const centerCell = pixelToGrid(x, y, triHeight, W_half, config);
        if (centerCell) {
            const useSize = currentTool === "picker" || currentTool === "bucket" ? 1 : config.brushSize;
            let anchor = { r: centerCell.r, c: centerCell.c };
            if (useSize > 1) {
                anchor = findBestCenter(centerCell.r, centerCell.c, useSize, config);
            }
            const cluster = getTriangleCluster(anchor.r, anchor.c, useSize, config);

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
