import { getTrianglePath } from "./geometry.js";

export function fullRedraw(artCtx, artCanvas, gridData, config, triHeight, W_half) {
    artCtx.clearRect(0, 0, artCanvas.width, artCanvas.height);

    if (config.bgColor !== "transparent") {
        artCtx.fillStyle = config.bgColor;
        artCtx.fillRect(0, 0, artCanvas.width, artCanvas.height);
    }

    const keys = Object.keys(gridData);
    keys.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const color = gridData[key];
        const path = getTrianglePath(r, c, triHeight, W_half);
        artCtx.fillStyle = color;
        artCtx.fill(path);
        artCtx.strokeStyle = color;
        artCtx.lineWidth = 0.5;
        artCtx.stroke(path);
    });

    if (config.showGrid) {
        drawGridLines(artCtx, artCanvas, config, triHeight, W_half);
    }
}

export function drawCursor(cursorCtx, cursorCanvas, hoveredCells, currentTool, triHeight, W_half) {
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
        const path = getTrianglePath(cell.r, cell.c, triHeight, W_half);
        cursorCtx.stroke(path);
    });

    cursorCtx.shadowColor = "transparent";
    cursorCtx.shadowBlur = 0;
}

export function drawGridLines(ctx, canvas, config, triHeight, W_half) {
    if (config.widthTriangles * config.heightTriangles > 400000) return;

    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    for (let r = 0; r <= config.heightTriangles; r++) {
        ctx.moveTo(0, r * triHeight);
        ctx.lineTo(canvas.width, r * triHeight);
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
